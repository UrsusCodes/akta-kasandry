export interface DriveOption {
  id: string
  name: string
  description: string
}

export const DRIVES: DriveOption[] = [
  {
    id: 'adventure',
    name: 'Żądza przygód',
    description: 'Adrenalina i akcja: nowe doświadczenia to sens życia. Odmowa przygody to przyznanie, że życie nie ma znaczenia.',
  },
  {
    id: 'antiquarianism',
    name: 'Antykwarianizm',
    description: 'Martwa przeszłość to jedyne miejsce, gdzie czujesz się naprawdę żywy. Odkrywanie starych prawd, domów i artefaktów to cel sam w sobie.',
  },
  {
    id: 'arrogance',
    name: 'Pycha',
    description: 'Twój sukces będzie sam w sobie uzasadnieniem. Zasady małych ludzi i ich tchórzliwe lęki cię nie dotyczą.',
  },
  {
    id: 'artistic_sensitivity',
    name: 'Wrażliwość artystyczna',
    description: 'Wyczuwasz nadprzyrodzoną jakość świata i musisz ją uchwycić w sztuce. Muza prowadzi, ty podążasz: bez względu na koszty.',
  },
  {
    id: 'bad_luck',
    name: 'Pech',
    description: 'Te rzeczy po prostu ci się przytrafiają. Odkopałeś nie ten posążek, wynająłeś nie ten pokój, okradłeś nie tego starca.',
  },
  {
    id: 'curiosity',
    name: 'Ciekawość',
    description: 'Kiedy napotykasz tajemnicę, nie możesz się powstrzymać. Do diabła z ryzykiem: musisz się dowiedzieć, bo inaczej zwariujesz.',
  },
  {
    id: 'duty',
    name: 'Obowiązek',
    description: 'Wiesz, że to niebezpieczne, ale ktoś musi zejść po tych schodach albo rozbić ten kult. Jeśli nie ty, to kto?',
  },
  {
    id: 'ennui',
    name: 'Znudzenie',
    description: 'Próbowałeś już wszystkiego i nic nie ma znaczenia. Nawet jeśli to może cię zabić: przynajmniej to będzie coś innego.',
  },
  {
    id: 'follower',
    name: 'Wyznawca',
    description: 'To nie był twój pomysł. Ale ktoś ważny zszedł do tego tunelu i lepiej pójdź za nim.',
  },
  {
    id: 'in_the_blood',
    name: 'To we krwi',
    description: 'Nie wiesz, dlaczego ciągle wracasz na ten cmentarz. Dziwaczne zachowania najwyraźniej są rodzinne.',
  },
  {
    id: 'revenge',
    name: 'Zemsta',
    description: 'Coś cię skrzywdziło albo kogoś bliskiego. Musi zostać zniszczone: cokolwiek trzeba, za każdą cenę.',
  },
  {
    id: 'scholarship',
    name: 'Wiedza akademicka',
    description: 'Odkrywanie prawdy o świecie to powołanie uczonego. Dlatego tropisz ocalałych z kultów i uczysz się języków nie dla ludzkich gardeł.',
  },
  {
    id: 'sudden_shock',
    name: 'Nagły wstrząs',
    description: 'Coś zdarło zasłonę ze świata. Równie dobrze możesz iść dalej w głąb: wracać nie ma dokąd.',
  },
  {
    id: 'thirst_for_knowledge',
    name: 'Głód wiedzy',
    description: 'Musisz poznać tajemną wiedzę kosmosu. Tylko ty naprawdę pragniesz tych sekretów i tylko ty jesteś gotów zrobić co trzeba.',
  },
]

export const PILLAR_EXAMPLES = [
  'Wiara religijna: zaufanie do Boga, konkretne wyznanie lub ogólna wiara w życzliwy porządek',
  'Rodzina: honor rodziny, czystość rodowodu, więzy krwi',
  'Godność i wartość człowieka: ludzie mają znaczenie i zasługują na szacunek',
  'Postęp naukowy / wartość intelektu: rozum i nauka mogą wyjaśnić wszystko',
  'Prawa fizyki i realność wiedzy naukowej: świat działa według znanych, stałych reguł',
  'Dobroć i piękno Natury: przyroda jest harmonijna i dobra',
  'Wrodzona dobroć ludzkości: ludzie z natury nie są źli',
  'Zasady moralne: istnieje obiektywne dobro i zło',
  'Estetyka / wyższe ideały sztuki: piękno i sztuka mają sens i wartość',
  'Epikureizm / życie pełnią: życie jest warte przeżycia dla samej przyjemności istnienia',
  'Patriotyzm i cnoty narodowe: twój kraj jest szlachetny i wart obrony',
  'Miłość do rodzinnego miasta: twoje miasto jest bezpieczne, dobre, twoje',
]

export const SOURCE_CATEGORIES = [
  { value: 'person' as const, label: 'Osoba', description: 'Konkretny NPC: nie inny Badacz' },
  { value: 'place' as const, label: 'Miejsce', description: 'Lokacja dająca poczucie bezpieczeństwa' },
  { value: 'organization' as const, label: 'Organizacja', description: 'Grupa ludzi, do której należysz' },
]

/** 1 pillar per full 20 SAN */
export function getPillarCount(san: number): number {
  return Math.floor(san / 20)
}

/** 1 source per full 15 SAN */
export function getSourceCount(san: number): number {
  return Math.floor(san / 15)
}
