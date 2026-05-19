import { Link } from 'react-router-dom'
import { shelves } from '@/mocks/content'

export function Landing() {
  return (
    <article>
      <h1 className="font-display text-4xl uppercase tracking-widest text-parchment">
        Strona główna
      </h1>
      <p className="font-body mt-3 text-lg italic text-parchment/80">
        Wiki dla kampanii <em>Rozdarte Sumienie</em>. Wybierz półkę z lewej kolumny albo poniżej.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {shelves.map((shelf) => (
          <Link
            key={shelf.slug}
            to={`/s/${shelf.slug}`}
            className="block border border-gold-muted bg-teal-dark/40 p-5 transition hover:border-gold hover:bg-teal-dark"
          >
            <h2 className="font-display text-2xl uppercase tracking-wider text-gold">
              {shelf.title}
            </h2>
            {shelf.description && (
              <p className="font-body mt-2 text-parchment/80">{shelf.description}</p>
            )}
            <p className="font-mono mt-3 text-xs text-parchment/50">
              {shelf.books.length} {shelf.books.length === 1 ? 'księga' : 'ksiąg'}
            </p>
          </Link>
        ))}
      </div>
    </article>
  )
}
