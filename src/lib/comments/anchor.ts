/**
 * Homegrown text anchorer. Pins a comment to a block (by stable id) and a
 * quoted fragment with surrounding context, then re-locates it at render time
 * with progressively looser matching. No geometry — pure DOM text + offsets —
 * so it is unit-testable under jsdom. No external dependency.
 */

/** Collapse all whitespace runs to single spaces and trim. */
export function normalizeText(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

/** Small deterministic FNV-1a hash → base36, max 8 chars. Used for block ids. */
export function shortHash(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36).slice(0, 8)
}
