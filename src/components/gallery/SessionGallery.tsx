import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadGalleryManifest, type GalleryManifest } from '@/lib/gallery/manifest'
import { withBase } from '@/lib/withBase'
import { Lightbox } from './Lightbox'

type Status = 'loading' | 'ready' | 'error'

type Props = {
  /** Which case's manifest to load, e.g. "ug2" → `public/gallery/ug2.json`. */
  caseKey: string
}

/**
 * Data-driven session gallery: scene illustrations, cast portraits, and music
 * tracks for one case, loaded from `public/gallery/<caseKey>.json` (see
 * `src/lib/gallery/manifest.ts`). Scene thumbnails open the in-house
 * `Lightbox`. Rendered inline in the content tree (see `NodeView`'s
 * `INLINE_PAGES`), so it manages its own `<article>` wrapper.
 */
export function SessionGallery({ caseKey }: Props) {
  const [status, setStatus] = useState<Status>('loading')
  const [manifest, setManifest] = useState<GalleryManifest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setManifest(null)
    setLightboxIndex(null)
    loadGalleryManifest(caseKey)
      .then((m) => {
        if (cancelled) return
        setManifest(m)
        setStatus('ready')
      })
      .catch((e: Error) => {
        if (cancelled) return
        setError(e.message)
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [caseKey])

  if (status === 'loading') {
    return (
      <article>
        <p className="font-body italic text-parchment/70">Wczytywanie galerii…</p>
      </article>
    )
  }

  if (status === 'error' || !manifest) {
    return (
      <article>
        <h1 className="font-display text-4xl uppercase tracking-widest text-parchment">
          Galeria
        </h1>
        <p className="font-body mt-3 text-parchment/80">
          Nie udało się wczytać galerii{error ? `: ${error}` : '.'}
        </p>
      </article>
    )
  }

  return (
    <article>
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl uppercase tracking-widest text-parchment">
          {manifest.title}
        </h1>
        {manifest.links.length > 0 && (
          <nav className="flex flex-wrap gap-2">
            {manifest.links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="border border-gold-muted/50 px-3 py-1.5 font-display text-xs uppercase tracking-wider text-parchment/70 transition hover:border-gold hover:text-gold"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {manifest.scenes.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display mb-4 border-b border-gold-muted/40 pb-1 text-2xl uppercase tracking-wider text-gold">
            Sceny
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {manifest.scenes.map((scene, i) => (
              <li key={scene.src}>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="group block w-full overflow-hidden border border-gold-muted bg-teal-dark/40 text-left transition hover:border-gold"
                >
                  <img
                    src={withBase(scene.src)}
                    alt={scene.alt ?? scene.caption ?? ''}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition group-hover:opacity-90"
                  />
                  {scene.caption && (
                    <span className="font-body block px-2 py-1.5 text-xs italic text-parchment/70">
                      {scene.caption}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {manifest.cast.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display mb-4 border-b border-gold-muted/40 pb-1 text-2xl uppercase tracking-wider text-gold">
            Obsada
          </h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {manifest.cast.map((p) => (
              <li
                key={p.src}
                className="border border-gold-muted bg-teal-dark/40"
              >
                <div className="aspect-square w-full overflow-hidden bg-ink">
                  <img
                    src={withBase(p.src)}
                    alt={p.character}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <div className="font-display text-sm uppercase tracking-wider text-gold">
                    {p.character}
                  </div>
                  {p.player && (
                    <div className="font-mono mt-0.5 text-xs text-parchment/50">{p.player}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {manifest.tracks.length > 0 && (
        <section>
          <h2 className="font-display mb-4 border-b border-gold-muted/40 pb-1 text-2xl uppercase tracking-wider text-gold">
            Muzyka
          </h2>
          <ul className="font-body space-y-1 text-parchment/80">
            {manifest.tracks.map((t) => (
              <li key={t.src} className="flex items-center gap-2">
                <span className="text-gold-muted">♪</span> {t.title}
              </li>
            ))}
          </ul>
          <p className="font-mono mt-2 text-xs text-parchment/50">
            Odtwarzanie muzyki: w prezentacji filmowej sesji.
          </p>
        </section>
      )}

      <Lightbox
        images={manifest.scenes}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndex={setLightboxIndex}
      />
    </article>
  )
}
