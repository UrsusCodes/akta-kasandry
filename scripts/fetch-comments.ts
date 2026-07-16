/**
 * fetch-comments.ts — wiki.comments (Supabase) → grouped feedback JSON.
 *
 * Run (two equivalent forms):
 *   npx tsx --env-file=.env.local scripts/fetch-comments.ts <page_key>
 *   npm run fetch-comments <page_key>
 *     (npm run cannot inject --env-file ahead of the script path, so this
 *     form only works if VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are
 *     already exported in the shell env — otherwise use the npx form above.)
 *
 * Example: npx tsx --env-file=.env.local scripts/fetch-comments.ts streszczenie/ug2
 *
 * Reads VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY from env (Node 24's native
 * --env-file, no dotenv dependency — see .env.example). Comments are publicly
 * readable per the `comments_anon_read` RLS policy, so this script uses the
 * **anon** key only — never a service-role secret, never hardcoded. Read-only:
 * it never writes to Supabase.
 *
 * Fetches every comment for <page_key> (same author/speaker join shape as
 * src/stores/comments.ts's SELECT), groups them per anchor.blockId via
 * scripts/lib/group-comments.ts, writes pretty JSON to
 * scratch/feedback-<page_key-slug>.json, and echoes a summary to stdout.
 * Consumed by the session-feedback skill.
 */
import { createClient } from '@supabase/supabase-js'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { groupComments, type RawComment } from './lib/group-comments'
import { slugify } from './lib/cleanup'

const pageKey = process.argv[2]

function usageAndExit(message: string): never {
  console.error(`[fetch-comments] ${message}`)
  console.error(
    '[fetch-comments] usage: npx tsx --env-file=.env.local scripts/fetch-comments.ts <page_key>',
  )
  process.exit(1)
}

// Same author/speaker join shape as src/stores/comments.ts's SELECT.
const SELECT =
  'id, page_key, anchor, author_profile_id, speaker_character_id, body, parent_id, created_at, edited,' +
  ' author:profiles!comments_author_profile_id_fkey(display_name, color),' +
  ' speaker:imported_characters!comments_speaker_character_id_fkey(name, portrait_url)'

function rowToRawComment(r: any): RawComment {
  const anchor = (r.anchor ?? {}) as { blockId?: string; quote?: string }
  return {
    id: String(r.id),
    pageKey: r.page_key,
    blockId: anchor.blockId ?? '',
    quote: anchor.quote ?? '',
    authorName: r.author?.display_name ?? 'Gracz',
    speakerName: r.speaker?.name ?? null,
    body: r.body,
    parentId: r.parent_id ?? null,
    createdAt: r.created_at,
    edited: Boolean(r.edited),
  }
}

async function main() {
  if (!pageKey) usageAndExit('missing <page_key> argument.')

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    usageAndExit(
      'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing from env. Copy .env.example to ' +
        '.env.local, fill both (anon key only), and run with --env-file=.env.local.',
    )
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: 'wiki' },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase
    .from('comments')
    .select(SELECT)
    .eq('page_key', pageKey)
    .order('created_at', { ascending: true })

  if (error) {
    console.error(`[fetch-comments] Supabase query failed: ${error.message}`)
    process.exit(1)
  }

  const rows = (data ?? []).map(rowToRawComment)
  const groups = groupComments(rows)
  const threadCount = groups.reduce((n, g) => n + g.threads.length, 0)

  const outDir = resolve('scratch')
  mkdirSync(outDir, { recursive: true })
  const outPath = resolve(outDir, `feedback-${slugify(pageKey)}.json`)
  writeFileSync(outPath, JSON.stringify(groups, null, 2) + '\n', 'utf8')

  console.log(
    `[fetch-comments] page_key=${pageKey}: ${rows.length} comment(s), ${groups.length} group(s), ${threadCount} thread(s) — written to ${outPath}`,
  )
}

main().catch((err: unknown) => {
  console.error(`[fetch-comments] unexpected error: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
