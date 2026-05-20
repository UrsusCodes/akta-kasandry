/**
 * push-vault.ts — Obsidian vault → wiki.pages (Supabase).
 *
 * Run:
 *   npx tsx scripts/push-vault.ts            # dry-run (default)
 *   npx tsx scripts/push-vault.ts --execute  # disabled — schema migration needs
 *                                              user approval first (shared Supabase
 *                                              with coc-creator).
 *
 * Reads VAULT_PUBLIC env var, falls back to ./sample-vault. Walks at arbitrary
 * depth (Obsidian-style) and prints what would be upserted:
 *   path-from-vault   folder-path   name   hash   (bytes)
 *
 * Cleanup pipeline:
 *   1. collapseAsterisks   — fix broken **** / *** / orphan **
 *   2. stripDuplicateH1    — drop leading `# Title` if it matches filename
 *   3. vaultToApp          — wikilinks `[[Page]]` / `[[Folder/Page]]` → `[…](/p/…)`
 */
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { walkVault, type VaultPage } from './lib/walk'
import { collapseAsterisks, stripDuplicateH1, contentHash } from './lib/cleanup'
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
  body = stripDuplicateH1(body, page.name)
  body = vaultToApp(body)
  return { cleaned: body, hash: contentHash(body) }
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
    `  ${'path-from-vault'.padEnd(60)} ${'folder-path'.padEnd(40)} ${'name'.padEnd(28)} hash      bytes`,
  )
  for (const page of pages) {
    const { cleaned, hash } = pipeline(page)
    console.log(
      `  ${page.pathFromVault.padEnd(60)} ${(page.folderPath || '(root)').padEnd(40)} ${page.name.padEnd(28)} ${hash}  ${cleaned.length}`,
    )
  }
  console.log(`[push-vault] dry-run complete — no rows upserted.`)
}

main()
