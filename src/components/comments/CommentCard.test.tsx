import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    render(<CommentCard comment={ic} currentUserId={null} isMG={false} />)
    expect(screen.getByText('James Kelly')).toBeInTheDocument()
    expect(screen.getByText(/w roli/i)).toBeInTheDocument()
  })

  it('shows the player name and an out-of-character badge for OOC comments', () => {
    render(<CommentCard comment={{ ...ic, speakerCharacterId: null, speakerName: null }} currentUserId={null} isMG={false} />)
    expect(screen.getByText('Nika')).toBeInTheDocument()
    expect(screen.getByText(/poza rol/i)).toBeInTheDocument()
  })

  it('lets the author delete their own comment (with confirm)', async () => {
    const onDelete = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    // ic fixture has authorProfileId: 'p'
    render(<CommentCard comment={ic} currentUserId="p" isMG={false} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /usuń/i }))
    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('hides controls for a non-author non-MG viewer', () => {
    render(<CommentCard comment={ic} currentUserId="someone-else" isMG={false} />)
    expect(screen.queryByRole('button', { name: /usuń/i })).not.toBeInTheDocument()
  })

  it('lets MG manage any comment', () => {
    render(<CommentCard comment={ic} currentUserId="someone-else" isMG />)
    expect(screen.getByRole('button', { name: /usuń/i })).toBeInTheDocument()
  })

  it('edits inline and saves via onEdit', async () => {
    const onEdit = vi.fn().mockResolvedValue({})
    render(<CommentCard comment={ic} currentUserId="p" isMG={false} onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /edytuj/i }))
    const box = screen.getByRole('textbox')
    await userEvent.clear(box)
    await userEvent.type(box, 'Poprawione.')
    await userEvent.click(screen.getByRole('button', { name: /zapisz/i }))
    expect(onEdit).toHaveBeenCalledWith('1', 'Poprawione.')
  })
})
