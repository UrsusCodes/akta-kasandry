import { Link, useParams } from 'react-router-dom'
import { findShelf, findBook, findChapter, findPage } from '@/mocks/content'
import type { Crumb } from '@/types'

export function Breadcrumbs() {
  const params = useParams<{
    shelf?: string
    book?: string
    chapter?: string
    page?: string
  }>()

  const crumbs = buildCrumbs(params)
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

function buildCrumbs(params: {
  shelf?: string
  book?: string
  chapter?: string
  page?: string
}): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'Strona główna', to: '/' }]
  const { shelf: shelfSlug, book: bookSlug, chapter: chapterSlug, page: pageSlug } = params

  if (!shelfSlug) return crumbs

  const shelf = findShelf(shelfSlug)
  if (!shelf) return [...crumbs, { label: shelfSlug }]

  crumbs.push({ label: shelf.title, to: bookSlug ? `/s/${shelf.slug}` : undefined })
  if (!bookSlug) return crumbs

  const book = findBook(shelfSlug, bookSlug)
  if (!book) return [...crumbs, { label: bookSlug }]

  const hasMore = !!chapterSlug || !!pageSlug
  crumbs.push({ label: book.title, to: hasMore ? `/s/${shelf.slug}/b/${book.slug}` : undefined })

  if (chapterSlug && pageSlug) {
    const chapter = findChapter(shelfSlug, bookSlug, chapterSlug)
    if (chapter) {
      crumbs.push({
        label: chapter.title,
        to: `/s/${shelf.slug}/b/${book.slug}/c/${chapter.slug}`,
      })
    }
    const page = findPage(shelfSlug, bookSlug, chapterSlug, pageSlug)
    crumbs.push({ label: page?.title ?? pageSlug })
    return crumbs
  }

  if (chapterSlug) {
    const chapter = findChapter(shelfSlug, bookSlug, chapterSlug)
    crumbs.push({ label: chapter?.title ?? chapterSlug })
    return crumbs
  }

  if (pageSlug) {
    const page = findPage(shelfSlug, bookSlug, pageSlug)
    crumbs.push({ label: page?.title ?? pageSlug })
  }

  return crumbs
}
