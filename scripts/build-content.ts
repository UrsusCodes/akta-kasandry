/**
 * build-content.ts — snapshot the GM's PUBLIC vault into the app.
 *
 * Run:
 *   npm run build-content                  # uses VAULT_PUBLIC env (defaults to G:\...\PUBLIC)
 *   VAULT_PUBLIC=/path/to/PUBLIC npm run build-content
 *
 * What it does:
 *   - Walks VAULT_PUBLIC recursively (skipping attachments/, memory/, .obsidian/, …)
 *   - Generates `src/generated/content.ts` — a TypeScript module exporting the
 *     full content tree (ContentNode[]) with each page's markdown body inlined
 *     as a string literal.
 *   - Copies every image referenced from a markdown body into
 *     `public/vault-attachments/by-name/<filename>` (flat dir, easier paths).
 *     Rewrites Obsidian-style embeds `![[foo.png]]` and HTML `<img src="attachments/foo.png">`
 *     into `<img src="/vault-attachments/by-name/foo.png">`.
 *
 * The generator is **read-only with respect to VAULT_PUBLIC** — never writes
 * back into the GM's vault. Only writes inside the project repo.
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
import { join, basename, extname, dirname, relative } from 'node:path'
import { slugify } from '../src/lib/tree'

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

const PROJECT_ROOT = process.cwd()
const VAULT = process.env.VAULT_PUBLIC || 'G:/My Drive/OBSIDIAN/RPG/Zew Cthulhu/PUBLIC'
const OUT_TS = join(PROJECT_ROOT, 'src/generated/content.ts')
const ATTACHMENTS_OUT = join(PROJECT_ROOT, 'public/vault-attachments/by-name')

/**
 * Files that live *next to* the PUBLIC folder rather than inside it but are
 * still needed for the rendered site. The interactive Boston map needs the
 * 13 MB 1924 JPG, which the GM keeps one directory up so it isn't published
 * as a wiki article. Resolved relative to dirname(VAULT).
 */
const EXTRA_ASSETS = ['boston-map-1924.jpg']

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

/** Find every image file under VAULT (including attachments/ dirs), index by basename. */
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
      if (e.startsWith('.')) continue
      const abs = join(dir, e)
      if (isDir(abs)) {
        stack.push(abs)
      } else if (IMAGE_EXTS.has(extname(e).toLowerCase())) {
        if (!out.has(e)) out.set(e, abs) // first match wins (Obsidian-ish)
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
  // Deterministic order — folders then files, alphabetical within each.
  entries.sort((a, b) => {
    const aDir = isDir(join(dir, a))
    const bDir = isDir(join(dir, b))
    if (aDir !== bDir) return aDir ? -1 : 1
    return a.localeCompare(b, 'pl')
  })

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

/**
 * Rewrite image references inside a markdown body to point at
 * `/vault-attachments/by-name/<filename>`, copying the source file as a side
 * effect. Handles:
 *   - Obsidian embeds:  ![[foo.png]]   ![[foo.png|alias]]
 *   - Markdown images:  ![alt](attachments/foo.png)  ![alt](relative.png)
 *   - HTML img:         <img src="attachments/foo.png" …>
 * External URLs (http://, https://, data:) are left untouched.
 */
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

  // ![[foo.png]] or ![[foo.png|alias]]
  markdown = markdown.replace(/!\[\[([^\]\n]+)\]\]/g, (full, inside: string) => {
    const ext = extname(inside.split('|')[0]).toLowerCase()
    if (!IMAGE_EXTS.has(ext)) return full
    const url = stageByBasename(inside)
    if (!url) return `_(brak: ${inside})_`
    const alt = basename(inside.split('|')[0], ext)
    return `![${alt}](${url})`
  })

  // ![alt](path) where path is not external
  markdown = markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, alt: string, url: string) => {
    if (/^(https?:|data:)/.test(url)) return full
    const replaced = stageByBasename(url)
    if (!replaced) return full
    return `![${alt}](${replaced})`
  })

  // <img src="path" ...>
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

function serializeTree(tree: ContentNodeLite[], indent = 2): string {
  const pad = (n: number) => ' '.repeat(n)
  const lines: string[] = ['[']
  const recurse = (nodes: ContentNodeLite[], depth: number) => {
    for (const node of nodes) {
      lines.push(`${pad(depth)}{`)
      lines.push(`${pad(depth + 2)}name: ${JSON.stringify(node.name)},`)
      lines.push(`${pad(depth + 2)}slug: ${JSON.stringify(node.slug)},`)
      lines.push(`${pad(depth + 2)}path: ${JSON.stringify(node.path)},`)
      lines.push(`${pad(depth + 2)}kind: ${JSON.stringify(node.kind)},`)
      if (node.kind === 'page') {
        lines.push(`${pad(depth + 2)}body: ${serializeBody(node.body ?? '', depth + 2)},`)
      } else if (node.children && node.children.length > 0) {
        lines.push(`${pad(depth + 2)}children: [`)
        recurse(node.children, depth + 4)
        lines.push(`${pad(depth + 2)}],`)
      } else {
        lines.push(`${pad(depth + 2)}children: [],`)
      }
      lines.push(`${pad(depth)}},`)
    }
  }
  recurse(tree, indent)
  lines.push(']')
  return lines.join('\n')
}

function serializeBody(body: string, baseIndent: number): string {
  // Use a template literal escaping ` and ${
  const escaped = body.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
  // Single-line if short; multi-line otherwise.
  if (escaped.length < 80 && !escaped.includes('\n')) {
    return '`' + escaped + '`'
  }
  return '`' + escaped.replace(/\n/g, '\n' + ' '.repeat(baseIndent + 2)) + '`'
}

function main() {
  if (!existsSync(VAULT)) {
    console.error(`[build-content] vault root not found: ${VAULT}`)
    console.error(`[build-content] set VAULT_PUBLIC to the absolute path of the PUBLIC folder.`)
    process.exit(1)
  }
  console.log(`[build-content] vault root: ${VAULT}`)

  // Clear and recreate the attachments output dir to drop stale files.
  if (existsSync(ATTACHMENTS_OUT)) rmSync(ATTACHMENTS_OUT, { recursive: true, force: true })
  mkdirSync(ATTACHMENTS_OUT, { recursive: true })

  const imageIndex = indexImages(VAULT)
  console.log(`[build-content] indexed ${imageIndex.size} image(s) by basename`)

  const copied = new Set<string>()
  const tree = walk(VAULT, '', imageIndex, copied)

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
    `// Generated from: ${VAULT}`,
    `// ${pageCount} page(s), ${copied.size} attachment(s) staged.`,
    `// Re-run: npm run build-content`,
    '',
    "import type { ContentNode } from '../types'",
    '',
    'export const contentTree: ContentNode[] = ' + serializeTree(tree) + '',
    '',
  ].join('\n')

  mkdirSync(dirname(OUT_TS), { recursive: true })
  writeFileSync(OUT_TS, banner, 'utf-8')

  console.log(`[build-content] wrote ${relative(PROJECT_ROOT, OUT_TS)}`)
  console.log(`[build-content] copied ${copied.size} attachment(s) to public/vault-attachments/by-name/`)
  console.log(`[build-content] ${pageCount} page(s) total`)

  // Copy out-of-band assets (e.g. the 1924 Boston map JPG that lives next to PUBLIC).
  const vaultParent = dirname(VAULT)
  for (const name of EXTRA_ASSETS) {
    const src = join(vaultParent, name)
    if (!existsSync(src)) {
      console.warn(`[build-content] extra asset missing: ${src} — skipping`)
      continue
    }
    const dest = join(ATTACHMENTS_OUT, name)
    copyFileSync(src, dest)
    console.log(`[build-content] copied extra asset: ${name}`)
  }
}

main()
