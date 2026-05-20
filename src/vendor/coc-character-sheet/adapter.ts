// Adapter: raw `public.characters` DB row → CharacterSheet props.
//
// akta-kasandry stores the raw coc-creator `public.characters` row as
// `wiki.imported_characters.data` (jsonb). This module is the single entry
// point that turns that raw row into the shape <CharacterSheet/> expects.
//
//   const props = mapCharacterRowToSheet(row)
//   <CharacterSheet {...props} />
//
// Design notes:
// - `derived` (HP/MP/SAN/DB/build/move/dodge) is RECOMPUTED from
//   characteristics, NOT trusted from the stored column. coc-creator computes
//   it at runtime and the DB column is frequently empty (`{}`). We fall back to
//   the stored value only if characteristics are incomplete (e.g. a draft).
// - `admin_notes` (Keeper-only notes) is intentionally NOT mapped. Do not
//   surface it on a player-facing wiki even though the raw `data` jsonb may
//   contain it.
// - Portrait preference: profile_portrait_url → portrait_url → card_portrait_url.

import type { CharacterSheetData } from './components/CharacterSheet'
import { calculateDerived } from './lib/derived'
import type { Characteristics, DerivedAttributes } from './types/character'

const CHAR_KEYS = ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU'] as const

/**
 * The raw shape of a `public.characters` row as exposed by coc-creator's
 * anon SELECT policy. jsonb columns arrive already parsed (the Supabase JS
 * client parses them). Every field is defensively optional/nullable because
 * draft rows may be partial.
 */
export interface PublicCharactersRow {
  id: string
  invite_code_id?: string | null
  status?: 'draft' | 'submitted' | string | null
  name?: string | null
  age?: number | null
  gender?: string | null
  appearance?: string | null
  residence?: string | null
  birthplace?: string | null
  characteristics?: Record<string, number> | null
  luck?: number | null
  derived?: Partial<DerivedAttributes> | Record<string, unknown> | null
  occupation_id?: string | null
  occupation_skill_points?: Record<string, number> | null
  personal_skill_points?: Record<string, number> | null
  backstory?: Record<string, unknown> | null
  equipment?: string[] | null
  cash?: string | null
  assets?: string | null
  spending_level?: string | null
  era?: string | null
  method?: string | null
  player_name?: string | null
  invite_code?: string | null
  admin_notes?: string | null // intentionally NOT mapped — Keeper-only
  portrait_url?: string | null
  portrait_crop_data?: { x: number; y: number; width: number; height: number } | null
  profile_portrait_url?: string | null
  card_portrait_url?: string | null
  card_portrait_crop_data?: { x: number; y: number; width: number; height: number } | null
  art_prompt?: string | null
  art_gallery?: { url: string; label: string; created_at: string }[] | null
  main_position?: Record<string, unknown> | null
  additional_positions?: Record<string, unknown>[] | null
  contacts_v2?: Record<string, unknown>[] | null
  sessions?: string[] | null
  distinguisher?: string | null
  created_at?: string | null
  updated_at?: string | null
}

/** Props accepted by <CharacterSheet/>. */
export interface SheetProps {
  character: CharacterSheetData
}

function computeDerived(row: PublicCharactersRow): DerivedAttributes {
  const c = (row.characteristics ?? {}) as Record<string, number>
  const hasAll = CHAR_KEYS.every((k) => typeof c[k] === 'number')
  if (hasAll) return calculateDerived(c as Characteristics)
  // Incomplete characteristics (draft) — fall back to stored derived if any.
  const d = (row.derived ?? {}) as Partial<DerivedAttributes>
  return {
    hp: d.hp ?? 0,
    mp: d.mp ?? 0,
    san: d.san ?? 0,
    db: d.db ?? '0',
    build: d.build ?? 0,
    move_rate: d.move_rate ?? 0,
    dodge: d.dodge ?? 0,
  }
}

/**
 * Map a raw `public.characters` row to <CharacterSheet/> props.
 * Pure, synchronous, no side effects, no network.
 */
export function mapCharacterRowToSheet(row: PublicCharactersRow): SheetProps {
  const character: CharacterSheetData = {
    id: row.id,
    name: row.name ?? '',
    age: row.age ?? 0,
    gender: row.gender ?? '',
    appearance: row.appearance ?? '',
    characteristics: (row.characteristics ?? {}) as Record<string, number>,
    luck: row.luck ?? 0,
    derived: computeDerived(row) as unknown as Record<string, unknown>,
    occupation_id: row.occupation_id ?? '',
    occupation_skill_points: (row.occupation_skill_points ?? {}) as Record<string, number>,
    personal_skill_points: (row.personal_skill_points ?? {}) as Record<string, number>,
    backstory: (row.backstory ?? {}) as Record<string, unknown>,
    equipment: (row.equipment ?? []) as string[],
    cash: row.cash ?? '',
    assets: row.assets ?? '',
    spending_level: row.spending_level ?? '',
    era: row.era ?? '',
    method: row.method ?? '',
    status: (row.status ?? '') as string,
    // optional / narrative
    player_name: row.player_name ?? undefined,
    residence: row.residence ?? undefined,
    birthplace: row.birthplace ?? undefined,
    invite_code: row.invite_code ?? undefined,
    main_position: (row.main_position ?? undefined) as CharacterSheetData['main_position'],
    additional_positions: (row.additional_positions ?? undefined) as CharacterSheetData['additional_positions'],
    contacts_v2: (row.contacts_v2 ?? undefined) as CharacterSheetData['contacts_v2'],
    // best available portrait for screen display
    portrait_url: row.profile_portrait_url ?? row.portrait_url ?? row.card_portrait_url ?? undefined,
    sessions: row.sessions ?? undefined,
    distinguisher: row.distinguisher ?? undefined,
    // NOTE: admin_notes, art_prompt, art_gallery deliberately omitted.
  }
  return { character }
}
