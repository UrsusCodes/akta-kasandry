// Deterministic narrative descriptions of a character based on their stats.
// Only stats in the tail of the population distribution (~5% / ~15% on each
// side) produce a paragraph. Average stats are skipped so the resulting
// "Portret z cech" highlights what is *distinctive* about the character.
//
// Thresholds are chosen per rollFormula:
//   3d6×5  (range 15–90, mean ~52): -2 ≤25, -1 26–35, +1 70–79, +2 ≥80
//   2d6+6×5 (range 40–90, mean ~65): -2 ≤50, -1 51–60, +1 75–84, +2 ≥85
//
// See plan: ~/.claude/plans/zacznijmy-od-f1-kr-tkie-deep-rivest.md

import { CHARACTERISTIC_MAP, CHARACTERISTICS } from '../data/characteristics'
import type { CharacteristicKey } from '../types/common'
import type { Characteristics } from '../types/character'

export type CharacterDescriptionCategory = -2 | -1 | 0 | 1 | 2

export interface CharacterDescription {
  stat: CharacteristicKey
  category: CharacterDescriptionCategory
  text: string
}

/**
 * Map a stat value to a category bucket based on the stat's roll formula.
 * Returns 0 for "average" values that should not produce a paragraph.
 */
export function getStatCategory(
  stat: CharacteristicKey,
  value: number,
): CharacterDescriptionCategory {
  const def = CHARACTERISTIC_MAP[stat]
  if (!def) return 0

  if (def.rollFormula === '3d6x5') {
    if (value <= 25) return -2
    if (value <= 35) return -1
    if (value >= 80) return 2
    if (value >= 70) return 1
    return 0
  }

  // '2d6+6x5'
  if (value <= 50) return -2
  if (value <= 60) return -1
  if (value >= 85) return 2
  if (value >= 75) return 1
  return 0
}

/**
 * Per-stat narrative paragraphs keyed by category. Category 0 has no entry
 * (average stats are intentionally skipped). Authored copy — see plan for
 * thresholds & rationale.
 */
export const STAT_DESCRIPTIONS: Record<
  CharacteristicKey,
  Partial<Record<CharacterDescriptionCategory, string>>
> = {
  STR: {
    [-2]: 'Postać jest w gronie 5% najsłabszych fizycznie ludzi w populacji. Może to być efekt wieku, ciężkiej choroby czy straszliwej kontuzji. Lepiej, żeby nie próbowała podnosić niczego cięższego niż długopis.',
    [-1]: 'Postać jest istotnie słabsza niż przeciętny człowiek, choć nie jest jeszcze niedołężna. Prawdopodobnie albo nigdy nie musiała pracować fizycznie, albo ma problemy zdrowotne. Podciąganie się nie jest dla niej.',
    [1]: 'Postać jest istotnie silniejsza niż przeciętny człowiek. Prawdopodobnie pracuje intensywnie fizycznie lub regularnie trenuje.',
    [2]: 'Postać należy do światowej czołówki siły fizycznej. Jest lub mogłaby być olimpijskim siłaczem.',
  },
  CON: {
    [-2]: 'Postać należy do 5% najmniej odpornych ludzi. Przewlekła choroba, słabe płuca czy kruche serce potrafią położyć ją do łóżka na tygodnie, a każda infekcja jest realnym zagrożeniem życia.',
    [-1]: 'Postać jest wyraźnie mniej odporna niż przeciętny człowiek. Częściej choruje, trudniej znosi wysiłek, wolniej się regeneruje. Noc spędzona na dworze zostawia ślad na kilka dni.',
    [1]: 'Postać ma odporność i wytrzymałość wyraźnie powyżej przeciętnej. Rzadko choruje, szybko się regeneruje, ciężko ją zmęczyć.',
    [2]: 'Postać ma żelazne zdrowie i wytrzymałość na poziomie światowej czołówki. Przetrzyma warunki, które położyłyby niejednego zawodowego żołnierza.',
  },
  SIZ: {
    [-2]: 'Postać należy do najdrobniejszych dorosłych. Niski wzrost i lekka budowa — przeciśnie się przez otwory, w których inni utkną, ale łatwo ją pominąć, przepchnąć, przewrócić.',
    [-1]: 'Postać jest wyraźnie drobniejsza lub niższa niż przeciętny człowiek. W tłumie jej nie widać, w kłótni mało kto traktuje ją jako fizyczne zagrożenie.',
    [1]: 'Postać jest wyraźnie większa, wyższa lub masywniejsza niż przeciętny człowiek. Zajmuje swoje miejsce — zauważalna z daleka i trudna do zignorowania.',
    [2]: 'Postać należy do najpotężniejszych fizycznie sylwetek, jakie się spotyka. Gigant wzrostem, masą albo jednym i drugim — głowa nad tłumem, przez drzwi przechodzi bokiem.',
  },
  DEX: {
    [-2]: 'Postać należy do 5% najbardziej niezgrabnych ludzi. Potyka się na prostej, wywraca szklankę zanim zdąży ją chwycić, problem z zawiązaniem sznurówek jest realny. Precyzyjna praca rąk jest poza jej zasięgiem.',
    [-1]: 'Postać jest wyraźnie mniej zręczna niż przeciętna. Sport nie jest jej domeną, taniec to ryzyko dla partnera, a ruchy wymagające finezji (szycie, majsterkowanie) kończą się frustracją.',
    [1]: 'Postać porusza się z zauważalnie większą zwinnością i precyzją niż przeciętny człowiek. Sprawnie posługuje się rękami, szybko reaguje, dobrze panuje nad własnym ciałem.',
    [2]: 'Postać należy do światowej czołówki zręczności. Kontrola nad ciałem i rękami jest na poziomie akrobaty, kieszonkowca albo chirurga.',
  },
  APP: {
    [-2]: 'Postać należy do grona najbrzydszych ludzi świata. Mogą za to odpowiadać okoliczności urodzin lub straszliwe obrażenia czy choroby, ale ciężko nie zauważyć, że ludzie odwracają wzrok na jej widok.',
    [-1]: 'Postać jest istotnie brzydsza niż przeciętny człowiek, ale nie w sposób, który istotnie wpłynie na jej pozycję społeczną. Konkursy piękności nie są jednak dla niej.',
    [1]: 'Postać jest istotnie atrakcyjniejsza niż przeciętny człowiek i cieszy się pozytywnym usposobieniem ludzi, którzy mają okazję podziwiać jej wdzięki.',
    [2]: 'Postać należy do najpiękniejszych ludzi świata i bez trudu mogłaby zarabiać swoją twarzą na całym świecie.',
  },
  INT: {
    [-2]: 'Postać należy do najmniej bystrych dorosłych. Nowe koncepcje jej się nie trzymają, logiczne łamigłówki są poza jej zasięgiem, a sprytne oszustwa rozpoznaje dopiero po fakcie.',
    [-1]: 'Postać myśli wyraźnie wolniej niż przeciętny człowiek. Potrzebuje więcej czasu na wyciągnięcie wniosków, gubi wątki w zawiłych rozmowach, łatwo dać się jej zagadać.',
    [1]: 'Postać myśli wyraźnie szybciej i ostrzej niż przeciętny człowiek. Szybko chwyta nowe idee, zauważa niespójności, sprawnie łączy kropki.',
    [2]: 'Postać należy do najbystrzejszych umysłów swojego pokolenia. Tam, gdzie inni widzą chaos, ona widzi strukturę — zagadki logiczne, abstrakcyjne systemy i skomplikowane związki przyczynowo-skutkowe to jej żywioł.',
  },
  POW: {
    [-2]: 'Postać należy do 5% ludzi o najsłabszej woli i wewnętrznej energii. Łatwo ją złamać, zmanipulować, przestraszyć. Świat jakby ją przytłaczał — intuicyjnie wyczuwa się w niej pustkę.',
    [-1]: 'Postać ma wyraźnie słabszą wolę i wewnętrzną energię niż przeciętny człowiek. Trudniej jej się oprzeć presji, szybciej traci wiarę w siebie, bywa niezdecydowana w momentach, które tego wymagają.',
    [1]: 'Postać ma wyraźnie silniejszą wolę i wewnętrzną energię niż przeciętny człowiek. Trudno ją zmanipulować, trudno złamać, łatwo wyczuć że wie, czego chce.',
    [2]: 'Postać należy do grona ludzi o niemal magnetycznej sile wewnętrznej. Jej wola jest trudna do złamania, jej obecność wyczuwalna, a ci, którzy stają z nią twarzą w twarz, często sami nie wiedzą, dlaczego nagle tracą animusz.',
  },
  EDU: {
    [-2]: 'Postać miała znikomy kontakt z formalną edukacją. Czytanie ze zrozumieniem sprawia jej trudność, podstawowa wiedza o świecie pochodzi z zasłyszanych rozmów, a długie słowa wzbudzają podejrzliwość.',
    [-1]: 'Postać ma wyraźnie słabsze wykształcenie niż przeciętny człowiek. Szkołę zakończyła wcześnie albo bez entuzjazmu — radzi sobie, ale w dyskusji o czymkolwiek bardziej złożonym niż codzienność czuje się nieswojo.',
    [1]: 'Postać jest wyraźnie lepiej wykształcona niż przeciętny człowiek. Czyta regularnie, zna się na kilku dziedzinach, potrafi prowadzić rzeczową rozmowę na tematy, o których inni ledwo słyszeli.',
    [2]: 'Postać należy do grona ludzi o wybitnym wykształceniu. Studiowała, być może prowadziła własne badania — jej wiedza obejmuje wiele dziedzin i ma głębokość, która onieśmiela laików.',
  },
}

/**
 * Build the ordered list of descriptions for a character. Returns paragraphs
 * for stats that fall in the tail buckets, in canonical stat order
 * (physical → mental, matching the order in characteristics.ts).
 */
export function getCharacterDescriptions(
  characteristics: Characteristics,
): CharacterDescription[] {
  const out: CharacterDescription[] = []
  for (const def of CHARACTERISTICS) {
    const value = characteristics[def.key] ?? 0
    if (!value) continue
    const category = getStatCategory(def.key, value)
    if (category === 0) continue
    const text = STAT_DESCRIPTIONS[def.key]?.[category]
    if (!text) continue
    out.push({ stat: def.key, category, text })
  }
  return out
}
