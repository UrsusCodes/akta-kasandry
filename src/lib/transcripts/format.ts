/** Small presentation helpers shared across the transcript viewer. */

/** Seconds → "h:mm:ss" or "mm:ss". Returns "--:--" for null/NaN. */
export function fmtTime(sec: number | null | undefined): string {
  if (sec == null || isNaN(sec)) return '--:--'
  const s0 = Math.max(0, Math.floor(sec))
  const h = Math.floor(s0 / 3600)
  const m = Math.floor((s0 % 3600) / 60)
  const s = s0 % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/** Seconds → "Xh YYm" or "Ym". Returns "—" for null. */
export function fmtDuration(sec: number | null | undefined): string {
  if (sec == null) return '—'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${m}m`
}

/** Channel index → "chNN". */
export function fmtChannel(idx: number | null | undefined): string {
  if (idx == null) return 'ch—'
  return 'ch' + String(idx).padStart(2, '0')
}

/** hex → rgba(...) with alpha, for subtle speaker tints. */
export function tint(hex: string | undefined, a: number): string {
  if (!hex || hex[0] !== '#' || hex.length < 7) return `rgba(139,148,163,${a})`
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

/** Readable text color (#000/#fff) on a solid speaker-colored chip. */
export function chipText(hex: string | undefined): string {
  if (!hex || hex[0] !== '#' || hex.length < 7) return '#fff'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  return lum > 150 ? '#0b0b0c' : '#ffffff'
}

/** chunk.prob (0..1) → integer percent. */
export function pct(prob: number | null | undefined): number {
  return Math.round((prob || 0) * 100)
}
