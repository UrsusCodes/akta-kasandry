import { create } from 'zustand'

type DraftState = {
  body: string
  setBody: (body: string) => void
  reset: () => void
}

const INITIAL = `# Próbna strona

Pisz po polsku — **ąćęłńóśźż** ĄĆĘŁŃÓŚŹŻ.

Wikilinki rozwiązują się względem snapshotu z PUBLIC. Spróbuj klikalnych:
[[Bijatyka]], [[Mapa Bostonu 1924|mapa]], [[Tutorial walki — hub]], [[Duży sukces]].

## Tabela

| Sukces | Próg | Symbol |
|---|---|---|
| Krytyczny | wartość ÷ 5 | ⭐ |
| Trudny | wartość ÷ 2 | ✅ |
| Zwykły | ≤ wartość | ✅ |
| Porażka | > wartość | ❌ |

\`\`\`
"Trzecia godzina jest najczystsza." — kult
\`\`\`

> [!note] Bez persistencji
> Edytor trzyma treść w pamięci zustand. Po odświeżeniu strony wraca do tej próbki.
`

/**
 * Draft store. In-memory only — stage D proper will replace with Supabase
 * upsert into wiki.pages + revision write into wiki.revisions on save.
 */
export const useDraftStore = create<DraftState>((set) => ({
  body: INITIAL,
  setBody: (body) => set({ body }),
  reset: () => set({ body: INITIAL }),
}))
