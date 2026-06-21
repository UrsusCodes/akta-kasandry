import { Markdown } from '@/components/Markdown'

/**
 * Companion "funny & epic moments" page for the Sól w Ranach summary, mirroring
 * the vault's "03 Cytaty i sytuacje z sesji" house style. Quotes are real lines
 * from the transcript, lightly cleaned of ASR noise; each carries a deep-link
 * marker into the matching transcript moment where one exists.
 */

const QUOTES = `# Sól w Ranach — śmieszne i epickie momenty

> Cytaty z transkryptu, lekko oczyszczone z szumu ASR. „↪ transkrypt" przenosi do tego momentu w nagraniu.

→ **[wróć do streszczenia](/streszczenie-demo)**

---

_Jack Murdock opatruje kogoś, kogo szczerze nie lubi — bo lekarz to lekarz._

> **Jack:** Nie lubimy się, pamiętaj — ale zawsze możesz liczyć na moją pomoc. Złożyłem przysięgę Hipokratesa. {sesja:sol-w-ranach#e3dc94a1c20d}

_Henry Pooler rozwiązuje problem podziemnego kompleksu pełnego potworów w jedyny słuszny, kowbojski sposób._

> **Henry:** Biorę zapałkę, podpalam i za siebie nie patrzę. _(rzuca dynamit do studni)_ {sesja:sol-w-ranach#a2ef244977b5}

_Indianka, w którą drużyna wcześniej pochopnie strzelała, okazuje się ich wybawieniem._

> **Indianka:** Cieszę się, że mój znaleziony amulet ci pomógł. {sesja:sol-w-ranach#aa880dbc6707}

_Strażnik Tajemnic zamyka sesję epilogiem._

> **MG:** Czy to szczęśliwe zakończenie? Można się zastanawiać. Wiele osób umarło — a tego, co zobaczyliście, nie da się odzobaczyć. **Świat nigdy nie będzie taki sam.** {sesja:sol-w-ranach#687e56dd2cc8}

_Henry podsumowuje finałową strzelaninę z właściwą sobie godnością._

> **Henry:** Dwie dwururki prosto w moją mordę, z pola obok. Ladies and gentlemen… What the fuck!

_Po jednej z dłuższych scen mechaniki Rafał wystawia recenzję._

> **Jack (Rafał):** That was boring as fuck. **MG:** Rafał, nie bądź taki salty.

_Na pytanie o motywy potwora MG odmawia wyjaśnień — i słusznie._

> **MG:** O ludzkich agendach — proszę bardzo. Ale istoty tego typu mają motywację w stu procentach niezrozumiałą dla ludzi. Myślą i postrzegają w kategoriach zupełnie nam obcych.

_I moment, w którym pada nazwa, od której zaczął się cały ten projekt._

> **MG:** Chcesz mi powiedzieć, że nazwisko Jolene znajdzie się w **aktach Cassandry**? **Randy:** …a może Jolene zostanie przewodniczącą stowarzyszenia? **MG:** Oj, na pewno. {sesja:sol-w-ranach#3f9a63904d38}
`

export function QuotesDemo() {
  return (
    <article>
      <Markdown>{QUOTES}</Markdown>
    </article>
  )
}
