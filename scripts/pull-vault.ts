/**
 * pull-vault.ts — wiki.pages (Supabase) → Obsidian PUBLIC/ writeback.
 *
 * Symmetric to push-vault.ts. Currently dry-run only — `--execute` is gated
 * because (a) the Supabase schema isn't migrated yet, and (b) writeback to
 * the GM's content vault must not race with the GM editing locally. A real
 * pull will need the `ready_to_sync` flag (stage F) and a manual confirm.
 *
 * Run:
 *   npx tsx scripts/pull-vault.ts            # dry-run (default)
 *   npx tsx scripts/pull-vault.ts --execute  # disabled — see message
 *
 * Dry-run plan: list every row that *would* land in the vault and what its
 * vault-form contents would look like (post `appToVault` conversion). Until
 * Supabase is wired up, we have nothing to pull, so the script prints a clear
 * placeholder + the mock content tree it *would* walk if it were live.
 */
import { appToVault } from '../src/lib/wikilinks'
import { shelves } from '../src/mocks/content'
import { contentHash } from './lib/cleanup'

const FLAG_EXECUTE = process.argv.includes('--execute')

function blockExecute(): never {
  console.error(
    '[pull-vault] --execute mode is disabled: writeback to the GM content vault requires (1) schema migration approval on the shared Supabase project, (2) the ready_to_sync flag from stage F, and (3) a manual confirm step. Run without --execute for a dry-run.',
  )
  process.exit(1)
}

type PullRow = {
  vaultPath: string
  title: string
  bodyAppForm: string
  bodyVaultForm: string
}

/**
 * Build a list of rows that *would* be pulled. With no Supabase wired yet,
 * this enumerates the mock content tree as a stand-in. When --execute lands
 * (stage F), swap this for a Supabase select * from wiki.pages where ready_to_sync.
 */
function collectMockRows(): PullRow[] {
  const rows: PullRow[] = []
  for (const shelf of shelves) {
    for (const book of shelf.books) {
      for (const page of book.pages ?? []) {
        rows.push(makeRow(shelf.title, book.title, undefined, page.title, page.body))
      }
      for (const chapter of book.chapters ?? []) {
        for (const page of chapter.pages) {
          rows.push(makeRow(shelf.title, book.title, chapter.title, page.title, page.body))
        }
      }
    }
  }
  return rows
}

function makeRow(
  shelf: string,
  book: string,
  chapter: string | undefined,
  title: string,
  appBody: string,
): PullRow {
  const parts = [shelf, book, chapter, `${title}.md`].filter(Boolean) as string[]
  // appToVault expects standard markdown links to internal URLs. The mock
  // content uses [[wikilink]] form already, so the round-trip here is a
  // no-op — that's the point of the dry-run: show the data flowing through.
  return {
    vaultPath: parts.join('/'),
    title,
    bodyAppForm: appBody,
    bodyVaultForm: appToVault(appBody),
  }
}

function main() {
  if (FLAG_EXECUTE) blockExecute()

  console.log(`[pull-vault] dry-run`)
  console.log(
    `[pull-vault] Supabase not wired yet — enumerating mock content tree as a stand-in.`,
  )
  console.log(
    `             Stage F will swap this for: select * from wiki.pages where ready_to_sync;`,
  )

  const rows = collectMockRows()
  if (rows.length === 0) {
    console.log(`[pull-vault] 0 rows.`)
    return
  }

  console.log(`[pull-vault] ${rows.length} row(s) would be written:`)
  console.log(
    `  ${'vault-path'.padEnd(70)} ${'title'.padEnd(28)} hash      bytes`,
  )
  for (const row of rows) {
    console.log(
      `  ${row.vaultPath.padEnd(70)} ${row.title.padEnd(28)} ${contentHash(row.bodyVaultForm)}  ${row.bodyVaultForm.length}`,
    )
  }
  console.log(`[pull-vault] dry-run complete — no files written.`)
}

main()
