import type { Shelf } from '@/types'

/**
 * Mock content tree mirroring the real Shelf > Book > Chapter > Page hierarchy
 * from the GM's content vault. Used by the public reader until the Supabase
 * push pipeline lands. Wikilinks reference page titles (not slugs) so the
 * renderer's resolver must walk the tree by title — see src/lib/wikilinks.ts.
 */

export const shelves: Shelf[] = [
  {
    slug: 'kampania',
    title: 'Kampania',
    description:
      'Rozdarte Sumienie — kampania w Bostonie roku 1924. Sceny, sesje i wątki śledztwa.',
    books: [
      {
        slug: 'tlo-historyczne',
        title: 'Tło historyczne',
        description: 'Boston wczesnych lat 20-tych — prohibicja, mafia, miasto na krawędzi.',
        chapters: [
          {
            slug: 'miasto',
            title: 'Miasto',
            pages: [
              {
                slug: 'beacon-hill',
                title: 'Beacon Hill',
                body: `# Beacon Hill

> [!note] Dzielnica śmietanki towarzyskiej
> Mieszkają tu starzy bostończycy — rodziny z **mayflowerskim rodowodem**, których fortuny zarabiają się od pokoleń.

Wąskie, brukowane uliczki Beacon Hill wspinają się stromo od [[Boston Common]] do złotej kopuły [[Massachusetts State House]]. Wieczorami latarnie gazowe — tak, *gazowe*, w roku 1924 — rzucają miodowe światło na fasady z czerwonej cegły.

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

Porównaj: [[North End]], [[Back Bay]].
`,
              },
              {
                slug: 'north-end',
                title: 'North End',
                body: `# North End

Włoska dzielnica. Tu mówi się po sycylijsku głośniej niż po angielsku, a **bootleg whisky** dyskretnie zmienia ręce w piwnicach przy Salem Street.

## Co tu czuć

- Zapach świeżego chleba o szóstej rano
- Słone powietrze od portu — bliżej niż w [[Beacon Hill]]
- Pot i czosnek w kawiarniach

## Ważni ludzie

1. **Salvatore "Sammy" Borghese** — szef lokalnego gangu, kontroluje rozprowadzanie alkoholu z Kanady
2. *Ojciec Domenico* — proboszcz St. Stephen's, wie więcej niż powie
3. Anna Costa — właścicielka pensjonatu na Hanover Street; gracze mogą tu wynająć pokój

> Gdy padał deszcz, cała Hanover Street pachniała mokrym marmurem i czosnkiem.

Kiedyś mieszkali tu Paul Revere i Cotton Mather. Teraz mieszka tu strach.
`,
              },
            ],
          },
          {
            slug: 'ludzie',
            title: 'Ludzie',
            pages: [
              {
                slug: 'alistair-whitcomb',
                title: 'Alistair Whitcomb',
                body: `# Alistair Whitcomb

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
> Whitcomb wie o [[Kult Trzeciego Kwadratu]] więcej, niż przyzna nawet sobie. Gracze, którzy wkupią się w jego zaufanie, mogą uzyskać kluczową wskazówkę — ale za cenę.

## Hak fabularny

Jeśli któryś z graczy pyta w bibliotece o **Necronomicon**, bibliotekarka odsyła go *właśnie* do Whitcomba. Spotkanie odbywa się w gabinecie z ciężkimi zasłonami — patrz mapę: [[Boston Common]].
`,
              },
            ],
          },
        ],
      },
      {
        slug: 'sesje',
        title: 'Dziennik sesji',
        description: 'Notatki z rozegranych sesji, w kolejności chronologicznej.',
        chapters: [
          {
            slug: 'sezon-1',
            title: 'Sezon 1',
            pages: [
              {
                slug: 'sesja-01-list',
                title: 'Sesja 1 — List',
                body: `# Sesja 1 — List

**Data sesji:** 12 października 1924, ranek
**Miejsce:** mieszkanie dr Henninga, [[Beacon Hill]]

## Co się wydarzyło

Gracze otrzymali list od **Edith Carrington** z prośbą o spotkanie. Treść listu — krótka, drżącą ręką:

> "Mr. Henning,
>
> jeżeli moje obawy są bezpodstawne — wybaczcie staruszce. Jeżeli nie są — ratujcie mnie.
> Spotkajmy się przy Louisburg Square dziś o ósmej wieczorem. Nie przychodźcie sami.
>
> E. C."

## Decyzje BG

- Henning zadzwonił do [[Alistair Whitcomb|Whitcomba]] (jego znajomy z czasów Harvardu)
- Grupa zdecydowała się iść w trójkę: Henning, Whitcomb, Stella
- Whitcomb zabrał ze sobą laskę z ukrytym ostrzem (*kupioną w 1899 w Marakeszu*)

## Co odkryli

Gdy dotarli pod adres Mt. Vernon 44, drzwi były otwarte. W holu — przewrócony świecznik. Edith Carrington nie było. Na biurku, pod kałamarzem, leżał drugi list — zaadresowany do graczy.

## Następna sesja

[[Sesja 2 — Drugi list]]
`,
              },
              {
                slug: 'sesja-02-drugi-list',
                title: 'Sesja 2 — Drugi list',
                body: `# Sesja 2 — Drugi list

> [!info] Status sesji
> Zaplanowana, jeszcze nierozegrana.

Plan: gracze odkrywają, że list zostawił [[Alistair Whitcomb|Whitcomb]] — bo wiedział, że Edith znika.

\`\`\`
TODO: dopracować scenę w piwnicy.
TODO: kto pierwszy zorientuje się o [[Kult Trzeciego Kwadratu|kulcie]]?
\`\`\`
`,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'mechanika',
    title: 'Mechanika',
    description: 'Zasady używane w kampanii — wybrane fragmenty Zewu Cthulhu 7e + house rules.',
    books: [
      {
        slug: 'testy',
        title: 'Testy i opozycje',
        description: 'Jak rzucamy kośćmi — i kiedy *nie* rzucamy.',
        pages: [
          {
            slug: 'rzut-zwykly',
            title: 'Rzut zwykły',
            body: `# Rzut zwykły

Rzucasz **1k100** i porównujesz z wartością umiejętności.

| Wynik | Sukces |
|---|---|
| ≤ wartość ÷ 5 | krytyczny |
| ≤ wartość ÷ 2 | trudny |
| ≤ wartość | zwykły |
| > wartość | porażka |
| 96–100 (gdy wartość < 50) | porażka krytyczna |

## House rule

Jeśli rzut zwykły byłby *fabularnie nudny*, MG może go pominąć i ogłosić wynik. Patrz [[Filozofia gry]].
`,
          },
          {
            slug: 'poczytalnosc',
            title: 'Poczytalność',
            body: `# Poczytalność

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
        ],
      },
    ],
  },
  {
    slug: 'okult',
    title: 'Okult i mity',
    description: 'Wiedza zakazana — tylko dla MG i graczy, którzy *zarobili* sobie ją w kampanii.',
    books: [
      {
        slug: 'kulty',
        title: 'Kulty bostońskie',
        description: 'Aktywne kulty w mieście, ich znaki rozpoznawcze i hierarchia.',
        pages: [
          {
            slug: 'kult-trzeciego-kwadratu',
            title: 'Kult Trzeciego Kwadratu',
            body: `# Kult Trzeciego Kwadratu

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

## Co wiedzą gracze

| Gracz | Wie | Skąd |
|---|---|---|
| Henning | nic | — |
| Whitcomb | być może wszystko, być może nic | jego sekret |
| Stella | dwa znaki | szyfr u Edith |

Patrz też: [[Beacon Hill]] (większość członków stąd), [[North End]] (jeden łącznik).
`,
          },
        ],
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Helpers — typed lookups by slug. Components should use these rather than
// reaching into `shelves` directly so future Supabase wiring is one swap.
// ---------------------------------------------------------------------------

export function findShelf(shelfSlug: string) {
  return shelves.find((s) => s.slug === shelfSlug)
}

export function findBook(shelfSlug: string, bookSlug: string) {
  return findShelf(shelfSlug)?.books.find((b) => b.slug === bookSlug)
}

export function findChapter(shelfSlug: string, bookSlug: string, chapterSlug: string) {
  return findBook(shelfSlug, bookSlug)?.chapters?.find((c) => c.slug === chapterSlug)
}

export function findPage(
  shelfSlug: string,
  bookSlug: string,
  chapterOrPageSlug: string,
  maybePageSlug?: string,
) {
  const book = findBook(shelfSlug, bookSlug)
  if (!book) return undefined
  if (maybePageSlug) {
    const chapter = book.chapters?.find((c) => c.slug === chapterOrPageSlug)
    return chapter?.pages.find((p) => p.slug === maybePageSlug)
  }
  return book.pages?.find((p) => p.slug === chapterOrPageSlug)
}
