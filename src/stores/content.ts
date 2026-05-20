import { create } from 'zustand'
import type { ContentNode, ImportedCharacterData } from '@/types'
import { contentTree as staticTree } from '@/content'
import { getSupabase, hasSupabaseCredentials } from '@/lib/supabase'
import { slugify } from '@/lib/tree'

/**
 * Merged content tree = the static PUBLIC vault snapshot (`src/generated`)
 * plus imported characters grafted under `BADACZE/` as `BADACZE/<player>/<char>`.
 *
 * The static tree is the synchronous default so the reader works instantly;
 * `load()` fetches `wiki.imported_characters` and re-merges. Components read
 * `tree` from here instead of importing the static tree directly.
 *
 * Note: the wikilink resolver (src/lib/wikilinks.ts) still resolves against the
 * static tree only — character pages aren't wikilink targets yet. Acceptable
 * for v1; revisit if the GM wants [[Character]] links.
 */

const IMPORTED_SELECT =
  'source_id, slug, name, player_name, source_player_id, occupation_id, era, status, portrait_url, data, source_updated_at, imported_at'

function playerLabel(c: ImportedCharacterData): string {
  return c.player_name?.trim() || `Gracz #${(c.source_player_id ?? '').slice(0, 8) || '—'}`
}

/** Build the BADACZE subtree: a folder per player, character pages within. */
function buildBadacze(chars: ImportedCharacterData[]): ContentNode[] {
  const groups = new Map<string, ImportedCharacterData[]>()
  for (const c of chars) {
    const key = playerLabel(c)
    const arr = groups.get(key) ?? []
    arr.push(c)
    groups.set(key, arr)
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'pl'))
    .map(([label, members]) => {
      const pslug = slugify(label)
      const ppath = `badacze/${pslug}`
      return {
        name: label,
        slug: pslug,
        path: ppath,
        kind: 'folder' as const,
        children: members
          .sort((a, b) => a.name.localeCompare(b.name, 'pl'))
          .map((c) => ({
            name: c.name,
            slug: c.slug,
            path: `${ppath}/${c.slug}`,
            kind: 'page' as const,
            character: c,
          })),
      }
    })
}

/** Replace BADACZE's children with the imported-character subtree. */
function merge(base: ContentNode[], badaczeChildren: ContentNode[]): ContentNode[] {
  return base.map((n) =>
    n.slug === 'badacze' ? { ...n, children: badaczeChildren } : n,
  )
}

type ContentState = {
  tree: ContentNode[]
  load: () => Promise<void>
}

export const useContentStore = create<ContentState>((set) => ({
  tree: staticTree,
  load: async () => {
    if (!hasSupabaseCredentials()) {
      set({ tree: staticTree })
      return
    }
    const { data, error } = await getSupabase()
      .from('imported_characters')
      .select(IMPORTED_SELECT)
    if (error || !data) return
    set({ tree: merge(staticTree, buildBadacze(data as unknown as ImportedCharacterData[])) })
  },
}))
