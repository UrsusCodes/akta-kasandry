import type { SpeakerOption } from '@/components/comments/SpeakerPicker'

type OwnedCharacter = { id: string; name: string; portrait_url: string | null }

/**
 * Speaker options for a player on a page: owned characters that are in the
 * investigation cast; if the page has no cast rows, fall back to all owned.
 * `id` here is the character's source_id (uuid) — the same key wiki.comments
 * .speaker_character_id references (migration 011). The caller maps imported
 * characters to `{ id: source_id, name, portrait_url }`.
 */
export function speakerOptionsFor(owned: OwnedCharacter[], castIds: string[]): SpeakerOption[] {
  const inCast = castIds.length ? owned.filter((c) => castIds.includes(c.id)) : owned
  return inCast.map((c) => ({ characterId: c.id, name: c.name, portraitUrl: c.portrait_url }))
}
