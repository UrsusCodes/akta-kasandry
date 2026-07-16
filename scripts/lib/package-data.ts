/**
 * Pure payload builder for the downloadable session package (Iteration 2).
 *
 * Given a session's transcript overlay (produced by rpg-recorder) and its
 * scene-index (produced by the `session-digest` skill), builds the trimmed
 * winner-only projection that gets inlined into the package's `index.html`
 * as `window.__PKG__` (see the payload contract in
 * `docs/superpowers/plans/2026-07-15-session-companion-iter2.md`). Pure, no
 * I/O — mirrors the style of `scripts/lib/group-comments.ts`. Consumed by
 * `scripts/build-package.ts` (T3), which does the file I/O and CLI wiring.
 */

import type { Overlay, Utterance } from '../../src/lib/transcripts/overlay'

export type SceneIndexEntry = {
  id: string
  title: string
  uStart: string
  uEnd: string
  tApprox: string
}
export type SceneIndexFile = { slug: string; scenes: SceneIndexEntry[] }

export type PkgSpeaker = { id: string; name: string; color: string }

export type PkgUtterance = {
  id: string // utterance id (same ids as {sesja:<slug>#<id>} anchors)
  sec: number | null // seek seconds into the mix (see seekSecondsFor); null = not seekable
  spk: string // speaker id -> PkgSpeaker
  text: string
  neutral: 0 | 1 // 1 when !assigned => render grey/neutral like the site viewer
}

export type PkgScene = {
  id: string
  title: string // from scene-index
  startIdx: number
  endIdx: number // resolved utterance array indexes (build-time)
  seekSec: number | null // uStart utterance's sec
  tApprox: string // display string, passed through
}

export type PkgPayload = {
  meta: {
    slug: string
    sessionName: string
    variantId: string
    builtAt: string // ISO date
    duration: number // overlay.duration (seconds)
    audioSrc: string | null // 'audio/<slug>-mix.opus' or null (no-audio build)
  }
  speakers: PkgSpeaker[]
  scenes: PkgScene[]
  utterances: PkgUtterance[]
}

/**
 * Seek seconds for one utterance — the pinned rule (see the plan's "Utterance
 * -> time" decision and rpg-recorder's SCHEMA.md): prefer the concat-stream
 * `play.start`; fall back to the transcript-clock `start` only when the
 * overlay's timeline IS the concat timeline (on an epoch timeline the
 * transcript clock diverges from audio time by hundreds of seconds, so no
 * fallback is valid there).
 */
const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i
const FALLBACK_COLOR = '#8b949e'

/**
 * Validates a speaker color is a strict `#rrggbb` hex string — colors are
 * interpolated verbatim into inline `style` attributes in the package
 * template (scripts/package-template/template.html), so anything else
 * (a stray `expression()`, an unclosed quote, etc.) must never reach there.
 * Falls back to a neutral grey.
 */
function safeSpeakerColor(color: string): string {
  return HEX_COLOR_RE.test(color) ? color : FALLBACK_COLOR
}

export function seekSecondsFor(u: Utterance, timeline: Overlay['timeline']): number | null {
  if (u.play?.start != null) return u.play.start
  if (timeline === 'concat') return u.start
  return null
}

/**
 * Overlay + scene index + build options -> the full trimmed PkgPayload.
 * Throws a descriptive Error (naming the scene id and the missing utterance
 * id) if a scene's `uStart`/`uEnd` is absent from the overlay.
 */
export function buildPackagePayload(
  overlay: Overlay,
  sceneIndex: SceneIndexFile,
  opts: { variantId: string; audioSrc: string | null; builtAt?: string },
): PkgPayload {
  const indexById = new Map(overlay.utterances.map((u, i) => [u.id, i]))

  const utterances: PkgUtterance[] = overlay.utterances.map((u) => ({
    id: u.id,
    sec: seekSecondsFor(u, overlay.timeline),
    spk: u.speaker_id,
    text: u.text,
    neutral: u.assigned ? 0 : 1,
  }))

  const scenes: PkgScene[] = sceneIndex.scenes.map((scene) => {
    const startIdx = indexById.get(scene.uStart)
    if (startIdx === undefined) {
      throw new Error(
        `buildPackagePayload: scene "${scene.id}" references uStart utterance id "${scene.uStart}" which is not present in the overlay`,
      )
    }
    const endIdx = indexById.get(scene.uEnd)
    if (endIdx === undefined) {
      throw new Error(
        `buildPackagePayload: scene "${scene.id}" references uEnd utterance id "${scene.uEnd}" which is not present in the overlay`,
      )
    }
    if (startIdx > endIdx) {
      throw new Error(
        `buildPackagePayload: scene "${scene.id}" has startIdx (${startIdx}, id "${scene.uStart}") after endIdx (${endIdx}, id "${scene.uEnd}")`,
      )
    }

    return {
      id: scene.id,
      title: scene.title,
      startIdx,
      endIdx,
      seekSec: utterances[startIdx].sec,
      tApprox: scene.tApprox,
    }
  })

  const speakers: PkgSpeaker[] = overlay.speakers.map((s) => ({
    id: s.id,
    name: s.name,
    color: safeSpeakerColor(s.color),
  }))

  return {
    meta: {
      slug: overlay.slug,
      sessionName: overlay.session_name,
      variantId: opts.variantId,
      builtAt: opts.builtAt ?? new Date().toISOString(),
      duration: overlay.duration,
      audioSrc: opts.audioSrc,
    },
    speakers,
    scenes,
    utterances,
  }
}

/**
 * JSON.stringify with `<` escaped as `\u003c` — safe to inline verbatim
 * inside a `<script>` tag (prevents `</script>` or `<!--` from breaking out
 * of the script context).
 */
export function inlineJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
