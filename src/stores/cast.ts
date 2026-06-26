import { create } from 'zustand'
import { getSupabase, hasSupabaseCredentials } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { speakerOptionsFor } from '@/lib/comments/speakerOptions'
import type { SpeakerOption } from '@/components/comments/SpeakerPicker'

/** Page keys whose investigation cast is managed in /admin (extend as pages gain comments). */
export const MANAGED_PAGE_KEYS = ['streszczenie/ug2'] as const

type Profile = { id: string; displayName: string | null }
type CastChar = { sourceId: string; name: string; portraitUrl: string | null; ownerProfileId: string | null }
type CastRow = { pageKey: string; characterId: string }

type CastState = {
  loading: boolean
  error: string | null
  profiles: Profile[]
  chars: CastChar[]
  cast: CastRow[]
  load: () => Promise<void>
  setOwner: (sourceId: string, profileId: string | null) => Promise<{ error?: string }>
  toggleCast: (pageKey: string, sourceId: string) => Promise<{ error?: string }>
  /** Speaker options for the CURRENT logged-in player on a page (owned ∩ cast, else all owned). */
  speakerOptionsForPlayer: (pageKey: string) => SpeakerOption[]
}

/**
 * Ownership + investigation-cast data for the comment speaker picker. Read by
 * /admin (MG assigns owner + cast) and by commentable pages (compute the player's
 * IC speaker options). MG-only writes are enforced by RLS (imported_mg_write,
 * cast_mg_write); reads are anon-safe.
 */
export const useCastStore = create<CastState>((set, get) => ({
  loading: false,
  error: null,
  profiles: [],
  chars: [],
  cast: [],

  load: async () => {
    if (!hasSupabaseCredentials()) {
      set({ profiles: [], chars: [], cast: [], loading: false })
      return
    }
    set({ loading: true, error: null })
    const sb = getSupabase()
    const [profsRes, charsRes, castRes] = await Promise.all([
      sb.from('profiles').select('id, display_name'),
      sb.from('imported_characters').select('source_id, name, portrait_url, owner_profile_id'),
      sb.from('investigation_cast').select('page_key, character_id'),
    ])
    const err = profsRes.error ?? charsRes.error ?? castRes.error
    if (err) {
      set({ loading: false, error: err.message })
      return
    }
    set({
      loading: false,
      profiles: (profsRes.data ?? []).map((p: any) => ({ id: p.id, displayName: p.display_name ?? null })),
      chars: (charsRes.data ?? []).map((c: any) => ({
        sourceId: String(c.source_id),
        name: c.name,
        portraitUrl: c.portrait_url ?? null,
        ownerProfileId: c.owner_profile_id ?? null,
      })),
      cast: (castRes.data ?? []).map((r: any) => ({ pageKey: r.page_key, characterId: String(r.character_id) })),
    })
  },

  setOwner: async (sourceId, profileId) => {
    if (!hasSupabaseCredentials()) return {}
    const { error } = await getSupabase()
      .from('imported_characters')
      .update({ owner_profile_id: profileId })
      .eq('source_id', sourceId)
    if (error) return { error: error.message }
    set({ chars: get().chars.map((c) => (c.sourceId === sourceId ? { ...c, ownerProfileId: profileId } : c)) })
    return {}
  },

  toggleCast: async (pageKey, sourceId) => {
    if (!hasSupabaseCredentials()) return {}
    const exists = get().cast.some((r) => r.pageKey === pageKey && r.characterId === sourceId)
    if (exists) {
      const { error } = await getSupabase()
        .from('investigation_cast')
        .delete()
        .eq('page_key', pageKey)
        .eq('character_id', sourceId)
      if (error) return { error: error.message }
      set({ cast: get().cast.filter((r) => !(r.pageKey === pageKey && r.characterId === sourceId)) })
    } else {
      const { error } = await getSupabase()
        .from('investigation_cast')
        .insert({ page_key: pageKey, character_id: sourceId })
      if (error) return { error: error.message }
      set({ cast: [...get().cast, { pageKey, characterId: sourceId }] })
    }
    return {}
  },

  speakerOptionsForPlayer: (pageKey) => {
    const uid = useAuthStore.getState().user?.id
    if (!uid) return []
    const owned = get()
      .chars.filter((c) => c.ownerProfileId === uid)
      .map((c) => ({ id: c.sourceId, name: c.name, portrait_url: c.portraitUrl }))
    const castIds = get().cast.filter((r) => r.pageKey === pageKey).map((r) => r.characterId)
    return speakerOptionsFor(owned, castIds)
  },
}))
