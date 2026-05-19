import { useParams } from 'react-router-dom'
import { findPage } from '@/mocks/content'
import { Markdown } from '@/components/Markdown'

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

  return <Markdown>{resolved.body}</Markdown>
}
