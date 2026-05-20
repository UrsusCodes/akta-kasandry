import type { CharacteristicKey } from '../types/common'

export interface CharacteristicDef {
  key: CharacteristicKey
  name: string
  abbreviation: string
  rollFormula: '3d6x5' | '2d6+6x5'
}

export const CHARACTERISTICS: CharacteristicDef[] = [
  { key: 'STR', name: 'Siła', abbreviation: 'SIŁ', rollFormula: '3d6x5' },
  { key: 'CON', name: 'Kondycja', abbreviation: 'KON', rollFormula: '3d6x5' },
  { key: 'SIZ', name: 'Budowa', abbreviation: 'BUD', rollFormula: '2d6+6x5' },
  { key: 'DEX', name: 'Zręczność', abbreviation: 'ZRĘ', rollFormula: '3d6x5' },
  { key: 'APP', name: 'Wygląd', abbreviation: 'WYG', rollFormula: '3d6x5' },
  { key: 'INT', name: 'Inteligencja', abbreviation: 'INT', rollFormula: '2d6+6x5' },
  { key: 'POW', name: 'Moc', abbreviation: 'MOC', rollFormula: '3d6x5' },
  { key: 'EDU', name: 'Wykształcenie', abbreviation: 'WYK', rollFormula: '2d6+6x5' },
]

export const CHARACTERISTIC_MAP = Object.fromEntries(
  CHARACTERISTICS.map((c) => [c.key, c])
) as Record<CharacteristicKey, CharacteristicDef>

export const POINT_BUY_TOTAL = 460
export const POINT_BUY_MIN = 15
export const POINT_BUY_MAX = 90
