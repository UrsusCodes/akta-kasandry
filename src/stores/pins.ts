import { create } from 'zustand'
import type { Pin } from '@/types'
import { getSupabase, hasSupabaseCredentials } from '@/lib/supabase'
import { pins as mockPins } from '@/mocks/pins'
import { DEFAULT_PIN_COLOR } from '@/lib/pinColors'

type NewPin = Omit<Pin, 'id'>

type PinsState = {
  pins: Pin[]
  loading: boolean
  /** 'supabase' when reading the live table, 'mock' when credentials are absent. */
  source: 'supabase' | 'mock'
  error: string | null

  load: () => Promise<void>
  addPin: (pin: NewPin) => Promise<{ error?: string }>
  updatePin: (id: string, patch: Partial<NewPin>) => Promise<{ error?: string }>
  deletePin: (id: string) => Promise<{ error?: string }>
}

const SELECT = 'id, x, y, title, description, label, color'

/**
 * Boston map pins store.
 *
 * - View: reads `wiki.pins` (anon-readable). Falls back to the mock list when
 *   Supabase credentials are absent (so dev clones without `.env` still show a
 *   populated map).
 * - Write (add / move / edit / delete): only succeeds for MG — `wiki.pins` RLS
 *   enforces it. After a mutation we reload (cheap; the table is tiny).
 */
export const usePinsStore = create<PinsState>((set, get) => ({
  pins: [],
  loading: false,
  source: hasSupabaseCredentials() ? 'supabase' : 'mock',
  error: null,

  load: async () => {
    if (!hasSupabaseCredentials()) {
      set({ pins: mockPins, source: 'mock', loading: false })
      return
    }
    set({ loading: true, error: null })
    const { data, error } = await getSupabase().from('pins').select(SELECT)
    if (error) {
      // Fall back to mock so the map isn't blank on a transient error.
      set({ pins: mockPins, source: 'mock', loading: false, error: error.message })
      return
    }
    set({
      pins: (data ?? []).map((r) => ({
        id: String(r.id),
        x: r.x,
        y: r.y,
        title: r.title,
        description: r.description ?? '',
        label: r.label ?? '',
        color: r.color ?? DEFAULT_PIN_COLOR,
      })),
      source: 'supabase',
      loading: false,
    })
  },

  addPin: async (pin) => {
    if (!hasSupabaseCredentials()) return { error: 'Supabase nie jest skonfigurowane.' }
    const { error } = await getSupabase().from('pins').insert({
      x: pin.x,
      y: pin.y,
      title: pin.title,
      description: pin.description || null,
      label: pin.label || null,
      color: pin.color || DEFAULT_PIN_COLOR,
    })
    if (error) return { error: error.message }
    await get().load()
    return {}
  },

  updatePin: async (id, patch) => {
    if (!hasSupabaseCredentials()) return { error: 'Supabase nie jest skonfigurowane.' }
    const { error } = await getSupabase().from('pins').update(patch).eq('id', id)
    if (error) return { error: error.message }
    await get().load()
    return {}
  },

  deletePin: async (id) => {
    if (!hasSupabaseCredentials()) return { error: 'Supabase nie jest skonfigurowane.' }
    const { error } = await getSupabase().from('pins').delete().eq('id', id)
    if (error) return { error: error.message }
    await get().load()
    return {}
  },
}))
