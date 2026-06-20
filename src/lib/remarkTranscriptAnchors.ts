import type { Plugin } from 'unified'

/**
 * Remark plugin: turns a transcript-anchor token into a deep-link "marker" into
 * the `/sesje` viewer. Authoring syntax (placed at the end of a summary
 * paragraph/section):
 *
 *   {sesja:<slug>#<utteranceId>}            → link one line
 *   {sesja:<slug>#<idFrom>..<idTo>}         → link a range of lines
 *
 * Renders as a link to `/sesje/<slug>?u=<id>` (or `u=<from>..<to>`) carrying the
 * `tv-anchor` class so the Markdown skin styles it as a pill. The viewer reads
 * `?u=` and scrolls to / highlights / pins the matching utterance(s).
 *
 * `id`s are utterance ids on the session's DEFAULT (production) variant — they
 * are variant-specific, so the viewer resolves them against the default overlay.
 *
 * Like remarkWikilinks, this walks text nodes only, so a token inside a code
 * span stays literal. The label is fixed ("↪ transkrypt"); the surrounding
 * prose carries the meaning, the marker just jumps to the source.
 */

type AnyNode = {
  type: string
  value?: string
  children?: AnyNode[]
  url?: string
  data?: Record<string, unknown>
}

// {sesja:slug#hexid} or {sesja:slug#hexid..hexid}
const TOKEN = /\{sesja:([a-z0-9][a-z0-9-]*)#([a-f0-9]+)(?:\.\.([a-f0-9]+))?\}/g

export const remarkTranscriptAnchors: Plugin = () => {
  return (tree) => {
    walk(tree as AnyNode)
  }
}

function walk(node: AnyNode) {
  if (!node.children) return
  if (node.type === 'inlineCode' || node.type === 'code') return

  const out: AnyNode[] = []
  for (const child of node.children) {
    if (child.type === 'text' && typeof child.value === 'string' && child.value.includes('{sesja:')) {
      const text = child.value
      let cursor = 0
      TOKEN.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = TOKEN.exec(text)) !== null) {
        if (m.index > cursor) out.push({ type: 'text', value: text.slice(cursor, m.index) })
        const slug = m[1]
        const u = m[3] ? `${m[2]}..${m[3]}` : m[2]
        out.push({
          type: 'link',
          url: `/sesje/${slug}?u=${u}`,
          data: { hProperties: { className: 'tv-anchor' } },
          children: [{ type: 'text', value: '↪ transkrypt' }],
        })
        cursor = m.index + m[0].length
      }
      if (cursor < text.length) out.push({ type: 'text', value: text.slice(cursor) })
      if (cursor === 0) out.push(child) // no token actually matched
    } else {
      walk(child)
      out.push(child)
    }
  }
  node.children = out
}
