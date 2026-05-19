import { useParams } from 'react-router-dom'
import { findPage } from '@/mocks/content'

export function PageView() {
  const { shelf, book, chapter, page } = useParams<{
    shelf: string
    book: string
    chapter?: string
    page: string
  }>()

  if (!shelf || !book || !page) {
    return <p className="font-body text-parchment">Brak strony.</p>
  }

  const resolved = chapter ? findPage(shelf, book, chapter, page) : findPage(shelf, book, page)

  if (!resolved) {
    return <p className="font-body text-parchment">Strona nie istnieje.</p>
  }

  // B3 will swap this <pre> for the markdown renderer.
  return (
    <article className="prose-cthulhu bg-parchment p-8">
      <pre className="font-mono whitespace-pre-wrap text-sm">{resolved.body}</pre>
    </article>
  )
}
