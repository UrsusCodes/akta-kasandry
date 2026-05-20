/**
 * build-content.ts — snapshot the GM's PUBLIC vault into the app, once.
 *
 * Run:
 *   npm run build-content                  # uses VAULT_PUBLIC env (defaults to G:\…\PUBLIC)
 *   VAULT_PUBLIC=/path/to/PUBLIC npm run build-content
 *
 * Walks the vault read-only, generates `src/generated/content.ts` and stages
 * referenced images + EXTRA_ASSETS into `public/vault-attachments/by-name/`.
 * Implementation lives in `scripts/lib/generate.ts` so the watcher
 * (`watch-content.ts`) can reuse it.
 */
import { relative } from 'node:path'
import { generateContent, OUT_PATH } from './lib/generate'

const PROJECT_ROOT = process.cwd()
const VAULT = process.env.VAULT_PUBLIC || 'G:/My Drive/OBSIDIAN/RPG/Zew Cthulhu/PUBLIC'

console.log(`[build-content] vault root: ${VAULT}`)
try {
  const report = generateContent({ vault: VAULT })
  console.log(`[build-content] wrote ${relative(PROJECT_ROOT, OUT_PATH)}`)
  console.log(`[build-content] ${report.pages} page(s), ${report.attachments} attachment(s) staged`)
  for (const a of report.extraAssetsCopied) console.log(`[build-content] copied extra asset: ${a}`)
  for (const a of report.extraAssetsMissing)
    console.warn(`[build-content] extra asset missing: ${a}`)
} catch (e) {
  console.error(String((e as Error).message))
  process.exit(1)
}
