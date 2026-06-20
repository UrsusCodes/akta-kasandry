import { useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranscriptStore } from '@/stores/transcript'
import { SessionHeader } from '@/components/transcripts/SessionHeader'
import { Legend } from '@/components/transcripts/Legend'
import { TranscriptList } from '@/components/transcripts/TranscriptList'
import { ProvenancePanel } from '@/components/transcripts/ProvenancePanel'

/**
 * `/sesje/:slug` — read-only transcript provenance viewer. Always loads the
 * session's latest production variant (no variant switching). Three panes on
 * desktop (legend / transcript / provenance dock); on mobile the dock becomes a
 * bottom sheet. `?u=<id>` (or `<from>..<to>`) deep-links from a summary marker.
 */
export function SessionView() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()

  const open = useTranscriptStore((s) => s.open)
  const status = useTranscriptStore((s) => s.status)
  const error = useTranscriptStore((s) => s.error)
  const overlay = useTranscriptStore((s) => s.overlay)
  const setPinned = useTranscriptStore((s) => s.setPinned)
  const active = useTranscriptStore((s) => s.pinnedIdx ?? s.hoverIdx)

  const deepLink = searchParams.get('u') // `<id>` or `<from>..<to>`

  useEffect(() => {
    if (slug) void open(slug)
  }, [slug, open])

  // Deep-link from a summary marker: scroll to, flash and pin the target line(s).
  useEffect(() => {
    if (status !== 'ready' || !overlay || !deepLink) return
    const [fromId, toId] = deepLink.split('..')
    const fromIdx = overlay.utterances.findIndex((u) => u.id === fromId)
    if (fromIdx < 0) return
    const toIdx = toId ? overlay.utterances.findIndex((u) => u.id === toId) : fromIdx
    const endIdx = toIdx >= fromIdx ? toIdx : fromIdx
    setPinned(fromIdx)
    const t = setTimeout(() => {
      const target = document.querySelector(`.tv-row[data-idx="${fromIdx}"]`)
      target?.scrollIntoView({ block: 'center' })
      for (let i = fromIdx; i <= endIdx; i++) {
        const r = document.querySelector(`.tv-row[data-idx="${i}"]`)
        if (!r) continue
        r.classList.add('tv-flash')
        setTimeout(() => r.classList.remove('tv-flash'), 2400)
      }
    }, 120)
    return () => clearTimeout(t)
  }, [status, overlay, deepLink, setPinned])

  // Esc clears the pinned line
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPinned(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPinned])

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-20">
        <SessionHeader />
      </div>

      {status === 'loading' && (
        <p className="font-mono px-4 py-10 text-sm text-parchment/50">Ładowanie transkryptu…</p>
      )}
      {status === 'error' && (
        <p className="font-mono px-4 py-10 text-sm text-amber-400">Błąd: {error}</p>
      )}

      {status === 'ready' && (
        <div className="flex gap-3 px-3 py-3">
          {/* Legend — sticky on desktop, collapsible on mobile */}
          <aside className="tv-scroll sticky top-[58px] hidden max-h-[calc(100vh-70px)] w-56 shrink-0 overflow-auto lg:block">
            <Legend />
          </aside>

          <main className="min-w-0 flex-1">
            <details className="mb-2 lg:hidden">
              <summary className="font-display cursor-pointer text-xs uppercase tracking-widest text-gold">
                Mówcy
              </summary>
              <div className="mt-2">
                <Legend />
              </div>
            </details>
            <TranscriptList />
          </main>

          {/* Provenance dock — sticky on desktop */}
          <aside className="tv-scroll sticky top-[58px] hidden max-h-[calc(100vh-70px)] w-[360px] shrink-0 overflow-auto border-l border-gold-muted/30 lg:block">
            <ProvenancePanel />
          </aside>
        </div>
      )}

      {/* Mobile provenance bottom sheet */}
      {status === 'ready' && active != null && (
        <div className="tv-scroll fixed inset-x-0 bottom-0 z-30 max-h-[48vh] overflow-auto border-t-2 border-gold bg-teal-dark lg:hidden">
          <ProvenancePanel />
        </div>
      )}
    </div>
  )
}
