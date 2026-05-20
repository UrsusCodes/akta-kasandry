import type { ContentNode } from '../types'

/**
 * Slugify: lowercase, drop Polish diacritics, non-alphanumerics → dashes.
 * Matches scripts/lib/cleanup.ts#slugify so push/render agree on URLs.
 */
export function slugify(text: string): string {
  const nfkd = text.normalize('NFKD').replace(/[̀-ͯ]/g, '')
  const ascii = nfkd
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .toLowerCase()
  const slug = ascii.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return slug || 'node'
}

/** Walk the tree depth-first, yielding every node. */
export function walkTree(tree: ContentNode[]): ContentNode[] {
  const out: ContentNode[] = []
  for (const node of tree) {
    out.push(node)
    if (node.children) out.push(...walkTree(node.children))
  }
  return out
}

/** Resolve a path (slash-joined slugs) to a node, or null. */
export function findByPath(tree: ContentNode[], path: string): ContentNode | null {
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0) return null
  let level: ContentNode[] | undefined = tree
  let found: ContentNode | null = null
  for (const seg of segments) {
    if (!level) return null
    const next: ContentNode | undefined = level.find((n) => n.slug === seg)
    if (!next) return null
    found = next
    level = next.children
  }
  return found
}

/**
 * Resolve a wikilink target to a node. Two forms:
 * - `Folder/Sub/Page` (path-form, segments separated by `/`) — match by name
 *   following the path; allows disambiguating duplicate page names.
 * - `Page` (leaf-form) — search the whole tree for any node whose name matches,
 *   case-insensitive. First match wins; deterministic via tree order.
 */
export function findByWikilinkTarget(
  tree: ContentNode[],
  target: string,
): ContentNode | null {
  const t = target.trim()
  if (t.includes('/')) {
    const segs = t.split('/').map((s) => s.trim().toLowerCase())
    let level: ContentNode[] | undefined = tree
    let found: ContentNode | null = null
    for (const s of segs) {
      if (!level) return null
      const next: ContentNode | undefined = level.find((n) => n.name.toLowerCase() === s)
      if (!next) return null
      found = next
      level = next.children
    }
    return found
  }
  const needle = t.toLowerCase()
  for (const node of walkTree(tree)) {
    if (node.name.toLowerCase() === needle) return node
  }
  return null
}

/**
 * Build a ContentNode from a literal tree-by-name + map of bodies. Used by mock
 * content to keep the source ergonomic — you write `{ "Folder": { "Page.md": "…body…" }}`
 * and the slugs/paths get computed.
 */
type RawTree = { [name: string]: string | RawTree }

export function buildTree(raw: RawTree, parentPath = ''): ContentNode[] {
  const out: ContentNode[] = []
  for (const [name, value] of Object.entries(raw)) {
    const isPage = typeof value === 'string'
    const displayName = isPage && name.endsWith('.md') ? name.slice(0, -3) : name
    const slug = slugify(displayName)
    const path = parentPath ? `${parentPath}/${slug}` : slug
    if (isPage) {
      out.push({ name: displayName, slug, path, kind: 'page', body: value })
    } else {
      out.push({
        name: displayName,
        slug,
        path,
        kind: 'folder',
        children: buildTree(value as RawTree, path),
      })
    }
  }
  return out
}
