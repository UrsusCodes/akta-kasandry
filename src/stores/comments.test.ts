import { describe, it, expect, beforeEach } from 'vitest'
import { useCommentsStore } from './comments'

// With no Supabase creds, the store serves/optimistically mutates mock data.
describe('comments store (mock mode)', () => {
  beforeEach(() => useCommentsStore.setState({ comments: [], source: 'mock' }))

  it('loads mock comments for a page key', async () => {
    await useCommentsStore.getState().load('streszczenie/ug2')
    expect(useCommentsStore.getState().comments.length).toBeGreaterThan(0)
    expect(useCommentsStore.getState().source).toBe('mock')
  })

  it('optimistically appends a new comment in mock mode', async () => {
    await useCommentsStore.getState().load('streszczenie/ug2')
    const before = useCommentsStore.getState().comments.length
    await useCommentsStore.getState().add({
      pageKey: 'streszczenie/ug2',
      anchor: { blockId: 'b', quote: 'q', prefix: '', suffix: '', startOffset: 0, endOffset: 1 },
      speakerCharacterId: null, body: 'test', parentId: null,
    })
    expect(useCommentsStore.getState().comments.length).toBe(before + 1)
  })
})
