/**
 * Pure Obsidian-markdown rewrite for a session's digest summary (Session
 * Vault, V1 of docs/superpowers/plans/2026-07-15-session-vault.md).
 *
 * The digest draft is authored for the site renderer: `{sesja:<slug>#<id>}`
 * deep-links (resolved by src/lib/remarkTranscriptAnchors.ts), site-absolute
 * `<img src="/img/<slug>/...">` / `![](/img/<slug>/...)` images,
 * `[label](/sesje/<slug>)` cross-page links, and a "Pytania i wątpliwości"
 * section of plain paragraphs. None of that renders usefully in Obsidian.
 * This module converts the same draft into Obsidian-safe markdown:
 * deep-links become a visible `(scena N · ~H:MM:SS)` label plus a hidden
 * `<!--rs:<id>-->` restore comment (losslessly invertible back to the site
 * token later), `/sesje/<slug>` links become a pointer at the vault's own
 * transcript tool, images become `![[basename]]` embeds, and questions
 * become `> [!question]` callouts.
 *
 * Pure, no I/O, no `import.meta` — mirrors the style of
 * scripts/lib/group-comments.ts and scripts/lib/package-data.ts. Consumed
 * by scripts/build-session-vault.ts (V5), which supplies the (impure)
 * `resolve` and `scenes` built from the overlay + scene-index.
 *
 * See docs/superpowers/specs/2026-07-15-session-vault-design.md §3 for the
 * full rationale.
 */

import { fmtTime } from '../../src/lib/transcripts/format'

/** Seconds → the site's `fmtTime` convention (`H:MM:SS` / `M:SS`); `'--:--'` for null/NaN. */
export function formatClock(sec: number | null): string {
  return fmtTime(sec)
}

export type SceneRef = { ordinal: number; aIdx: number; bIdx: number }

/**
 * Which scene an overlay index belongs to. Scenes are chronological,
 * non-overlapping ranges (a sparse subset of the full utterance list — see
 * the plan's "20 of 55 distinct anchors fall outside every range" finding),
 * so containment isn't enough: an index between ranges resolves to the
 * *preceding* scene (the one it happened during/just after), flagged
 * `exact: false`. An index before the first scene falls back to scene 1,
 * also flagged `exact: false`. Empty `scenes` → `{ ordinal: 0, exact: false }`
 * (the builder guarantees at least one scene in practice).
 */
export function sceneForIndex(idx: number, scenes: SceneRef[]): { ordinal: number; exact: boolean } {
  if (scenes.length === 0) return { ordinal: 0, exact: false }

  const sorted = [...scenes].sort((a, b) => a.aIdx - b.aIdx)

  for (const scene of sorted) {
    if (idx >= scene.aIdx && idx <= scene.bIdx) return { ordinal: scene.ordinal, exact: true }
  }

  let preceding: SceneRef | null = null
  for (const scene of sorted) {
    if (scene.aIdx <= idx) preceding = scene
    else break
  }
  if (preceding) return { ordinal: preceding.ordinal, exact: false }

  return { ordinal: sorted[0].ordinal, exact: false }
}

export type UttResolve = (id: string) => { idx: number; sec: number | null } | null

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Splits markdown into alternating {text, isCode} segments so rewrites skip fenced/inline code, matching remarkTranscriptAnchors' "code stays literal" behavior. */
function splitCodeSegments(md: string): { text: string; isCode: boolean }[] {
  const parts = md.split(/(```[\s\S]*?```|`[^`\n]*`)/)
  return parts.map((text, i) => ({ text, isCode: i % 2 === 1 }))
}

// Same token shape as src/lib/remarkTranscriptAnchors.ts' TOKEN, scoped to one slug.
function tokenRegex(slug: string): RegExp {
  return new RegExp(`\\{sesja:${escapeRegExp(slug)}#([a-f0-9]+)(?:\\.\\.([a-f0-9]+))?\\}`, 'g')
}

/**
 * `{sesja:<slug>#<id>}` (and range `{sesja:<slug>#<from>..<to>}`) →
 * `(scena N · ~H:MM:SS)<!--rs:id-->` (range: both clocks, `<!--rs:from..to-->`).
 * Throws naming the id when `resolve` can't find it — a draft/overlay
 * mismatch must fail loud rather than ship a dead link (mirrors
 * buildPackagePayload's posture in scripts/lib/package-data.ts).
 */
export function rewriteDeepLinks(md: string, slug: string, resolve: UttResolve, scenes: SceneRef[]): string {
  const regex = tokenRegex(slug)

  const renderOne = (fromId: string, toId?: string): string => {
    const from = resolve(fromId)
    if (!from) {
      throw new Error(
        `rewriteDeepLinks: unknown utterance id "${fromId}" (token {sesja:${slug}#${fromId}${toId ? '..' + toId : ''}})`,
      )
    }
    const scene = sceneForIndex(from.idx, scenes)
    const sceneLabel = scene.exact ? `scena ${scene.ordinal}` : `scena ~${scene.ordinal}`
    const fromClock = formatClock(from.sec)

    if (toId) {
      const to = resolve(toId)
      if (!to) {
        throw new Error(`rewriteDeepLinks: unknown utterance id "${toId}" (token {sesja:${slug}#${fromId}..${toId}})`)
      }
      const toClock = formatClock(to.sec)
      return `(${sceneLabel} · ~${fromClock}–${toClock})<!--rs:${fromId}..${toId}-->`
    }
    return `(${sceneLabel} · ~${fromClock})<!--rs:${fromId}-->`
  }

  return splitCodeSegments(md)
    .map((seg) =>
      seg.isCode
        ? seg.text
        : seg.text.replace(regex, (_match, fromId: string, toId: string | undefined) => renderOne(fromId, toId)),
    )
    .join('')
}

/**
 * `<img src="/img/<slug>/<base>.<ext>" ...>` and `![alt](/img/<slug>/<base>.<ext>)`
 * → `![[<base>.<ext>]]` (Obsidian resolves embeds by filename, so `Media/`
 * subfoldering is free). A following `*caption*` line and any image outside
 * `/img/<slug>/` are left untouched.
 */
export function rewriteImageEmbeds(md: string, slug: string): string {
  const escapedSlug = escapeRegExp(slug)
  const imgTagRe = new RegExp(`<img\\b[^>]*\\bsrc="\\/img\\/${escapedSlug}\\/([^"]+)"[^>]*\\/?>`, 'g')
  const mdImgRe = new RegExp(`!\\[[^\\]]*\\]\\(\\/img\\/${escapedSlug}\\/([^)]+)\\)`, 'g')

  return md
    .replace(imgTagRe, (_m, basename: string) => `![[${basename}]]`)
    .replace(mdImgRe, (_m, basename: string) => `![[${basename}]]`)
}

/** All `/img/<slug>/<base>.<ext>` basenames referenced in `md`, deduped, first-seen order. */
export function collectMediaBasenames(md: string, slug: string): string[] {
  const re = new RegExp(`\\/img\\/${escapeRegExp(slug)}\\/([^")\\s]+\\.[a-zA-Z0-9]+)`, 'g')
  const seen = new Set<string>()
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(md)) !== null) {
    const basename = m[1]
    if (!seen.has(basename)) {
      seen.add(basename)
      out.push(basename)
    }
  }
  return out
}

const SESJE_TOOL_TARGET = 'Narzędzia/transkrypt/index.html'
const SESJE_TOOL_HINT = '(otwórz w folderze Narzędzia → transkrypt)'

/**
 * `[label](/sesje/<slug>)` (and `/sesje/<slug>?...` query-string form) — the
 * site's cross-page link to the session's transcript route — has nothing to
 * resolve to in Obsidian. Rewritten to point at the vault's own bundled
 * transcript tool (`Narzędzia/transkrypt/index.html`), with a parenthetical
 * hint appended since Obsidian doesn't reliably open a clicked link to a
 * local non-note file in every version (design spec §6): the hint gives the
 * file-manager fallback a name to look for even if the click does nothing.
 * A link to a **foreign** slug's `/sesje/...` route (this vault's summary
 * quoting another session) has no corresponding local tool, so it's left
 * untouched.
 */
export function rewriteSesjeLinks(md: string, slug: string): string {
  const re = new RegExp(`\\[([^\\]]+)\\]\\(\\/sesje\\/${escapeRegExp(slug)}(?:\\?[^)]*)?\\)`, 'g')
  return md.replace(re, (_match, label: string) => `[${label}](${SESJE_TOOL_TARGET}) ${SESJE_TOOL_HINT}`)
}

const QUESTIONS_HEADING = /^## Pytania i wątpliwości\s*$/m

function findQuestionsSection(md: string): { headingEnd: number; end: number } | null {
  const m = QUESTIONS_HEADING.exec(md)
  if (!m) return null
  const headingEnd = m.index + m[0].length
  const rest = md.slice(headingEnd)
  // Section ends at the next `##` heading, the next thematic break (`---`), or EOF.
  const stopMatch = /\n##\s|\n---\s*(\n|$)/.exec(rest)
  const end = stopMatch ? headingEnd + stopMatch.index : md.length
  return { headingEnd, end }
}

function toQuestionCallout(text: string): string {
  const lines = text.split('\n').map((line) => (line.length ? `> ${line}` : '>'))
  return ['> [!question]', ...lines].join('\n')
}

/**
 * Within `## Pytania i wątpliwości`, wraps each non-blank paragraph as a
 * `> [!question]` callout. The section's intro blockquote (a paragraph
 * whose lines already start with `>`) is preserved verbatim. A paragraph
 * ending with `{q-after:<heading text>}` has the marker stripped and the
 * resulting callout relocated to just after the matching `### <heading>`
 * line anywhere in `md`; if no such heading exists, it stays in the section
 * like an unmarked question (fail-soft — placement is a display nicety, not
 * data-integrity critical).
 */
export function questionsToCallouts(md: string): string {
  const section = findQuestionsSection(md)
  if (!section) return md

  const availableHeadings = new Set(
    Array.from(md.matchAll(/^###\s+(.+?)\s*$/gm)).map((m) => m[1].trim()),
  )

  const sectionText = md.slice(section.headingEnd, section.end)
  const rawParagraphs = sectionText.split(/\n\s*\n/)

  const keptParagraphs: string[] = []
  const relocations: { heading: string; callout: string }[] = []

  for (const raw of rawParagraphs) {
    const para = raw.trim()
    if (!para) continue

    if (para.startsWith('>')) {
      keptParagraphs.push(para) // intro blockquote, preserved verbatim
      continue
    }

    const markerMatch = /\s*\{q-after:([^}]+)\}\s*$/.exec(para)
    const heading = markerMatch ? markerMatch[1].trim() : null
    const text = (markerMatch ? para.slice(0, markerMatch.index) : para).trim()
    const callout = toQuestionCallout(text)

    if (heading && availableHeadings.has(heading)) {
      relocations.push({ heading, callout })
    } else {
      keptParagraphs.push(callout)
    }
  }

  const newSectionText = `\n\n${keptParagraphs.join('\n\n')}\n\n`
  let out = md.slice(0, section.headingEnd) + newSectionText + md.slice(section.end)

  for (const { heading, callout } of relocations) {
    const headingRe = new RegExp(`^(###\\s+${escapeRegExp(heading)}\\s*)$`, 'm')
    const hm = headingRe.exec(out)
    if (!hm) continue // defensive — heading existed at scan time, so this shouldn't happen
    const insertAt = hm.index + hm[0].length
    out = out.slice(0, insertAt) + '\n\n' + callout + out.slice(insertAt)
  }

  return out
}

const PLAYER_NOTE =
  '> [!note] Wersja do waszej korekty\n' +
  '> To streszczenie sesji czeka na wasze poprawki — imion, kolejności scen i wszystkiego, ' +
  'co na taśmie wyszło niejasno. Odpowiedzi na pytania `[!question]` i uwagi wpiszcie w `Komentarz do AI.md`.'

/** Replaces the draft's internal "WERSJA ROBOCZA / nie publikować" top blockquote with a player-facing note; no-op if not found. */
function replaceDraftBanner(md: string): string {
  const blocks = md.split(/\n\n+/)
  const idx = blocks.findIndex((b) => b.trimStart().startsWith('>') && b.includes('WERSJA ROBOCZA'))
  if (idx === -1) return md
  blocks[idx] = PLAYER_NOTE
  return blocks.join('\n\n')
}

function escapeYamlString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function buildFrontmatter(slug: string, sessionName: string): string {
  return (
    '---\n' +
    `session: "${escapeYamlString(sessionName)}"\n` +
    `slug: ${slug}\n` +
    'status: do-korekty\n' +
    'tags: [streszczenie, do-korekty]\n' +
    '---\n\n'
  )
}

/**
 * Composes the full draft → vault rewrite: replaces the internal
 * "WERSJA ROBOCZA" banner with a player-facing note, prepends YAML
 * frontmatter, then runs deep-link → sesje-link → image → questions
 * transforms in that order. Returns the rewritten markdown plus the deduped
 * media basenames the summary references (for the vault's Media/ checklist).
 */
export function rewriteSummaryToObsidian(
  md: string,
  opts: { slug: string; sessionName: string; resolve: UttResolve; scenes: SceneRef[] },
): { markdown: string; mediaBasenames: string[] } {
  const mediaBasenames = collectMediaBasenames(md, opts.slug)

  let out = replaceDraftBanner(md)
  out = buildFrontmatter(opts.slug, opts.sessionName) + out
  out = rewriteDeepLinks(out, opts.slug, opts.resolve, opts.scenes)
  out = rewriteSesjeLinks(out, opts.slug)
  out = rewriteImageEmbeds(out, opts.slug)
  out = questionsToCallouts(out)

  return { markdown: out, mediaBasenames }
}
