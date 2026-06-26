import { describe, it, expect } from 'vitest'
import { normalizeText, shortHash } from './anchor'
import { createAnchor } from './anchor'

describe('normalizeText', () => {
  it('collapses whitespace and trims', () => {
    expect(normalizeText('  a\n  b\t c ')).toBe('a b c')
  })
})

describe('shortHash', () => {
  it('is deterministic and stable for the same input', () => {
    expect(shortHash('pierwsza strzelanina')).toBe(shortHash('pierwsza strzelanina'))
  })
  it('differs for different inputs and is short/base36', () => {
    expect(shortHash('a')).not.toBe(shortHash('b'))
    expect(shortHash('a')).toMatch(/^[0-9a-z]{1,8}$/)
  })
})

function blockWith(html: string, id = 'blk1'): HTMLElement {
  const el = document.createElement('p')
  el.setAttribute('data-block-id', id)
  el.innerHTML = html
  document.body.appendChild(el)
  return el
}

function rangeOverText(block: HTMLElement, start: number, end: number): Range {
  // Walk text nodes to map char offsets → (node, offset) for the test.
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT)
  let acc = 0
  let startNode: Text | null = null
  let startOff = 0
  let endNode: Text | null = null
  let endOff = 0
  let n = walker.nextNode() as Text | null
  while (n) {
    const len = n.data.length
    if (!startNode && start <= acc + len) {
      startNode = n
      startOff = start - acc
    }
    if (!endNode && end <= acc + len) {
      endNode = n
      endOff = end - acc
    }
    acc += len
    n = walker.nextNode() as Text | null
  }
  const r = document.createRange()
  r.setStart(startNode!, startOff)
  r.setEnd(endNode!, endOff)
  return r
}

describe('createAnchor', () => {
  it('captures quote, offsets, prefix and suffix across inline markup', () => {
    const block = blockWith('O świcie <strong>wywiązała się</strong> pierwsza strzelanina.')
    // textContent = "O świcie wywiązała się pierwsza strzelanina."
    const text = block.textContent!
    const start = text.indexOf('pierwsza strzelanina')
    const end = start + 'pierwsza strzelanina'.length
    const anchor = createAnchor(rangeOverText(block, start, end), block)!
    expect(anchor.blockId).toBe('blk1')
    expect(anchor.quote).toBe('pierwsza strzelanina')
    expect(anchor.startOffset).toBe(start)
    expect(anchor.endOffset).toBe(end)
    expect(anchor.prefix.endsWith('się ')).toBe(true)
    expect(anchor.suffix).toBe('.')
  })
})
