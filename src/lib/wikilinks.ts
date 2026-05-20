import { contentTree } from '../mocks/content'
import { findByWikilinkTarget } from './tree'
import type { ContentNode } from '../types'

/**
 * Wikilink parser + resolver, recursive-tree edition.
 *
 * Shared between the renderer (B3 — markdown plugin) and the sync scripts
 * (C1/C2 — push/pull). Source of truth for how `[[Page]]` / `[[Folder/Page]]` /
 * `[[X|alias]]` map to internal URLs and how vault-form ↔ app-form conversion
 * works.
 *
 * Targets are resolved by **node name** (Obsidian convention). A target with
 * a `/` is treated as a path through the tree; a bare target searches the
 * whole tree by leaf name (first match wins, deterministic via tree order).
 */

export type ParsedWikilink = {
  raw: string
  target: string
  alias?: string
}

export function parseWikilink(inside: string): ParsedWikilink {
  const pipe = inside.indexOf('|')
  if (pipe === -1) return { raw: inside, target: inside.trim() }
  return {
    raw: inside,
    target: inside.slice(0, pipe).trim(),
    alias: inside.slice(pipe + 1).trim(),
  }
}

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
 * Resolve a wikilink target to an internal URL. Returns null when no node
 * matches — caller renders a broken-link styled placeholder.
 */
export function resolveWikilink(
  target: string,
  tree: ContentNode[] = contentTree,
): string | null {
  const node = findByWikilinkTarget(tree, target)
  if (!node) return null
  return `/p/${node.path}`
}

/**
 * Vault-form → app-form (push). Replaces every `[[Target|alias]]` with a
 * standard markdown link. Broken targets are left as plain text in single
 * brackets so the GM can see what needs fixing.
 */
export function vaultToApp(markdown: string, tree: ContentNode[] = contentTree): string {
  return markdown.replace(WIKILINK_RE, (_, inside: string) => {
    const { target, alias } = parseWikilink(inside)
    const url = resolveWikilink(target, tree)
    const label = alias ?? target
    if (!url) return `[${label}]`
    return `[${label}](${url})`
  })
}

/**
 * App-form → vault-form (pull). Walks the tree to find the node whose URL
 * matches the link target, then rewrites as `[[Name]]` or `[[Name|alias]]`.
 */
const INTERNAL_LINK_RE = /\[([^\]]+)\]\((\/p\/[^)]+)\)/g

export function appToVault(markdown: string, tree: ContentNode[] = contentTree): string {
  return markdown.replace(INTERNAL_LINK_RE, (full, label: string, url: string) => {
    const name = findNameByUrl(url, tree)
    if (!name) return full
    if (label.trim() === name) return `[[${name}]]`
    return `[[${name}|${label}]]`
  })
}

function findNameByUrl(url: string, tree: ContentNode[]): string | null {
  const wanted = url.startsWith('/p/') ? url.slice(3) : url
  const stack: ContentNode[] = [...tree]
  while (stack.length) {
    const node = stack.pop()!
    if (node.path === wanted) return node.name
    if (node.children) stack.push(...node.children)
  }
  return null
}
