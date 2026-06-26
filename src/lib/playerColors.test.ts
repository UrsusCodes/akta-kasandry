import { describe, it, expect } from 'vitest'
import { PLAYER_COLORS, DEFAULT_PLAYER_COLOR, playerColorName } from './playerColors'

describe('playerColors', () => {
  it('offers exactly 16 colours with unique hex values', () => {
    expect(PLAYER_COLORS).toHaveLength(16)
    const hexes = PLAYER_COLORS.map((c) => c.hex.toLowerCase())
    expect(new Set(hexes).size).toBe(16)
  })

  it('default colour is one of the palette', () => {
    expect(PLAYER_COLORS.some((c) => c.hex === DEFAULT_PLAYER_COLOR)).toBe(true)
  })

  it('names a known hex and falls back to the hex itself', () => {
    expect(playerColorName(PLAYER_COLORS[0].hex)).toBe(PLAYER_COLORS[0].name)
    expect(playerColorName('#000000')).toBe('#000000')
  })
})
