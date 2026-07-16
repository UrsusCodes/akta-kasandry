/**
 * Pure comment-grouping helper for scripts/fetch-comments.ts.
 *
 * Given a flat array of comment rows for one page (already fetched from
 * wiki.comments, ordered by created_at), buckets them per anchor (blockId +
 * quoted fragment, first-seen order) and nests replies under their root.
 * Mirrors the byId/roots approach of src/lib/comments/group.ts, extended
 * with the blockId bucketing fetch-comments.ts needs. Pure, no I/O.
 */

export type RawComment = {
  id: string
  pageKey: string
  blockId: string
  quote: string
  authorName: string
  speakerName: string | null
  body: string
  parentId: string | null
  createdAt: string
  edited: boolean
}

export type FeedbackThread = { root: RawComment; replies: RawComment[] }
export type FeedbackGroup = { blockId: string; quote: string; threads: FeedbackThread[] }

/**
 * Group rows by `blockId` (first-seen order preserved), then within each
 * group nest replies under their root. A root is a comment with no
 * `parentId`, or whose `parentId` doesn't resolve within the same group
 * (an orphan reply — its parent lives elsewhere or is missing — is promoted
 * to its own thread rather than dropped).
 */
export function groupComments(rows: RawComment[]): FeedbackGroup[] {
  const blockOrder: string[] = []
  const byBlock = new Map<string, RawComment[]>()

  for (const row of rows) {
    if (!byBlock.has(row.blockId)) {
      blockOrder.push(row.blockId)
      byBlock.set(row.blockId, [])
    }
    byBlock.get(row.blockId)!.push(row)
  }

  return blockOrder.map((blockId) => {
    const groupRows = byBlock.get(blockId)!
    return { blockId, quote: groupRows[0].quote, threads: buildThreads(groupRows) }
  })
}

// Known limitation: only direct children of a root are collected as replies —
// a reply-to-a-reply (parentId pointing at another reply) would be silently
// dropped. Fine today because the app only supports single-level replies;
// revisit if multi-level replies ever land (see Stage L "Deferred polish").
function buildThreads(rows: RawComment[]): FeedbackThread[] {
  const byId = new Map(rows.map((r) => [r.id, r]))
  const roots = rows.filter((r) => !r.parentId || !byId.has(r.parentId))

  return roots.map((root) => ({
    root,
    replies: rows.filter((r) => r.parentId === root.id),
  }))
}
