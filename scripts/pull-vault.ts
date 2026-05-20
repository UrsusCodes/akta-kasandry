/**
 * pull-vault.ts — wiki.pages (Supabase) → Obsidian vault writeback.
 *
 * Symmetric to push-vault.ts. Currently dry-run only — `--execute` is gated
 * because (a) the Supabase schema isn't migrated yet, and (b) writeback to
 * the GM's content vault must not race with the GM editing locally. A real
 * pull will need the `ready_to_sync` flag (stage F) and a manual confirm.
 *
 * Until Supabase wires up, the script enumerates the mock content tree as a
 * stand-in source. Walks arbitrary depth (no fixed Shelf/Book/Chapter).
 */
import { appToVault } from '../src/lib/wikilinks'
import { contentTree } from '../src/content'
import { walkTree } from '../src/lib/tree'
import { contentHash } from './lib/cleanup'
import type { ContentNode } from '../src/types'

const FLAG_EXECUTE = process.argv.includes('--execute')

function blockExecute(): never {
  console.error(
    '[pull-vault] --execute mode is disabled: writeback to the GM content vault requires (1) schema migration approval on the shared Supabase project, (2) the ready_to_sync flag from stage F, and (3) a manual confirm step. Run without --execute for a dry-run.',
  )
  process.exit(1)
}

type PullRow = {
  vaultPath: string
  name: string
  bodyVaultForm: string
}

function collectMockRows(): PullRow[] {
  const rows: PullRow[] = []
  for (const node of walkTree(contentTree)) {
    if (node.kind !== 'page' || !node.body) continue
    rows.push(rowFor(node))
  }
  return rows
}

function rowFor(node: ContentNode): PullRow {
  // node.path is slug-form; for vault writeback we want the *name* path
  // (display names with diacritics + spaces), since that's what Obsidian
  // round-trips. The slug→name mapping comes from walking the tree.
  const segments = nameSegments(node)
  const vaultPath = [...segments.slice(0, -1), `${node.name}.md`].join('/')
  return {
    vaultPath,
    name: node.name,
    bodyVaultForm: appToVault(node.body ?? ''),
  }
}

function nameSegments(node: ContentNode): string[] {
  // Walk path slugs and resolve each one back to its node name. Linear in
  // depth; tree is small.
  const slugs = node.path.split('/')
  const names: string[] = []
  let level: ContentNode[] | undefined = contentTree
  for (const slug of slugs) {
    const found: ContentNode | undefined = level?.find((n) => n.slug === slug)
    if (!found) break
    names.push(found.name)
    level = found.children
  }
  return names
}

function main() {
  if (FLAG_EXECUTE) blockExecute()

  console.log(`[pull-vault] dry-run`)
  console.log(`[pull-vault] Supabase not wired yet — enumerating mock content tree as a stand-in.`)
  console.log(`             Stage F will swap this for: select * from wiki.pages where ready_to_sync;`)

  const rows = collectMockRows()
  if (rows.length === 0) {
    console.log(`[pull-vault] 0 rows.`)
    return
  }

  console.log(`[pull-vault] ${rows.length} row(s) would be written:`)
  console.log(`  ${'vault-path'.padEnd(70)} ${'name'.padEnd(28)} hash      bytes`)
  for (const row of rows) {
    console.log(
      `  ${row.vaultPath.padEnd(70)} ${row.name.padEnd(28)} ${contentHash(row.bodyVaultForm)}  ${row.bodyVaultForm.length}`,
    )
  }
  console.log(`[pull-vault] dry-run complete — no files written.`)
}

main()
