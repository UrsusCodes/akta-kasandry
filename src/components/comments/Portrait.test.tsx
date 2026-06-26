import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Portrait } from './Portrait'

describe('Portrait', () => {
  it('renders a rectangular character photo when a portrait url is given', () => {
    render(<Portrait color="#b5472d" name="James Kelly" portraitUrl="/p.jpg" kind="character" />)
    const img = screen.getByRole('img', { name: /james kelly/i })
    expect(img).toHaveAttribute('src', '/p.jpg')
  })

  it('renders a round initial tile for self (no portrait)', () => {
    render(<Portrait color="#3a6ea5" name="Nika" portraitUrl={null} kind="self" />)
    expect(screen.getByText('NI')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
