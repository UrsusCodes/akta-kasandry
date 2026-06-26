import { useEffect } from 'react'
import type { Comment } from '@/types'
import { resolveAnchor } from '@/lib/comments/anchor'

/** Group top-level comments by author colour (for one highlight registry each). */
export function buildHighlightGroups(comments: Comment[]): Map<string, Comment[]> {
  const groups = new Map<string, Comment[]>()
  for (const c of comments) {
    if (c.parentId) continue
    const arr = groups.get(c.authorColor) ?? []
    arr.push(c)
    groups.set(c.authorColor, arr)
  }
  return groups
}

const supported = () => typeof CSS !== 'undefined' && 'highlights' in CSS

/**
 * Paint fragment highlights via the CSS Custom Highlight API. Registers one
 * Highlight per author colour ("ak-comment-<hex>") plus "ak-comment-active".
 * The matching ::highlight() rules live in index.css (Task 20). No-ops where
 * the API is unavailable; the rail still works.
 */
export function useHighlights(
  container: HTMLElement | null,
  comments: Comment[],
  activeBlockId: string | null,
) {
  useEffect(() => {
    if (!container || !supported()) return
    const highlights = (CSS as unknown as { highlights: Map<string, unknown> }).highlights
    const registered: string[] = []

    const groups = buildHighlightGroups(comments)
    for (const [color, list] of groups) {
      const ranges: Range[] = []
      for (const c of list) {
        const r = resolveAnchor(c.anchor, container)
        if (r) ranges.push(r)
      }
      if (ranges.length) {
        const name = `ak-comment-${color.replace('#', '')}`
        highlights.set(name, new Highlight(...ranges))
        registered.push(name)
        document.documentElement.style.setProperty(`--hl-${color.replace('#', '')}`, color)
      }
    }
    // Active fragment overlay.
    if (activeBlockId) {
      const active = comments.find((c) => !c.parentId && c.anchor.blockId === activeBlockId)
      const r = active && resolveAnchor(active.anchor, container)
      if (r) {
        highlights.set('ak-comment-active', new Highlight(r))
        registered.push('ak-comment-active')
      }
    }
    return () => {
      for (const name of registered) highlights.delete(name)
    }
  }, [container, comments, activeBlockId])
}
