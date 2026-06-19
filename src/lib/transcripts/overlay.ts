/**
 * TypeScript contract for the transcript-provenance overlay format produced by
 * rpg-recorder. This MIRRORS `data/SCHEMA.md` from that project — the overlay
 * JSON is the binding interface between the two repos. Do not invent fields;
 * if the schema changes upstream, update this file to match.
 *
 * One `<slug>-<variant>-overlay.json` = one session × one attribution variant,
 * carrying the whole transcript (`utterances`, sorted by `start`) where each
 * utterance overlays its competing cross-microphone `chunks` as provenance.
 */

/** Playback coordinates — ALWAYS concat-stream offsets, never the transcript clock. */
export type Play = {
  audio_file: string // e.g. "audio/sol-w-ranach/ch00.opus" (relative to the producer's tree)
  start: number | null // seconds into audio_file; null if unmatched to the whisper cache
  end: number | null
}

export type Speaker = {
  id: string
  name: string
  channel_idx: number | null // channel this speaker owns, or null
  color: string // distinct, legible hex; safe to use directly
}

export type Channel = {
  speaker_id: string | null
  speaker_name: string | null
  audio_file: string | null // null if the channel had no audio
  audio_duration?: number | null
}

/** The five attribution methods' votes for the winning utterance ({method: speaker_name}). */
export type Methods = {
  baseline_argmax?: string
  margin_gate?: string
  trust_weighted?: string
  z_score_relative?: string
  combined_v5?: string
}

/** A competing copy of an utterance, heard on one microphone channel. */
export type Chunk = {
  speaker_id: string
  speaker_name: string
  channel_idx: number
  text: string // THIS copy's own transcript (may differ — that's the bleed)
  prob: number // headroom-softmax over the chunk set; the set sums to 1.0
  rms_db: number | null
  headroom_db: number | null
  is_winner: boolean // exactly one chunk per utterance has this true
  play: Play
}

export type Utterance = {
  id: string
  start: number // transcript clock (see `timeline`)
  end: number
  text: string // winner copy (== chunks[is_winner].text)
  speaker_id: string
  speaker_name: string
  channel_idx: number
  assigned: boolean // false => render neutral (ambiguous attribution)
  consensus_confidence?: number | null
  methods?: Methods
  play: Play
  chunks: Chunk[] // >= 1
}

export type BuildMeta = {
  config?: string
  source_file?: string
  built_at_note?: string
  caveats?: string[]
}

export type Overlay = {
  session_id: string
  session_name: string
  slug: string
  timeline: 'epoch' | 'concat'
  duration: number
  speakers: Speaker[]
  channels: Record<string, Channel>
  build_meta?: BuildMeta
  utterances: Utterance[]
}

/** `variants.json` — the authoritative index of sessions and their variants. */
export type VariantEntry = {
  id: string
  label: string
  file: string
  n_utterances: number
  timeline: 'epoch' | 'concat'
}

export type SessionEntry = {
  label: string
  session_id: string
  default_variant: string
  variants: VariantEntry[]
}

export type Manifest = {
  version: number
  sessions: Record<string, SessionEntry>
}
