import type { CharacterSheetData } from '../components/CharacterSheet'
import { OCCUPATIONS } from '../data/occupations'
import { WEAPONS } from '../data/weapons'
import { WEAPONS_CATALOG_V2 } from '../data/weaponsV2'
import { BLACK_MARKET_CATALOG } from '../data/blackMarket'
import { getSkillBase, getBaseSkillId, getSpecialization } from '../data/skills'
import { halfValue, fifthValue } from './utils'

/** Shape consumed by new HTML front (window.setCharacter). Mirrors INTEGRATION.md §2.1. */
export interface CardFrontData {
  name: string
  player_name: string
  occupation: string
  age: string
  gender: string
  residence: string
  birthplace: string
  death_place: string
  portrait?: string
  chars: {
    str: number; dex: number; pow: number
    con: number; app: number; edu: number
    siz: number; int: number; move: number
  }
  san: { max: number; curr?: number; fifth?: number }
  hp: { max: number; curr?: number }
  luck: { max: number; curr?: number }
  mp: { max: number; curr?: number }
  heavy_wounds: number
  damage_bonus: string
  build: number
  dodge: number
  walk?: string | number
  sprint?: string | number
  spending_level?: string
  cash?: string
  skills: Record<string, { value?: number; name?: string; trained?: boolean }>
  weapons: Array<{
    name: string
    norm: number; hard: number; extreme: number
    damage: string
    range: string
    attacks: number | string
    ammo: number | string
    reliability: number | string
    unarmed?: boolean
  }>
}

/** App skill ID (Polish) → new card key (English snake_case). */
const SKILL_KEY_MAP: Record<string, string> = {
  antropologia: 'anthropology',
  archeologia: 'archaeology',
  charakteryzacja: 'disguise',
  elektryka: 'electrical',
  gadanina: 'fast_talk',
  historia: 'history',
  jezdziectwo: 'ride',
  jezyk_ojczysty: 'lang_own',
  korzystanie_z_bibliotek: 'library_use',
  ksiegowosc: 'accounting',
  majetnosc: 'credit_rating',
  mechanika: 'mechanical',
  medycyna: 'medicine',
  mity_cthulhu: 'cthulhu_mythos',
  nasluchiwanie: 'listen',
  nawigacja: 'navigate',
  obsluga_ciezkiego_sprzetu: 'heavy_machinery',
  okultyzm: 'occult',
  perswazja: 'persuade',
  pierwsza_pomoc: 'first_aid',
  plywanie: 'swim',
  prawo: 'law',
  prowadzenie_samochodu: 'drive_auto',
  psychoanaliza: 'psychoanalysis',
  psychologia: 'psychology',
  rzucanie: 'throw',
  skakanie: 'jump',
  spostrzegawczosc: 'spot_hidden',
  sztuka_przetrwania: 'survival',
  slusarstwo: 'locksmith',
  tropienie: 'track',
  ukrywanie: 'stealth',
  unik: 'dodge',
  urok_osobisty: 'appearance_skill',
  wiedza_o_naturze: 'natural_world',
  wspinaczka: 'climb',
  wycena: 'appraise',
  zastraszanie: 'intimidate',
  zreczne_palce: 'sleight_of_hand',
}

const COMBAT_KEY_MAP: Record<string, string> = {
  'bron_palna:krotka': 'firearms_handgun',
  'bron_palna:karabin_strzelba': 'firearms_rifle',
  'bron_palna:pistolet_maszynowy': 'firearms_smg',
  'bron_palna:bron_ciezka': 'firearms_heavy',
  'bron_palna:luk_kusza': 'firearms_bow',
  'walka_wrecz:bijatyka': 'fighting_brawl',
  'walka_wrecz:dluga_ostra': 'fighting_swords',
  'walka_wrecz:bron_obuchowa': 'fighting_blunt',
  'walka_wrecz:skrytobojstwo': 'fighting_garrote',
}

const OPEN_SPEC_PARENT_TO_PREFIX: Record<string, string> = {
  nauka: 'science_',
  jezyk_obcy: 'lang_other_',
  sztuka_rzemioslo: 'art_craft_',
}

function resolveBase(skillKey: string, chars: Record<string, number>): number {
  const base = getSkillBase(skillKey)
  if (base === 'half_dex') return Math.floor((chars['DEX'] ?? 0) / 2)
  if (base === 'edu') return chars['EDU'] ?? 0
  return base
}

function buildWeaponEntry(
  name: string, skillId: string, damage: string, range: string,
  attacks: string | number, ammo: number | null | undefined,
  malfunction: number | undefined,
  chars: Record<string, number>, allPoints: Record<string, number>,
  unarmed = false,
): CardFrontData['weapons'][number] {
  const skillBase = resolveBase(skillId, chars)
  const skillPoints = allPoints[skillId] ?? 0
  const total = skillBase + skillPoints
  return {
    name,
    norm: total,
    hard: total > 0 ? halfValue(total) : 0,
    extreme: total > 0 ? fifthValue(total) : 0,
    damage,
    range,
    attacks,
    ammo: ammo ? ammo : '—',
    reliability: malfunction ? `${malfunction}` : '—',
    ...(unarmed ? { unarmed: true } : {}),
  }
}

function parseWeaponsFromEquipment(
  equipment: string[],
  chars: Record<string, number>,
  allPoints: Record<string, number>,
  damageBonus: string,
): CardFrontData['weapons'] {
  const out: CardFrontData['weapons'] = []
  // Always include unarmed first
  const fightingBrawlPoints = allPoints['walka_wrecz:bijatyka'] ?? 0
  const brawlBase = resolveBase('walka_wrecz:bijatyka', chars)
  const brawlTotal = brawlBase + fightingBrawlPoints
  const dbStr = damageBonus || '0'
  out.push({
    name: 'Nieuzbrojony',
    norm: brawlTotal,
    hard: brawlTotal > 0 ? halfValue(brawlTotal) : 0,
    extreme: brawlTotal > 0 ? fifthValue(brawlTotal) : 0,
    damage: dbStr === '0' || dbStr === '' ? '1k3' : `1k3+${dbStr}`,
    range: '—',
    attacks: 1,
    ammo: '—',
    reliability: '—',
    unarmed: true,
  })

  for (const item of equipment) {
    if (out.length >= 5) break
    const isWeaponTag =
      item.startsWith('[Broń]') || item.startsWith('[Czarny rynek]') || item.startsWith('[Wojsko]')
    const stripped = item.replace(/^\[.*?\]\s*/, '')

    // Look up in catalogs (legacy WEAPONS, V2, black market). Same logic as exportCardPdf.
    const w = WEAPONS.find((x) => item.includes(x.name))
    if (w) {
      out.push(buildWeaponEntry(
        w.name, w.skill_id, w.damage, w.range,
        w.attacks_per_round, w.ammo, w.malfunction,
        chars, allPoints,
      ))
      continue
    }
    const w2 = WEAPONS_CATALOG_V2.find((x) => item.includes(x.name))
    if (w2) {
      out.push(buildWeaponEntry(
        w2.name, w2.skillId, w2.damage, w2.range,
        '1', w2.ammo, w2.malfunction,
        chars, allPoints,
      ))
      continue
    }
    const bm = BLACK_MARKET_CATALOG.find((x) => x.skillId && item.includes(x.name))
    if (bm && bm.skillId) {
      out.push(buildWeaponEntry(
        bm.name, bm.skillId, bm.damage ?? '', bm.range ?? '',
        '1', bm.ammo, bm.malfunction,
        chars, allPoints,
      ))
      continue
    }

    // Tagged but unmatched: parse "[Broń] Name (damage, range)"
    if (isWeaponTag) {
      const m = stripped.match(/^(.+?)\s*\(([^,]+),\s*(.+?)\)/)
      if (m) {
        out.push({
          name: m[1].trim(), norm: 0, hard: 0, extreme: 0,
          damage: m[2].trim(), range: m[3].trim(),
          attacks: '1', ammo: '—', reliability: '—',
        })
      }
    }
  }

  return out.slice(0, 5)
}

export function characterToCardFrontData(char: CharacterSheetData): CardFrontData {
  const occupation = OCCUPATIONS.find((o) => o.id === char.occupation_id)
  const derived = char.derived as {
    hp: number; mp: number; san: number; db: string
    build: number; move_rate: number; dodge: number
  }

  const chars = char.characteristics
  const allPoints: Record<string, number> = { ...char.occupation_skill_points }
  for (const [k, v] of Object.entries(char.personal_skill_points)) {
    allPoints[k] = (allPoints[k] ?? 0) + v
  }

  // Build skills map. Only include keys that translate to the new card.
  const skillsOut: CardFrontData['skills'] = {}

  // 1) Plain (Polish→English) skills.
  for (const [polId, newKey] of Object.entries(SKILL_KEY_MAP)) {
    const points = allPoints[polId] ?? 0
    const base = resolveBase(polId, chars)
    const total = base + points
    if (total === 0 && points === 0) continue
    skillsOut[newKey] = { value: total, trained: points > 0 }
  }

  // 2) Combat fixed specs.
  for (const [appKey, newKey] of Object.entries(COMBAT_KEY_MAP)) {
    const points = allPoints[appKey] ?? 0
    const base = resolveBase(appKey, chars)
    const total = base + points
    if (total === 0 && points === 0) continue
    skillsOut[newKey] = { value: total, trained: points > 0 }
  }

  // 3) Open spec slots: nauka_*, jezyk_obcy_*, sztuka_rzemioslo_*.
  for (const [parent, prefix] of Object.entries(OPEN_SPEC_PARENT_TO_PREFIX)) {
    const specsForParent = Object.keys(allPoints)
      .filter((k) => getBaseSkillId(k) === parent && (allPoints[k] ?? 0) > 0)
      .map((k) => ({ key: k, name: getSpecialization(k) ?? '', points: allPoints[k] }))
    for (let i = 0; i < Math.min(3, specsForParent.length); i++) {
      const s = specsForParent[i]
      const base = resolveBase(s.key, chars)
      const total = base + s.points
      skillsOut[`${prefix}${i + 1}`] = { value: total, name: s.name, trained: true }
    }
  }

  // Heavy wounds: not currently tracked at character level — leave 0.
  const heavyWounds = 0

  // Dodge total (derived.dodge already accounts for half DEX; add unik points).
  const unikPoints = (char.occupation_skill_points['unik'] ?? 0) + (char.personal_skill_points['unik'] ?? 0)
  const dodgeTotal = (derived?.dodge ?? Math.floor((chars['DEX'] ?? 0) / 2)) + unikPoints

  // Spending level: legacy stores raw "$X"; new card just shows the val. Strip leading "$" so the field looks tidy in the small box.
  const spendingDisplay = char.spending_level
    ? char.spending_level.startsWith('$')
      ? char.spending_level.slice(1) + '$'
      : char.spending_level
    : ''
  const cashDisplay = (() => {
    if (!char.cash) return ''
    const m = char.cash.match(/Gotówka:\s*(.+?)(?:\s*\||$)/)
    const raw = (m ? m[1].trim() : char.cash).replace(/\s/g, '')
    return raw
  })()

  return {
    name: char.name ?? '',
    player_name: char.player_name ?? '',
    occupation: occupation?.name ?? char.occupation_id ?? '',
    age: String(char.age ?? ''),
    gender:
      char.gender === 'M' ? 'Mężczyzna'
        : char.gender === 'F' || char.gender === 'K' ? 'Kobieta'
        : (char.gender ?? ''),
    residence: char.residence ?? '',
    birthplace: char.birthplace ?? '',
    death_place: '',
    portrait: char.card_portrait_url ?? char.portrait_url ?? '',
    chars: {
      str: chars['STR'] ?? 0,
      dex: chars['DEX'] ?? 0,
      pow: chars['POW'] ?? 0,
      con: chars['CON'] ?? 0,
      app: chars['APP'] ?? 0,
      edu: chars['EDU'] ?? 0,
      siz: chars['SIZ'] ?? 0,
      int: chars['INT'] ?? 0,
      move: derived?.move_rate ?? 0,
    },
    /* Pola CURR celowo puste — gracz uzupełnia podczas gry. */
    san: { max: derived?.san ?? 0 },
    hp: { max: derived?.hp ?? 0 },
    luck: { max: char.luck ?? 0 },
    mp: { max: derived?.mp ?? 0 },
    heavy_wounds: heavyWounds,
    damage_bonus: derived?.db ?? '0',
    build: derived?.build ?? 0,
    dodge: dodgeTotal,
    walk: derived?.move_rate ? Math.floor(derived.move_rate / 3) : '—',
    sprint: derived?.move_rate ? Math.floor((derived.move_rate * 5) / 3) : '—',
    spending_level: spendingDisplay,
    cash: cashDisplay,
    skills: skillsOut,
    weapons: parseWeaponsFromEquipment(char.equipment ?? [], chars, allPoints, derived?.db ?? '0'),
  }
}
