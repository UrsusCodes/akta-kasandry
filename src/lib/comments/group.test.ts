import { describe, it, expect } from 'vitest'
import { groupThreads } from './group'
import type { Comment } from '@/types'

const mk = (over: Partial<Comment>): Comment => ({
  id: 'x', pageKey: 'k', anchor: { blockId: 'b', quote: 'q', prefix: '', suffix: '', startOffset: 0, endOffset: 1 },
  authorProfileId: 'p', authorName: 'A', authorColor: '#fff',
  speakerCharacterId: null, speakerName: null, speakerPortraitUrl: null,
  body: '', parentId: null, createdAt: '2026-01-01T00:00:00Z', edited: false, ...over,
})

describe('groupThreads', () => {
  it('nests replies under their root and keeps roots in createdAt order', () => {
    const comments = [
      mk({ id: 'r1', createdAt: '2026-01-02T00:00:00Z' }),
      mk({ id: 'r0', createdAt: '2026-01-01T00:00:00Z' }),
      mk({ id: 'a', parentId: 'r0', createdAt: '2026-01-03T00:00:00Z' }),
    ]
    const threads = groupThreads(comments)
    expect(threads.map((t) => t.root.id)).toEqual(['r0', 'r1'])
    expect(threads[0].replies.map((r) => r.id)).toEqual(['a'])
  })

  it('promotes a reply whose parent is missing to its own thread', () => {
    const threads = groupThreads([mk({ id: 'orphanReply', parentId: 'gone' })])
    expect(threads).toHaveLength(1)
    expect(threads[0].root.id).toBe('orphanReply')
  })
})
