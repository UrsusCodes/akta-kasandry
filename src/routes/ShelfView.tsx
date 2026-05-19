import { Link, useParams } from 'react-router-dom'
import { findShelf } from '@/mocks/content'

export function ShelfView() {
  const { shelf: shelfSlug } = useParams<{ shelf: string }>()
  const shelf = shelfSlug ? findShelf(shelfSlug) : undefined

  if (!shelf) {
    return <p className="font-body text-parchment">Półka nie istnieje.</p>
  }

  return (
    <article>
      <h1 className="font-display text-4xl uppercase tracking-widest text-parchment">
        {shelf.title}
      </h1>
      {shelf.description && (
        <p className="font-body mt-3 text-lg italic text-parchment/80">{shelf.description}</p>
      )}

      <ul className="mt-6 space-y-3">
        {shelf.books.map((book) => (
          <li key={book.slug}>
            <Link
              to={`/s/${shelf.slug}/b/${book.slug}`}
              className="block border border-gold-muted bg-teal-dark/40 p-4 transition hover:border-gold hover:bg-teal-dark"
            >
              <h2 className="font-display text-xl uppercase tracking-wider text-gold">
                {book.title}
              </h2>
              {book.description && (
                <p className="font-body mt-1 text-parchment/80">{book.description}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  )
}
