/**
 * Pin colour palette — 10 muted, period-appropriate options that sit on the
 * Cthulhu skin (parchment/teal/gold world). Used by the map edit form and the
 * pin list. Stored as hex in `wiki.pins.color`.
 */
export const PIN_COLORS = [
  { name: 'Złoto', hex: '#c89b3c' },
  { name: 'Miedź', hex: '#b5703c' },
  { name: 'Rdza', hex: '#a14e29' },
  { name: 'Krew', hex: '#7a2e2e' },
  { name: 'Śliwka', hex: '#5d4459' },
  { name: 'Atrament', hex: '#3a5a78' },
  { name: 'Patyna', hex: '#4a7c74' },
  { name: 'Mech', hex: '#6b7551' },
  { name: 'Cyna', hex: '#8a8678' },
  { name: 'Kość', hex: '#e8dcc0' },
] as const

export const DEFAULT_PIN_COLOR = '#c89b3c'

/** Display name for a hex value (falls back to the hex itself). */
export function colorName(hex: string): string {
  return PIN_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.name ?? hex
}

/** Stable sort index for grouping the pin list by colour (palette order). */
export function colorOrder(hex: string): number {
  const i = PIN_COLORS.findIndex((c) => c.hex.toLowerCase() === hex.toLowerCase())
  return i === -1 ? PIN_COLORS.length : i
}
