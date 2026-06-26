/**
 * Player identity palette — 16 muted, period-appropriate colours for the
 * Cthulhu skin. A player picks one; it rings their portrait and tints the
 * fragments they comment on. Distinct from the 10-colour pin palette.
 * Seeded from the brainstorm mockup v3.
 */
export const PLAYER_COLORS = [
  { name: 'Terakota', hex: '#b5472d' },
  { name: 'Miedź', hex: '#c97f2e' },
  { name: 'Złoto', hex: '#c8a23c' },
  { name: 'Oliwka', hex: '#7d8c3a' },
  { name: 'Szmaragd', hex: '#3f8c6e' },
  { name: 'Patyna', hex: '#2f7d8a' },
  { name: 'Atrament', hex: '#3a6ea5' },
  { name: 'Fiolet', hex: '#5a5aa5' },
  { name: 'Ametyst', hex: '#8a4fa5' },
  { name: 'Magenta', hex: '#a5417e' },
  { name: 'Sjena', hex: '#9c5a3c' },
  { name: 'Grafit', hex: '#6b6b6b' },
  { name: 'Mosiądz', hex: '#a08947' },
  { name: 'Mech', hex: '#4f7a4f' },
  { name: 'Stal', hex: '#3a5566' },
  { name: 'Burgund', hex: '#7a3a3a' },
] as const

export const DEFAULT_PLAYER_COLOR = '#3a6ea5'

/** Display name for a hex value (falls back to the hex itself). */
export function playerColorName(hex: string): string {
  return PLAYER_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.name ?? hex
}
