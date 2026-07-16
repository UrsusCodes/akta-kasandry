/**
 * Pure vault-assembly plan for the Session Vault builder (V2 of
 * `docs/superpowers/plans/2026-07-15-session-vault.md`).
 *
 * `planVaultFiles(slug)` is the single source of truth for which
 * static-template and derived paths the vault builder
 * (`scripts/build-session-vault.ts`, V5) writes under
 * `packages/<slug>-vault/`. It does **no** filesystem I/O — it only computes
 * the plan, so the file/folder set the builder assembles can be asserted in
 * tests without touching disk. See design spec §4 ("Vault contents") for the
 * origin of every path.
 *
 * Deliberately **excluded**: the two tool subtrees `Narzędzia/transkrypt/**`
 * and `Narzędzia/prezentacja/**`, which are owned end-to-end by
 * `buildSessionPackage` / `buildPresentationKit` respectively — the builder
 * calls those functions directly rather than routing their output through
 * this plan. `.obsidian/workspace.json` is also deliberately never included
 * (design spec §5: it pins machine-local pane state and is not portable).
 */

export type VaultFile = { path: string; kind: 'summary' | 'template' | 'derived' | 'tool' }

/**
 * The static template files (verbatim from `scripts/vault-template/**`,
 * token-interpolated by the builder — `__SESSION__`, `__SLUG__`, `__OWNER__`,
 * `__MEDIA_CHECKLIST__`). Slug-independent, so listed once and reused.
 */
const TEMPLATE_FILES: readonly string[] = [
  'START TUTAJ.md',
  'Komentarz do AI.md',
  'Narzędzia/Otwórz narzędzia.md',
  'Media/_Wrzuć tu media.md',
  '.obsidian/app.json',
  '.obsidian/appearance.json',
]

/**
 * Empty `Media/` drop-zone subfolders the builder recreates as real
 * directories (the template ships them as `.gitkeep` markers, which are
 * never copied into the vault — see V3's acceptance criteria).
 */
const MEDIA_SUBFOLDERS: readonly string[] = [
  'Media/portrety',
  'Media/sceny',
  'Media/muzyka',
  'Media/zdjecia-z-gry',
  'Media/materialy',
]

/**
 * The exact relative paths (final, Polish-diacritic vault names) the vault
 * builder writes for the static-template + derived parts of the tree. Does
 * **not** include the two tool subtrees (owned by `buildSessionPackage` /
 * `buildPresentationKit`, called separately by the builder).
 *
 * The summary entry's filename is interpolated from `slug` here as a stable
 * placeholder; the builder (V5), which additionally knows the session's
 * display name from the overlay, writes the actual file using that display
 * name (`Streszczenie — <sessionName>.md`) — this function has no access to
 * that value, so it plans the summary slot by slug and the builder owns the
 * final on-disk name.
 */
export function planVaultFiles(slug: string): VaultFile[] {
  const files: VaultFile[] = TEMPLATE_FILES.map((path) => ({ path, kind: 'template' as const }))

  files.push({ path: `Streszczenie — ${slug}.md`, kind: 'summary' })

  for (const dir of MEDIA_SUBFOLDERS) {
    files.push({ path: dir, kind: 'derived' })
  }

  return files
}
