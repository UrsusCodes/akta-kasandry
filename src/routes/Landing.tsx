import { Link } from 'react-router-dom'
import { useContentStore } from '@/stores/content'
import type { ContentNode } from '@/types'

export function Landing() {
  const tree = useContentStore((s) => s.tree)
  return (
    <article>
      <h1 className="font-display text-4xl uppercase tracking-widest text-parchment">
        Akta Kasandry
      </h1>
      <p className="font-body mt-3 text-lg italic text-parchment/80">
        Wiki kampanii <em>Rozdarte Sumienie</em>. Wybierz folder z drzewa po lewej albo skocz do jednego z głównych poniżej.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {tree.map((node) => (
          <Card key={node.path} node={node} />
        ))}
      </div>
    </article>
  )
}

function Card({ node }: { node: ContentNode }) {
  const count = node.children?.length ?? 0
  return (
    <Link
      to={`/p/${node.path}`}
      className="block border border-gold-muted bg-teal-dark/40 p-5 transition hover:border-gold hover:bg-teal-dark"
    >
      <h2 className="font-display text-2xl uppercase tracking-wider text-gold">{node.name}</h2>
      <p className="font-mono mt-3 text-xs text-parchment/50">
        {node.kind === 'folder' ? `${count} element(ów)` : 'strona'}
      </p>
    </Link>
  )
}
