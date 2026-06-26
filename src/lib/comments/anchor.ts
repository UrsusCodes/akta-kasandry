import type { CommentAnchor } from '@/types'

/**
 * Homegrown text anchorer. Pins a comment to a block (by stable id) and a
 * quoted fragment with surrounding context, then re-locates it at render time
 * with progressively looser matching. No geometry — pure DOM text + offsets —
 * so it is unit-testable under jsdom. No external dependency.
 */

/** Collapse all whitespace runs to single spaces and trim. */
export function normalizeText(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

/** Small deterministic FNV-1a hash → base36, max 8 chars. Used for block ids. */
export function shortHash(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36).slice(0, 8)
}

const CONTEXT = 32

/** Character offset of a (node, offset) point within el.textContent. */
function pointToOffset(el: HTMLElement, node: Node, nodeOffset: number): number {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let acc = 0
  let n = walker.nextNode() as Text | null
  while (n) {
    if (n === node) return acc + nodeOffset
    acc += n.data.length
    n = walker.nextNode() as Text | null
  }
  return acc
}

/**
 * Build an anchor from a DOM selection Range and the enclosing block element
 * (the nearest ancestor carrying `data-block-id`). Returns null if the block
 * has no id or the range is collapsed.
 */
export function createAnchor(range: Range, blockEl: HTMLElement): CommentAnchor | null {
  const blockId = blockEl.getAttribute('data-block-id')
  if (!blockId || range.collapsed) return null
  const text = blockEl.textContent ?? ''
  const startOffset = pointToOffset(blockEl, range.startContainer, range.startOffset)
  const endOffset = pointToOffset(blockEl, range.endContainer, range.endOffset)
  const lo = Math.min(startOffset, endOffset)
  const hi = Math.max(startOffset, endOffset)
  return {
    blockId,
    quote: text.slice(lo, hi),
    prefix: text.slice(Math.max(0, lo - CONTEXT), lo),
    suffix: text.slice(hi, hi + CONTEXT),
    startOffset: lo,
    endOffset: hi,
  }
}

/** Inverse of pointToOffset: map a char offset back to a (node, offset). */
function offsetToPoint(el: HTMLElement, offset: number): { node: Text; offset: number } | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let acc = 0
  let n = walker.nextNode() as Text | null
  let last: Text | null = null
  while (n) {
    const len = n.data.length
    if (offset <= acc + len) return { node: n, offset: offset - acc }
    acc += len
    last = n
    n = walker.nextNode() as Text | null
  }
  return last ? { node: last, offset: last.data.length } : null
}

function rangeFor(el: HTMLElement, start: number, end: number): Range | null {
  const a = offsetToPoint(el, start)
  const b = offsetToPoint(el, end)
  if (!a || !b) return null
  const r = document.createRange()
  r.setStart(a.node, a.offset)
  r.setEnd(b.node, b.offset)
  return r
}

/**
 * Re-locate an anchor inside `container`. Resolution order:
 *   1. block by id, exact offset slice === quote
 *   2. block by id, indexOf(quote)
 *   3. any block whose normalized text contains the quote (fuzzy block move)
 * Returns null when the quote is gone — caller treats that as an orphan.
 */
export function resolveAnchor(anchor: CommentAnchor, container: HTMLElement): Range | null {
  const byId = container.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(anchor.blockId)}"]`)
  const tryBlock = (el: HTMLElement): Range | null => {
    const text = el.textContent ?? ''
    if (text.slice(anchor.startOffset, anchor.endOffset) === anchor.quote) {
      return rangeFor(el, anchor.startOffset, anchor.endOffset)
    }
    const idx = text.indexOf(anchor.quote)
    if (idx >= 0) return rangeFor(el, idx, idx + anchor.quote.length)
    return null
  }

  if (byId) {
    const r = tryBlock(byId)
    if (r) return r
  }
  // Fuzzy: scan every block for the quote (block id may have changed).
  const wantedNorm = normalizeText(anchor.quote)
  for (const el of Array.from(container.querySelectorAll<HTMLElement>('[data-block-id]'))) {
    if (el === byId) continue
    if (normalizeText(el.textContent ?? '').includes(wantedNorm)) {
      const r = tryBlock(el)
      if (r) return r
    }
  }
  return null
}
