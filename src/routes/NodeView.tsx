import { Link, useLocation } from 'react-router-dom'
import { contentTree } from '@/mocks/content'
import { findByPath } from '@/lib/tree'
import { Markdown } from '@/components/Markdown'
import type { ContentNode } from '@/types'

/**
 * `/p/*` catch-all view. Resolves the rest of the URL into a node and:
 * - page node → renders body via Markdown
 * - folder node with body → renders body + child index
 * - folder node without body → renders child index only
 * - missing → 404-ish message
 */
export function NodeView() {
  const { pathname } = useLocation()
  const rest = decodeURIComponent(pathname.replace(/^\/p\//, ''))
  const node = findByPath(contentTree, rest)

  if (!node) {
    return (
      <article>
        <h1 className="font-display text-4xl uppercase tracking-widest text-parchment">
          Nie znaleziono
        </h1>
        <p className="font-body mt-3 italic text-parchment/80">
          Ścieżka <code className="font-mono">{rest}</code> nie istnieje w wiki.
        </p>
      </article>
    )
  }

  if (node.kind === 'page') {
    return <Markdown>{node.body ?? ''}</Markdown>
  }

  // Folder
  return (
    <article>
      <header className="mb-6">
        <h1 className="font-display text-4xl uppercase tracking-widest text-parchment">
          {node.name}
        </h1>
        <p className="font-mono mt-2 text-xs text-parchment/60">
          {(node.children?.length ?? 0)} element(ów)
        </p>
      </header>

      {node.body && (
        <div className="mb-8">
          <Markdown>{node.body}</Markdown>
        </div>
      )}

      <ChildList nodes={node.children ?? []} />
    </article>
  )
}

function ChildList({ nodes }: { nodes: ContentNode[] }) {
  if (nodes.length === 0) {
    return <p className="font-body italic text-parchment/60">Pusty folder.</p>
  }
  const folders = nodes.filter((n) => n.kind === 'folder')
  const pages = nodes.filter((n) => n.kind === 'page')
  return (
    <div className="space-y-6">
      {folders.length > 0 && (
        <section>
          <h2 className="font-display mb-3 text-xs uppercase tracking-widest text-gold-muted">
            Foldery
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {folders.map((n) => (
              <li key={n.path}>
                <Link
                  to={`/p/${n.path}`}
                  className="block border border-gold-muted bg-teal-dark/40 p-4 transition hover:border-gold hover:bg-teal-dark"
                >
                  <div className="font-display text-lg uppercase tracking-wider text-gold">
                    {n.name}
                  </div>
                  <div className="font-mono mt-1 text-xs text-parchment/50">
                    {(n.children?.length ?? 0)} element(ów)
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pages.length > 0 && (
        <section>
          <h2 className="font-display mb-3 text-xs uppercase tracking-widest text-gold-muted">
            Strony
          </h2>
          <ul className="space-y-1">
            {pages.map((n) => (
              <li key={n.path}>
                <Link
                  to={`/p/${n.path}`}
                  className="font-body block border-l-2 border-transparent px-3 py-1 text-parchment transition hover:border-gold hover:text-gold"
                >
                  {n.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
