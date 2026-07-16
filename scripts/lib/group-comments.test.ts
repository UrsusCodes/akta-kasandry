import { describe, it, expect } from 'vitest'
import { groupComments, type RawComment } from './group-comments'

const mk = (over: Partial<RawComment>): RawComment => ({
  id: 'x', pageKey: 'streszczenie/ug2', blockId: 'b1', quote: 'quoted fragment',
  authorName: 'Gracz', speakerName: null, body: 'body', parentId: null,
  createdAt: '2026-01-01T00:00:00Z', edited: false, ...over,
})

describe('groupComments', () => {
  it('two comments on the same blockId → one group, two root threads', () => {
    const groups = groupComments([
      mk({ id: 'a' }),
      mk({ id: 'b' }),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].blockId).toBe('b1')
    expect(groups[0].threads).toHaveLength(2)
    expect(groups[0].threads.map((t) => t.root.id)).toEqual(['a', 'b'])
    expect(groups[0].threads.every((t) => t.replies.length === 0)).toBe(true)
  })

  it('a reply nests under its root, not as a new thread', () => {
    const groups = groupComments([
      mk({ id: 'root', createdAt: '2026-01-01T00:00:00Z' }),
      mk({ id: 'reply', parentId: 'root', createdAt: '2026-01-02T00:00:00Z' }),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].threads).toHaveLength(1)
    expect(groups[0].threads[0].root.id).toBe('root')
    expect(groups[0].threads[0].replies.map((r) => r.id)).toEqual(['reply'])
  })

  it('comments on different blockId → separate groups, preserving first-seen order', () => {
    const groups = groupComments([
      mk({ id: 'a', blockId: 'block-2', quote: 'second' }),
      mk({ id: 'b', blockId: 'block-1', quote: 'first' }),
      mk({ id: 'c', blockId: 'block-2', quote: 'second' }),
    ])
    expect(groups.map((g) => g.blockId)).toEqual(['block-2', 'block-1'])
    expect(groups[0].quote).toBe('second')
    expect(groups[0].threads).toHaveLength(2)
    expect(groups[1].threads).toHaveLength(1)
  })

  it('empty input → []', () => {
    expect(groupComments([])).toEqual([])
  })

  it('promotes an orphan reply (parent missing from the batch) to its own thread', () => {
    const groups = groupComments([mk({ id: 'orphan', parentId: 'gone' })])
    expect(groups[0].threads).toHaveLength(1)
    expect(groups[0].threads[0].root.id).toBe('orphan')
  })
})
