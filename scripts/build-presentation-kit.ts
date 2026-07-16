/**
 * build-presentation-kit.ts — gallery manifest + engine sources + kit template
 * → downloadable player-facing slide editor (`packages/<slug>-prezentacja/`).
 *
 * Run:
 *   npx tsx scripts/build-presentation-kit.ts <slug> [--out <dir>=packages]
 *   npm run build-presentation-kit -- <slug>
 *
 * Example:
 *   npm run build-presentation-kit -- ug2
 *
 * Reads (all local, read-only, no env / no network / no Supabase):
 *   - public/gallery/<slug>.json → the Session Gallery manifest (scenes/cast/tracks with
 *     real repo paths). This is NOT parsed via `src/lib/gallery/manifest.ts` — that module's
 *     `@/` alias and `import.meta.env` are Vite-only and unavailable under plain `tsx`. The
 *     fields this builder actually consumes are validated structurally below instead.
 *   - the scene/cast image files it references, under `public/`
 *   - the track audio files it references, under `public/`
 *   - public/prezentacja/ug2/{engine.js,base.css,themes/cthulhu.css} → the in-repo canonical
 *     copy of the cinematic-slideshow engine (read as-is; never modified — see
 *     docs/superpowers/specs/2026-07-15-presentation-kit-design.md §2). The kit pins the
 *     cthulhu theme only (§8 — out of scope for v1), so this path is fixed regardless of
 *     <slug>.
 *   - scripts/kit-template/{kit-core.js,edytor.html} → the editor template + shared logic
 *
 * Builds `window.__KIT__` (the pinned contract — see
 * docs/superpowers/plans/2026-07-15-presentation-kit.md "Pinned contracts"): every gallery
 * scene/cast image is base64-encoded into `images[]` at BUILD TIME (§3.4 of the spec explains
 * why this can't happen at editor runtime: `fetch()` is blocked and `file://` images taint
 * `<canvas>`). Track audio is base64-encoded too, but NOT into `edytor.html` itself — it's
 * written to a sibling `assets/tracks-data.js` (`window.__KIT_TRACKS__`, basename -> data URI)
 * that the editor loads via `<script src>` (works under `file://`, unlike `fetch()`) and that
 * `KitCore.serializeSlidesJs` inlines into the exported deck's `TRACKS` object — see the
 * kit-audio-self-contained fix: the deck used to reference `assets/audio/<file>` relatively,
 * which 404s once a player moves the exported HTML away from the kit folder (e.g. their
 * Downloads folder). Keeping tracks-data.js separate from edytor.html keeps the editor lean.
 *
 * Writes `packages/<slug>-prezentacja/{edytor.html, assets/tracks-data.js}` (gitignored — see
 * `.gitignore`'s `packages/` entry, which already covers this kit's output; nothing here is
 * ever committed).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { resolve, basename, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inlineJson } from './lib/package-data'

// ----------------------------------------------------------------------
// CLI
// ----------------------------------------------------------------------

function usageAndExit(message: string): never {
  console.error(`[build-presentation-kit] ${message}`)
  console.error(
    '[build-presentation-kit] usage: npx tsx scripts/build-presentation-kit.ts <slug> [--out <dir>=packages]',
  )
  process.exit(1)
}

function parseArgs(argv: string[]) {
  const positional: string[] = []
  let out = 'packages'

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--out') {
      out = argv[++i]
      if (!out) usageAndExit('--out requires a directory argument.')
    } else if (arg.startsWith('--')) {
      usageAndExit(`unknown flag "${arg}".`)
    } else {
      positional.push(arg)
    }
  }

  return { slug: positional[0], out }
}

function fmtMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1)
}

// Mirrors the local `escapeHtml` in scripts/build-package.ts (not shared —
// each builder keeps its own copy per that file's convention). Used only for
// text injected directly into static HTML text nodes (the __KIT_TITLE__
// token); everything routed through `window.__KIT__` is escaped instead by
// KitCore at render time (see kit-core.js), so it is intentionally NOT
// applied to values placed inside the __KIT__ payload.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ----------------------------------------------------------------------
// Gallery manifest — structural validation (no Zod/`@/` import; see header).
// Mirrors the shape of src/lib/gallery/manifest.ts's GalleryManifestSchema,
// but only checks the fields this builder actually reads.
// ----------------------------------------------------------------------

type GalleryImageEntry = { src: string; caption?: string; alt?: string }
type GalleryPortraitEntry = { src: string; character: string }
type GalleryTrackEntry = { src: string; title: string }
type GalleryManifest = {
  caseKey: string
  title: string
  caseName?: string
  scenes: GalleryImageEntry[]
  cast: GalleryPortraitEntry[]
  tracks: GalleryTrackEntry[]
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0
}

function validateArrayField<T>(
  v: unknown,
  manifestPath: string,
  field: string,
  mapEntry: (entry: unknown, index: number) => T,
): T[] {
  if (!Array.isArray(v)) {
    usageAndExit(`gallery manifest ${manifestPath}: "${field}" must be an array.`)
  }
  return (v as unknown[]).map(mapEntry)
}

function validateGalleryManifest(raw: unknown, manifestPath: string): GalleryManifest {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    usageAndExit(`gallery manifest ${manifestPath}: expected a JSON object at the top level.`)
  }
  const m = raw as Record<string, unknown>

  if (!isNonEmptyString(m.caseKey)) {
    usageAndExit(`gallery manifest ${manifestPath}: "caseKey" must be a non-empty string.`)
  }
  if (!isNonEmptyString(m.title)) {
    usageAndExit(`gallery manifest ${manifestPath}: "title" must be a non-empty string.`)
  }
  if (m.caseName !== undefined && !isNonEmptyString(m.caseName)) {
    usageAndExit(`gallery manifest ${manifestPath}: "caseName" must be a non-empty string when present.`)
  }

  const scenes = validateArrayField(m.scenes, manifestPath, 'scenes', (entry, i) => {
    if (typeof entry !== 'object' || entry === null) {
      usageAndExit(`gallery manifest ${manifestPath}: scenes[${i}] is not an object.`)
    }
    const e = entry as Record<string, unknown>
    if (!isNonEmptyString(e.src)) {
      usageAndExit(`gallery manifest ${manifestPath}: scenes[${i}].src must be a non-empty string.`)
    }
    return {
      src: e.src,
      caption: typeof e.caption === 'string' ? e.caption : undefined,
      alt: typeof e.alt === 'string' ? e.alt : undefined,
    }
  })

  const cast = validateArrayField(m.cast, manifestPath, 'cast', (entry, i) => {
    if (typeof entry !== 'object' || entry === null) {
      usageAndExit(`gallery manifest ${manifestPath}: cast[${i}] is not an object.`)
    }
    const e = entry as Record<string, unknown>
    if (!isNonEmptyString(e.src)) {
      usageAndExit(`gallery manifest ${manifestPath}: cast[${i}].src must be a non-empty string.`)
    }
    if (!isNonEmptyString(e.character)) {
      usageAndExit(`gallery manifest ${manifestPath}: cast[${i}].character must be a non-empty string.`)
    }
    return { src: e.src, character: e.character }
  })

  const tracks = validateArrayField(m.tracks, manifestPath, 'tracks', (entry, i) => {
    if (typeof entry !== 'object' || entry === null) {
      usageAndExit(`gallery manifest ${manifestPath}: tracks[${i}] is not an object.`)
    }
    const e = entry as Record<string, unknown>
    if (!isNonEmptyString(e.src)) {
      usageAndExit(`gallery manifest ${manifestPath}: tracks[${i}].src must be a non-empty string.`)
    }
    if (!isNonEmptyString(e.title)) {
      usageAndExit(`gallery manifest ${manifestPath}: tracks[${i}].title must be a non-empty string.`)
    }
    return { src: e.src, title: e.title }
  })

  return {
    caseKey: m.caseKey,
    title: m.title,
    caseName: typeof m.caseName === 'string' ? m.caseName : undefined,
    scenes,
    cast,
    tracks,
  }
}

// ----------------------------------------------------------------------
// Image embedding (base64 data-URLs, build-time — spec §3.4)
// ----------------------------------------------------------------------

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
}

function mimeFor(filePath: string): string {
  const ext = extname(filePath).toLowerCase()
  const mime = MIME_BY_EXT[ext]
  if (!mime) usageAndExit(`unsupported image extension "${ext}" for ${filePath}.`)
  return mime
}

// Audio tracks are base64-encoded into assets/tracks-data.js (never inlined
// into edytor.html itself — see the file header). Restrict to the extensions
// the cinematic-slideshow engine and browsers actually play; anything else is
// almost certainly a manifest mistake (or a non-audio file smuggled in via a
// hand-edited manifest) rather than a track.
const AUDIO_MIME_BY_EXT: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.m4a': 'audio/mp4',
}
const AUDIO_EXTENSIONS = new Set(Object.keys(AUDIO_MIME_BY_EXT))

function assertAudioExtension(filePath: string, src: string): void {
  const ext = extname(filePath).toLowerCase()
  if (!AUDIO_EXTENSIONS.has(ext)) {
    usageAndExit(
      `unsupported audio extension "${ext}" for ${filePath} (manifest src "${src}") — allowed: ` +
        `${[...AUDIO_EXTENSIONS].join(', ')}.`,
    )
  }
}

function audioMimeFor(filePath: string): string {
  const ext = extname(filePath).toLowerCase()
  const mime = AUDIO_MIME_BY_EXT[ext]
  if (!mime) usageAndExit(`unsupported audio extension "${ext}" for ${filePath}.`)
  return mime
}

// `src` fields in the gallery manifest are absolute-from-public paths
// (e.g. "/img/ug2/speakeasy.jpg") — strip the leading slash and resolve
// under public/. Every caller of this function reads and packages whatever
// it resolves to (via base64-inlining or a straight file copy), so a
// manifest src containing "../" segments (or a Windows drive-absolute path)
// could otherwise walk the resolved path outside public/ entirely — assert
// containment before returning.
const PUBLIC_ROOT = resolve('public') + sep

function publicFilePath(src: string): string {
  const filePath = resolve('public', src.replace(/^\/+/, ''))
  if (!filePath.startsWith(PUBLIC_ROOT)) {
    usageAndExit(`manifest src "${src}" resolves outside public/ (${filePath}) — refusing to read it.`)
  }
  return filePath
}

type KitImage = { id: string; label: string; group: 'scene' | 'cast'; dataUrl: string }

function idFromSrc(src: string, group: 'scene' | 'cast'): string {
  const base = basename(src, extname(src))
  return group === 'cast' ? `cast-${base}` : base
}

function loadImage(
  src: string,
  label: string,
  group: 'scene' | 'cast',
  manifestPath: string,
): { image: KitImage; bytes: number } {
  const filePath = publicFilePath(src)
  if (!existsSync(filePath)) {
    usageAndExit(`missing image file: ${filePath} (referenced by ${manifestPath}, src "${src}").`)
  }
  const buf = readFileSync(filePath)
  const dataUrl = `data:${mimeFor(filePath)};base64,${buf.toString('base64')}`
  return { image: { id: idFromSrc(src, group), label, group, dataUrl }, bytes: buf.length }
}

// ----------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------

/**
 * Builds the presentation kit for `opts.slug` and writes it under
 * `opts.outDir` (the FINAL directory that receives `edytor.html` +
 * `assets/tracks-data.js`, e.g. `<vault>/Narzędzia/prezentacja` — no
 * `<slug>-prezentacja` subfolder is appended here, unlike the CLI's default).
 *
 * Pure orchestration extracted from the CLI's `main()` — see
 * docs/superpowers/plans/2026-07-15-session-vault.md task V0b. Behavior is
 * unchanged from the pre-extraction `main()`; only the destination directory
 * and gallery manifest path are now explicit parameters instead of being
 * computed from argv.
 */
export function buildPresentationKit(opts: {
  slug: string
  outDir: string
  galleryPath?: string
}): { edytorPath: string; edytorBytes: number; trackCount: number; imageCount: number } {
  const { slug, outDir } = opts

  // ------------------------------------------------------------------
  // 1. Gallery manifest.
  // ------------------------------------------------------------------
  const manifestPath = opts.galleryPath ? resolve(opts.galleryPath) : resolve('public/gallery', `${slug}.json`)
  if (!existsSync(manifestPath)) {
    usageAndExit(
      `gallery manifest not found: ${manifestPath} — build one with the session-digest skill ` +
        '(see .claude/skills/session-digest) before running this builder.',
    )
  }
  let rawManifest: unknown
  try {
    rawManifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch (err) {
    usageAndExit(`gallery manifest ${manifestPath} is not valid JSON: ${err instanceof Error ? err.message : String(err)}`)
  }
  const manifest = validateGalleryManifest(rawManifest, manifestPath)

  // ------------------------------------------------------------------
  // 2. Embed scene + cast images as base64 data-URLs.
  // ------------------------------------------------------------------
  const images: KitImage[] = []
  let imageBytes = 0

  for (const scene of manifest.scenes) {
    const { image, bytes } = loadImage(scene.src, scene.caption ?? scene.alt ?? '', 'scene', manifestPath)
    images.push(image)
    imageBytes += bytes
  }
  for (const member of manifest.cast) {
    const { image, bytes } = loadImage(member.src, member.character, 'cast', manifestPath)
    images.push(image)
    imageBytes += bytes
  }

  const IMAGE_WARN_BYTES = 12 * 1024 * 1024
  if (imageBytes > IMAGE_WARN_BYTES) {
    console.warn(
      `[build-presentation-kit] warning: embedded image payload is ${fmtMB(imageBytes)} MB ` +
        `(over the ${fmtMB(IMAGE_WARN_BYTES)} MB soft guideline) — continuing anyway.`,
    )
  }

  // ------------------------------------------------------------------
  // 3. Base64-encode track audio into a sibling assets/tracks-data.js
  //    (window.__KIT_TRACKS__) — NOT inlined into edytor.html itself (see
  //    the file header). Every manifest track is included, so the editor's
  //    "Posłuchaj" preview and the export path's self-contained inlining
  //    both work for every track, not just ones actually used by a draft.
  // ------------------------------------------------------------------
  const assetsDir = resolve(outDir, 'assets')
  mkdirSync(assetsDir, { recursive: true })

  const kitTracks: { file: string; label: string }[] = []
  const trackData: Record<string, string> = {}
  let audioBytes = 0

  for (const track of manifest.tracks) {
    const srcPath = publicFilePath(track.src)
    assertAudioExtension(srcPath, track.src)
    if (!existsSync(srcPath)) {
      usageAndExit(`missing audio file: ${srcPath} (referenced by ${manifestPath}, src "${track.src}").`)
    }
    const file = basename(track.src)
    const buf = readFileSync(srcPath)
    audioBytes += buf.length
    trackData[file] = `data:${audioMimeFor(srcPath)};base64,${buf.toString('base64')}`
    kitTracks.push({ file, label: track.title })
  }

  const tracksDataPath = resolve(assetsDir, 'tracks-data.js')
  writeFileSync(tracksDataPath, `window.__KIT_TRACKS__ = ${JSON.stringify(trackData)};\n`, 'utf8')
  const tracksDataBytes = statSync(tracksDataPath).size

  // ------------------------------------------------------------------
  // 4. Engine sources (in-repo canonical copy — cthulhu theme only, §8)
  //    + editor template + shared logic.
  // ------------------------------------------------------------------
  const engineDir = resolve('public/prezentacja/ug2')
  const engineJsPath = resolve(engineDir, 'engine.js')
  const baseCssPath = resolve(engineDir, 'base.css')
  const themeCssPath = resolve(engineDir, 'themes/cthulhu.css')
  for (const p of [engineJsPath, baseCssPath, themeCssPath]) {
    if (!existsSync(p)) usageAndExit(`engine source not found: ${p}`)
  }
  const engineJs = readFileSync(engineJsPath, 'utf8')
  const baseCss = readFileSync(baseCssPath, 'utf8')
  const themeCss = readFileSync(themeCssPath, 'utf8')
  // Editor preview never hits the network (K2 acceptance: zero requests under
  // file://) — strip the theme's Google Fonts @import for the embedded
  // editor copy. The EXPORTED deck keeps the full themeCss (with @import) —
  // see buildEngineDoc's `full` flag in edytor.html.
  const themeCssEditor = themeCss
    .split('\n')
    .filter((line) => !/^\s*@import\b/.test(line))
    .join('\n')

  const kitCorePath = resolve('scripts/kit-template/kit-core.js')
  const templatePath = resolve('scripts/kit-template/edytor.html')
  if (!existsSync(kitCorePath)) usageAndExit(`kit-core.js not found: ${kitCorePath}`)
  if (!existsSync(templatePath)) usageAndExit(`edytor.html template not found: ${templatePath}`)
  const kitCoreJs = readFileSync(kitCorePath, 'utf8')
  // Drift guard: kit-core.js is injected verbatim into an HTML <script>
  // element below. The HTML tokenizer ends that element at the first
  // `</script` byte sequence regardless of JS context (e.g. inside a string
  // or comment), which would silently truncate KitCore mid-file. Catch that
  // here instead of shipping a broken editor.
  if (/<\/script/i.test(kitCoreJs)) {
    usageAndExit(
      `${kitCorePath} contains a literal "</script" sequence, which would truncate the ` +
        'injected <script> element and break the editor. Reword the offending text so it ' +
        'no longer contains that byte sequence.',
    )
  }
  let html = readFileSync(templatePath, 'utf8')

  // ------------------------------------------------------------------
  // 5. Inject tokens — function-form replacement only (never `String.replace`
  //    with a raw string payload: a payload containing a literal `$&`/`$1`
  //    sequence would otherwise corrupt the output — see the iter-2 review
  //    fix mirrored here from scripts/build-package.ts).
  // ------------------------------------------------------------------

  const titleToken = '__KIT_TITLE__'
  const titleOccurrences = html.split(titleToken).length - 1
  if (titleOccurrences === 0) {
    usageAndExit(`template drift: token "${titleToken}" not found in ${templatePath}.`)
  }
  // Prefer the manifest's clean `caseName` over `title`, which is the gallery
  // PAGE heading (e.g. "Urodzaj Grozy — galeria") and would otherwise leak
  // that suffix into the kit/deck title.
  const kitTitle = manifest.caseName ?? manifest.title
  const titleText = `${escapeHtml(kitTitle)} — edytor prezentacji`
  html = html.split(titleToken).join(titleText)

  const coreToken = '/*__KIT_CORE__*/'
  const coreOccurrences = html.split(coreToken).length - 1
  if (coreOccurrences !== 1) {
    usageAndExit(
      `template drift: expected exactly one occurrence of "${coreToken}" in ${templatePath}, found ${coreOccurrences}.`,
    )
  }
  html = html.replace(coreToken, () => kitCoreJs)

  const dataToken = '/*__KIT_DATA__*/null'
  const dataOccurrences = html.split(dataToken).length - 1
  if (dataOccurrences !== 1) {
    usageAndExit(
      `template drift: expected exactly one occurrence of "${dataToken}" in ${templatePath}, found ${dataOccurrences}.`,
    )
  }
  const kit = {
    slug,
    title: kitTitle,
    images,
    tracks: kitTracks,
    engineJs,
    baseCss,
    themeCss,
    themeCssEditor,
  }
  html = html.replace(dataToken, () => inlineJson(kit))

  // `assets/tracks-data.js` is written as its own file (not inlined into
  // edytor.html — see the file header), so all it needs here is a
  // `<script src>` reference. Drift-guarded like every other token above.
  const tracksScriptToken = '<!--__KIT_TRACKS_SCRIPT__-->'
  const tracksScriptOccurrences = html.split(tracksScriptToken).length - 1
  if (tracksScriptOccurrences !== 1) {
    usageAndExit(
      `template drift: expected exactly one occurrence of "${tracksScriptToken}" in ${templatePath}, found ${tracksScriptOccurrences}.`,
    )
  }
  html = html.replace(tracksScriptToken, () => '<script src="assets/tracks-data.js"></script>')

  // ------------------------------------------------------------------
  // 6. Write the kit.
  // ------------------------------------------------------------------
  const edytorPath = resolve(outDir, 'edytor.html')
  writeFileSync(edytorPath, html, 'utf8')
  const edytorBytes = statSync(edytorPath).size

  // ------------------------------------------------------------------
  // Summary (console log kept here — dev-visible feedback either way the fn
  // is invoked; the CLI's own next-steps block stays in main()).
  // ------------------------------------------------------------------
  console.log(
    `[build-presentation-kit] slug=${slug} images=${images.length} (scenes=${manifest.scenes.length} cast=${manifest.cast.length}) tracks=${kitTracks.length}`,
  )
  console.log(`[build-presentation-kit] wrote ${edytorPath} (${fmtMB(edytorBytes)} MB)`)
  console.log(
    `[build-presentation-kit] wrote ${tracksDataPath} (${fmtMB(tracksDataBytes)} MB, ${kitTracks.length} tracks, ${fmtMB(audioBytes)} MB raw audio)`,
  )

  return { edytorPath, edytorBytes, trackCount: kitTracks.length, imageCount: images.length }
}

function main() {
  const { slug, out } = parseArgs(process.argv.slice(2))
  if (!slug) usageAndExit('missing <slug> argument.')

  const kitFolderName = `${slug}-prezentacja`
  const outDir = resolve(out, kitFolderName)

  buildPresentationKit({ slug, outDir })

  // ------------------------------------------------------------------
  // Next steps.
  // ------------------------------------------------------------------
  console.log('')
  console.log('[build-presentation-kit] next steps:')
  console.log('  1. Zip the kit:')
  console.log(
    `     powershell -Command "Compress-Archive -Path ${out}\\${kitFolderName}\\* -DestinationPath ${out}\\${kitFolderName}.zip -Force"`,
  )
  console.log('  2. Upload the zip to Google Drive, share as "anyone with the link, viewer".')
  console.log(
    '  3. See docs/RUNBOOKS/presentation-kit.md (player instructions step) for the ready-to-paste Polish snippet.',
  )
}

const isMainModule = resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)
if (isMainModule) main()
