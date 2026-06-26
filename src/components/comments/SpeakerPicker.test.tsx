import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpeakerPicker } from './SpeakerPicker'

const options = [
  { characterId: 'c1', name: 'James Kelly', portraitUrl: null },
  { characterId: 'c2', name: 'Eleine Howard', portraitUrl: null },
]

describe('SpeakerPicker', () => {
  it('lists characters plus a self option and reports the choice', async () => {
    const onPick = vi.fn()
    render(<SpeakerPicker options={options} selfName="Nika" color="#b5472d" value={null} onPick={onPick} />)
    expect(screen.getByText('James Kelly')).toBeInTheDocument()
    // "Ja (Nika)" — use exact text to avoid collision with "James" (which also contains "Ja")
    expect(screen.getByText('Ja (Nika)')).toBeInTheDocument()
    await userEvent.click(screen.getByText('James Kelly'))
    expect(onPick).toHaveBeenCalledWith('c1')
  })

  it('reports null when self is chosen', async () => {
    const onPick = vi.fn()
    render(<SpeakerPicker options={options} selfName="Nika" color="#b5472d" value="c1" onPick={onPick} />)
    await userEvent.click(screen.getByText('Ja (Nika)'))
    expect(onPick).toHaveBeenCalledWith(null)
  })
})
