/**
 * push-vault.ts — Obsidian PUBLIC/ → wiki.pages (Supabase).
 *
 * Run:
 *   npx tsx scripts/push-vault.ts            # dry-run (default)
 *   npx tsx scripts/push-vault.ts --execute  # disabled — schema migration needs
 *                                              user approval first (shared Supabase
 *                                              with coc-creator).
 *
 * Reads VAULT_PUBLIC env var, falls back to ./sample-vault (which may be empty —
 * the script prints "0 pages" rather than crashing).
 *
 * Dry-run prints, for each page that would be upserted:
 *   path  shelf / book / chapter  title  hash  (content length)
 *
 * Cleanup pipeline (mirrors C:\temp\bookstack-test\import.py):
 *   1. collapseAsterisks   — fix broken **** / *** / orphan **
 *   2. stripDuplicateH1    — drop leading `# Title` if it matches filename
 *   3. vaultToApp          — wikilinks `[[Page]]` → `[Page](/s/…/p/…)` resolved
 *                            against current content tree (mock for now; real
 *                            Supabase-backed tree in --execute mode later)
 */
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { walkVault, type VaultPage } from './lib/walk'
import { collapseAsterisks, stripDuplicateH1, contentHash, slugify } from './lib/cleanup'
import { vaultToApp } from '../src/lib/wikilinks'

const FLAG_EXECUTE = process.argv.includes('--execute')

function blockExecute(): never {
  console.error(
    '[push-vault] --execute mode is disabled: schema migration on the shared Supabase project needs explicit user approval (coordinate with coc-creator). Run without --execute for a dry-run.',
  )
  process.exit(1)
}

function pipeline(page: VaultPage): { cleaned: string; hash: string } {
  let body = page.content
  body = collapseAsterisks(body)
  body = stripDuplicateH1(body, page.title)
  body = vaultToApp(body)
  return { cleaned: body, hash: contentHash(body) }
}

function printRow(page: VaultPage, hash: string, len: number) {
  const where = page.chapter
    ? `${slugify(page.shelf)}/${slugify(page.book)}/${slugify(page.chapter)}`
    : `${slugify(page.shelf)}/${slugify(page.book)}`
  console.log(
    `  ${page.pathFromVault.padEnd(60)} ${where.padEnd(40)} ${page.title.padEnd(28)} ${hash}  (${len} chars)`,
  )
}

function main() {
  if (FLAG_EXECUTE) blockExecute()

  const root = resolve(process.env.VAULT_PUBLIC || './sample-vault')
  const exists = existsSync(root)

  console.log(`[push-vault] dry-run`)
  console.log(`[push-vault] vault root: ${root} ${exists ? '' : '(missing — 0 pages)'}`)

  if (!exists) {
    console.log(`[push-vault] 0 pages discovered.`)
    return
  }

  const pages = walkVault(root)
  if (pages.length === 0) {
    console.log(`[push-vault] 0 pages discovered.`)
    return
  }

  console.log(`[push-vault] ${pages.length} page(s) discovered:`)
  console.log(
    `  ${'path-from-vault'.padEnd(60)} ${'shelf/book[/chapter]'.padEnd(40)} ${'title'.padEnd(28)} hash`,
  )
  for (const page of pages) {
    const { cleaned, hash } = pipeline(page)
    printRow(page, hash, cleaned.length)
  }
  console.log(`[push-vault] dry-run complete — no rows upserted.`)
}

main()
