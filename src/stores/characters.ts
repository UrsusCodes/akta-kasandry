import { create } from 'zustand'
import { getSupabase, getAnonClient, hasSupabaseCredentials } from '@/lib/supabase'
import { CHARACTER_SELECT } from '@/lib/characterColumns'
import { slugify } from '@/lib/tree'

/** A character row from coc-creator's public.characters (allowlisted columns). */
export type SourceCharacter = {
  id: string
  player_id: string | null
  status: string | null
  name: string
  occupation_id: string | null
  era: string | null
  portrait_url: string | null
  profile_portrait_url: string | null
  card_portrait_url: string | null
  updated_at: string
  // …plus the rest of the allowlist, kept for the snapshot:
  [k: string]: unknown
}

/** Metadata about what we've already imported (from wiki.imported_characters). */
export type ImportedMeta = {
  source_id: string
  slug: string
  player_name: string | null
  source_updated_at: string
}

export type ImportState = 'not-imported' | 'current' | 'stale'

type CharactersState = {
  loading: boolean
  error: string | null
  /** All source characters, keyed by id. */
  sources: SourceCharacter[]
  /** Imported metadata, keyed by source_id. */
  imported: Record<string, ImportedMeta>

  load: () => Promise<void>
  importOne: (source: SourceCharacter, playerName: string) => Promise<{ error?: string }>
  remove: (sourceId: string) => Promise<{ error?: string }>
  stateFor: (source: SourceCharacter) => ImportState
}

export const useCharactersStore = create<CharactersState>((set, get) => ({
  loading: false,
  error: null,
  sources: [],
  imported: {},

  load: async () => {
    if (!hasSupabaseCredentials()) {
      set({ error: 'Supabase nie jest skonfigurowane.', sources: [], imported: {} })
      return
    }
    set({ loading: true, error: null })

    // Source characters via the anon client (their RLS is `TO anon`).
    const { data: src, error: srcErr } = await getAnonClient()
      .from('characters')
      .select(CHARACTER_SELECT)
    if (srcErr) {
      set({ loading: false, error: `Odczyt public.characters: ${srcErr.message}` })
      return
    }

    // What we've already imported, via the authenticated client.
    const { data: imp, error: impErr } = await getSupabase()
      .from('imported_characters')
      .select('source_id, slug, player_name, source_updated_at')
    if (impErr) {
      set({ loading: false, error: `Odczyt wiki.imported_characters: ${impErr.message}` })
      return
    }

    const importedMap: Record<string, ImportedMeta> = {}
    for (const row of imp ?? []) {
      importedMap[String(row.source_id)] = {
        source_id: String(row.source_id),
        slug: row.slug,
        player_name: row.player_name,
        source_updated_at: row.source_updated_at,
      }
    }

    set({
      loading: false,
      sources: (src ?? []) as unknown as SourceCharacter[],
      imported: importedMap,
    })
  },

  importOne: async (source, playerName) => {
    if (!hasSupabaseCredentials()) return { error: 'Supabase nie jest skonfigurowane.' }
    const name = source.name || 'Postać bez nazwy'
    // Include a short id suffix so two unnamed/duplicate-name characters don't
    // collide on the unique slug.
    const slug = `${slugify(name)}-${source.id.slice(0, 4)}`
    const row = {
      source_id: source.id,
      slug,
      name,
      occupation_id: source.occupation_id ?? null,
      era: source.era ?? null,
      status: source.status ?? null,
      source_player_id: source.player_id ?? null,
      player_name: playerName.trim() || null,
      portrait_url:
        source.portrait_url ?? source.profile_portrait_url ?? source.card_portrait_url ?? null,
      data: source, // full allowlisted snapshot
      source_updated_at: source.updated_at,
    }
    const { error } = await getSupabase()
      .from('imported_characters')
      .upsert(row, { onConflict: 'source_id' })
    if (error) {
      // Most likely a slug collision (two characters with the same name).
      return { error: error.message }
    }
    await get().load()
    return {}
  },

  remove: async (sourceId) => {
    if (!hasSupabaseCredentials()) return { error: 'Supabase nie jest skonfigurowane.' }
    const { error } = await getSupabase()
      .from('imported_characters')
      .delete()
      .eq('source_id', sourceId)
    if (error) return { error: error.message }
    await get().load()
    return {}
  },

  stateFor: (source) => {
    const meta = get().imported[source.id]
    if (!meta) return 'not-imported'
    // Source moved since we snapshotted → stale.
    return source.updated_at > meta.source_updated_at ? 'stale' : 'current'
  },
}))
