import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComposeBubble } from './ComposeBubble'

describe('ComposeBubble', () => {
  it('submits body + selected speaker', async () => {
    const onSubmit = vi.fn().mockResolvedValue({})
    render(
      <ComposeBubble
        quote="pierwsza strzelanina"
        speakerOptions={[{ characterId: 'c1', name: 'James', portraitUrl: null }]}
        selfName="Nika" color="#b5472d"
        onSubmit={onSubmit} onCancel={() => {}}
      />,
    )
    await userEvent.click(screen.getByText('James'))
    await userEvent.type(screen.getByRole('textbox'), 'Nareszcie.')
    await userEvent.click(screen.getByRole('button', { name: /dodaj/i }))
    expect(onSubmit).toHaveBeenCalledWith({ speakerCharacterId: 'c1', body: 'Nareszcie.' })
  })

  it('omits the speaker picker and submits as OOC when there are no character options', async () => {
    const onSubmit = vi.fn().mockResolvedValue({})
    render(
      <ComposeBubble
        quote="pierwsza strzelanina"
        speakerOptions={[]}
        selfName="Nika" color="#b5472d"
        onSubmit={onSubmit} onCancel={() => {}}
      />,
    )
    expect(screen.queryByText(/Ja \(Nika\)/)).not.toBeInTheDocument()
    await userEvent.type(screen.getByRole('textbox'), 'Notka.')
    await userEvent.click(screen.getByRole('button', { name: /dodaj/i }))
    expect(onSubmit).toHaveBeenCalledWith({ speakerCharacterId: null, body: 'Notka.' })
  })
})
