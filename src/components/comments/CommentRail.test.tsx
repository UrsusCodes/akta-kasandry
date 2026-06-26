import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CommentRail } from './CommentRail'
import type { Comment } from '@/types'

const base = (over: Partial<Comment>): Comment => ({
  id: 'x', pageKey: 'k', anchor: { blockId: 'b1', quote: 'pierwsza strzelanina', prefix: '', suffix: '', startOffset: 0, endOffset: 1 },
  authorProfileId: 'p', authorName: 'A', authorColor: '#b5472d',
  speakerCharacterId: 'c', speakerName: 'James', speakerPortraitUrl: null,
  body: 'b', parentId: null, createdAt: '2026-01-01T00:00:00Z', edited: false, ...over,
})

describe('CommentRail', () => {
  it('groups two comments on the same anchor into one thread card', () => {
    const comments = [
      base({ id: '1', createdAt: '2026-01-01T00:00:00Z' }),
      base({ id: '2', createdAt: '2026-01-02T00:00:00Z' }),
    ]
    render(<CommentRail comments={comments} activeThreadId={null} canModerate={false} onFocusAnchor={() => {}} />)
    // Quote shown once as the thread header.
    expect(screen.getAllByText(/pierwsza strzelanina/).length).toBe(1)
  })
})
