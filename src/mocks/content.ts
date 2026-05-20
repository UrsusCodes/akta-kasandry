import type { ContentNode } from '../types'
import { buildTree } from '../lib/tree'

/**
 * Mock content tree — arbitrary depth, no fixed Shelf/Book/Chapter levels.
 * Mirrors how an Obsidian vault is laid out: folders nested freely, leaves
 * are markdown pages. Bodies use Polish characters, wikilinks `[[Page]]` /
 * `[[Folder/Page]]` / `[[Page|alias]]`, GFM tables, code, blockquotes, images.
 *
 * Editor convention: `"Foo": { … }` is a folder, `"Foo.md": "…body…"` is a page.
 * Slugs and full paths are computed by `buildTree` so the source stays terse.
 */
export const contentTree: ContentNode[] = buildTree({
  'Tło historyczne': {
    Miasto: {
      'Beacon Hill.md': `# Beacon Hill

> [!note] Dzielnica śmietanki towarzyskiej
> Mieszkają tu starzy bostończycy — rodziny z **mayflowerskim rodowodem**.

Wąskie, brukowane uliczki Beacon Hill wspinają się stromo od [[Boston Common]] do złotej kopuły [[Massachusetts State House]]. Wieczorami latarnie gazowe — *gazowe*, w 1924 — rzucają miodowe światło na fasady z czerwonej cegły.

## Najważniejsze adresy

| Adres | Rezydent | Uwagi |
|---|---|---|
| Louisburg Square 12 | dr Charles Henning | znajomy [[Alistair Whitcomb|Whitcomba]] |
| Chestnut St. 89 | rodzina Lowellów | brahminowie starszej generacji |
| Mt. Vernon St. 44 | Edith Carrington | wdowa po sędziej, kolekcjonerka |

## Atmosfera

Ulica milczy. Tylko *stuk-stuk* obcasów po kamieniu i, gdzieś za murem ogrodu, krótki śmiech kobiety, której twarzy nigdy nie zobaczysz.

\`\`\`
"Tutaj nie zadaje się pytań." — Whitcomb, pierwsze spotkanie
\`\`\`

![Boston, Louisburg Square circa 1924](https://placehold.co/720x400/2d1b14/f5e6c8?text=Louisburg+Square)

Porównaj: [[North End]], [[Tło historyczne/Ludzie/Alistair Whitcomb|Whitcomb (pełna karta)]].
`,
      'North End.md': `# North End

Włoska dzielnica. Tu mówi się po sycylijsku głośniej niż po angielsku, a **bootleg whisky** dyskretnie zmienia ręce w piwnicach przy Salem Street.

## Co tu czuć

- Zapach świeżego chleba o szóstej rano
- Słone powietrze od portu — bliżej niż w [[Beacon Hill]]
- Pot i czosnek w kawiarniach

## Ważni ludzie

1. **Salvatore "Sammy" Borghese** — szef lokalnego gangu, kontroluje rozprowadzanie alkoholu z Kanady
2. *Ojciec Domenico* — proboszcz St. Stephen's, wie więcej niż powie
3. Anna Costa — właścicielka pensjonatu na Hanover Street

> Gdy padał deszcz, cała Hanover Street pachniała mokrym marmurem i czosnkiem.

Kiedyś mieszkali tu Paul Revere i Cotton Mather. Teraz mieszka tu strach.
`,
    },
    Ludzie: {
      'Alistair Whitcomb.md': `# Alistair Whitcomb

Antykwariusz z [[Beacon Hill]]. Wygląda na sześćdziesiątkę, ma sześćdziesiąt dwa lata, mówi jak gdyby liczył każdą głoskę przed wypuszczeniem jej w świat.

## Charakterystyka

| Cecha | Wartość |
|---|---|
| STR | 9 |
| CON | 11 |
| INT | 16 |
| POW | 14 |
| EDU | 19 |

**Umiejętności:** Wiedza okultystyczna 65%, Biblioteka 80%, Historia 70%, Łacina 60%.

## Historia

Pochodzi ze starej rodziny [[Beacon Hill|brahminów]]. W 1903 stracił żonę w wypadku, którego — jak sam mówi w pijanym widzie — *"nigdy nie było"*. Od tamtej pory zbiera księgi, których nie powinien zbierać.

> [!warning] Sekret
> Whitcomb wie o [[Kult Trzeciego Kwadratu]] więcej, niż przyzna nawet sobie.

## Hak fabularny

Jeśli któryś z graczy pyta w bibliotece o **Necronomicon**, bibliotekarka odsyła go *właśnie* do Whitcomba.
`,
      'Edith Carrington.md': `# Edith Carrington

Wdowa po sędziu federalnym. Mieszka przy Mt. Vernon 44 w [[Beacon Hill]]. Pisze do graczy list otwierający kampanię (patrz [[Sesja 1 — List]]).

> "Jeżeli moje obawy są bezpodstawne — wybaczcie staruszce. Jeżeli nie są — ratujcie mnie."

Wie więcej niż mówi. Mniej, niż myśli.
`,
    },
  },

  Sesje: {
    'Sezon 1': {
      'Sesja 1 — List.md': `# Sesja 1 — List

**Data sesji:** 12 października 1924, ranek
**Miejsce:** mieszkanie dr Henninga, [[Beacon Hill]]

## Co się wydarzyło

Gracze otrzymali list od **[[Edith Carrington]]** z prośbą o spotkanie. Treść — krótka, drżącą ręką:

> "Mr. Henning, jeżeli moje obawy są bezpodstawne — wybaczcie staruszce. Jeżeli nie są — ratujcie mnie. Spotkajmy się przy Louisburg Square dziś o ósmej wieczorem. Nie przychodźcie sami. E. C."

## Decyzje BG

- Henning zadzwonił do [[Alistair Whitcomb|Whitcomba]] (jego znajomy z czasów Harvardu)
- Grupa zdecydowała się iść w trójkę
- Whitcomb zabrał ze sobą laskę z ukrytym ostrzem

## Co odkryli

Drzwi były otwarte. Przewrócony świecznik. Edith nie było. Na biurku, pod kałamarzem — drugi list, zaadresowany do graczy.

## Następna sesja

[[Sesja 2 — Drugi list]]
`,
      'Sesja 2 — Drugi list.md': `# Sesja 2 — Drugi list

> [!info] Status sesji
> Zaplanowana, jeszcze nierozegrana.

Plan: gracze odkrywają, że list zostawił [[Alistair Whitcomb|Whitcomb]] — bo wiedział, że Edith znika.

\`\`\`
TODO: dopracować scenę w piwnicy.
TODO: kto pierwszy zorientuje się o [[Kult Trzeciego Kwadratu|kulcie]]?
\`\`\`
`,
    },
  },

  Mechanika: {
    Testy: {
      'Rzut zwykły.md': `# Rzut zwykły

Rzucasz **1k100** i porównujesz z wartością umiejętności.

| Wynik | Sukces |
|---|---|
| ≤ wartość ÷ 5 | krytyczny |
| ≤ wartość ÷ 2 | trudny |
| ≤ wartość | zwykły |
| > wartość | porażka |
| 96–100 (gdy wartość < 50) | porażka krytyczna |

## House rule

Jeśli rzut byłby *fabularnie nudny*, MG może go pominąć i ogłosić wynik. Patrz [[Filozofia gry]].
`,
      'Poczytalność.md': `# Poczytalność

> [!warning] To nie jest punkt życia
> Strata POW jest **trwała**. Nie ma "uzdrowienia w karczmie".

## Co odbiera POW

- Widok rzeczy, których nie powinno się widzieć
- Wiedza, która nie powinna istnieć
- *Niektóre* sny

## Rzut na zdrowy rozsądek

\`\`\`
1k100 vs aktualne POW
sukces: utrata x (np. 1k4)
porażka: utrata y (np. 1k10)
\`\`\`

Porównaj: [[Rzut zwykły]].
`,
    },
    Walka: {
      'Akcje.md': `# Akcje (przegląd)

Patrz pełną tabelę w [[Tabele/Akcje walki]] (jeszcze nieistniejąca — przykład *broken link*).

Każda postać ma akcję główną + uboczną na rundę.
`,
      'Inicjatywa.md': `# Inicjatywa

Ranking po **DEX** + modyfikator broni. Patrz [[Rzut zwykły]] dla przeciętnych testów obronnych.
`,
    },
  },

  'Okult i mity': {
    'Kulty bostońskie': {
      'Kult Trzeciego Kwadratu.md': `# Kult Trzeciego Kwadratu

> [!danger] Spoiler dla graczy
> Tej strony nie powinien czytać nikt, kto siedzi przy stole jako Badacz.

## Co to jest

Tajna sieć starych bostońskich rodzin, oddająca kult **bóstwu pomiędzy świtem a snem**. Symbol: trzy kwadraty wpisane w siebie, obrócone o 33°.

## Hierarchia

1. **Wewnętrzny krąg** — 7 osób, w tym jedna spoza Bostonu
2. **Słudzy** — kilkudziesięciu, nie znają się nawzajem
3. **Nieświadomi pomocnicy** — *być może [[Alistair Whitcomb|Whitcomb]]?*

## Znaki rozpoznawcze

- Trzy małe kwadraty wytatuowane pod lewym uchem
- Słowo-klucz: *"Trzecia godzina jest najczystsza."*

Patrz też: [[Beacon Hill]] (większość członków stąd), [[North End]] (jeden łącznik).
`,
    },
    'Filozofia gry.md': `# Filozofia gry

Trzy zasady prowadzącego:

1. **Strach z niedopowiedzenia, nie z opisu.** Nigdy nie opisuj potwora w całości.
2. **Zaufaj graczom.** Jeśli ktoś wymyśla "głupi" plan, daj mu szansę.
3. **Konsekwencje są trwałe.** Patrz [[Poczytalność]].
`,
  },
})
