import { Link, useLocation } from 'react-router-dom'
import { contentTree } from '@/content'
import { findByPath } from '@/lib/tree'
import type { Crumb, ContentNode } from '@/types'

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const crumbs = buildCrumbs(pathname)
  if (crumbs.length === 0) return null

  return (
    <nav
      aria-label="breadcrumbs"
      className="font-display mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-gold-muted/40 pb-3 text-sm uppercase tracking-wider text-parchment"
    >
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-gold-muted">›</span>}
          {c.to ? (
            <Link to={c.to} className="hover:text-gold">
              {c.label}
            </Link>
          ) : (
            <span className="text-gold">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

function buildCrumbs(pathname: string): Crumb[] {
  const out: Crumb[] = [{ label: 'Strona główna', to: '/' }]

  if (pathname === '/' || pathname === '') return out

  if (pathname.startsWith('/map')) {
    out.push({ label: 'Mapa' })
    return out
  }
  if (pathname.startsWith('/draft')) {
    out.push({ label: 'Draft' })
    return out
  }

  if (!pathname.startsWith('/p/')) return out

  const rest = decodeURIComponent(pathname.slice(3))
  const segments = rest.split('/').filter(Boolean)
  let accumulated = ''
  let level: ContentNode[] | undefined = contentTree
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    accumulated = accumulated ? `${accumulated}/${seg}` : seg
    const node: ContentNode | undefined = level?.find((n) => n.slug === seg)
    const label = node ? node.name : seg
    const isLast = i === segments.length - 1
    out.push({ label, to: isLast ? undefined : `/p/${accumulated}` })
    // Fallback if node-lookup fails partway — use findByPath for safety.
    level = node?.children ?? findByPath(contentTree, accumulated)?.children
  }
  return out
}
