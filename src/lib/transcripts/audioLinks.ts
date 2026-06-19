/**
 * Audio is NOT streamed in-app. Instead each chunk shows its channel + the
 * timestamp to seek to, and — if the GM has uploaded that channel's file
 * somewhere shareable (e.g. Google Drive) and filled `audio-links.json` — an
 * external link. The user opens the link and seeks manually to the timestamp.
 *
 * A channel may be split into several parts; this resolver picks the part whose
 * [start, end) window covers the requested playback offset and returns the
 * offset WITHIN that part (so a sharded upload still points at the right place).
 */
import { fmtTime } from './format'

export type AudioSegment = {
  url: string
  start: number
  end: number | null // null = open-ended (last/only part)
}

export type AudioChannel = {
  speaker?: string
  segments: AudioSegment[]
}

export type AudioLinks = {
  sessions: Record<string, { channels: Record<string, AudioChannel> }>
}

export type AudioRef = {
  /** External URL to open, or null if no link is configured for this channel/time. */
  url: string | null
  /** Human seek hint, e.g. "16:02" — the offset within the linked file. */
  seekLabel: string
  /** Raw seconds to seek to within the linked part (or the whole-channel offset). */
  seekSeconds: number | null
}

/**
 * Resolve a chunk's playback coordinates to an external audio reference.
 * `channelIdx`/`seconds` come from `chunk.play` (concat-stream offset).
 */
export function resolveAudioRef(
  links: AudioLinks | null,
  slug: string,
  channelIdx: number | null | undefined,
  seconds: number | null | undefined,
): AudioRef {
  // No coordinates at all → nothing to seek to.
  if (channelIdx == null || seconds == null) {
    return { url: null, seekLabel: fmtTime(seconds ?? null), seekSeconds: seconds ?? null }
  }

  const channel = links?.sessions?.[slug]?.channels?.[String(channelIdx)]
  if (!channel || !channel.segments?.length) {
    // No link configured — surface the whole-channel timestamp anyway.
    return { url: null, seekLabel: fmtTime(seconds), seekSeconds: seconds }
  }

  const seg = channel.segments.find(
    (s) => seconds >= s.start && (s.end == null || seconds < s.end),
  )
  if (!seg || !seg.url) {
    return { url: null, seekLabel: fmtTime(seconds), seekSeconds: seconds }
  }

  const offset = seconds - seg.start
  return { url: seg.url, seekLabel: fmtTime(offset), seekSeconds: offset }
}
