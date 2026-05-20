/**
 * Weapons & Ammo Catalog v2 — Full weapon list with numeric prices
 * Era: Klasyczna (lata 20. XX wieku)
 */

export interface WeaponV2 {
  id: string
  name: string
  price: number
  damage: string
  range: string
  ammo: number | null
  malfunction?: number
  category: 'melee' | 'handgun' | 'rifle' | 'shotgun'
  skillId: string
}

export interface AmmoV2 {
  id: string
  name: string
  price: number
  quantity: number
}

export const WEAPONS_CATALOG_V2: WeaponV2[] = [
  // === Broń biała (melee) ===
  { id: 'kastet', name: 'Kastet', price: 2, damage: '1K3+1+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka' },
  { id: 'szpicruta', name: 'Szpicruta', price: 3, damage: '1K3+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka' },
  { id: 'bykowiec', name: 'Bykowiec', price: 2, damage: '1K3+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka' },
  { id: 'brzytwa', name: 'Brzytwa', price: 0.50, damage: '1K3+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka' },
  { id: 'noz_kieszonkowy', name: 'Nóż kieszonkowy', price: 0.50, damage: '1K3+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka' },
  { id: 'noz_bojowy', name: 'Nóż bojowy / sztylet', price: 1, damage: '1K4+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka' },
  { id: 'noz_mysliwski', name: 'Nóż myśliwski', price: 3, damage: '1K4+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka' },
  { id: 'palka', name: 'Pałka / kij', price: 1, damage: '1K6+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka' },
  { id: 'palka_policyjna', name: 'Pałka policyjna', price: 3, damage: '1K6+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:bijatyka' },
  { id: 'topor_maly', name: 'Mały topór', price: 3, damage: '1K6+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:dluga_ostra' },
  { id: 'topor_duzy', name: 'Duży topór', price: 5, damage: '1K8+2+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:dluga_ostra' },
  { id: 'siekiera_bojowa', name: 'Siekiera bojowa', price: 10, damage: '1K8+2+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:dluga_ostra' },
  { id: 'miecz_szeroki', name: 'Miecz szeroki', price: 15, damage: '1K8+1+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:dluga_ostra' },
  { id: 'miecz_rapier', name: 'Rapier', price: 20, damage: '1K6+1+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:dluga_ostra' },
  { id: 'szabla', name: 'Szabla', price: 15, damage: '1K8+1+MO', range: 'dotyk', ammo: null, category: 'melee', skillId: 'walka_wrecz:dluga_ostra' },
  { id: 'wlocznia', name: 'Włócznia', price: 5, damage: '1K8+1+MO', range: 'dotyk/rzut', ammo: null, category: 'melee', skillId: 'walka_wrecz:dluga_ostra' },
  { id: 'luk', name: 'Łuk', price: 10, damage: '1K6+połowa MO', range: '30 m', ammo: null, category: 'melee', skillId: 'walka_wrecz:luk' },
  { id: 'kusza', name: 'Kusza', price: 25, damage: '1K8+2', range: '50 m', ammo: null, category: 'melee', skillId: 'walka_wrecz:kusza' },

  // === Pistolety i rewolwery (handgun) ===
  { id: 'derringer_25', name: '.25 Derringer', price: 8, damage: '1K6', range: '3 m', ammo: 2, malfunction: 100, category: 'handgun', skillId: 'bron_palna:krotka' },
  { id: 'derringer_41', name: '.41 Derringer', price: 10, damage: '1K8', range: '5 m', ammo: 2, malfunction: 100, category: 'handgun', skillId: 'bron_palna:krotka' },
  { id: 'colt_pocket_32', name: '.32 Colt Pocket', price: 15, damage: '1K8', range: '15 m', ammo: 6, malfunction: 100, category: 'handgun', skillId: 'bron_palna:krotka' },
  { id: 'sw_32', name: '.32 Smith & Wesson', price: 15, damage: '1K8', range: '15 m', ammo: 6, malfunction: 100, category: 'handgun', skillId: 'bron_palna:krotka' },
  { id: 'colt_police_38', name: '.38 Colt Police', price: 20, damage: '1K10', range: '15 m', ammo: 6, malfunction: 100, category: 'handgun', skillId: 'bron_palna:krotka' },
  { id: 'sw_38', name: '.38 Smith & Wesson', price: 20, damage: '1K10', range: '15 m', ammo: 6, malfunction: 100, category: 'handgun', skillId: 'bron_palna:krotka' },
  { id: 'colt_45_auto', name: '.45 Colt M1911', price: 30, damage: '1K10+2', range: '15 m', ammo: 7, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka' },
  { id: 'sw_44', name: '.44 Smith & Wesson', price: 25, damage: '1K10+2', range: '15 m', ammo: 6, malfunction: 100, category: 'handgun', skillId: 'bron_palna:krotka' },
  { id: 'colt_45_revolver', name: '.45 Colt Revolver', price: 25, damage: '1K10+2', range: '15 m', ammo: 6, malfunction: 100, category: 'handgun', skillId: 'bron_palna:krotka' },
  { id: 'webley_455', name: '.455 Webley', price: 25, damage: '1K10+2', range: '15 m', ammo: 6, malfunction: 100, category: 'handgun', skillId: 'bron_palna:krotka' },
  { id: 'mauser_c96', name: '7.63 Mauser C96', price: 30, damage: '1K10', range: '20 m', ammo: 10, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka' },
  { id: 'luger_p08', name: '9mm Luger P08', price: 30, damage: '1K10', range: '20 m', ammo: 8, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka' },
  { id: 'browning_auto_25', name: '.25 Browning Auto', price: 12, damage: '1K6', range: '10 m', ammo: 6, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka' },
  { id: 'browning_auto_32', name: '.32 Browning Auto', price: 18, damage: '1K8', range: '15 m', ammo: 8, malfunction: 99, category: 'handgun', skillId: 'bron_palna:krotka' },

  // === Karabiny (rifle) ===
  { id: 'karabin_22', name: '.22 Karabin sportowy', price: 15, damage: '1K6+1', range: '30 m', ammo: 6, malfunction: 100, category: 'rifle', skillId: 'bron_palna:karabin_strzelba' },
  { id: 'karabin_30_30', name: '.30-30 Karabin myśliwski', price: 35, damage: '2K6+1', range: '110 m', ammo: 6, malfunction: 100, category: 'rifle', skillId: 'bron_palna:karabin_strzelba' },
  { id: 'karabin_30_06', name: '.30-06 Springfield', price: 50, damage: '2K6+4', range: '150 m', ammo: 5, malfunction: 100, category: 'rifle', skillId: 'bron_palna:karabin_strzelba' },
  { id: 'lee_enfield', name: '.303 Lee-Enfield', price: 45, damage: '2K6+4', range: '150 m', ammo: 10, malfunction: 100, category: 'rifle', skillId: 'bron_palna:karabin_strzelba' },
  { id: 'mauser_gew98', name: '7.92 Mauser Gew98', price: 45, damage: '2K6+4', range: '150 m', ammo: 5, malfunction: 100, category: 'rifle', skillId: 'bron_palna:karabin_strzelba' },
  { id: 'karabin_na_slonie', name: 'Karabin na słonie', price: 150, damage: '3K6+4', range: '100 m', ammo: 2, malfunction: 100, category: 'rifle', skillId: 'bron_palna:karabin_strzelba' },

  // === Strzelby (shotgun) ===
  { id: 'remington_dwururka', name: 'Remington dwururka', price: 30, damage: '2K6+2/1K6+1', range: '10/20 m', ammo: 2, malfunction: 100, category: 'shotgun', skillId: 'bron_palna:karabin_strzelba' },
  { id: 'winchester_lever', name: 'Winchester lever', price: 40, damage: '2K6+2/1K6+1', range: '10/20 m', ammo: 5, malfunction: 100, category: 'shotgun', skillId: 'bron_palna:karabin_strzelba' },
  { id: 'winchester_pump', name: 'Winchester pump', price: 45, damage: '2K6+2/1K6+1', range: '10/20 m', ammo: 5, malfunction: 100, category: 'shotgun', skillId: 'bron_palna:karabin_strzelba' },
]

export const AMMO_CATALOG: AmmoV2[] = [
  { id: 'ammo_22', name: 'Amunicja .22', price: 0.50, quantity: 50 },
  { id: 'ammo_25', name: 'Amunicja .25', price: 1, quantity: 50 },
  { id: 'ammo_32', name: 'Amunicja .32', price: 1.50, quantity: 50 },
  { id: 'ammo_38', name: 'Amunicja .38', price: 2, quantity: 50 },
  { id: 'ammo_41', name: 'Amunicja .41', price: 2, quantity: 50 },
  { id: 'ammo_44', name: 'Amunicja .44', price: 2.50, quantity: 50 },
  { id: 'ammo_45', name: 'Amunicja .45', price: 2.50, quantity: 50 },
  { id: 'ammo_30_30', name: 'Amunicja .30-30', price: 3, quantity: 20 },
  { id: 'ammo_30_06', name: 'Amunicja .30-06', price: 3.50, quantity: 20 },
  { id: 'ammo_303', name: 'Amunicja .303 British', price: 3.50, quantity: 20 },
  { id: 'ammo_792', name: 'Amunicja 7.92 Mauser', price: 3.50, quantity: 20 },
  { id: 'ammo_763', name: 'Amunicja 7.63 Mauser', price: 3, quantity: 50 },
  { id: 'ammo_9mm', name: 'Amunicja 9mm Parabellum', price: 3, quantity: 50 },
  { id: 'ammo_455', name: 'Amunicja .455 Webley', price: 3, quantity: 50 },
  { id: 'ammo_12g', name: 'Amun. 12 gauge', price: 2.50, quantity: 25 },
  { id: 'ammo_elephant', name: 'Amunicja na słonie', price: 5, quantity: 10 },
  { id: 'strzaly_luk', name: 'Strzały do łuku (12 szt.)', price: 2, quantity: 12 },
  { id: 'belty_kusza', name: 'Bełty do kuszy (12 szt.)', price: 3, quantity: 12 },
]
