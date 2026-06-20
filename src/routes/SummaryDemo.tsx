import { Markdown } from '@/components/Markdown'

/**
 * Demo of a session/investigation summary with per-paragraph deep-link markers
 * into the transcript viewer. This renders through the SAME `Markdown` component
 * a real vault summary page would use — the `{sesja:<slug>#<id>}` tokens become
 * "↪ transkrypt" pills (via remarkTranscriptAnchors) that jump to and flash the
 * matching line in `/sesje`. The utterance ids are real (Sol w Ranach, default
 * `parallel-split-epoch` variant); the prose is placeholder flavour.
 */

const SAMPLE = `# Sól w Ranach — streszczenie

> Dochodzenie: *Znak życia* · sesja 1 · Boston, zima 1924.
> Robocza wersja — pokazuje, jak akapit streszczenia linkuje do konkretnego miejsca w transkrypcie. Kliknij „↪ transkrypt".

Wieczór zaczął się od fałszywego tropu: badacze rozdzielili się, a Jakub ruszył wybadać okolicę — szybko jednak pogubił się w zaułkach portowej dzielnicy i przyznał, że nie nadąża za sytuacją. {sesja:sol-w-ranach#c1c1705922c4}

Rozmowy w spelunce nad wodą nie przyniosły niczego prócz plotek; nikt nie chciał mówić wprost o zniknięciach, a bohaterowie kwitowali to gorzkimi żartami o braku szczęścia. {sesja:sol-w-ranach#9ce12a9080b0}

## Trop w magazynie

Prowadzący pchnął drużynę ku opuszczonemu składowi przy nabrzeżu, zapowiadając, że tam czeka pierwszy realny ślad — i żeby się „nie nudzili" po drodze. {sesja:sol-w-ranach#067dd5e264d7}

Rafał przyjrzał się ustawieniu skrzyń i wskazał kąt, pod którym ktoś niedawno coś stąd wywlókł. {sesja:sol-w-ranach#b053cc161a6d}

## Ciało

Najmocniejszy moment wieczoru: odkrycie, że ktoś **zabrał ciało** zanim badacze dotarli na miejsce, i ostra wymiana zdań o tym, jak właściwie doszło do jego przeniesienia. {sesja:sol-w-ranach#c0a3177e67f8..80166003daa1}
`

export function SummaryDemo() {
  return (
    <article>
      <Markdown>{SAMPLE}</Markdown>
    </article>
  )
}
