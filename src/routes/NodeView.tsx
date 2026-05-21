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
    const back = <BackButton path={node.path} />
    if (node.character) return <>{back}<CharacterPage character={node.character} /></>
    if (node.path === MAP_PAGE_PATH) return <>{back}<MapArticle node={node} /></>
    return <>{back}<Markdown>{node.body ?? ''}</Markdown></>
  }

  // A folder whose children are imported characters → render a portrait hub.
  const characterChildren = (node.children ?? []).filter((c) => c.character)
  const isPlayerHub = characterChildren.length > 0

  return (
    <article>
      <BackButton path={node.path} />
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
        <ChildGrid nodes={node.children ?? []} />
      )}
    </article>
  )
}

/**
 * Mobile-only back button (md:hidden). Links to the parent folder or to the
 * home page when already at a root-level node.
 */
function BackButton({ path }: { path: string }) {
  const slashIdx = path.lastIndexOf('/')
  const to = slashIdx > 0 ? `/p/${path.slice(0, slashIdx)}` : '/'
  return (
    <Link
      to={to}
      className="mb-4 inline-flex items-center gap-1 border border-gold-muted/50 px-3 py-1.5 font-display text-xs uppercase tracking-wider text-parchment/70 transition hover:border-gold hover:text-gold md:hidden"
    >
      <span>‹</span> Powrót
    </Link>
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

/**
 * Tile-based child grid (replaces ChildList).
 * Single column on mobile, 2 columns on sm+.
 * Folder tiles are visually heavier (gold tint); page tiles are lighter.
 */
function ChildGrid({ nodes }: { nodes: ContentNode[] }) {
  if (nodes.length === 0) {
    return <p className="font-body italic text-parchment/60">Pusty folder.</p>
  }
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {nodes.map((n) => (
        <li key={n.path}>
          <Link
            to={`/p/${n.path}`}
            className={`flex items-center gap-3 border px-4 py-3 transition ${
              n.kind === 'folder'
                ? 'border-gold-muted/60 bg-teal-dark/30 hover:border-gold hover:bg-teal-dark/60'
                : 'border-gold-muted/20 hover:border-gold-muted/50'
            }`}
          >
            <span className="shrink-0 text-gold-muted">{n.kind === 'folder' ? '▸' : '·'}</span>
            <span
              className={`truncate ${
                n.kind === 'folder'
                  ? 'font-display text-sm uppercase tracking-wider text-gold'
                  : 'font-body text-parchment'
              }`}
            >
              {n.name}
            </span>
            {n.kind === 'folder' && (
              <span className="font-mono ml-auto shrink-0 text-xs text-parchment/40">
                {n.children?.length ?? 0}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}
