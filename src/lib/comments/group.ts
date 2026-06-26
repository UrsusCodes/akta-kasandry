import type { Comment, CommentThread } from '@/types'

/**
 * Build threads: top-level comments (parentId === null, or whose parent is
 * absent) become roots, ordered by createdAt; their replies hang underneath,
 * also createdAt-ordered. Density in the UI is handled by collapsing a thread.
 */
export function groupThreads(comments: Comment[]): CommentThread[] {
  const byId = new Map(comments.map((c) => [c.id, c]))
  const byTime = (a: Comment, b: Comment) => a.createdAt.localeCompare(b.createdAt)

  const roots = comments
    .filter((c) => !c.parentId || !byId.has(c.parentId))
    .sort(byTime)

  return roots.map((root) => ({
    anchor: root.anchor,
    root,
    replies: comments.filter((c) => c.parentId === root.id).sort(byTime),
  }))
}
