import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranscriptStore } from '@/stores/transcript'

/**
 * `/sesje` index — lists recorded sessions from the manifest. Each card links
 * to the provenance viewer for that session's default variant.
 */
export function Sessions() {
  const manifest = useTranscriptStore((s) => s.manifest)
  const status = useTranscriptStore((s) => s.manifestStatus)
  const error = useTranscriptStore((s) => s.error)
  const initManifest = useTranscriptStore((s) => s.initManifest)

  useEffect(() => {
    void initManifest()
  }, [initManifest])

  const sessions = manifest ? Object.entries(manifest.sessions) : []

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <h1 className="font-display text-3xl uppercase tracking-widest text-parchment">
        Transkrypty sesji
      </h1>
      <p className="font-body mt-2 max-w-2xl text-parchment/70">
        Pełne transkrypty nagrań z wielu mikrofonów. Każda linia niesie konkurujące kopie
        z różnych mikrofonów wraz z prawdopodobieństwem atrybucji mówcy — najedź na linię,
        by je zobaczyć.
      </p>

      <Link
        to="/streszczenie-demo"
        className="font-display mt-4 inline-block border border-gold-muted/60 px-3 py-1.5 text-xs uppercase tracking-wider text-gold hover:border-gold hover:bg-gold/10"
      >
        ↪ Streszczenie: Sól w Ranach (z deep-linkami do transkryptu)
      </Link>

      {status === 'loading' && (
        <p className="font-mono mt-8 text-sm text-parchment/50">Ładowanie manifestu…</p>
      )}
      {status === 'error' && (
        <p className="font-mono mt-8 text-sm text-amber-400">Błąd: {error}</p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {sessions.map(([slug, s]) => (
          <Link
            key={slug}
            to={`/sesje/${slug}`}
            className="block border border-gold-muted bg-teal-dark/40 p-5 transition hover:border-gold hover:bg-teal-dark"
          >
            <h2 className="font-display text-2xl uppercase tracking-wider text-gold">{s.label}</h2>
            <p className="font-mono mt-3 text-xs text-parchment/50">
              {s.variants.length} wariant(ów) atrybucji · domyślny:{' '}
              <span className="text-parchment/70">{s.default_variant}</span>
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
