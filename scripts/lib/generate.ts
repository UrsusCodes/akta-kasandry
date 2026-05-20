/**
 * Core content-generation logic, shared by:
 * - `scripts/build-content.ts` — one-shot invocation
 * - `scripts/watch-content.ts` — re-runs on vault changes
 *
 * `generateContent({ vault })` walks the vault, writes `src/generated/content.ts`,
 * copies attachments and EXTRA_ASSETS into `public/vault-attachments/by-name/`,
 * and returns a small report.
 */
import {
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  existsSync,
  rmSync,
} from 'node:fs'
import { join, basename, extname, dirname } from 'node:path'
import { slugify } from '../../src/lib/tree'

const EXCLUDE_DIRS = new Set([
  'memory',
  '.obsidian',
  'node_modules',
  '.trash',
  '.git',
  'attachments',
])
const EXCLUDE_SUFFIXES = ['.excalidraw.md']
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'])

// Dirs the image index skips while scanning the whole vault (broader than
// PUBLIC, so Obsidian's vault-root pasted images are found). Excludes the heavy/
// irrelevant trees but — unlike EXCLUDE_DIRS — keeps `attachments/` so tutorial
// screenshots there are still indexed.
const IMAGE_INDEX_SKIP = new Set(['memory', 'node_modules', '.trash', '.git'])

/**
 * Files that live next to PUBLIC but are still needed by the rendered site
 * (e.g. the 13 MB 1924 Boston map JPG, which the GM keeps one folder up so it
 * isn't itself a wiki article). Resolved against `dirname(vault)`.
 */
export const EXTRA_ASSETS = ['boston-map-1924.jpg']

const PROJECT_ROOT = process.cwd()
const OUT_TS = join(PROJECT_ROOT, 'src/generated/content.ts')
const ATTACHMENTS_OUT = join(PROJECT_ROOT, 'public/vault-attachments/by-name')

function shouldInclude(name: string): boolean {
  if (name.startsWith('_') || name.startsWith('.')) return false
  for (const s of EXCLUDE_SUFFIXES) if (name.endsWith(s)) return false
  return true
}

function isDir(p: string): boolean {
  try {
    return statSync(p).isDirectory()
  } catch {
    return false
  }
}

/** Index every image file under VAULT (incl. attachments/) by basename. */
function indexImages(root: string): Map<string, string> {
  const out = new Map<string, string>()
  const stack: string[] = [root]
  while (stack.length) {
    const dir = stack.pop()!
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      continue
    }
    for (const e of entries) {
      // Skip only heavy/irrelevant dirs — DO descend into attachments/ (images
      // live there). .obsidian etc. are caught by the dotfile check.
      if (e.startsWith('.') || IMAGE_INDEX_SKIP.has(e)) continue
      const abs = join(dir, e)
      if (isDir(abs)) {
        stack.push(abs)
      } else if (IMAGE_EXTS.has(extname(e).toLowerCase())) {
        if (!out.has(e)) out.set(e, abs)
      }
    }
  }
  return out
}

type ContentNodeLite = {
  name: string
  slug: string
  path: string
  kind: 'folder' | 'page'
  children?: ContentNodeLite[]
  body?: string
}

function walk(
  dir: string,
  parentPath: string,
  imageIndex: Map<string, string>,
  copiedImages: Set<string>,
): ContentNodeLite[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return []
  }
  // Pure alphabetical (Polish collation) — folders and files interleave so
  // numeric-prefix conventions like "01. Wstęp" / "02. Akcje" sort naturally.
  entries.sort((a, b) => a.localeCompare(b, 'pl'))

  const out: ContentNodeLite[] = []
  for (const entry of entries) {
    if (!shouldInclude(entry) || EXCLUDE_DIRS.has(entry)) continue
    const abs = join(dir, entry)
    if (isDir(abs)) {
      const name = entry
      const slug = slugify(name)
      const path = parentPath ? `${parentPath}/${slug}` : slug
      const children = walk(abs, path, imageIndex, copiedImages)
      out.push({ name, slug, path, kind: 'folder', children })
    } else if (extname(entry) === '.md') {
      const name = basename(entry, '.md')
      const slug = slugify(name)
      const path = parentPath ? `${parentPath}/${slug}` : slug
      let body = readFileSync(abs, 'utf-8')
      body = rewriteImages(body, imageIndex, copiedImages)
      out.push({ name, slug, path, kind: 'page', body })
    }
  }
  return out
}

function rewriteImages(
  markdown: string,
  imageIndex: Map<string, string>,
  copiedImages: Set<string>,
): string {
  const stageByBasename = (name: string): string | null => {
    const base = basename(name).split('|')[0].trim()
    const source = imageIndex.get(base)
    if (!source) return null
    const dest = join(ATTACHMENTS_OUT, base)
    if (!copiedImages.has(base)) {
      mkdirSync(dirname(dest), { recursive: true })
      copyFileSync(source, dest)
      copiedImages.add(base)
    }
    return `/vault-attachments/by-name/${encodeURIComponent(base)}`
  }

  markdown = markdown.replace(/!\[\[([^\]\n]+)\]\]/g, (full, inside: string) => {
    const ext = extname(inside.split('|')[0]).toLowerCase()
    if (!IMAGE_EXTS.has(ext)) return full
    const url = stageByBasename(inside)
    if (!url) return `_(brak: ${inside})_`
    const alt = basename(inside.split('|')[0], ext)
    return `![${alt}](${url})`
  })

  markdown = markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, alt: string, url: string) => {
    if (/^(https?:|data:)/.test(url)) return full
    const replaced = stageByBasename(url)
    if (!replaced) return full
    return `![${alt}](${replaced})`
  })

  // <img src=...> stays raw — rehype-raw on the render side honours
  // width/align/style. Only rewrite src to /vault-attachments/by-name/.
  markdown = markdown.replace(
    /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*)>/g,
    (full, before: string, src: string, after: string) => {
      if (/^(https?:|data:|\/)/.test(src)) return full
      const replaced = stageByBasename(src)
      if (!replaced) return full
      return `<img ${before}src="${replaced}"${after}>`
    },
  )

  return markdown
}

function serializeTree(tree: ContentNodeLite[]): string {
  return JSON.stringify(tree, null, 2)
}

export type GenerateReport = {
  pages: number
  attachments: number
  extraAssetsCopied: string[]
  extraAssetsMissing: string[]
}

export function generateContent({ vault }: { vault: string }): GenerateReport {
  if (!existsSync(vault)) {
    throw new Error(
      `[generate] vault root not found: ${vault}. Set VAULT_PUBLIC to the absolute path of the PUBLIC folder.`,
    )
  }

  if (existsSync(ATTACHMENTS_OUT)) rmSync(ATTACHMENTS_OUT, { recursive: true, force: true })
  mkdirSync(ATTACHMENTS_OUT, { recursive: true })

  // Index images across the WHOLE vault (one level up from PUBLIC), not just
  // PUBLIC — Obsidian dumps pasted images (e.g. "Pasted image ….png") into the
  // vault root by default. Only images actually referenced by a published page
  // get staged, so scanning wider doesn't copy unreferenced vault images.
  const imageIndex = indexImages(dirname(vault))
  const copied = new Set<string>()
  const tree = walk(vault, '', imageIndex, copied)

  let pageCount = 0
  const countPages = (nodes: ContentNodeLite[]) => {
    for (const n of nodes) {
      if (n.kind === 'page') pageCount++
      else if (n.children) countPages(n.children)
    }
  }
  countPages(tree)

  const banner = [
    '// AUTOGENERATED by scripts/build-content.ts — do not edit by hand.',
    `// Generated from: ${vault}`,
    `// ${pageCount} page(s), ${copied.size} attachment(s) staged.`,
    `// Re-run: npm run build-content   (or `,
    `//          npm run watch-content for auto-refresh on vault changes)`,
    '',
    "import type { ContentNode } from '../types'",
    '',
    'export const contentTree: ContentNode[] = ' + serializeTree(tree) + '',
    '',
  ].join('\n')

  mkdirSync(dirname(OUT_TS), { recursive: true })
  writeFileSync(OUT_TS, banner, 'utf-8')

  const extraCopied: string[] = []
  const extraMissing: string[] = []
  const vaultParent = dirname(vault)
  for (const name of EXTRA_ASSETS) {
    const src = join(vaultParent, name)
    if (!existsSync(src)) {
      extraMissing.push(name)
      continue
    }
    copyFileSync(src, join(ATTACHMENTS_OUT, name))
    extraCopied.push(name)
  }

  return {
    pages: pageCount,
    attachments: copied.size,
    extraAssetsCopied: extraCopied,
    extraAssetsMissing: extraMissing,
  }
}

export const OUT_PATH = OUT_TS
