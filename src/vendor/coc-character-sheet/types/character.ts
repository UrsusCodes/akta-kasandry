import type { CharacteristicKey, Era, CreationMethod } from './common'

export type Characteristics = Record<CharacteristicKey, number>

export interface DerivedAttributes {
  hp: number
  mp: number
  san: number
  db: string
  build: number
  move_rate: number
  dodge: number
}

export interface Backstory {
  ideology: string
  significant_people_who: string
  significant_people_why: string
  meaningful_locations: string
  treasured_possessions: string
  traits: string
  appearance_description: string
  key_connection: string
  // Drive+Pillars variant fields
  drive?: string
  drive_detail?: string
  pillars?: string[]
  sources?: StabilitySource[]
  other_traits?: string
}

export interface StabilitySource {
  name: string
  category: 'person' | 'place' | 'organization'
  description: string
}

export interface CharacterPosition {
  description: string
  category: string
  weight: number
  weightDisplay: string
  rollValue: number
  custom: boolean
  pendingSt: boolean
}

export interface CharacterContact {
  subcategory: string
  category: string
  strength: number
  strengthDisplay: string
  rollValue: number
  synergyBonus: number
  custom: boolean
  customName: string
  pendingSt: boolean
}

// ── New Position & Contact system (v2) ──

export interface PositionOption {
  id: string
  name: string
  organization_size: 'Mikro' | 'Mała' | 'Średnia' | 'Duża' | 'Wielka'
  size_modifier: number
  unlock_condition: string
  placeholder: string
  category: string
  /** Which occupations can see this option. If omitted, all occupations in the cluster can. */
  occupations?: string[]
}

export interface MainPosition {
  option_id: string
  option_name: string
  organization_size: string
  category: string
  custom_description: string
  strength_percent: number
  unlock_condition: string
}

export interface AdditionalPosition {
  slot_index: number
  option_id: string
  option_name: string
  organization_size: string
  category: string
  custom_description: string
  weight: 1 | 2 | 3
  roll_value: number
  is_custom: boolean
  pending_st_approval: boolean
  unlocked_by: string
  is_attribute_special: boolean
}

export interface ContactV2 {
  slot_index: number
  subcategory_id: string
  subcategory_name: string
  category_id: string
  category_name: string
  base_strength: 1 | 2 | 3
  strength: 1 | 2 | 3
  roll_value: 30 | 60 | 90
  synergy_bonus: 0 | 1 | 2
  custom_description: string
  custom_name: string
  is_custom: boolean
  pending_st_approval: boolean
  slot_source: 'occupation' | 'additional'
}

export interface AssetBreakdown {
  type: string
  percent: number
  value: number
}

export interface CharacterData {
  id?: string
  invite_code_id: string
  status: 'draft' | 'submitted'
  name: string
  age: number
  gender: string
  appearance: string
  residence?: string
  birthplace?: string
  characteristics: Characteristics
  luck: number
  derived: DerivedAttributes
  occupation_id: string
  occupation_skill_points: Record<string, number>
  personal_skill_points: Record<string, number>
  backstory: Backstory
  equipment: string[]
  cash: string
  assets: string
  spending_level: string
  era: Era
  method: CreationMethod
  player_name?: string
  invite_code?: string
  admin_notes?: string
  created_at?: string
  updated_at?: string
  // Positions & Contacts (legacy v1)
  positions?: CharacterPosition[]
  contacts?: CharacterContact[]
  // Positions & Contacts (v2)
  main_position?: MainPosition
  additional_positions?: AdditionalPosition[]
  contacts_v2?: ContactV2[]
  // Wealth v2 fields
  lifestyle_rating?: number
  lifestyle_stars?: string
  lifestyle_label?: string
  spending_free?: string
  assets_breakdown?: AssetBreakdown[]
  equipment_catalogs_available?: string[]
  // Portrait fields
  /** @deprecated Use profile_portrait_url + card_portrait_url instead. Kept for backward-compat. */
  portrait_url?: string
  /** @deprecated Use card_portrait_crop_data instead. Kept for backward-compat. */
  portrait_crop_data?: PortraitCropData
  /** Full-resolution avatar shown in app UI (no crop applied). Migration 021. */
  profile_portrait_url?: string
  /** Image used at PDF card export, with card_portrait_crop_data applied. Migration 021. */
  card_portrait_url?: string
  /** Crop region (% based) applied to card_portrait_url at PDF render time. */
  card_portrait_crop_data?: PortraitCropData
  art_prompt?: string
  art_gallery?: { url: string; label: string; created_at: string }[]
  // Sessions & distinguisher
  sessions?: string[]
  distinguisher?: string
  // Player-centric fields
  draft_locked_step?: number | null
  draft_step?: SoftZoneStep | string
  created_by?: string
  perks?: string[]
  max_skill_value?: number
  // Optional per-code ceilings (migration 022). Mirrored from invite_codes
  // at /start-character. NULL/undefined = no ceiling.
  max_wealth?: number | null
  max_luck?: number | null
  // Code-identity rework (migration 018)
  rerolls_remaining?: number
  characteristics_committed_at?: string | null
  reroll_history?: RerollHistoryEntry[]
  // Granular commits (migration 019)
  swap_committed_at?: string | null
  age_committed_at?: string | null
  edu_committed_at?: string | null
  aging_committed_at?: string | null
  luck_committed_at?: string | null
  swap_available?: boolean
  swap_used?: boolean
  edu_rolls?: EduRoll[]
}

/** Per-roll detail of EDU improvement step (granular commits, migration 019). */
export interface EduRoll {
  /** d100 result for the improvement check */
  roll: number
  /** True if roll > previous EDU (improvement triggered) */
  improved: boolean
  /** d10 amount EDU gained (0 if !improved) */
  gained: number
  /** EDU value after this roll */
  new_edu: number
}

/** Audit entry appended to characters.reroll_history on each /reroll. */
export interface RerollHistoryEntry {
  /** ISO timestamp */
  at: string
  /** 'reroll' | 'manual_edit' | future scopes */
  scope: string
  previous_characteristics?: Characteristics | Record<string, number>
  previous_luck?: number
  previous_age?: number
  previous_edu_rolls?: EduRoll[]
}

/** Soft-zone wizard steps for /go-back-to-step endpoint (granular commits). */
export type SoftZoneStep =
  | 'occupation'
  | 'occupation_skills'
  | 'personal_skills'
  | 'wealth_equipment'
  | 'positions_contacts'

/** Allowed characteristic deductions for /apply-aging-penalties. */
export type AgingDeductions = Partial<Record<'STR' | 'CON' | 'DEX' | 'SIZ', number>>

/** Allowed narrative fields for /narrative (anytime, even post-submit). */
export interface NarrativeFields {
  name?: string
  appearance?: string
  residence?: string
  birthplace?: string
  player_name?: string
  gender?: string
  backstory?: Backstory | Record<string, unknown>
  portrait_url?: string
  art_prompt?: string
  art_gallery?: { url: string; label: string; created_at: string }[]
  portrait_crop_data?: PortraitCropData | null
}

export interface PortraitCropData {
  x: number      // left offset as % of image width (0–100)
  y: number      // top offset as % of image height (0–100)
  width: number  // crop width as % of image width (0–100)
  height: number // crop height as % of image height (0–100)
}

export interface PortraitFeedback {
  id: string
  character_id: string
  player_id?: string
  variant_url: string
  comment: string
  reference_image_url?: string
  status: 'pending_fix' | 'in_progress' | 'resolved'
  admin_comment?: string
  created_at: string
  resolved_at?: string
  // joined fields
  characters?: { id: string; name: string; player_name?: string }
  players?: { name: string; login: string }
}

export interface PortraitStatusEntry {
  id: string
  name: string
  player_name?: string
  portrait_status: 'no_portraits' | 'has_gallery' | 'chosen' | 'feedback'
  gallery_count: number
  portrait_url?: string
}

export interface ShareToken {
  id: string
  character_id: string
  token: string
  type: 'view' | 'edit'
  edit_mode?: 'lore' | 'standard' | 'full' | null
  expires_at?: string | null
  created_at: string
}

export interface HistoryEntry {
  id: string
  character_id: string
  snapshot: CharacterData
  changed_by: string
  change_comment: string
  created_at: string
}
