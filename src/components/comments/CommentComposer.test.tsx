import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentComposer } from './CommentComposer'

const base = {
  quote: null as string | null,
  hasFragment: false,
  speakerOptions: [] as { characterId: string; name: string; portraitUrl: string | null }[],
  selfName: 'Nika',
  color: '#b5472d',
  onStart: vi.fn(),
  onConfirmFragment: vi.fn(),
  onCancel: vi.fn(),
  onSubmit: vi.fn().mockResolvedValue({}),
}

describe('CommentComposer', () => {
  it('idle: shows the add button and reports start', async () => {
    const onStart = vi.fn()
    render(<CommentComposer {...base} mode="idle" onStart={onStart} />)
    await userEvent.click(screen.getByRole('button', { name: /dodaj komentarz/i }))
    expect(onStart).toHaveBeenCalled()
  })

  it('selecting: Potwierdź is disabled until a fragment is captured', async () => {
    const onConfirmFragment = vi.fn()
    const { rerender } = render(<CommentComposer {...base} mode="selecting" hasFragment={false} onConfirmFragment={onConfirmFragment} />)
    expect(screen.getByText(/zaznacz fragment/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /potwierdź/i })).toBeDisabled()
    rerender(<CommentComposer {...base} mode="selecting" hasFragment quote="pierwsza strzelanina" onConfirmFragment={onConfirmFragment} />)
    expect(screen.getByText(/pierwsza strzelanina/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /potwierdź/i }))
    expect(onConfirmFragment).toHaveBeenCalled()
  })

  it('selecting: Anuluj cancels', async () => {
    const onCancel = vi.fn()
    render(<CommentComposer {...base} mode="selecting" onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: /anuluj/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('composing: renders the compose box and submits OOC', async () => {
    const onSubmit = vi.fn().mockResolvedValue({})
    render(<CommentComposer {...base} mode="composing" quote="pierwsza strzelanina" onSubmit={onSubmit} />)
    await userEvent.type(screen.getByRole('textbox'), 'Notka.')
    await userEvent.click(screen.getByRole('button', { name: /dodaj/i }))
    expect(onSubmit).toHaveBeenCalledWith({ speakerCharacterId: null, body: 'Notka.' })
  })
})
