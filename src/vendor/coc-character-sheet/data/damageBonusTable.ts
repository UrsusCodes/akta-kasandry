/**
 * CoC 7e Damage Bonus + Build table
 * Based on STR + SIZ combined value
 */
export interface DamageBonusEntry {
  min: number
  max: number
  db: string
  build: number
}

export const DAMAGE_BONUS_TABLE: DamageBonusEntry[] = [
  { min: 2, max: 64, db: '-2', build: -2 },
  { min: 65, max: 84, db: '-1', build: -1 },
  { min: 85, max: 124, db: '0', build: 0 },
  { min: 125, max: 164, db: '+1K4', build: 1 },
  { min: 165, max: 204, db: '+1K6', build: 2 },
  { min: 205, max: 284, db: '+2K6', build: 3 },
  { min: 285, max: 364, db: '+3K6', build: 4 },
  { min: 365, max: 444, db: '+4K6', build: 5 },
  { min: 445, max: 524, db: '+5K6', build: 6 },
]

export function getDamageBonus(str: number, siz: number): DamageBonusEntry {
  const combined = str + siz
  for (const entry of DAMAGE_BONUS_TABLE) {
    if (combined >= entry.min && combined <= entry.max) {
      return entry
    }
  }
  // For extremely high values
  return DAMAGE_BONUS_TABLE[DAMAGE_BONUS_TABLE.length - 1]
}
