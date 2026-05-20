import type { Era } from './common'

export interface CombatSpecialization {
  id: string
  name: string
  base: number
  rare?: boolean
  era?: Era[]
}

export interface Skill {
  id: string
  name: string
  base: number | 'half_dex' | 'edu'
  category?: 'combat_melee' | 'combat_ranged' | 'social' | 'academic' | 'practical' | 'physical'
  specializations?: string[]
  combatSpecializations?: CombatSpecialization[]
  era?: Era[]
  rare?: boolean
  description?: string
}

export interface CharacterSkill {
  skill_id: string
  base_value: number
  occupation_points: number
  personal_points: number
  total: number
}
