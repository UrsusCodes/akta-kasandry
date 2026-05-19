import { create } from 'zustand'

type DraftState = {
  body: string
  setBody: (body: string) => void
  reset: () => void
}

const INITIAL = `# Próbna strona

Pisz po polsku — **ąćęłńóśźż** ĄĆĘŁŃÓŚŹŻ.

Wikilinki działają w podglądzie: [[Beacon Hill]], [[Alistair Whitcomb|antykwariusz]], [[Sesja 1 — List]].

## Tabela

| Co | Gdzie |
|---|---|
| Antykwariat | Louisburg Square 12 |
| Pensjonat | Hanover St., North End |

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
