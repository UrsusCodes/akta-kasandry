import { Link, useLocation } from 'react-router-dom'
import { useContentStore } from '@/stores/content'
import { findByPath } from '@/lib/tree'
import { Markdown } from '@/components/Markdown'
import { BostonMap } from '@/components/BostonMap'
import { CharacterPage } from './CharacterPage'
import { MAP_PAGE_PATH, stripLegacyMapEmbed } from '@/lib/specialPages'
import type { ContentNode } from '@/types'

/**
 * `/p/*` catch-all view. Resolves the rest of the URL into a node and:
 * - page node → renders body via Markdown (or custom component if special)
 * - folder node with body → renders body + child index
 * - folder node without body → renders child index only
 * - missing → 404-ish message
 */
export function NodeView() {
  const { pathname } = useLocation()
  const rest = decodeURIComponent(pathname.replace(/^\/p\//, ''))
  const tree = useContentStore((s) => s.tree)
  const node = findByPath(tree, rest)

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
    if (node.character) return <CharacterPage character={node.character} />
    if (node.path === MAP_PAGE_PATH) return <MapArticle node={node} />
    return <Markdown>{node.body ?? ''}</Markdown>
  }

  // A folder whose children are imported characters → render a portrait hub.
  const characterChildren = (node.children ?? []).filter((c) => c.character)
  const isPlayerHub = characterChildren.length > 0

  return (
    <article>
      <header className="mb-6">
        <h1 className="font-display text-4xl uppercase tracking-widest text-parchment">
          {node.name}
        </h1>
        <p className="font-mono mt-2 text-xs text-parchment/60">
          {isPlayerHub
            ? `${characterChildren.length} ${characterChildren.length === 1 ? 'postać' : 'postaci'}`
            : `${node.children?.length ?? 0} element(ów)`}
        </p>
      </header>

      {node.body && (
        <div className="mb-8">
          <Markdown>{node.body}</Markdown>
        </div>
      )}

      {isPlayerHub ? (
        <CharacterHub nodes={characterChildren} />
      ) : (
        <ChildList nodes={node.children ?? []} />
      )}
    </article>
  )
}

/** Portrait grid for a player folder: each card links to a character sheet. */
function CharacterHub({ nodes }: { nodes: ContentNode[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {nodes.map((n) => {
        const portrait = n.character?.portrait_url
        const occupation = n.character?.occupation_id
        return (
          <li key={n.path}>
            <Link
              to={`/p/${n.path}`}
              className="group block border border-gold-muted bg-teal-dark/40 transition hover:border-gold hover:bg-teal-dark"
            >
              <div className="aspect-square w-full overflow-hidden bg-ink">
                {portrait ? (
                  <img
                    src={portrait}
                    alt={n.name}
                    className="h-full w-full object-cover transition group-hover:opacity-90"
                  />
                ) : (
                  <div className="font-display flex h-full w-full items-center justify-center text-4xl uppercase text-gold-muted">
                    {n.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="font-display text-sm uppercase tracking-wider text-gold group-hover:text-parchment">
                  {n.name}
                </div>
                {occupation && (
                  <div className="font-mono mt-0.5 text-xs text-parchment/50">{occupation}</div>
                )}
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function MapArticle({ node }: { node: ContentNode }) {
  // The PUBLIC article carries a hardcoded <a><img src="http://localhost:8081/…"></a>
  // from the BookStack PoC. Strip it so the interactive map slots in cleanly,
  // and let the legend (and any other text) render below.
  const cleaned = stripLegacyMapEmbed(node.body ?? '')
  return (
    <article>
      <header className="mb-6">
        <h1 className="font-display text-4xl uppercase tracking-widest text-parchment">
          {node.name}
        </h1>
      </header>
      <div className="mb-6">
        <BostonMap />
      </div>
      <p className="font-mono mb-6 text-xs text-parchment/60">
        Mapa: OpenStreetMap. Pinezki: kliknij, by zobaczyć popover. Edycja (drag, klik-dodaj,
        prawy klik-usuń) czeka na auth + Supabase pin storage.
      </p>
      <Markdown>{cleaned}</Markdown>
    </article>
  )
}

function ChildList({ nodes }: { nodes: ContentNode[] }) {
  if (nodes.length === 0) {
    return <p className="font-body italic text-parchment/60">Pusty folder.</p>
  }
  // One list, original (alphabetical) order. Folder vs page is signalled by
  // styling, not by grouping into separate sections.
  return (
    <ul className="space-y-1">
      {nodes.map((n) => (
        <li key={n.path}>
          <Link
            to={`/p/${n.path}`}
            className={
              n.kind === 'folder'
                ? 'font-display flex items-baseline gap-2 border-l-2 border-transparent px-3 py-2 text-lg uppercase tracking-wider text-gold transition hover:border-gold hover:bg-teal-dark/40'
                : 'font-body flex items-baseline gap-2 border-l-2 border-transparent px-3 py-1 text-parchment transition hover:border-gold hover:text-gold'
            }
          >
            <span className="w-4 text-gold-muted">{n.kind === 'folder' ? '▸' : '·'}</span>
            <span>{n.name}</span>
            {n.kind === 'folder' && (
              <span className="font-mono ml-2 text-xs text-parchment/40">
                {(n.children?.length ?? 0)}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}
