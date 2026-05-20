import type { Era } from '../types/common'

export interface Weapon {
  id: string
  name: string
  skill_id: string
  damage: string
  range: string
  attacks_per_round: string
  ammo?: number
  malfunction?: number
  price: string
  era?: Era[]
  category: 'melee' | 'handgun' | 'rifle' | 'shotgun' | 'smg' | 'other'
}

export const WEAPONS: Weapon[] = [
  // === Broń biała (melee) ===
  { id: 'noz_bojowy', name: 'Nóż / sztylet', skill_id: 'walka_wrecz:bijatyka', damage: '1K4+MO', range: 'dotyk', attacks_per_round: '1', price: '1 $', category: 'melee' },
  { id: 'pałka', name: 'Pałka / kij', skill_id: 'walka_wrecz:bijatyka', damage: '1K6+MO', range: 'dotyk', attacks_per_round: '1', price: '1 $', category: 'melee' },
  { id: 'topor_maly', name: 'Mały topór', skill_id: 'walka_wrecz:dluga_ostra', damage: '1K6+MO', range: 'dotyk', attacks_per_round: '1', price: '3 $', category: 'melee' },
  { id: 'topor_duzy', name: 'Duży topór', skill_id: 'walka_wrecz:dluga_ostra', damage: '1K8+2+MO', range: 'dotyk', attacks_per_round: '1', price: '5 $', category: 'melee' },
  { id: 'miecz_szeroki', name: 'Miecz szeroki', skill_id: 'walka_wrecz:dluga_ostra', damage: '1K8+1+MO', range: 'dotyk', attacks_per_round: '1', price: '15 $', category: 'melee' },
  { id: 'wlocznia', name: 'Włócznia', skill_id: 'walka_wrecz:dluga_ostra', damage: '1K8+1+MO', range: 'dotyk/rzut', attacks_per_round: '1', price: '5 $', category: 'melee' },
  { id: 'kastet', name: 'Kastet', skill_id: 'walka_wrecz:bijatyka', damage: '1K3+1+MO', range: 'dotyk', attacks_per_round: '1', price: '2 $', category: 'melee' },

  // === Broń Krótka (handguns) ===
  { id: 'rewolwer_maly', name: 'Rewolwer .32', skill_id: 'bron_palna:krotka', damage: '1K8', range: '15 m', attacks_per_round: '1 (3)', ammo: 6, malfunction: 100, price: '15 $', category: 'handgun' },
  { id: 'rewolwer_sredni', name: 'Rewolwer .38', skill_id: 'bron_palna:krotka', damage: '1K10', range: '15 m', attacks_per_round: '1 (3)', ammo: 6, malfunction: 100, price: '20 $', category: 'handgun' },
  { id: 'rewolwer_duzy', name: 'Rewolwer .45', skill_id: 'bron_palna:krotka', damage: '1K10+2', range: '15 m', attacks_per_round: '1 (3)', ammo: 6, malfunction: 100, price: '25 $', category: 'handgun' },
  { id: 'pistolet_auto', name: 'Pistolet automatyczny .32', skill_id: 'bron_palna:krotka', damage: '1K8', range: '15 m', attacks_per_round: '1 (3)', ammo: 8, malfunction: 99, price: '20 $', category: 'handgun' },
  { id: 'pistolet_auto_45', name: 'Pistolet automatyczny .45', skill_id: 'bron_palna:krotka', damage: '1K10+2', range: '15 m', attacks_per_round: '1 (3)', ammo: 7, malfunction: 99, price: '30 $', category: 'handgun' },
  { id: 'derringer', name: 'Derringer .41', skill_id: 'bron_palna:krotka', damage: '1K8', range: '5 m', attacks_per_round: '1 (2)', ammo: 2, malfunction: 100, price: '10 $', category: 'handgun' },

  // === Karabin / Strzelba ===
  { id: 'karabin_mysliwski', name: 'Karabin myśliwski', skill_id: 'bron_palna:karabin_strzelba', damage: '2K6+1', range: '110 m', attacks_per_round: '1 (2)', ammo: 5, malfunction: 100, price: '35 $', category: 'rifle' },
  { id: 'karabin_wojskowy', name: 'Karabin wojskowy', skill_id: 'bron_palna:karabin_strzelba', damage: '2K6+4', range: '150 m', attacks_per_round: '1 (2)', ammo: 5, malfunction: 100, price: '50 $', category: 'rifle' },
  { id: 'strzelba', name: 'Strzelba dwururka (12 g.)', skill_id: 'bron_palna:karabin_strzelba', damage: '2K6+2/1K6+1', range: '10/20 m', attacks_per_round: '1 (2)', ammo: 2, malfunction: 100, price: '30 $', category: 'shotgun' },
  { id: 'strzelba_pompka', name: 'Strzelba powtarzalna', skill_id: 'bron_palna:karabin_strzelba', damage: '2K6+2/1K6+1', range: '10/20 m', attacks_per_round: '1', ammo: 5, malfunction: 100, price: '40 $', category: 'shotgun', era: ['classic_1920s', 'modern'] },

  // === SMG ===
  { id: 'tommy_gun', name: 'Thompson SMG', skill_id: 'bron_palna:pistolet_maszynowy', damage: '1K10+2', range: '30 m', attacks_per_round: 'rafał', ammo: 30, malfunction: 96, price: '200 $', category: 'smg', era: ['classic_1920s'] },

  // === Łuk ===
  { id: 'luk_krotki', name: 'Łuk krótki', skill_id: 'luk', damage: '1K6+½MO', range: '30 m', attacks_per_round: '1', price: '5 $', category: 'other' },
  { id: 'luk_dlugi', name: 'Łuk długi', skill_id: 'luk', damage: '1K8+½MO', range: '60 m', attacks_per_round: '1', price: '10 $', category: 'other' },
]

export function getWeaponsForEra(era: Era): Weapon[] {
  return WEAPONS.filter((w) => !w.era || w.era.includes(era))
}
