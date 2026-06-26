import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CommentCard } from './CommentCard'
import type { Comment } from '@/types'

const ic: Comment = {
  id: '1', pageKey: 'k', anchor: { blockId: 'b', quote: 'q', prefix: '', suffix: '', startOffset: 0, endOffset: 1 },
  authorProfileId: 'p', authorName: 'Nika', authorColor: '#b5472d',
  speakerCharacterId: 'c', speakerName: 'James Kelly', speakerPortraitUrl: null,
  body: 'Nareszcie uczciwa walka.', parentId: null, createdAt: '2026-06-24T20:00:00Z', edited: false,
}

describe('CommentCard', () => {
  it('shows the speaker name and an in-character badge for IC comments', () => {
    render(<CommentCard comment={ic} canModerate={false} />)
    expect(screen.getByText('James Kelly')).toBeInTheDocument()
    expect(screen.getByText(/w roli/i)).toBeInTheDocument()
  })

  it('shows the player name and an out-of-character badge for OOC comments', () => {
    render(<CommentCard comment={{ ...ic, speakerCharacterId: null, speakerName: null }} canModerate={false} />)
    expect(screen.getByText('Nika')).toBeInTheDocument()
    expect(screen.getByText(/poza rol/i)).toBeInTheDocument()
  })
})
