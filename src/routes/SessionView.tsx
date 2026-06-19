import { useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranscriptStore } from '@/stores/transcript'
import { VariantBar } from '@/components/transcripts/VariantBar'
import { Legend } from '@/components/transcripts/Legend'
import { TranscriptList } from '@/components/transcripts/TranscriptList'
import { ProvenancePanel } from '@/components/transcripts/ProvenancePanel'

/**
 * `/sesje/:slug` — the transcript provenance viewer/editor. Variant comes from
 * `?v=`; the store loads the matching overlay. Three panes on desktop (legend /
 * transcript / provenance dock); on mobile the dock becomes a bottom sheet.
 */
export function SessionView() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const v = searchParams.get('v') || undefined

  const open = useTranscriptStore((s) => s.open)
  const status = useTranscriptStore((s) => s.status)
  const error = useTranscriptStore((s) => s.error)
  const setPinned = useTranscriptStore((s) => s.setPinned)
  const active = useTranscriptStore((s) => s.pinnedIdx ?? s.hoverIdx)

  useEffect(() => {
    if (slug) void open(slug, v)
  }, [slug, v, open])

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
        <VariantBar />
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
          <aside className="tv-scroll sticky top-[92px] hidden max-h-[calc(100vh-104px)] w-56 shrink-0 overflow-auto lg:block">
            <Legend />
          </aside>

          <main className="min-w-0 flex-1">
            <details className="mb-2 lg:hidden">
              <summary className="font-display cursor-pointer text-xs uppercase tracking-widest text-gold">
                Mówcy i korekty
              </summary>
              <div className="mt-2">
                <Legend />
              </div>
            </details>
            <TranscriptList />
          </main>

          {/* Provenance dock — sticky on desktop */}
          <aside className="tv-scroll sticky top-[92px] hidden max-h-[calc(100vh-104px)] w-[360px] shrink-0 overflow-auto border-l border-gold-muted/30 lg:block">
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
