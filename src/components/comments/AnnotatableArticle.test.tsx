import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnnotatableArticle } from './AnnotatableArticle'
import { useCommentsStore } from '@/stores/comments'

describe('AnnotatableArticle', () => {
  beforeEach(() => useCommentsStore.setState({ comments: [], source: 'mock' }))

  it('renders the markdown content and the comment rail', async () => {
    render(<AnnotatableArticle pageKey="streszczenie/ug2">{'# Tytuł\n\nAkapit z treścią.'}</AnnotatableArticle>)
    expect(await screen.findByRole('heading', { name: 'Tytuł' })).toBeInTheDocument()
    expect(screen.getByText(/Komentarze/)).toBeInTheDocument()
  })
})
