import { shelves } from '@/mocks/content'
import type { Shelf } from '@/types'

/**
 * Wikilink parser + resolver.
 *
 * Shared between the renderer (B3 — markdown plugin) and the sync scripts
 * (C1/C2 — push/pull). Source of truth for how `[[Page]]` and `[[Page|alias]]`
 * map to internal URLs and how vault-form ↔ app-form conversion works.
 *
 * Wikilinks in the vault reference page **titles** (Obsidian convention),
 * not slugs. The resolver walks the content tree by title.
 */

export type ParsedWikilink = {
  raw: string
  target: string
  alias?: string
}

/**
 * Parse a single wikilink expression (content *inside* the `[[...]]` brackets).
 * `target` is the part before `|`, `alias` the part after (if any).
 */
export function parseWikilink(inside: string): ParsedWikilink {
  const pipe = inside.indexOf('|')
  if (pipe === -1) return { raw: inside, target: inside.trim() }
  return {
    raw: inside,
    target: inside.slice(0, pipe).trim(),
    alias: inside.slice(pipe + 1).trim(),
  }
}

/**
 * Find every `[[...]]` inside a text string. Used by the remark plugin.
 * Returns matches in order with their character ranges so the plugin can
 * splice them into the AST cleanly.
 */
export type WikilinkMatch = {
  start: number
  end: number
  parsed: ParsedWikilink
}

const WIKILINK_RE = /\[\[([^\]\n]+)\]\]/g

export function findWikilinks(text: string): WikilinkMatch[] {
  const matches: WikilinkMatch[] = []
  let m: RegExpExecArray | null
  WIKILINK_RE.lastIndex = 0
  while ((m = WIKILINK_RE.exec(text)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, parsed: parseWikilink(m[1]) })
  }
  return matches
}

/**
 * Resolve a wikilink target (a page title) to an internal URL by walking the
 * content tree. Returns `null` when no page matches — the renderer should
 * render a styled "broken link" in that case.
 *
 * `tree` defaults to the mock shelves. C1/C2 will pass in the live tree from
 * Supabase or filesystem; the resolution logic stays identical.
 */
export function resolveWikilink(target: string, tree: Shelf[] = shelves): string | null {
  const needle = target.trim().toLowerCase()
  for (const shelf of tree) {
    for (const book of shelf.books) {
      for (const page of book.pages ?? []) {
        if (page.title.toLowerCase() === needle) {
          return `/s/${shelf.slug}/b/${book.slug}/p/${page.slug}`
        }
      }
      for (const chapter of book.chapters ?? []) {
        for (const page of chapter.pages) {
          if (page.title.toLowerCase() === needle) {
            return `/s/${shelf.slug}/b/${book.slug}/c/${chapter.slug}/p/${page.slug}`
          }
        }
      }
    }
  }
  return null
}

/**
 * Vault-form to app-form conversion (push-time). Replaces every `[[Target|alias]]`
 * with a standard markdown link. Used by the push script before upsert.
 *
 * Broken wikilinks (target not resolvable) are left as plain text wrapped in
 * single brackets — visible to the GM as something to fix.
 */
export function vaultToApp(markdown: string, tree: Shelf[] = shelves): string {
  return markdown.replace(WIKILINK_RE, (_, inside: string) => {
    const { target, alias } = parseWikilink(inside)
    const url = resolveWikilink(target, tree)
    const label = alias ?? target
    if (!url) return `[${label}]`
    return `[${label}](${url})`
  })
}

/**
 * App-form to vault-form conversion (pull-time). Walks the tree to find the
 * page whose URL matches the link target, then rewrites as `[[Title|alias]]`.
 * Pull script uses this before writing back to the filesystem.
 *
 * Internal markdown links (`[label](/s/...)`) become `[[Title]]` or
 * `[[Title|label]]` if label differs from the page title.
 */
const INTERNAL_LINK_RE = /\[([^\]]+)\]\((\/s\/[^)]+)\)/g

export function appToVault(markdown: string, tree: Shelf[] = shelves): string {
  return markdown.replace(INTERNAL_LINK_RE, (full, label: string, url: string) => {
    const title = findTitleByUrl(url, tree)
    if (!title) return full
    if (label.trim() === title) return `[[${title}]]`
    return `[[${title}|${label}]]`
  })
}

function findTitleByUrl(url: string, tree: Shelf[]): string | null {
  for (const shelf of tree) {
    for (const book of shelf.books) {
      for (const page of book.pages ?? []) {
        if (url === `/s/${shelf.slug}/b/${book.slug}/p/${page.slug}`) return page.title
      }
      for (const chapter of book.chapters ?? []) {
        for (const page of chapter.pages) {
          if (url === `/s/${shelf.slug}/b/${book.slug}/c/${chapter.slug}/p/${page.slug}`)
            return page.title
        }
      }
    }
  }
  return null
}
