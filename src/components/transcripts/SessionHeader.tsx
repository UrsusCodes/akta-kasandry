import { Link } from 'react-router-dom'
import { useTranscriptStore } from '@/stores/transcript'
import { fmtDuration } from '@/lib/transcripts/format'

/**
 * Minimal header for a session: back link, title and read-only meta. The viewer
 * always shows the session's latest production variant — no variant switching.
 */
export function SessionHeader() {
  const slug = useTranscriptStore((s) => s.slug)
  const overlay = useTranscriptStore((s) => s.overlay)

  if (!slug) return null

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b-2 border-gold/60 bg-teal-dark px-4 py-2.5">
      <Link
        to="/sesje"
        className="font-display text-[11px] uppercase tracking-wider text-parchment/70 hover:text-gold"
      >
        ← Sesje
      </Link>
      <span className="font-display text-lg uppercase tracking-wider text-gold">
        {overlay?.session_name || slug}
      </span>
      {overlay && (
        <span className="font-mono text-[11px] text-parchment/50">
          {fmtDuration(overlay.duration)} · {overlay.speakers.length} mówców ·{' '}
          {overlay.utterances.length.toLocaleString('pl')} wypowiedzi
        </span>
      )}
    </div>
  )
}
