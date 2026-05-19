import { Link, useParams } from 'react-router-dom'
import { findShelf, findBook } from '@/mocks/content'

export function BookView() {
  const { shelf: shelfSlug, book: bookSlug } = useParams<{ shelf: string; book: string }>()
  const shelf = shelfSlug ? findShelf(shelfSlug) : undefined
  const book = shelfSlug && bookSlug ? findBook(shelfSlug, bookSlug) : undefined

  if (!shelf || !book) {
    return <p className="font-body text-parchment">Księga nie istnieje.</p>
  }

  const hasChapters = !!book.chapters && book.chapters.length > 0
  const hasFlatPages = !!book.pages && book.pages.length > 0

  return (
    <article>
      <h1 className="font-display text-4xl uppercase tracking-widest text-parchment">
        {book.title}
      </h1>
      {book.description && (
        <p className="font-body mt-3 text-lg italic text-parchment/80">{book.description}</p>
      )}

      {hasChapters && (
        <section className="mt-6">
          <h2 className="font-display text-xs uppercase tracking-widest text-gold-muted">
            Rozdziały
          </h2>
          <ul className="mt-3 space-y-3">
            {book.chapters!.map((chapter) => (
              <li key={chapter.slug}>
                <Link
                  to={`/s/${shelf.slug}/b/${book.slug}/c/${chapter.slug}`}
                  className="block border border-gold-muted bg-teal-dark/40 p-4 transition hover:border-gold hover:bg-teal-dark"
                >
                  <h3 className="font-display text-lg uppercase tracking-wider text-gold">
                    {chapter.title}
                  </h3>
                  <p className="font-mono mt-1 text-xs text-parchment/50">
                    {chapter.pages.length} {chapter.pages.length === 1 ? 'strona' : 'stron'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasFlatPages && (
        <section className="mt-6">
          <h2 className="font-display text-xs uppercase tracking-widest text-gold-muted">
            Strony
          </h2>
          <ul className="mt-3 space-y-2">
            {book.pages!.map((page) => (
              <li key={page.slug}>
                <Link
                  to={`/s/${shelf.slug}/b/${book.slug}/p/${page.slug}`}
                  className="font-body block border-l-2 border-transparent px-3 py-1 text-parchment transition hover:border-gold hover:text-gold"
                >
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
