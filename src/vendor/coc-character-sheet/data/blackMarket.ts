/**
 * Black Market Catalog: Illegal items available through underworld contacts
 * Era: Klasyczna (lata 20. XX wieku)
 */

export interface BlackMarketItem {
  id: string
  name: string
  priceMin: number
  priceMax: number
  description: string
  tag: string
  skillId?: string
  damage?: string
  range?: string
  ammo?: number
  malfunction?: number
}

export const BLACK_MARKET_CATALOG: BlackMarketItem[] = [
  // ── Nielegalna broń krótka (pistolety/rewolwery) ──
  {
    id: 'bm_derringer_25',
    name: 'Nielegalny .25 Derringer',
    priceMin: 16, priceMax: 16,
    description: 'Mały, łatwy do ukrycia. Bez numeru seryjnego.',
    tag: '[Czarny rynek]',
    skillId: 'bron_palna:krotka', damage: '1K6', range: '3 m', ammo: 2, malfunction: 100,
  },
  {
    id: 'bm_colt_pocket_32',
    name: 'Nielegalny .32 Colt Pocket',
    priceMin: 30, priceMax: 30,
    description: 'Kompaktowy rewolwer bez śladów. Popularny wśród kieszonkowców.',
    tag: '[Czarny rynek]',
    skillId: 'bron_palna:krotka', damage: '1K8', range: '15 m', ammo: 6, malfunction: 100,
  },
  {
    id: 'bm_colt_police_38',
    name: 'Nielegalny .38 Colt Police',
    priceMin: 40, priceMax: 40,
    description: 'Rewolwer policyjny z zatartym numerem seryjnym.',
    tag: '[Czarny rynek]',
    skillId: 'bron_palna:krotka', damage: '1K10', range: '15 m', ammo: 6, malfunction: 100,
  },
  {
    id: 'bm_colt_45_auto',
    name: 'Nielegalny .45 Colt M1911',
    priceMin: 60, priceMax: 60,
    description: 'Wojskowy pistolet automatyczny. Bez dokumentów, bez pytań.',
    tag: '[Czarny rynek]',
    skillId: 'bron_palna:krotka', damage: '1K10+2', range: '15 m', ammo: 7, malfunction: 99,
  },
  {
    id: 'bm_sw_44',
    name: 'Nielegalny .44 Smith & Wesson',
    priceMin: 50, priceMax: 50,
    description: 'Ciężki rewolwer bez śladów. Ulubieniec gangsterów.',
    tag: '[Czarny rynek]',
    skillId: 'bron_palna:krotka', damage: '1K10+2', range: '15 m', ammo: 6, malfunction: 100,
  },
  {
    id: 'bm_luger_p08',
    name: 'Nielegalny 9mm Luger P08',
    priceMin: 60, priceMax: 60,
    description: 'Niemiecki pistolet z Wielkiej Wojny. Trofeum wojenne, brak rejestracji.',
    tag: '[Czarny rynek]',
    skillId: 'bron_palna:krotka', damage: '1K10', range: '20 m', ammo: 8, malfunction: 99,
  },

  // ── Nielegalne karabiny ──
  {
    id: 'bm_karabin_30_30',
    name: 'Nielegalny .30-30 karabin',
    priceMin: 70, priceMax: 70,
    description: 'Karabin myśliwski z zatartym numerem. Idealny do zasadzek.',
    tag: '[Czarny rynek]',
    skillId: 'bron_palna:karabin_strzelba', damage: '2K6+1', range: '110 m', ammo: 6, malfunction: 100,
  },
  {
    id: 'bm_springfield',
    name: 'Nielegalny .30-06 Springfield',
    priceMin: 100, priceMax: 100,
    description: 'Wojskowy karabin bez rejestracji. Precyzyjny i śmiercionośny.',
    tag: '[Czarny rynek]',
    skillId: 'bron_palna:karabin_strzelba', damage: '2K6+4', range: '150 m', ammo: 5, malfunction: 100,
  },

  // ── Nielegalne strzelby ──
  {
    id: 'bm_remington',
    name: 'Nielegalna Remington dwururka',
    priceMin: 60, priceMax: 60,
    description: 'Dwururka z obciętą lufą. Krótki zasięg, potężna siła ognia.',
    tag: '[Czarny rynek]',
    skillId: 'bron_palna:karabin_strzelba', damage: '2K6+2/1K6+1', range: '10/20 m', ammo: 2, malfunction: 100,
  },
  {
    id: 'bm_winchester_pump',
    name: 'Nielegalna Winchester pump',
    priceMin: 90, priceMax: 90,
    description: 'Strzelba powtarzalna bez numeru. Ulubiona broń rum-runnerów.',
    tag: '[Czarny rynek]',
    skillId: 'bron_palna:karabin_strzelba', damage: '2K6+2/1K6+1', range: '10/20 m', ammo: 5, malfunction: 100,
  },

  // ── Broń ciężka ──
  {
    id: 'thompson_smg',
    name: 'Thompson (pistolet maszynowy)',
    priceMin: 1000, priceMax: 1000,
    description: 'Pistolet maszynowy Thompson kal. .45. Potocznie „Tommy Gun". Nielegalny bez pozwolenia.',
    tag: '[Czarny rynek]',
    skillId: 'bron_palna:pistolet_maszynowy', damage: '1K10+2', range: '30 m', ammo: 30, malfunction: 96,
  },

  // ── Akcesoria i modyfikacje ──
  {
    id: 'tlumik',
    name: 'Tłumik do pistoletu',
    priceMin: 150, priceMax: 200,
    description: 'Tłumik do pistoletu. Redukuje dźwięk strzału, ale wpływa na celność na dłuższych dystansach.',
    tag: '[Czarny rynek]',
  },

  // ── Materiały wybuchowe ──
  {
    id: 'granat_reczny',
    name: 'Granat ręczny',
    priceMin: 20, priceMax: 20,
    description: 'Granat odłamkowy z Wielkiej Wojny. 4K10 do 3m, 2K10 do 6m, 1K10 do 9m.',
    tag: '[Czarny rynek]',
    skillId: 'rzucanie',
    damage: '4K10/2K10/1K10',
    range: '3/6/9 m',
    malfunction: 50,
  },
  {
    id: 'dynamit_laseczka',
    name: 'Dynamit (laseczka)',
    priceMin: 5, priceMax: 15,
    description: 'Pojedyncza laseczka dynamitu. Obrażenia: 3K6 w promieniu 2 m.',
    tag: '[Czarny rynek]',
  },

  // ── Amunicja specjalna ──
  {
    id: 'amunicja_ap',
    name: 'Amunicja przeciwpancerna (AP)',
    priceMin: 10, priceMax: 30,
    description: 'Amunicja przebijająca (20 szt.). Połowa wartości pancerza celu.',
    tag: '[Czarny rynek]',
  },

  // ── Narkotyki ──
  {
    id: 'narkotyki_kokaina',
    name: 'Kokaina (dawka)',
    priceMin: 5, priceMax: 15,
    description: 'Kokaina w proszku. Efekt: chwilowa euforia i odporność na ból. Uzależniająca.',
    tag: '[Czarny rynek]',
  },
  {
    id: 'narkotyki_heroina',
    name: 'Heroina (dawka)',
    priceMin: 5, priceMax: 20,
    description: 'Heroina. Silnie uzależniająca. Efekt: otępienie i zniesienie bólu.',
    tag: '[Czarny rynek]',
  },
  {
    id: 'narkotyki_opium',
    name: 'Opium (dawka)',
    priceMin: 3, priceMax: 10,
    description: 'Opium do palenia lub jedzenia. Efekt: halucynacje, senność, uzależnienie.',
    tag: '[Czarny rynek]',
  },

  // ── Dokumenty i usługi ──
  {
    id: 'falszywe_dokumenty',
    name: 'Fałszywe dokumenty toż.',
    priceMin: 50, priceMax: 200,
    description: 'Fałszywy paszport, prawo jazdy lub inne dokumenty. Jakość zależy od ceny.',
    tag: '[Czarny rynek]',
  },

  // ── Trucizny ──
  {
    id: 'arszenik',
    name: 'Arszenik',
    priceMin: 10, priceMax: 50,
    description: 'Arszenik — bezwonny, bezsmakowy. Śmiertelny w dużych dawkach. Trudny do wykrycia w pożywieniu.',
    tag: '[Czarny rynek]',
  },

  // ── Ochrona ──
  {
    id: 'kamizelka_kuloodporna',
    name: 'Amatorska kamizelka kuloodporna',
    priceMin: 50, priceMax: 150,
    description: 'Amatorska kamizelka kuloodporna. Pancerz 3 pkt, ukryta pod ubraniem. Niewygodna.',
    tag: '[Czarny rynek]',
  },
]
