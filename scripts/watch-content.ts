/**
 * watch-content.ts — auto-refresh the site when the GM's vault changes.
 *
 * Run:
 *   npm run watch-content
 *
 * Watches VAULT_PUBLIC (default `G:\…\PUBLIC`) recursively + the parent
 * directory for changes to EXTRA_ASSETS (e.g. the 1924 Boston map JPG that
 * lives next to PUBLIC). Debounces ~500 ms so a burst of saves coalesces
 * into one regenerate.
 *
 * The generator writes `src/generated/content.ts` and stages attachments;
 * Vite's dev-server HMR picks up the file change and reloads the page. So
 * the workflow is:
 *
 *   terminal A:  npm run dev            # Vite + HMR
 *   terminal B:  npm run watch-content  # this watcher
 *   then edit .md files in Obsidian → page auto-reloads.
 *
 * Uses Node's built-in `fs.watch` with `recursive: true` — works well on
 * Windows (the project's primary platform). On Linux, native fs.watch
 * recursion is limited; if we ever support Linux dev, swap in chokidar.
 */
import { watch } from 'node:fs'
import { dirname, basename, join, sep, relative } from 'node:path'
import { existsSync } from 'node:fs'
import { generateContent, EXTRA_ASSETS } from './lib/generate'

const VAULT = process.env.VAULT_PUBLIC || 'G:/My Drive/OBSIDIAN/RPG/Zew Cthulhu/PUBLIC'
const DEBOUNCE_MS = 500

if (!existsSync(VAULT)) {
  console.error(`[watch-content] vault root not found: ${VAULT}`)
  console.error(`[watch-content] set VAULT_PUBLIC to the absolute path of the PUBLIC folder.`)
  process.exit(1)
}

const vaultParent = dirname(VAULT)
const vaultName = basename(VAULT)

console.log(`[watch-content] watching: ${VAULT}`)
console.log(`[watch-content] plus EXTRA_ASSETS next to it: ${EXTRA_ASSETS.join(', ')}`)
console.log(`[watch-content] debounce: ${DEBOUNCE_MS} ms`)

// Initial generation so the watched state matches disk on startup.
regenerate('startup')

let timer: NodeJS.Timeout | null = null
let pendingReason = ''

function schedule(reason: string) {
  pendingReason = reason
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    regenerate(pendingReason)
  }, DEBOUNCE_MS)
}

function regenerate(reason: string) {
  const start = Date.now()
  try {
    const report = generateContent({ vault: VAULT })
    const ms = Date.now() - start
    console.log(
      `[watch-content] ${new Date().toLocaleTimeString()} regen (${reason}) — ${report.pages} page(s), ${report.attachments} attachment(s), ${ms} ms`,
    )
  } catch (e) {
    console.error(`[watch-content] regen failed: ${(e as Error).message}`)
  }
}

// Watch the parent of PUBLIC so we also see changes to EXTRA_ASSETS that live
// next to PUBLIC. Filter inside the callback.
const watcher = watch(vaultParent, { recursive: true }, (eventType, filename) => {
  if (!filename) return
  const rel = filename.split(sep).join('/')
  // Inside PUBLIC?
  const insideVault = rel === vaultName || rel.startsWith(vaultName + '/')
  // Or one of the named EXTRA_ASSETS sitting next to PUBLIC?
  const isExtra = EXTRA_ASSETS.includes(rel)
  if (!insideVault && !isExtra) return

  // Skip noisy paths even before debounce.
  if (
    rel.includes('/.obsidian/') ||
    rel.endsWith('.tmp') ||
    rel.endsWith('~') ||
    /\.[\w-]+\.swp$/.test(rel)
  ) {
    return
  }

  schedule(`${eventType}: ${relative(vaultParent, join(vaultParent, rel))}`)
})

process.on('SIGINT', () => {
  console.log(`\n[watch-content] stopping.`)
  watcher.close()
  process.exit(0)
})
