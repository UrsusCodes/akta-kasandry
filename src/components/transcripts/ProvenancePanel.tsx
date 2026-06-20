import { useTranscriptStore } from '@/stores/transcript'
import { resolveAudioRef } from '@/lib/transcripts/audioLinks'
import { fmtChannel, pct } from '@/lib/transcripts/format'
import type { Chunk } from '@/lib/transcripts/overlay'

const METHOD_LABELS: Record<string, string> = {
  baseline_argmax: 'argmax',
  margin_gate: 'margin',
  trust_weighted: 'trust',
  z_score_relative: 'z-score',
  combined_v5: 'v5',
}

/**
 * Right dock (read-only): provenance for the active line (pinned, else hovered).
 * Shows the competing microphone chunks with probability bars, each chunk's own
 * text, an external audio link (manual seek), and the 5-method votes.
 */
export function ProvenancePanel() {
  const overlay = useTranscriptStore((s) => s.overlay)
  const nameToColor = useTranscriptStore((s) => s.nameToColor)
  const pinnedIdx = useTranscriptStore((s) => s.pinnedIdx)
  const hoverIdx = useTranscriptStore((s) => s.hoverIdx)
  const setPinned = useTranscriptStore((s) => s.setPinned)

  const idx = pinnedIdx ?? hoverIdx
  const isPinned = pinnedIdx != null && idx === pinnedIdx

  if (!overlay || idx == null) {
    return (
      <div className="font-body flex h-full items-center justify-center px-6 text-center text-sm text-parchment/40">
        Najedź na linię, by zobaczyć konkurujące mikrofony.
      </div>
    )
  }

  const u = overlay.utterances[idx]
  const winColor = nameToColor[u.speaker_name] || '#8b949e'

  const chunks = u.chunks.slice().sort((a, b) => {
    if (a.is_winner !== b.is_winner) return a.is_winner ? -1 : 1
    return (b.prob || 0) - (a.prob || 0)
  })

  const conf = u.consensus_confidence != null ? (u.consensus_confidence * 100).toFixed(0) + '%' : '—'

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2 border-b border-gold-muted/30 pb-2">
        <span className="font-display text-[11px] uppercase tracking-widest text-gold">
          Konkurujące mikrofony · {u.chunks.length}
        </span>
        <button
          onClick={() => setPinned(isPinned ? null : idx)}
          className="font-display border border-gold-muted/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-parchment/80 hover:border-gold hover:text-gold"
        >
          {isPinned ? '✕ Odepnij' : 'Przypnij'}
        </button>
      </div>

      {chunks.map((c) => (
        <ChunkCard key={`${c.channel_idx}:${c.play.start}`} chunk={c} winColor={winColor} />
      ))}

      {/* 5-method votes */}
      <div className="border-t border-gold-muted/30 pt-2">
        <div className="font-mono text-[10px] text-parchment/50">
          Głosy 5 metod · zwycięzca: <span style={{ color: winColor }}>{u.speaker_name}</span> · conf{' '}
          {conf}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {u.methods && Object.keys(u.methods).length ? (
            Object.keys(METHOD_LABELS)
              .filter((k) => k in (u.methods as object))
              .map((k) => {
                const vote = (u.methods as Record<string, string>)[k]
                const vc = nameToColor[vote] || '#8b949e'
                const dissent = vote && vote !== u.speaker_name
                return (
                  <span
                    key={k}
                    title={`${METHOD_LABELS[k]} → ${vote}${dissent ? ' (dissent)' : ''}`}
                    className={
                      'font-mono inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] ' +
                      (dissent ? 'bg-amber-400/15 text-amber-300' : 'bg-parchment/5 text-parchment/70')
                    }
                  >
                    {METHOD_LABELS[k]}
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: vc }}
                    />
                    {vote}
                  </span>
                )
              })
          ) : (
            <span className="font-mono text-[10px] text-parchment/40">brak danych metod</span>
          )}
        </div>
      </div>
    </div>
  )
}

function ChunkCard({ chunk, winColor }: { chunk: Chunk; winColor: string }) {
  const audioLinks = useTranscriptStore((s) => s.audioLinks)
  const slug = useTranscriptStore((s) => s.slug)
  const nameToColor = useTranscriptStore((s) => s.nameToColor)

  const cc = nameToColor[chunk.speaker_name] || '#8b949e'
  const percent = pct(chunk.prob)
  const ref = resolveAudioRef(audioLinks, slug || '', chunk.channel_idx, chunk.play.start)

  return (
    <div
      className="rounded-sm border p-2"
      style={{ borderColor: chunk.is_winner ? winColor : 'rgba(245,230,200,0.12)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-semibold" style={{ color: cc }}>
          {chunk.speaker_name}
        </span>
        {chunk.is_winner && (
          <span className="font-mono text-[10px] text-gold" title="pipeline winner">
            ★ zwycięzca
          </span>
        )}
        <span className="font-mono ml-auto text-[10px] text-parchment/40">
          {fmtChannel(chunk.channel_idx)} · {chunk.rms_db != null ? chunk.rms_db.toFixed(1) : '—'} dB ·
          hd {chunk.headroom_db != null ? chunk.headroom_db.toFixed(1) : '—'}
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <span className="tv-bar">
          <i style={{ width: `${percent}%`, background: cc }} />
        </span>
        <span
          className="font-mono w-9 text-right text-[11px] font-semibold"
          style={{ color: cc }}
        >
          {percent}%
        </span>
      </div>

      <div className="font-body mt-1.5 text-[13px] leading-snug text-parchment/85">{chunk.text}</div>

      <div className="mt-1.5">
        {ref.url ? (
          <a
            href={ref.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono inline-flex items-center gap-1 rounded-sm border border-gold-muted/50 px-1.5 py-0.5 text-[10px] text-gold hover:border-gold hover:bg-gold/10"
            title="Otwórz plik audio na zewnątrz i przewiń do podanego czasu"
          >
            ▶ {fmtChannel(chunk.channel_idx)} @ {ref.seekLabel} ↗
          </a>
        ) : (
          <span
            className="font-mono inline-flex items-center gap-1 rounded-sm border border-dashed border-parchment/20 px-1.5 py-0.5 text-[10px] text-parchment/40"
            title="Brak linku — wgraj audio kanału i uzupełnij audio-links.json"
          >
            {fmtChannel(chunk.channel_idx)} @ {ref.seekLabel}
          </span>
        )}
      </div>
    </div>
  )
}
