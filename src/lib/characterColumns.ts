/**
 * Explicit column allowlist for snapshotting coc-creator's public.characters.
 *
 * NEVER use `select *` — that would silently pull any sensitive column the
 * coc-creator side adds later into our wiki.imported_characters.data. This list
 * was reviewed + approved by coc-creator-Claude (2026-05-20). See
 * work/2026-05-20-import-coc-creator-characters.md section 7.
 *
 * To add a field to the import, add it here AND re-import the affected rows.
 */
export const CHARACTER_COLUMNS = [
  'id',
  'player_id',
  'status',
  'name',
  'age',
  'gender',
  'appearance',
  'characteristics',
  'luck',
  'derived',
  'occupation_id',
  'occupation_skill_points',
  'personal_skill_points',
  'backstory',
  'equipment',
  'cash',
  'assets',
  'spending_level',
  'era',
  'method',
  'perks',
  'max_skill_value',
  'max_wealth',
  'max_luck',
  'residence',
  'birthplace',
  // Portraits: coc-creator's canonical field is `portrait_url` (a public
  // Storage URL), with `art_gallery` holding colour/sepia/bw/faded variants.
  // profile_/card_ are legacy/unused (often null) — kept for completeness.
  'portrait_url',
  'art_gallery',
  'profile_portrait_url',
  'card_portrait_url',
  'card_portrait_crop_data',
  'draft_locked_step',
  'created_by',
  'created_at',
  'updated_at',
] as const

export const CHARACTER_SELECT = CHARACTER_COLUMNS.join(',')
