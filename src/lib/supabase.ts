import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Shared Supabase client.
 *
 * Reads `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` from the build-time
 * env (`.env`, see `.env.example`). The client is created lazily — importing
 * this module is always safe even before credentials are set; only
 * `getSupabase()` throws.
 *
 * Default schema is `wiki` (set via `db.schema` at runtime). So:
 *   `getSupabase().from('pages')`              → `wiki.pages`
 *   `getSupabase().schema('public').from('characters')`  → cross-schema read
 *                                                          of coc-creator data
 *
 * The schema must also be added to the dashboard's "Exposed schemas" list
 * (Settings → API → Exposed schemas → `wiki`). Without that, PostgREST hides
 * wiki.* and the calls above 404. See docs/RUNBOOKS/supabase-migration.md.
 *
 * Typing note: we cast back to the default `SupabaseClient` shape because we
 * don't have a generated Database type yet (no `supabase gen types typescript`
 * setup). Schema routing still works at runtime via `db.schema`; the cast
 * just keeps the surface ergonomic for call sites until codegen lands.
 *
 * Stage gating: as of 2026-05-20, no component imports this. Schema migration
 * is pending; until then, importing here is a no-op and
 * `hasSupabaseCredentials()` lets callers fall back to mock data.
 */

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let client: SupabaseClient | null = null

export function hasSupabaseCredentials(): boolean {
  return Boolean(URL && ANON_KEY)
}

export function getSupabase(): SupabaseClient {
  if (!URL || !ANON_KEY) {
    throw new Error(
      '[supabase] credentials missing — copy .env.example to .env and fill VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY. See docs/RUNBOOKS/supabase-migration.md.',
    )
  }
  if (client) return client
  client = createClient(URL, ANON_KEY, {
    db: { schema: 'wiki' },
    auth: { persistSession: true, autoRefreshToken: true },
  }) as unknown as SupabaseClient
  return client
}
