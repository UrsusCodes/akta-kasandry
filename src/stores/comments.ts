import { create } from 'zustand'
import type { Comment, CommentAnchor } from '@/types'
import { getSupabase, hasSupabaseCredentials } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { mockComments } from '@/mocks/comments'

export type NewComment = {
  pageKey: string
  anchor: CommentAnchor
  speakerCharacterId: string | null
  body: string
  parentId: string | null
}

type CommentsState = {
  comments: Comment[]
  loading: boolean
  source: 'supabase' | 'mock'
  error: string | null
  load: (pageKey: string) => Promise<void>
  add: (input: NewComment) => Promise<{ error?: string }>
  edit: (id: string, body: string) => Promise<{ error?: string }>
  remove: (id: string) => Promise<{ error?: string }>
}

// Shape returned by the join select below.
const SELECT =
  'id, page_key, anchor, author_profile_id, speaker_character_id, body, parent_id, created_at, edited,' +
  ' author:profiles!comments_author_profile_id_fkey(display_name, color),' +
  ' speaker:imported_characters!comments_speaker_character_id_fkey(name, portrait_url)'

function rowToComment(r: any): Comment {
  return {
    id: String(r.id),
    pageKey: r.page_key,
    anchor: r.anchor as CommentAnchor,
    authorProfileId: r.author_profile_id,
    authorName: r.author?.display_name ?? 'Gracz',
    authorColor: r.author?.color ?? '#3a6ea5',
    speakerCharacterId: r.speaker_character_id ?? null,
    speakerName: r.speaker?.name ?? null,
    speakerPortraitUrl: r.speaker?.portrait_url ?? null,
    body: r.body,
    parentId: r.parent_id ?? null,
    createdAt: r.created_at,
    edited: r.edited,
  }
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  comments: [],
  loading: false,
  source: hasSupabaseCredentials() ? 'supabase' : 'mock',
  error: null,

  load: async (pageKey) => {
    if (get().source === 'mock') {
      set({ comments: mockComments.filter((c) => c.pageKey === pageKey), loading: false })
      return
    }
    set({ loading: true, error: null })
    const { data, error } = await getSupabase()
      .from('comments').select(SELECT).eq('page_key', pageKey)
    if (error) {
      set({ comments: [], loading: false, error: error.message })
      return
    }
    set({ comments: (data ?? []).map(rowToComment), loading: false })
  },

  add: async (input) => {
    if (get().source === 'mock') {
      // Optimistic local append for credential-less dev.
      const c: Comment = {
        id: `local-${get().comments.length + 1}`,
        pageKey: input.pageKey, anchor: input.anchor,
        authorProfileId: 'local', authorName: 'Ty', authorColor: '#3a6ea5',
        speakerCharacterId: input.speakerCharacterId, speakerName: null, speakerPortraitUrl: null,
        body: input.body, parentId: input.parentId,
        createdAt: new Date().toISOString(), edited: false,
      }
      set({ comments: [...get().comments, c] })
      return {}
    }
    const uid = useAuthStore.getState().user?.id
    if (!uid) return { error: 'Musisz być zalogowany.' }
    const { error } = await getSupabase().from('comments').insert({
      page_key: input.pageKey,
      anchor: input.anchor,
      author_profile_id: uid,
      speaker_character_id: input.speakerCharacterId,
      body: input.body,
      parent_id: input.parentId,
    })
    if (error) return { error: error.message }
    await get().load(input.pageKey)
    return {}
  },

  edit: async (id, body) => {
    if (get().source === 'mock') {
      set({ comments: get().comments.map((c) => (c.id === id ? { ...c, body, edited: true } : c)) })
      return {}
    }
    const target = get().comments.find((c) => c.id === id)
    const { error } = await getSupabase()
      .from('comments').update({ body, edited: true, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return { error: error.message }
    if (target) await get().load(target.pageKey)
    return {}
  },

  remove: async (id) => {
    if (get().source === 'mock') {
      set({ comments: get().comments.filter((c) => c.id !== id) })
      return {}
    }
    const target = get().comments.find((c) => c.id === id)
    const { error } = await getSupabase().from('comments').delete().eq('id', id)
    if (error) return { error: error.message }
    if (target) await get().load(target.pageKey)
    return {}
  },
}))
