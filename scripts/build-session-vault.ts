/**
 * build-session-vault.ts — assembles a self-contained **Obsidian vault** for
 * one session under `packages/<slug>-vault/`, reusing the two shipped
 * builders for its in-vault tools plus the pure summary rewrite.
 *
 * Run:
 *   npx tsx scripts/build-session-vault.ts <slug> [--summary <path>] [--audio <path>] [--out <dir>=packages] [--owner <name>]
 *   npm run build-session-vault -- <slug> --audio "<path-to-sala-mix.opus>"
 *
 * Example:
 *   npm run build-session-vault -- rozdarte-sumienie --audio "packages/_audio-src/rozdarte-sumienie-sala.opus" --owner "Nika"
 *
 * Reads (all local, read-only, no env / no network / no Supabase):
 *   - public/transcripts/data/variants.json → resolve <slug> → default variant → overlay file
 *   - public/transcripts/data/<overlay file> → parsed as Overlay
 *   - public/transcripts/scene-index/<slug>.json → parsed as SceneIndexFile
 *   - the digest draft: `--summary <path>`, else the single match of
 *     `docs/superpowers/drafts/*-<slug>-summary.md`
 *   - scripts/vault-template/** → static vault notes + minimal `.obsidian/` config
 *     (ASCII source names; written under their final Polish-diacritic vault paths)
 *   - public/gallery/<slug>.json (via buildPresentationKit) and, when `--audio`
 *     (or the default Sala mix) is given, that audio file (via buildSessionPackage)
 *
 * Orchestration only — the two genuinely new pieces of logic
 * (`scripts/lib/vault-summary.ts`'s rewrite, `scripts/lib/vault-manifest.ts`'s
 * file plan) are pure and unit-tested there; this script wires them together
 * with the two existing builders (`buildSessionPackage`, `buildPresentationKit`,
 * extracted in V0a/V0b) and the static templates.
 *
 * See docs/superpowers/plans/2026-07-15-session-vault.md (task V5) and
 * docs/superpowers/specs/2026-07-15-session-vault-design.md for the full
 * design (vault tree, deep-link rewrite, round-trip contract).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync, readdirSync, rmSync, copyFileSync } from 'node:fs'
import { resolve, relative, sep, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSessionPackage } from './build-package'
import { buildPresentationKit } from './build-presentation-kit'
import { rewriteSummaryToObsidian, type SceneRef, type UttResolve } from './lib/vault-summary'
import { planVaultFiles } from './lib/vault-manifest'
import { seekSecondsFor, type SceneIndexFile } from './lib/package-data'
import type { Overlay, Manifest } from '../src/lib/transcripts/overlay'

const DEFAULT_OWNER = 'wyznaczony gracz'

function usageAndExit(message: string): never {
  console.error(`[build-session-vault] ${message}`)
  console.error(
    '[build-session-vault] usage: npx tsx scripts/build-session-vault.ts <slug> ' +
      '[--summary <path>] [--audio <path>] [--out <dir>=packages] [--owner <name>]',
  )
  process.exit(1)
}

function parseArgs(argv: string[]) {
  const positional: string[] = []
  let summary: string | undefined
  let audio: string | undefined
  let out = 'packages'
  let owner: string | undefined

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--summary') {
      summary = argv[++i]
      if (!summary) usageAndExit('--summary requires a path argument.')
    } else if (arg === '--audio') {
      audio = argv[++i]
      if (!audio) usageAndExit('--audio requires a path argument.')
    } else if (arg === '--out') {
      out = argv[++i]
      if (!out) usageAndExit('--out requires a directory argument.')
    } else if (arg === '--owner') {
      owner = argv[++i]
      if (!owner) usageAndExit('--owner requires a name argument.')
    } else if (arg.startsWith('--')) {
      usageAndExit(`unknown flag "${arg}".`)
    } else {
      positional.push(arg)
    }
  }

  return { slug: positional[0], summary, audio, out, owner }
}

function fmtMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1)
}

/** Recursively sums file sizes under `dir` (0 if it doesn't exist yet). */
function dirBytes(dir: string): number {
  if (!existsSync(dir)) return 0
  let total = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, entry.name)
    total += entry.isDirectory() ? dirBytes(p) : statSync(p).size
  }
  return total
}

// ----------------------------------------------------------------------
// Overlay + scene-index resolution — mirrors build-package.ts's main()
// (task V0a's extraction kept that resolution inside `buildSessionPackage`,
// which doesn't hand back the parsed `Overlay`/`SceneIndexFile` objects this
// script also needs for the summary rewrite, so it's duplicated here per the
// plan's V5 note: "reuse build-package.ts's resolution ... else duplicate the
// ~15 lines").
// ----------------------------------------------------------------------

function resolveOverlayAndScenes(
  slug: string,
  dataDir: string,
): { overlay: Overlay; sceneIndex: SceneIndexFile } {
  const manifestPath = resolve(dataDir, 'variants.json')
  if (!existsSync(manifestPath)) {
    usageAndExit(`manifest not found: ${manifestPath}`)
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest

  const session = manifest.sessions[slug]
  if (!session) {
    const available = Object.keys(manifest.sessions).join(', ')
    usageAndExit(`unknown slug "${slug}". Available slugs: ${available}`)
  }

  const variant = session.variants.find((v) => v.id === session.default_variant)
  if (!variant) {
    usageAndExit(
      `slug "${slug}": default_variant "${session.default_variant}" not found among its variants.`,
    )
  }

  const overlayPath = resolve(dataDir, variant.file)
  if (!existsSync(overlayPath)) {
    usageAndExit(`overlay file not found: ${overlayPath}`)
  }
  const overlay = JSON.parse(readFileSync(overlayPath, 'utf8')) as Overlay

  const sceneIndexPath = resolve('public/transcripts/scene-index', `${slug}.json`)
  if (!existsSync(sceneIndexPath)) {
    usageAndExit(
      `scene-index not found: ${sceneIndexPath} — create it with the session-digest skill ` +
        '(see .claude/skills/session-digest).',
    )
  }
  const sceneIndex = JSON.parse(readFileSync(sceneIndexPath, 'utf8')) as SceneIndexFile

  return { overlay, sceneIndex }
}

/** `--summary <path>`, else the single match of `docs/superpowers/drafts/*-<slug>-summary.md`. */
function resolveSummaryPath(slug: string, summaryArg: string | undefined): string {
  if (summaryArg) {
    const p = resolve(summaryArg)
    if (!existsSync(p)) usageAndExit(`--summary path not found: ${p}`)
    return p
  }

  const draftsDir = resolve('docs/superpowers/drafts')
  if (!existsSync(draftsDir)) {
    usageAndExit(
      `no --summary given and drafts dir not found: ${draftsDir} — pass --summary <path> or ` +
        'run the session-digest skill first.',
    )
  }
  const suffix = `-${slug}-summary.md`
  const matches = readdirSync(draftsDir).filter((f) => f.endsWith(suffix))
  if (matches.length === 0) {
    usageAndExit(
      `no draft found matching ${draftsDir}${sep}*${suffix} — pass --summary <path> or run the ` +
        'session-digest skill first.',
    )
  }
  if (matches.length > 1) {
    usageAndExit(
      `ambiguous draft: ${matches.length} files match ${draftsDir}${sep}*${suffix} ` +
        `(${matches.join(', ')}) — pass --summary <path> to disambiguate.`,
    )
  }
  return resolve(draftsDir, matches[0])
}

/** Builds the `resolve`/`scenes` inputs `rewriteSummaryToObsidian` needs from the overlay + scene-index. */
function buildRewriteInputs(
  overlay: Overlay,
  sceneIndex: SceneIndexFile,
): { resolveUtt: UttResolve; scenes: SceneRef[] } {
  const indexById = new Map(overlay.utterances.map((u, i) => [u.id, i]))

  const resolveUtt: UttResolve = (id) => {
    const idx = indexById.get(id)
    if (idx === undefined) return null
    return { idx, sec: seekSecondsFor(overlay.utterances[idx], overlay.timeline) }
  }

  const scenes: SceneRef[] = sceneIndex.scenes.map((scene, i) => {
    const aIdx = indexById.get(scene.uStart)
    if (aIdx === undefined) {
      usageAndExit(
        `scene-index "${scene.id}" references uStart utterance id "${scene.uStart}" which is ` +
          'not present in the overlay.',
      )
    }
    const bIdx = indexById.get(scene.uEnd)
    if (bIdx === undefined) {
      usageAndExit(
        `scene-index "${scene.id}" references uEnd utterance id "${scene.uEnd}" which is not ` +
          'present in the overlay.',
      )
    }
    return { ordinal: i + 1, aIdx, bIdx }
  })

  return { resolveUtt, scenes }
}

// ----------------------------------------------------------------------
// Static templates — ASCII source names under scripts/vault-template/**,
// written at their final Polish-diacritic vault paths (see the file header
// and docs/superpowers/plans/2026-07-15-session-vault.md task V3's note on
// why the source tree stays ASCII-only).
// ----------------------------------------------------------------------

const TEMPLATE_SOURCE_BY_FINAL: Record<string, string> = {
  'START TUTAJ.md': 'START TUTAJ.md',
  'Komentarz do AI.md': 'Komentarz do AI.md',
  'Narzędzia/Otwórz narzędzia.md': 'Narzedzia/Otworz narzedzia.md',
  'Media/_Wrzuć tu media.md': 'Media/_Wrzuc tu media.md',
  '.obsidian/app.json': 'dot-obsidian/app.json',
  '.obsidian/appearance.json': 'dot-obsidian/appearance.json',
}

const TOKEN_RE = /__[A-Z_]+__/

// Windows-illegal filename chars (`\ / : * ? " < > |`) union Obsidian
// wikilink-breaking chars (`# ^ [ ] |`) — a session display name can contain
// any of these (e.g. a colon in a subtitle), which would otherwise either
// fail the file write outright or silently break every `[[Streszczenie —
// <name>]]` wikilink in the static templates. Replaced with a space so the
// result stays readable, then repeats/edges are collapsed.
const FILENAME_UNSAFE_RE = /[\\/:*?"<>|#^[\]]/g

/**
 * Sanitizes a session's display name for use as the summary's on-disk
 * filename and the `__SESSION__` token substituted into the vault's static
 * templates (including their `[[Streszczenie — __SESSION__]]` wikilinks —
 * both must use the identical sanitized string for those links to resolve).
 * A name with none of the unsafe characters (e.g. "Rozdarte Sumienie")
 * passes through unchanged.
 */
function sanitizeSessionNameForFilename(name: string): string {
  return name.replace(FILENAME_UNSAFE_RE, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * `missingBasenames` is the subset of the summary's referenced media that is
 * still absent from Media/ (see `copyGalleryMediaIntoVault` + its caller in
 * `main`) — `totalReferenced` (the summary's full reference count, before
 * filtering) disambiguates "no images referenced at all" from "all
 * referenced images already copied in".
 */
function buildMediaChecklist(missingBasenames: string[], totalReferenced: number): string {
  if (totalReferenced === 0) {
    return '*(to streszczenie na razie nie odwołuje się do żadnych obrazków)*'
  }
  if (missingBasenames.length === 0) {
    return '*(wszystkie obrazki, do których odwołuje się streszczenie, są już w Media/ — nic do zrobienia)*'
  }
  return missingBasenames.map((b) => `- [ ] ${b}`).join('\n')
}

// ----------------------------------------------------------------------
// Gallery-manifest media → Media/sceny + Media/portrety.
//
// The summary's `![[basename]]` embeds resolve in Obsidian by basename
// anywhere in the vault (folder structure is free), so copying the gallery
// manifest's scene/cast images into Media/ — the same manifest
// `buildPresentationKit` already reads for the presentation tool — is enough
// to make those embeds work with no per-embed path bookkeeping. Not routed
// through `src/lib/gallery/manifest.ts`'s Zod schema: that module's `@/`
// alias is Vite-only and unavailable under plain `tsx` (mirrors the same
// call-out in build-presentation-kit.ts's file header) — only the two fields
// actually needed (`scenes[].src`, `cast[].src`) are read here, structurally.
// ----------------------------------------------------------------------

type GalleryMediaEntry = { src: string }
type GalleryMediaManifest = { scenes: GalleryMediaEntry[]; cast: GalleryMediaEntry[] }

const MEDIA_PUBLIC_ROOT = resolve('public') + sep

/** `src` fields are absolute-from-public paths (e.g. "/img/<slug>/cast/x.jpg") — resolve under public/, refusing anything that would walk outside it. */
function publicFilePathForMedia(src: string): string | null {
  const filePath = resolve('public', src.replace(/^\/+/, ''))
  return filePath.startsWith(MEDIA_PUBLIC_ROOT) ? filePath : null
}

/** Reads `public/gallery/<slug>.json`'s `scenes`/`cast` arrays; `null` if the manifest is missing or malformed (never fails the vault build — `buildPresentationKit`, called later, is the authoritative hard-failure point for a missing/invalid manifest). */
function loadGalleryMediaManifest(slug: string): GalleryMediaManifest | null {
  const manifestPath = resolve('public/gallery', `${slug}.json`)
  if (!existsSync(manifestPath)) return null
  try {
    const raw = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown>
    const scenes = Array.isArray(raw.scenes) ? (raw.scenes as GalleryMediaEntry[]) : []
    const cast = Array.isArray(raw.cast) ? (raw.cast as GalleryMediaEntry[]) : []
    return { scenes, cast }
  } catch {
    return null
  }
}

/**
 * Copies each manifest scene image into `Media/sceny/<basename>` and each
 * cast image into `Media/portrety/<basename>` under `vaultOutDir`. A
 * referenced file that doesn't exist under `public/` is skipped with a
 * console warning rather than failing the build (a manifest can legitimately
 * reference art that hasn't been drawn yet). Returns the flat filenames
 * (no directory) actually copied, for the missing-media checklist below.
 */
function copyGalleryMediaIntoVault(manifest: GalleryMediaManifest | null, vaultOutDir: string): Set<string> {
  const copied = new Set<string>()
  if (!manifest) return copied

  const copyGroup = (entries: GalleryMediaEntry[], destSubdir: string) => {
    const destDir = resolve(vaultOutDir, 'Media', destSubdir)
    mkdirSync(destDir, { recursive: true })
    for (const entry of entries) {
      const srcPath = publicFilePathForMedia(entry.src)
      if (!srcPath || !existsSync(srcPath)) {
        console.warn(
          `[build-session-vault] warning: missing media file for Media/${destSubdir}: "${entry.src}" — skipping.`,
        )
        continue
      }
      const base = basename(srcPath)
      copyFileSync(srcPath, resolve(destDir, base))
      copied.add(base)
    }
  }

  copyGroup(manifest.scenes, 'sceny')
  copyGroup(manifest.cast, 'portrety')
  return copied
}

// Function-form-only replacement (mirrors the two other builders' token
// injection): a token value containing a literal `$&`/`$1` sequence must
// never corrupt the output via String.replace's special substitution syntax.
// split/join sidesteps that entirely.
function replaceTokens(text: string, tokens: Record<string, string>): string {
  let out = text
  for (const [token, value] of Object.entries(tokens)) {
    out = out.split(token).join(value)
  }
  return out
}

// ----------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------

function main() {
  const { slug, summary, audio, out, owner } = parseArgs(process.argv.slice(2))
  if (!slug) usageAndExit('missing <slug> argument.')

  const dataDir = resolve('public/transcripts/data')
  const { overlay, sceneIndex } = resolveOverlayAndScenes(slug, dataDir)
  const sessionName = overlay.session_name

  // Validated up front — fail fast, before the two 100MB-ish tool builds
  // below — rather than discovering a blank filename after most of the work
  // is already done.
  const sessionNameSafe = sanitizeSessionNameForFilename(sessionName)
  if (!sessionNameSafe) {
    usageAndExit(
      `slug "${slug}": session name "${sessionName}" is empty after filename sanitization ` +
        '(it consists entirely of Windows-illegal / wikilink-breaking characters).',
    )
  }

  const summaryPath = resolveSummaryPath(slug, summary)
  const draftMd = readFileSync(summaryPath, 'utf8')

  const { resolveUtt, scenes } = buildRewriteInputs(overlay, sceneIndex)

  let rewritten: { markdown: string; mediaBasenames: string[] }
  try {
    rewritten = rewriteSummaryToObsidian(draftMd, { slug, sessionName, resolve: resolveUtt, scenes })
  } catch (err) {
    console.error(`[build-session-vault] ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }

  const ownerName = owner ?? DEFAULT_OWNER
  const vaultOutDir = resolve(out, `${slug}-vault`)
  // Clean rebuild: remove any prior build first so orphaned files (an old
  // summary filename from a since-renamed session, a removed gallery track,
  // a stale template file) never linger across re-runs — the vault tree is
  // always assembled wholesale from current sources, never patched in place.
  if (existsSync(vaultOutDir)) {
    rmSync(vaultOutDir, { recursive: true, force: true })
  }
  mkdirSync(vaultOutDir, { recursive: true })

  // ------------------------------------------------------------------
  // Gallery-manifest media → Media/sceny + Media/portrety (ahead of the
  // planVaultFiles loop below, so the missing-media checklist token it
  // substitutes into "Media/_Wrzuć tu media.md" already reflects what's
  // actually been copied in).
  // ------------------------------------------------------------------
  const galleryMediaManifest = loadGalleryMediaManifest(slug)
  const copiedMediaBasenames = copyGalleryMediaIntoVault(galleryMediaManifest, vaultOutDir)
  const missingMediaBasenames = rewritten.mediaBasenames.filter(
    (b) => !copiedMediaBasenames.has(basename(b)),
  )

  // ------------------------------------------------------------------
  // Static templates + summary + Media/ subfolders, per planVaultFiles.
  // ------------------------------------------------------------------
  const tokens: Record<string, string> = {
    __SESSION__: sessionNameSafe,
    __SLUG__: slug,
    __OWNER__: ownerName,
    __MEDIA_CHECKLIST__: buildMediaChecklist(missingMediaBasenames, rewritten.mediaBasenames.length),
  }

  let summaryFinalPath = ''
  let summaryBytes = 0

  for (const file of planVaultFiles(slug)) {
    if (file.kind === 'summary') {
      // planVaultFiles plans this slot by slug (it has no access to the
      // overlay's display name) — the builder owns the final on-disk name.
      // Uses the sanitized name (see sanitizeSessionNameForFilename) so the
      // filename is always Windows-legal and matches the __SESSION__ token
      // baked into the templates' [[Streszczenie — __SESSION__]] wikilinks.
      summaryFinalPath = resolve(vaultOutDir, `Streszczenie — ${sessionNameSafe}.md`)
      writeFileSync(summaryFinalPath, rewritten.markdown, 'utf8')
      summaryBytes = statSync(summaryFinalPath).size
      continue
    }

    if (file.kind === 'derived') {
      mkdirSync(resolve(vaultOutDir, file.path), { recursive: true })
      continue
    }

    // kind === 'template'
    const sourceRel = TEMPLATE_SOURCE_BY_FINAL[file.path]
    if (!sourceRel) {
      usageAndExit(`vault-manifest drift: no template source mapped for "${file.path}".`)
    }
    const sourcePath = resolve('scripts/vault-template', sourceRel)
    if (!existsSync(sourcePath)) {
      usageAndExit(`template not found: ${sourcePath} (for vault path "${file.path}").`)
    }
    const rendered = replaceTokens(readFileSync(sourcePath, 'utf8'), tokens)
    if (TOKEN_RE.test(rendered)) {
      usageAndExit(`template drift: unreplaced token remains in ${sourcePath} after substitution.`)
    }
    const destPath = resolve(vaultOutDir, file.path)
    mkdirSync(resolve(destPath, '..'), { recursive: true })
    writeFileSync(destPath, rendered, 'utf8')
  }

  // ------------------------------------------------------------------
  // Transcript tool (buildSessionPackage, V0a) → Narzędzia/transkrypt/.
  // --audio, else the default Sala mix iff it exists, else no-audio.
  // ------------------------------------------------------------------
  const transcriptOutDir = resolve(vaultOutDir, 'Narzędzia/transkrypt')

  let audioPath: string | null = null
  if (audio) {
    audioPath = resolve(audio)
    if (!existsSync(audioPath)) {
      usageAndExit(`--audio path not found: ${audioPath}`)
    }
  } else {
    const defaultSala = resolve('packages/_audio-src', `${slug}-sala.opus`)
    if (existsSync(defaultSala)) {
      audioPath = defaultSala
      console.log(`[build-session-vault] no --audio given — using default Sala mix: ${audioPath}`)
    }
  }
  if (!audioPath) {
    console.log('[build-session-vault] no audio available — building transcript-only tool.')
  }

  const pkgResult = buildSessionPackage({ slug, audioPath, outDir: transcriptOutDir, dataDir })

  // ------------------------------------------------------------------
  // Presentation tool (buildPresentationKit, V0b) → Narzędzia/prezentacja/.
  // ------------------------------------------------------------------
  const prezOutDir = resolve(vaultOutDir, 'Narzędzia/prezentacja')
  const kitResult = buildPresentationKit({ slug, outDir: prezOutDir })

  // ------------------------------------------------------------------
  // Summary + next steps.
  // ------------------------------------------------------------------
  const transcriptBytes = dirBytes(transcriptOutDir)
  const prezBytes = dirBytes(prezOutDir)
  const totalBytes = dirBytes(vaultOutDir)

  console.log('')
  console.log('[build-session-vault] built:')
  console.log(`  streszczenie: ${relative(process.cwd(), summaryFinalPath)} (${fmtMB(summaryBytes)} MB)`)
  console.log(
    `  transkrypt:   ${relative(process.cwd(), transcriptOutDir)} (${fmtMB(transcriptBytes)} MB` +
      `${pkgResult.audioDestPath ? ', z audio' : ', bez audio'})`,
  )
  console.log(
    `  prezentacja:  ${relative(process.cwd(), prezOutDir)} (${fmtMB(prezBytes)} MB, ` +
      `images=${kitResult.imageCount} tracks=${kitResult.trackCount})`,
  )
  console.log(`  RAZEM:        ${relative(process.cwd(), vaultOutDir)} (${fmtMB(totalBytes)} MB)`)
  console.log(
    `  media:        skopiowano ${copiedMediaBasenames.size} z galerii do Media/sceny + Media/portrety`,
  )

  if (missingMediaBasenames.length > 0) {
    console.log('')
    console.log(
      `[build-session-vault] przypomnienie: streszczenie odwołuje się do ${missingMediaBasenames.length} ` +
        'obrazka/-ów, których jeszcze nie ma w Media/ — patrz Media/_Wrzuć tu media.md.',
    )
  }

  console.log('')
  console.log('[build-session-vault] next steps:')
  console.log('  1. Zip the vault:')
  console.log(
    `     powershell -Command "Compress-Archive -Path ${out}\\${slug}-vault\\* -DestinationPath ${out}\\${slug}-vault.zip -Force"`,
  )
  console.log('  2. Upload the zip to Google Drive, share as "anyone with the link, viewer".')
  console.log(
    `  3. Next: hand the link to ${ownerName} as the correction assignment ` +
      '(see docs/RUNBOOKS/session-vault.md).',
  )
}

const isMainModule = resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)
if (isMainModule) main()
