import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { getSupabase, hasSupabaseCredentials } from '@/lib/supabase'

export type Role = 'mg' | 'gracz' | null

type AuthState = {
  /** True once the initial session check has finished. */
  ready: boolean
  /** False when Supabase credentials are absent — auth features hide, site stays anon-readable. */
  enabled: boolean
  user: User | null
  role: Role
  displayName: string | null

  init: () => void
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

let initialized = false

/**
 * Auth store. Single source of truth for "who is signed in + what role".
 *
 * - When Supabase credentials are missing (`.env` not set), `enabled` is false:
 *   the UI hides all login/edit affordances and the site behaves as anon-only.
 * - On init, loads the current session, fetches the matching `wiki.profiles`
 *   row for the role, and subscribes to auth state changes.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  ready: false,
  enabled: hasSupabaseCredentials(),
  user: null,
  role: null,
  displayName: null,

  init: () => {
    if (initialized) return
    initialized = true

    if (!hasSupabaseCredentials()) {
      set({ ready: true, enabled: false })
      return
    }

    const supabase = getSupabase()

    const loadProfile = async (user: User | null) => {
      if (!user) {
        set({ user: null, role: null, displayName: null })
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('role, display_name')
        .eq('id', user.id)
        .single()
      set({
        user,
        role: (data?.role as Role) ?? 'gracz',
        displayName: (data?.display_name as string | null) ?? user.email ?? null,
      })
    }

    // Initial session.
    supabase.auth.getSession().then(async ({ data }) => {
      await loadProfile(data.session?.user ?? null)
      set({ ready: true })
    })

    // React to sign-in / sign-out / token refresh.
    supabase.auth.onAuthStateChange((_event, session) => {
      void loadProfile(session?.user ?? null)
    })
  },

  signIn: async (email, password) => {
    if (!hasSupabaseCredentials()) return { error: 'Supabase nie jest skonfigurowane.' }
    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  },

  signOut: async () => {
    if (!get().enabled) return
    await getSupabase().auth.signOut()
    set({ user: null, role: null, displayName: null })
  },
}))

/** Convenience selector: is the current user a game master? */
export function useIsMG(): boolean {
  return useAuthStore((s) => s.role === 'mg')
}
