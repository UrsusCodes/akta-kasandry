import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import { shortHash, normalizeText } from './comments/anchor'

const BLOCK_TYPES = new Set(['paragraph', 'heading', 'listItem', 'blockquote', 'tableRow'])

/**
 * Attach `data-block-id` (a hash of the block's normalized text) to each block
 * node so comments can anchor to it. Inert unless the annotation layer reads
 * it. Added to the shared Markdown pipeline. `unist-util-visit` and
 * `mdast-util-to-string` are transitive deps of react-markdown (verified
 * resolvable); no new top-level dependency.
 */
export function remarkBlockIds() {
  return (tree: unknown) => {
    visit(tree as never, (node: any) => {
      if (!BLOCK_TYPES.has(node.type)) return
      const text = normalizeText(toString(node))
      if (!text) return
      node.data = node.data || {}
      node.data.hProperties = node.data.hProperties || {}
      node.data.hProperties['data-block-id'] = shortHash(text)
    })
  }
}
