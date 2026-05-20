import type { Skill } from '../types/skill'
import type { Era } from '../types/common'

export const SKILLS: Skill[] = [
  {
    id: 'antropologia',
    name: 'Antropologia',
    base: 1,
    category: 'academic',
  },
  {
    id: 'archeologia',
    name: 'Archeologia',
    base: 1,
    category: 'academic',
  },
  {
    id: 'bron_palna',
    name: 'Broń Palna',
    base: 20,
    category: 'combat_ranged',
    combatSpecializations: [
      { id: 'krotka', name: 'Krótka', base: 20 },
      { id: 'karabin_strzelba', name: 'Karabin/Strzelba', base: 25 },
      { id: 'pistolet_maszynowy', name: 'Pistolet Maszynowy', base: 15 },
      { id: 'luk_kusza', name: 'Łuk/Kusza', base: 15 },
      { id: 'bron_ciezka', name: 'Broń Ciężka', base: 5, rare: true },
    ],
  },
  {
    id: 'charakteryzacja',
    name: 'Charakteryzacja',
    base: 5,
    category: 'practical',
  },
  {
    id: 'czytanie_z_ruchu_warg',
    name: 'Czytanie z Ruchu Warg',
    base: 1,
    category: 'practical',
    rare: true,
  },
  {
    id: 'elektronika',
    name: 'Elektronika',
    base: 1,
    category: 'practical',
    era: ['modern'],
  },
  {
    id: 'elektryka',
    name: 'Elektryka',
    base: 10,
    category: 'practical',
  },
  {
    id: 'gadanina',
    name: 'Gadanina',
    base: 5,
    category: 'social',
  },
  {
    id: 'hipnoza',
    name: 'Hipnoza',
    base: 1,
    category: 'academic',
    rare: true,
  },
  {
    id: 'historia',
    name: 'Historia',
    base: 5,
    category: 'academic',
  },
  {
    id: 'jezdziectwo',
    name: 'Jeździectwo',
    base: 5,
    category: 'physical',
  },
  {
    id: 'jezyk_obcy',
    name: 'Język Obcy',
    base: 1,
    category: 'academic',
    specializations: [
      'Angielski',
      'Arabski',
      'Chiński',
      'Francuski',
      'Grecki',
      'Hebrajski',
      'Hiszpański',
      'Japoński',
      'Łacina',
      'Niemiecki',
      'Rosyjski',
      'Włoski',
    ],
  },
  {
    id: 'jezyk_ojczysty',
    name: 'Język Ojczysty',
    base: 'edu',
    category: 'academic',
  },
  {
    id: 'korzystanie_z_bibliotek',
    name: 'Korzystanie z Bibliotek',
    base: 20,
    category: 'academic',
  },
  {
    id: 'korzystanie_z_komputerow',
    name: 'Korzystanie z Komputerów',
    base: 5,
    category: 'practical',
    era: ['modern'],
  },
  {
    id: 'ksiegowosc',
    name: 'Księgowość',
    base: 5,
    category: 'academic',
  },
  {
    id: 'luk',
    name: 'Łuk',
    base: 15,
    category: 'combat_ranged',
  },
  {
    id: 'majetnosc',
    name: 'Majętność',
    base: 0,
    category: 'social',
  },
  {
    id: 'mechanika',
    name: 'Mechanika',
    base: 10,
    category: 'practical',
  },
  {
    id: 'medycyna',
    name: 'Medycyna',
    base: 1,
    category: 'academic',
  },
  {
    id: 'mity_cthulhu',
    name: 'Mity Cthulhu',
    base: 0,
    category: 'academic',
  },
  {
    id: 'nasluchiwanie',
    name: 'Nasłuchiwanie',
    base: 20,
    category: 'physical',
  },
  {
    id: 'nauka',
    name: 'Nauka',
    base: 1,
    category: 'academic',
    specializations: [
      'Astronomia',
      'Biologia',
      'Botanika',
      'Chemia',
      'Farmacja',
      'Fizyka',
      'Geologia',
      'Inżynieria',
      'Kryminalistyka',
      'Kryptografia',
      'Matematyka',
      'Medycyna Sądowa',
      'Meteorologia',
      'Zoologia',
    ],
  },
  {
    id: 'nawigacja',
    name: 'Nawigacja',
    base: 10,
    category: 'practical',
  },
  {
    id: 'nurkowanie',
    name: 'Nurkowanie',
    base: 1,
    category: 'physical',
    rare: true,
  },
  {
    id: 'obsluga_ciezkiego_sprzetu',
    name: 'Obsługa Ciężkiego Sprzętu',
    base: 1,
    category: 'practical',
  },
  {
    id: 'okultyzm',
    name: 'Okultyzm',
    base: 5,
    category: 'academic',
  },
  {
    id: 'perswazja',
    name: 'Perswazja',
    base: 10,
    category: 'social',
  },
  {
    id: 'pilotowanie',
    name: 'Pilotowanie',
    base: 1,
    category: 'practical',
    specializations: ['Samolot', 'Łódź'],
  },
  {
    id: 'pierwsza_pomoc',
    name: 'Pierwsza Pomoc',
    base: 30,
    category: 'practical',
  },
  {
    id: 'plywanie',
    name: 'Pływanie',
    base: 20,
    category: 'physical',
  },
  {
    id: 'prawo',
    name: 'Prawo',
    base: 5,
    category: 'academic',
  },
  {
    id: 'prowadzenie_samochodu',
    name: 'Prowadzenie Samochodu',
    base: 20,
    category: 'practical',
  },
  {
    id: 'psychoanaliza',
    name: 'Psychoanaliza',
    base: 1,
    category: 'academic',
  },
  {
    id: 'psychologia',
    name: 'Psychologia',
    base: 10,
    category: 'social',
  },
  {
    id: 'rzucanie',
    name: 'Rzucanie',
    base: 20,
    category: 'combat_ranged',
  },
  {
    id: 'skakanie',
    name: 'Skakanie',
    base: 20,
    category: 'physical',
  },
  {
    id: 'spostrzegawczosc',
    name: 'Spostrzegawczość',
    base: 25,
    category: 'physical',
  },
  {
    id: 'sztuka_przetrwania',
    name: 'Sztuka Przetrwania',
    base: 10,
    category: 'practical',
    specializations: ['Arktyka', 'Góry', 'Las', 'Morze', 'Pustynia'],
  },
  {
    id: 'sztuka_rzemioslo',
    name: 'Sztuka/Rzemiosło',
    base: 5,
    category: 'practical',
    specializations: [
      'Aktorstwo',
      'Balwierstwo',
      'Dziennikarstwo',
      'Fałszerstwo',
      'Fotografia',
      'Gotowanie',
      'Gra na Instrumencie',
      'Hydraulika',
      'Komedia',
      'Krawiectwo',
      'Literatura',
      'Malarstwo',
      'Maszynopisanie',
      'Materiały Wybuchowe',
      'Rolnictwo i Hodowla',
      'Rysunek Techniczny',
      'Rzeźbiarstwo',
      'Spawanie',
      'Stenografia',
      'Stolarstwo',
      'Ślusarstwo',
      'Śpiew',
    ],
  },
  {
    id: 'slusarstwo',
    name: 'Ślusarstwo',
    base: 1,
    category: 'practical',
  },
  {
    id: 'tresura_zwierzat',
    name: 'Tresura Zwierząt',
    base: 5,
    category: 'practical',
    rare: true,
  },
  {
    id: 'tropienie',
    name: 'Tropienie',
    base: 10,
    category: 'physical',
  },
  {
    id: 'ukrywanie',
    name: 'Ukrywanie',
    base: 20,
    category: 'physical',
  },
  {
    id: 'unik',
    name: 'Unik',
    base: 'half_dex',
    category: 'physical',
  },
  {
    id: 'urok_osobisty',
    name: 'Urok Osobisty',
    base: 15,
    category: 'social',
  },
  {
    id: 'walka_wrecz',
    name: 'Walka Wręcz',
    base: 25,
    category: 'combat_melee',
    combatSpecializations: [
      { id: 'bijatyka', name: 'Bijatyka', base: 25 },
      { id: 'dluga_ostra', name: 'Długa Ostra', base: 15 },
      { id: 'bron_obuchowa', name: 'Broń Obuchowa', base: 10 },
      { id: 'skrytobojstwo', name: 'Skrytobójstwo', base: 20, rare: true },
    ],
  },
  {
    id: 'wycena',
    name: 'Wycena',
    base: 5,
    category: 'academic',
  },
  {
    id: 'wiedza_o_naturze',
    name: 'Wiedza o Naturze',
    base: 10,
    category: 'academic',
  },
  {
    id: 'wiedza_tajemna',
    name: 'Wiedza Tajemna',
    base: 1,
    category: 'academic',
    rare: true,
  },
  {
    id: 'wspinaczka',
    name: 'Wspinaczka',
    base: 20,
    category: 'physical',
  },
  {
    id: 'zastraszanie',
    name: 'Zastraszanie',
    base: 15,
    category: 'social',
  },
  {
    id: 'zreczne_palce',
    name: 'Zręczne Palce',
    base: 10,
    category: 'practical',
  },
]

/** Extract base skill ID from a composite key. 'nauka:Fizyka' → 'nauka', 'walka_wrecz:bijatyka' → 'walka_wrecz' */
export function getBaseSkillId(key: string): string {
  if (key.startsWith('choice:') || key === 'any' || key === 'any_academic') return key
  const colonIdx = key.indexOf(':')
  return colonIdx > 0 ? key.substring(0, colonIdx) : key
}

/** Extract specialization from composite key. 'nauka:Fizyka' → 'Fizyka', 'walka_wrecz:bijatyka' → 'bijatyka' */
export function getSpecialization(key: string): string | null {
  if (key.startsWith('choice:') || key === 'any' || key === 'any_academic') return null
  const colonIdx = key.indexOf(':')
  return colonIdx > 0 ? key.substring(colonIdx + 1) : null
}

/** Get the base value for a skill, handling combat specialization composite keys.
 *  'walka_wrecz:bijatyka' → 25, 'walka_wrecz:dluga_ostra' → 15, 'nauka:Fizyka' → 1 */
export function getSkillBase(compositeKey: string): number | 'half_dex' | 'edu' {
  const baseId = getBaseSkillId(compositeKey)
  const spec = getSpecialization(compositeKey)
  const skill = SKILLS.find((s) => s.id === baseId)
  if (!skill) return 0

  if (spec && skill.combatSpecializations) {
    const combatSpec = skill.combatSpecializations.find((cs) => cs.id === spec)
    if (combatSpec) return combatSpec.base
  }

  return skill.base
}

/** Format a composite skill key for display.
 *  'nauka:Fizyka' → 'Nauka (Fizyka)', 'walka_wrecz:bijatyka' → 'Walka Wręcz (Bijatyka)' */
export function getSkillDisplayName(key: string): string {
  const baseId = getBaseSkillId(key)
  const skill = SKILLS.find((s) => s.id === baseId)
  const baseName = skill?.name ?? baseId
  const spec = getSpecialization(key)

  if (spec && skill?.combatSpecializations) {
    const combatSpec = skill.combatSpecializations.find((cs) => cs.id === spec)
    if (combatSpec) return `${baseName} (${combatSpec.name})`
  }

  return spec ? `${baseName} (${spec})` : baseName
}

/** Look up a skill by ID, supporting composite keys like 'nauka:Fizyka' → looks up 'nauka'. */
export function getSkillById(id: string): Skill | undefined {
  const baseId = getBaseSkillId(id)
  return SKILLS.find((skill) => skill.id === baseId)
}

export function getSkillsForEra(era: Era): Skill[] {
  return SKILLS.filter((skill) => !skill.era || skill.era.includes(era))
}
