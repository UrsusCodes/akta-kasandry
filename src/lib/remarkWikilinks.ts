import type { Plugin } from 'unified'
import { findWikilinks, resolveWikilink } from './wikilinks'

/**
 * Remark plugin: converts `[[Page]]` / `[[Page|alias]]` inside text nodes into
 * link nodes. Operates on the AST (not the raw string), so wikilink syntax
 * inside code blocks / inline code is left untouched.
 *
 * Broken wikilinks (no resolvable target) become emphasis nodes — visually
 * distinct without crashing the render. PageView's CSS can style `em` inside
 * `.prose-cthulhu` to colour them differently if needed.
 *
 * The output `link` nodes carry an `href` that always starts with `/s/` — the
 * Markdown component override in PageView swaps these for react-router `<Link>`.
 *
 * See work note: docs/AktaKasandry_obsidian/work/2026-05-19-wikilink-plugin.md
 */

type AnyNode = {
  type: string
  value?: string
  children?: AnyNode[]
  url?: string
  data?: Record<string, unknown>
}

export const remarkWikilinks: Plugin = () => {
  return (tree) => {
    walk(tree as AnyNode)
  }
}

function walk(node: AnyNode) {
  if (!node.children) return
  // Skip nodes whose children are code — wikilinks inside ``code`` stay literal.
  if (node.type === 'inlineCode' || node.type === 'code') return

  const out: AnyNode[] = []
  for (const child of node.children) {
    if (child.type === 'text' && typeof child.value === 'string') {
      const matches = findWikilinks(child.value)
      if (matches.length === 0) {
        out.push(child)
        continue
      }
      let cursor = 0
      for (const m of matches) {
        if (m.start > cursor) {
          out.push({ type: 'text', value: child.value.slice(cursor, m.start) })
        }
        const label = m.parsed.alias ?? m.parsed.target
        const url = resolveWikilink(m.parsed.target)
        if (url) {
          out.push({
            type: 'link',
            url,
            data: { wikilink: true },
            children: [{ type: 'text', value: label }],
          })
        } else {
          out.push({
            type: 'emphasis',
            data: { wikilinkBroken: true, target: m.parsed.target },
            children: [{ type: 'text', value: label }],
          })
        }
        cursor = m.end
      }
      if (cursor < child.value.length) {
        out.push({ type: 'text', value: child.value.slice(cursor) })
      }
    } else {
      walk(child)
      out.push(child)
    }
  }
  node.children = out
}
