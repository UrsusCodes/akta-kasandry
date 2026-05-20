import type { Characteristics, DerivedAttributes } from '../types/character'
import { getDamageBonus } from '../data/damageBonusTable'

/**
 * Calculate Hit Points: (CON + SIZ) / 10, rounded down
 */
export function calculateHP(con: number, siz: number): number {
  return Math.floor((con + siz) / 10)
}

/**
 * Calculate Magic Points: POW / 5, rounded down
 */
export function calculateMP(pow: number): number {
  return Math.floor(pow / 5)
}

/**
 * Calculate starting Sanity: equal to POW
 */
export function calculateSAN(pow: number): number {
  return pow
}

/**
 * Calculate Dodge: DEX / 2, rounded down
 */
export function calculateDodge(dex: number): number {
  return Math.floor(dex / 2)
}

/**
 * Calculate Move Rate based on STR, DEX, SIZ and age
 */
export function calculateMoveRate(str: number, dex: number, siz: number): number {
  if (dex < siz && str < siz) return 7
  if (dex > siz && str > siz) return 9
  return 8
}

/**
 * Calculate all derived attributes from characteristics
 */
export function calculateDerived(chars: Characteristics): DerivedAttributes {
  const { STR, CON, SIZ, DEX, POW } = chars
  const dbEntry = getDamageBonus(STR, SIZ)

  return {
    hp: calculateHP(CON, SIZ),
    mp: calculateMP(POW),
    san: calculateSAN(POW),
    db: dbEntry.db,
    build: dbEntry.build,
    move_rate: calculateMoveRate(STR, DEX, SIZ),
    dodge: calculateDodge(DEX),
  }
}
