/**
 * Markdown cleanup helpers ported from C:\temp\bookstack-test\import.py
 *
 * Used by scripts/push-vault.ts before sending a page to Supabase. Pure functions,
 * no I/O — easy to unit-test later. See work note 2026-05-19-wikilink-plugin.md
 * for the wikilink half of the pipeline (it lives in src/lib/wikilinks.ts so the
 * renderer and the script share one source of truth).
 */

const ASTERISK_4PLUS = /\*{4,}/g
const ASTERISK_3 = /\*{3}/g

/**
 * Fix broken bold markup:
 * - `****` (empty bold pair) → strip entirely
 * - `***` (italic+bold, often unbalanced in user-written notes) → reduce to `**`
 * - Lines with an odd count of `**` → drop the last orphan
 */
export function collapseAsterisks(text: string): string {
  let cleaned = text.replace(ASTERISK_4PLUS, '').replace(ASTERISK_3, '**')
  return cleaned
    .split('\n')
    .map((line) => {
      const count = (line.match(/\*\*/g) ?? []).length
      if (count % 2 === 1) {
        const idx = line.lastIndexOf('**')
        if (idx >= 0) return line.slice(0, idx) + line.slice(idx + 2)
      }
      return line
    })
    .join('\n')
}

/**
 * Strip a leading `# Title` if it matches the page filename — avoids a duplicate
 * H1 when the renderer already shows the title from breadcrumbs/route.
 */
export function stripDuplicateH1(text: string, pageName: string): string {
  const trimmed = text.replace(/^\n+/, '')
  const lines = trimmed.split('\n')
  if (lines.length === 0) return text
  const first = lines[0].trim()
  if (!first.startsWith('# ')) return text
  const title = first.slice(2).trim()
  const norm = (s: string) => s.replace(/[^\p{L}\p{N}\s-]/gu, '').trim().toLowerCase()
  if (norm(title) === norm(pageName) || title.toLowerCase().startsWith(pageName.toLowerCase())) {
    return lines.slice(1).join('\n').replace(/^\n+/, '')
  }
  return text
}

/**
 * Polish-aware slug. Mirrors import.py's slugify: NFKD normalize, strip combining
 * marks (ą → a, ł → l, ż → z), lowercase, non-alphanumerics → dashes, trim.
 */
export function slugify(text: string): string {
  const nfkd = text.normalize('NFKD').replace(/[̀-ͯ]/g, '')
  const ascii = nfkd
    // Polish letters that don't decompose via NFKD
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .toLowerCase()
  const slug = ascii.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return slug || 'page'
}

/**
 * Cheap stable hash for content fingerprinting. Used in dry-run output and in
 * `--execute` mode to skip unchanged pages. FNV-1a 32-bit, deterministic.
 */
export function contentHash(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = (h * 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}
