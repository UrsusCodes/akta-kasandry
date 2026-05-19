import { Link, useParams } from 'react-router-dom'
import { findShelf, findBook, findChapter } from '@/mocks/content'

export function ChapterView() {
  const { shelf: shelfSlug, book: bookSlug, chapter: chapterSlug } = useParams<{
    shelf: string
    book: string
    chapter: string
  }>()
  const shelf = shelfSlug ? findShelf(shelfSlug) : undefined
  const book = shelfSlug && bookSlug ? findBook(shelfSlug, bookSlug) : undefined
  const chapter =
    shelfSlug && bookSlug && chapterSlug
      ? findChapter(shelfSlug, bookSlug, chapterSlug)
      : undefined

  if (!shelf || !book || !chapter) {
    return <p className="font-body text-parchment">Rozdział nie istnieje.</p>
  }

  return (
    <article>
      <h1 className="font-display text-4xl uppercase tracking-widest text-parchment">
        {chapter.title}
      </h1>

      <ul className="mt-6 space-y-2">
        {chapter.pages.map((page) => (
          <li key={page.slug}>
            <Link
              to={`/s/${shelf.slug}/b/${book.slug}/c/${chapter.slug}/p/${page.slug}`}
              className="font-body block border-l-2 border-transparent px-3 py-2 text-lg text-parchment transition hover:border-gold hover:text-gold"
            >
              {page.title}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  )
}
