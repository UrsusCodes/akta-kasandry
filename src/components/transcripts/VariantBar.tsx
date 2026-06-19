import { Link, useSearchParams } from 'react-router-dom'
import { useTranscriptStore } from '@/stores/transcript'
import { buildExport } from '@/lib/transcripts/corrections'
import { fmtDuration } from '@/lib/transcripts/format'

/**
 * Header strip for a session: back link, title/meta, the attribution-variant
 * pills (driven by the manifest), and the corrections export button.
 */
export function VariantBar() {
  const manifest = useTranscriptStore((s) => s.manifest)
  const slug = useTranscriptStore((s) => s.slug)
  const variant = useTranscriptStore((s) => s.variant)
  const overlay = useTranscriptStore((s) => s.overlay)
  const corrections = useTranscriptStore((s) => s.corrections)
  const [, setSearchParams] = useSearchParams()

  if (!slug) return null
  const session = manifest?.sessions?.[slug]
  const correctionCount = Object.keys(corrections).length

  function exportCorrections() {
    if (!overlay || !slug) return
    const payload = buildExport(slug, overlay.session_id, corrections, new Date().toISOString())
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug}-${variant}-corrections.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-2 border-b-2 border-gold/60 bg-teal-dark px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Link
          to="/sesje"
          className="font-display text-[11px] uppercase tracking-wider text-parchment/70 hover:text-gold"
        >
          ← Sesje
        </Link>
        <span className="font-display text-lg uppercase tracking-wider text-gold">
          {overlay?.session_name || session?.label || slug}
        </span>
        {overlay && (
          <span className="font-mono text-[11px] text-parchment/50">
            {fmtDuration(overlay.duration)} · {overlay.speakers.length} mówców ·{' '}
            {overlay.utterances.length.toLocaleString('pl')} wypowiedzi · oś „{overlay.timeline}"
          </span>
        )}
        <button
          onClick={exportCorrections}
          disabled={correctionCount === 0}
          className="font-display ml-auto border border-gold-muted/50 px-2.5 py-1 text-[10px] uppercase tracking-wider text-parchment/80 enabled:hover:border-gold enabled:hover:text-gold disabled:opacity-40"
          title="Pobierz korekty jako JSON"
        >
          Eksport korekt ({correctionCount})
        </button>
      </div>

      {session && (
        <div className="flex flex-wrap gap-1.5">
          {session.variants.map((v) => {
            const active = v.id === variant
            return (
              <button
                key={v.id}
                onClick={() => setSearchParams({ v: v.id })}
                title={v.label}
                className={
                  'max-w-[280px] truncate rounded-sm px-2 py-0.5 text-[11px] ' +
                  (active
                    ? 'bg-gold text-teal-deep'
                    : 'border border-gold-muted/40 text-parchment/70 hover:border-gold hover:text-gold')
                }
              >
                {v.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
