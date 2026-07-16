import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SessionGallery } from './SessionGallery'
import type { GalleryManifest } from '@/lib/gallery/manifest'

vi.mock('@/lib/gallery/manifest', async () => {
  const actual = await vi.importActual<typeof import('@/lib/gallery/manifest')>(
    '@/lib/gallery/manifest',
  )
  return { ...actual, loadGalleryManifest: vi.fn() }
})

import { loadGalleryManifest } from '@/lib/gallery/manifest'

const manifest: GalleryManifest = {
  caseKey: 'ug2',
  title: 'Urodzaj Grozy — galeria',
  scenes: [
    { src: '/img/ug2/speakeasy.jpg', caption: 'Speakeasy', alt: 'Speakeasy' },
    { src: '/img/ug2/mcbride.jpg', caption: 'McBride', alt: 'McBride' },
  ],
  cast: [],
  tracks: [],
  links: [],
}

describe('SessionGallery', () => {
  it('renders scene thumbnails, opens the lightbox on click, and Escape closes it', async () => {
    vi.mocked(loadGalleryManifest).mockResolvedValue(manifest)

    render(
      <MemoryRouter>
        <SessionGallery caseKey="ug2" />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(2))

    const thumbs = screen.getAllByRole('img')
    fireEvent.click(thumbs[0].closest('button')!)

    const dialog = await screen.findByRole('dialog')
    const lightboxImg = within(dialog).getByRole('img')
    expect(lightboxImg).toHaveAttribute('src', '/img/ug2/speakeasy.jpg')

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
