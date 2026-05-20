// Public barrel for the vendored coc-creator character sheet.
//
//   import { CharacterSheet, mapCharacterRowToSheet } from '@/vendor/coc-character-sheet'
//
//   const props = mapCharacterRowToSheet(importedRow.data)
//   return <CharacterSheet {...props} />

// Primary API (Path 1 — responsive screen card)
export { CharacterSheet } from './components/CharacterSheet'
export type { CharacterSheetData } from './components/CharacterSheet'
export { mapCharacterRowToSheet } from './adapter'
export type { PublicCharactersRow, SheetProps } from './adapter'

// Derived-attribute calculator (exposed in case you need it standalone)
export { calculateDerived } from './lib/derived'

// Bonus: offline A4 print-card data mappers (only if you also implement the
// HTML v2 print pipeline — see new_char_sheet/INTEGRATION.md in coc-creator).
export { characterToCardFrontData } from './lib/cardFrontMap'
export type { CardFrontData } from './lib/cardFrontMap'
export { characterToCardBackData } from './lib/backTocV2Map'
export type { CardBackData } from './lib/backTocV2Map'

// Re-export the narrative subcomponent in case you want it in isolation.
export { CharacterDescriptions } from './components/CharacterDescriptions'
