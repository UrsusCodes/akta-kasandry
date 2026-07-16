/**
 * build-package.ts — session overlay + scene-index (+ optional audio) →
 * downloadable session package (`packages/<slug>/index.html` [+ `audio/`]).
 *
 * Run:
 *   npx tsx scripts/build-package.ts <slug> [--audio <path-to-mix.opus>] [--out <dir>=packages]
 *   npm run build-package -- <slug> --audio "<path>"
 *
 * Example:
 *   npm run build-package -- ug2 --audio "C:\Users\Pawel\rpg-recorder\outputs\transcript-viz\audio\ug2\ug2-mix.opus"
 *
 * Reads (all local, read-only, no env / no network / no Supabase):
 *   - public/transcripts/data/variants.json  → resolve <slug> → default variant → overlay file
 *   - public/transcripts/data/<overlay file> → parsed as Overlay
 *   - public/transcripts/scene-index/<slug>.json → parsed as SceneIndexFile
 *   - scripts/package-template/template.html → viewer shell (tokens replaced below)
 *
 * Builds the trimmed payload via `buildPackagePayload` (scripts/lib/package-data.ts),
 * injects it into the template as `window.__PKG__`, and writes the package to
 * `packages/<slug>/` (gitignored — see docs/superpowers/plans/2026-07-15-session-companion-iter2.md
 * "Hard constraints": the concat-mix audio is an rpg-recorder output, never committed here).
 *
 * `--audio <path>` is optional. When given, the file is copied to
 * `packages/<slug>/audio/<slug>-mix.opus` and the payload's `meta.audioSrc` points at it
 * (relative `audio/<slug>-mix.opus`, per the file:// rules — no absolute paths in the payload).
 * Without it, the package still builds: `meta.audioSrc` is null and the viewer degrades to a
 * transcript-only package (see template.html's no-audio branch).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, statSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildPackagePayload, inlineJson, type SceneIndexFile } from './lib/package-data'
import type { Overlay, Manifest } from '../src/lib/transcripts/overlay'

function usageAndExit(message: string): never {
  console.error(`[build-package] ${message}`)
  console.error(
    '[build-package] usage: npx tsx scripts/build-package.ts <slug> [--audio <path-to-mix.opus>] [--out <dir>=packages]',
  )
  process.exit(1)
}

function parseArgs(argv: string[]) {
  const positional: string[] = []
  let audio: string | undefined
  let out = 'packages'

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--audio') {
      audio = argv[++i]
      if (!audio) usageAndExit('--audio requires a path argument.')
    } else if (arg === '--out') {
      out = argv[++i]
      if (!out) usageAndExit('--out requires a directory argument.')
    } else if (arg.startsWith('--')) {
      usageAndExit(`unknown flag "${arg}".`)
    } else {
      positional.push(arg)
    }
  }

  return { slug: positional[0], audio, out }
}

function fmtMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Build a session package for `slug` into `outDir` (which receives `index.html`
 * and, when `audioPath` is given, `audio/<slug>-mix.opus`).
 *
 * Pure orchestration, no argv parsing — extracted from the CLI's `main()` so other
 * scripts (e.g. the session-vault builder) can call it directly with an exact
 * output directory. Throws (via `process.exit(1)`, matching the CLI's existing
 * `usageAndExit` posture) on any missing/invalid input — same failure behavior as
 * running the CLI.
 */
export function buildSessionPackage(opts: {
  slug: string
  audioPath?: string | null
  outDir: string
  dataDir?: string
}): { indexPath: string; indexBytes: number; audioDestPath: string | null; audioBytes: number | null } {
  const { slug, outDir } = opts
  const audioPath = opts.audioPath ?? null

  // ------------------------------------------------------------------
  // Resolve overlay via variants.json.
  // ------------------------------------------------------------------
  const dataDir = resolve(opts.dataDir ?? 'public/transcripts/data')
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

  // ------------------------------------------------------------------
  // Resolve scene index.
  // ------------------------------------------------------------------
  const sceneIndexPath = resolve('public/transcripts/scene-index', `${slug}.json`)
  if (!existsSync(sceneIndexPath)) {
    usageAndExit(
      `scene-index not found: ${sceneIndexPath} — create it with the session-digest skill ` +
        '(see .claude/skills/session-digest).',
    )
  }
  const sceneIndex = JSON.parse(readFileSync(sceneIndexPath, 'utf8')) as SceneIndexFile

  // ------------------------------------------------------------------
  // Resolve audio (optional).
  // ------------------------------------------------------------------
  let audioSrcPath: string | undefined
  if (audioPath) {
    audioSrcPath = resolve(audioPath)
    if (!existsSync(audioSrcPath)) {
      usageAndExit(`--audio path not found: ${audioSrcPath}`)
    }
    if (extname(audioSrcPath).toLowerCase() !== '.opus') {
      console.warn(
        `[build-package] warning: --audio path "${audioSrcPath}" does not have a .opus extension — continuing anyway.`,
      )
    }
  }

  const audioSrc = audioPath ? `audio/${slug}-mix.opus` : null

  // ------------------------------------------------------------------
  // Build the payload (pure — scripts/lib/package-data.ts).
  // ------------------------------------------------------------------
  let payload
  try {
    payload = buildPackagePayload(overlay, sceneIndex, { variantId: variant.id, audioSrc })
  } catch (err) {
    console.error(`[build-package] ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }

  // ------------------------------------------------------------------
  // Inject into the template.
  // ------------------------------------------------------------------
  const templatePath = resolve('scripts/package-template/template.html')
  if (!existsSync(templatePath)) {
    usageAndExit(`template not found: ${templatePath}`)
  }
  let html = readFileSync(templatePath, 'utf8')

  const titleToken = '__PKG_TITLE__'
  const titleOccurrences = html.split(titleToken).length - 1
  if (titleOccurrences === 0) {
    usageAndExit(`template drift: token "${titleToken}" not found in ${templatePath}.`)
  }
  const title = `${escapeHtml(overlay.session_name)} — pakiet sesji`
  html = html.split(titleToken).join(title)

  const jsonToken = '/*__PKG_JSON__*/null'
  const jsonOccurrences = html.split(jsonToken).length - 1
  if (jsonOccurrences !== 1) {
    usageAndExit(
      `template drift: expected exactly one occurrence of "${jsonToken}" in ${templatePath}, found ${jsonOccurrences}.`,
    )
  }
  html = html.replace(jsonToken, () => inlineJson(payload))

  // ------------------------------------------------------------------
  // Write the package.
  // ------------------------------------------------------------------
  mkdirSync(outDir, { recursive: true })

  const indexPath = resolve(outDir, 'index.html')
  writeFileSync(indexPath, html, 'utf8')
  const indexBytes = statSync(indexPath).size

  let audioBytes: number | null = null
  let audioDestPath: string | null = null
  if (audioSrcPath) {
    const audioDir = resolve(outDir, 'audio')
    mkdirSync(audioDir, { recursive: true })
    audioDestPath = resolve(audioDir, `${slug}-mix.opus`)
    copyFileSync(audioSrcPath, audioDestPath)
    audioBytes = statSync(audioDestPath).size
  }

  // ------------------------------------------------------------------
  // Summary (console log kept here — dev-visible feedback either way the fn
  // is invoked; the CLI's own next-steps block stays in main()).
  // ------------------------------------------------------------------
  console.log(`[build-package] slug=${slug} variant=${variant.id} scenes=${payload.scenes.length} utterances=${payload.utterances.length}`)
  console.log(`[build-package] wrote ${indexPath} (${fmtMB(indexBytes)} MB)`)
  if (audioDestPath && audioBytes != null) {
    console.log(`[build-package] wrote ${audioDestPath} (${fmtMB(audioBytes)} MB)`)
  } else {
    console.log('[build-package] UWAGA: pakiet bez audio — seek wyłączony.')
  }

  return { indexPath, indexBytes, audioDestPath, audioBytes }
}

function main() {
  const { slug, audio, out } = parseArgs(process.argv.slice(2))
  if (!slug) usageAndExit('missing <slug> argument.')

  const outDir = resolve(out, slug)
  const audioPath = audio ? resolve(audio) : null

  buildSessionPackage({ slug, audioPath, outDir })

  // ------------------------------------------------------------------
  // Next steps.
  // ------------------------------------------------------------------
  console.log('')
  console.log('[build-package] next steps:')
  console.log('  1. Zip the package:')
  console.log(
    `     powershell -Command "Compress-Archive -Path ${out}\\${slug}\\* -DestinationPath ${out}\\${slug}.zip -Force"`,
  )
  console.log('  2. Upload the zip to Google Drive, share as "anyone with the link, viewer".')
  console.log('  3. Paste the hub link in BOTH places (see docs/RUNBOOKS/session-package.md):')
  console.log(
    `     - [⬇ Pakiet sesji (transkrypt + audio, ~40 MB)](<WKLEJ-LINK-DRIVE>) - otwórz index.html z rozpakowanego ZIP-a`,
  )
  console.log('     - wklej do vaulta: PUBLIC/SPRAWY/<sprawa>/00 HUB.md oraz do src/generated/content.ts')
}

const isMainModule = resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)
if (isMainModule) main()
