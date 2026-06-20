import { useEffect, useState } from 'react'
import { useTranscriptStore } from '@/stores/transcript'
import { effective } from '@/lib/transcripts/effective'
import { resolveAudioRef } from '@/lib/transcripts/audioLinks'
import { fmtChannel, pct } from '@/lib/transcripts/format'
import type { Chunk, Utterance } from '@/lib/transcripts/overlay'

const METHOD_LABELS: Record<string, string> = {
  baseline_argmax: 'argmax',
  margin_gate: 'margin',
  trust_weighted: 'trust',
  z_score_relative: 'z-score',
  combined_v5: 'v5',
}

/**
 * Right dock: provenance for the active line (pinned, else hovered). Shows the
 * competing microphone chunks with probability bars, each chunk's own text, an
 * external audio link (manual seek), the 5-method votes, and — when a line is
 * pinned — the correction editor (paint from a mic / edit text / clear).
 */
export function ProvenancePanel() {
  const overlay = useTranscriptStore((s) => s.overlay)
  const slug = useTranscriptStore((s) => s.slug)
  const corrections = useTranscriptStore((s) => s.corrections)
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
  const eff = effective(u, corrections[u.id])
  const winColor = nameToColor[eff.speaker_name] || '#8b949e'

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
        <div className="flex items-center gap-1.5">
          {isPinned && <CopyAnchor slug={slug} id={u.id} />}
          <button
            onClick={() => setPinned(isPinned ? null : idx)}
            className="font-display border border-gold-muted/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-parchment/80 hover:border-gold hover:text-gold"
          >
            {isPinned ? '✕ Odepnij' : 'Przypnij'}
          </button>
        </div>
      </div>

      {chunks.map((c) => (
        <ChunkCard key={`${c.channel_idx}:${c.play.start}`} chunk={c} winColor={winColor} idx={idx} />
      ))}

      {/* 5-method votes */}
      <div className="border-t border-gold-muted/30 pt-2">
        <div className="font-mono text-[10px] text-parchment/50">
          Głosy 5 metod · zwycięzca:{' '}
          <span style={{ color: winColor }}>{eff.speaker_name}</span> · conf {conf}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {u.methods && Object.keys(u.methods).length ? (
            Object.keys(METHOD_LABELS)
              .filter((k) => k in (u.methods as object))
              .map((k) => {
                const vote = (u.methods as Record<string, string>)[k]
                const vc = nameToColor[vote] || '#8b949e'
                const dissent = vote && vote !== eff.speaker_name
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
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: vc }} />
                    {vote}
                  </span>
                )
              })
          ) : (
            <span className="font-mono text-[10px] text-parchment/40">brak danych metod</span>
          )}
        </div>
      </div>

      {isPinned ? (
        <Editor u={u} idx={idx} />
      ) : (
        <div className="font-body text-[11px] text-parchment/40">
          Kliknij linię, by ją przypiąć i edytować.
        </div>
      )}
    </div>
  )
}

/** Copies the summary deep-link token `{sesja:<slug>#<id>}` for this line. */
function CopyAnchor({ slug, id }: { slug: string | null; id: string }) {
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 1400)
    return () => clearTimeout(t)
  }, [done])
  const token = `{sesja:${slug}#${id}}`
  return (
    <button
      onClick={() => {
        void navigator.clipboard?.writeText(token)
        setDone(true)
      }}
      title={`Kopiuj kotwicę do streszczenia: ${token}`}
      className="font-display border border-gold-muted/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-parchment/80 hover:border-gold hover:text-gold"
    >
      {done ? '✓ Skopiowano' : '⎘ Kotwica'}
    </button>
  )
}

function ChunkCard({ chunk, winColor, idx }: { chunk: Chunk; winColor: string; idx: number }) {
  const audioLinks = useTranscriptStore((s) => s.audioLinks)
  const slug = useTranscriptStore((s) => s.slug)
  const nameToColor = useTranscriptStore((s) => s.nameToColor)
  const paintUtterance = useTranscriptStore((s) => s.paintUtterance)

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
          {fmtChannel(chunk.channel_idx)} · {chunk.rms_db != null ? chunk.rms_db.toFixed(1) : '—'} dB · hd{' '}
          {chunk.headroom_db != null ? chunk.headroom_db.toFixed(1) : '—'}
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <span className="tv-bar">
          <i style={{ width: `${percent}%`, background: cc }} />
        </span>
        <span className="font-mono w-9 text-right text-[11px] font-semibold" style={{ color: cc }}>
          {percent}%
        </span>
      </div>

      <div className="font-body mt-1.5 text-[13px] leading-snug text-parchment/85">{chunk.text}</div>

      <div className="mt-1.5 flex items-center gap-2">
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
        <button
          onClick={() => paintUtterance(idx, chunk.speaker_id)}
          className="font-mono rounded-sm border border-gold-muted/40 px-1.5 py-0.5 text-[10px] text-parchment/70 hover:border-gold hover:text-gold"
          title="Przypisz tę linię temu mówcy"
        >
          przypisz
        </button>
      </div>
    </div>
  )
}

function Editor({ u, idx }: { u: Utterance; idx: number }) {
  const corrections = useTranscriptStore((s) => s.corrections)
  const editText = useTranscriptStore((s) => s.editText)
  const clearOverride = useTranscriptStore((s) => s.clearOverride)
  const ov = corrections[u.id]
  const current = ov?.text ?? u.text
  const [val, setVal] = useState(current)
  const hasOverride = !!ov

  return (
    <div className="flex flex-col gap-2 border-t border-gold-muted/30 pt-3">
      <h3 className="font-display text-[11px] uppercase tracking-widest text-gold">Edytuj tekst</h3>
      <textarea
        key={u.id}
        defaultValue={current}
        onChange={(e) => setVal(e.target.value)}
        rows={3}
        className="font-body w-full resize-y rounded-sm border border-gold-muted/40 bg-teal-deep/60 p-2 text-[14px] text-parchment focus:border-gold focus:outline-none"
      />
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => editText(idx, val)}
          className="font-display border border-gold-muted/50 px-2 py-1 text-[10px] uppercase tracking-wider text-parchment/80 hover:border-gold hover:text-gold"
        >
          Zapisz tekst
        </button>
        {hasOverride && (
          <button
            onClick={() => clearOverride(idx)}
            className="font-display border border-amber-400/40 px-2 py-1 text-[10px] uppercase tracking-wider text-amber-300 hover:border-amber-400"
          >
            Cofnij korektę
          </button>
        )}
      </div>
      {hasOverride && ov?.text != null && (
        <p className="font-mono text-[10px] text-parchment/40">Oryginał: {u.text}</p>
      )}
    </div>
  )
}
