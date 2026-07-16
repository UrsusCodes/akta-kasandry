import { useEffect } from 'react'
import type { GalleryImage } from '@/lib/gallery/manifest'
import { withBase } from '@/lib/withBase'

type Props = {
  images: GalleryImage[]
  /** Currently-open image index, or `null` when closed. */
  index: number | null
  onClose: () => void
  onIndex: (index: number) => void
}

/**
 * In-house click-to-zoom overlay for `SessionGallery`'s scene grid. No
 * dependency — a fixed-position overlay + keyboard handlers on top of the
 * existing stack. Renders nothing when `index` is `null`. Navigation clamps
 * at the first/last image (does not wrap).
 */
export function Lightbox({ images, index, onClose, onIndex }: Props) {
  const isOpen = index !== null

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onIndex(Math.max(0, (index as number) - 1))
      else if (e.key === 'ArrowRight') onIndex(Math.min(images.length - 1, (index as number) + 1))
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, index, images.length])

  if (!isOpen || index === null) return null

  const image = images[index]
  if (!image) return null

  const atFirst = index === 0
  const atLast = index === images.length - 1

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={image.caption ?? image.alt ?? 'Podgląd obrazu'}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Zamknij"
        className="font-display absolute right-4 top-4 text-3xl text-parchment/80 transition hover:text-gold"
      >
        ✕
      </button>

      {!atFirst && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onIndex(index - 1)
          }}
          aria-label="Poprzedni obraz"
          className="font-display absolute left-2 top-1/2 -translate-y-1/2 px-3 py-6 text-4xl text-parchment/70 transition hover:text-gold sm:left-4"
        >
          ‹
        </button>
      )}
      {!atLast && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onIndex(index + 1)
          }}
          aria-label="Następny obraz"
          className="font-display absolute right-2 top-1/2 -translate-y-1/2 px-3 py-6 text-4xl text-parchment/70 transition hover:text-gold sm:right-4"
        >
          ›
        </button>
      )}

      <div
        className="flex max-h-full max-w-full flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={withBase(image.src)}
          alt={image.alt ?? image.caption ?? ''}
          className="max-h-[80vh] max-w-[90vw] object-contain"
        />
        {image.caption && (
          <p className="font-body max-w-[90vw] text-center italic text-parchment/80">
            {image.caption}
          </p>
        )}
      </div>
    </div>
  )
}
