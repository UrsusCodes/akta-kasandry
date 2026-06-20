import { useMemo } from 'react'
import { useTranscriptStore } from '@/stores/transcript'

/**
 * Left rail (read-only): speaker legend with per-speaker visibility toggles,
 * plus the ambiguous-line count and any build caveats.
 */
export function Legend() {
  const overlay = useTranscriptStore((s) => s.overlay)
  const speakerOn = useTranscriptStore((s) => s.speakerOn)
  const toggleSpeaker = useTranscriptStore((s) => s.toggleSpeaker)
  const setAllSpeakers = useTranscriptStore((s) => s.setAllSpeakers)

  const { counts, ambiguous } = useMemo(() => {
    const counts = new Map<string, number>()
    let ambiguous = 0
    for (const u of overlay?.utterances || []) {
      counts.set(u.speaker_id, (counts.get(u.speaker_id) || 0) + 1)
      if (!u.assigned) ambiguous++
    }
    return { counts, ambiguous }
  }, [overlay])

  if (!overlay) return null
  const total = overlay.utterances.length

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-xs uppercase tracking-widest text-gold">Mówcy</h2>

      <p className="font-body text-[12px] leading-snug text-parchment/55">
        <span className="text-parchment">Kolorowa linia</span> = pewna atrybucja.{' '}
        <span className="text-parchment">Biała</span> = niejednoznaczna (pipeline nie jest pewien).
        Wyłącz mówcę, by wygasić jego linie.
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => setAllSpeakers(true)}
          className="font-display flex-1 border border-gold-muted/50 px-2 py-1 text-[10px] uppercase tracking-wider text-parchment/80 hover:border-gold hover:text-gold"
        >
          Wszyscy
        </button>
        <button
          onClick={() => setAllSpeakers(false)}
          className="font-display flex-1 border border-gold-muted/50 px-2 py-1 text-[10px] uppercase tracking-wider text-parchment/80 hover:border-gold hover:text-gold"
        >
          Nikt
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {overlay.speakers.map((s) => {
          const on = speakerOn[s.id] !== false
          return (
            <button
              key={s.id}
              onClick={() => toggleSpeaker(s.id)}
              className={
                'flex items-center gap-2 rounded-sm px-2 py-1 text-left transition ' +
                (on ? 'opacity-100' : 'opacity-40')
              }
            >
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: s.color }} />
              <span className="font-body min-w-0 flex-1 truncate text-[14px] text-parchment">
                {s.name}
              </span>
              <span className="font-mono text-[10px] text-parchment/40">{counts.get(s.id) || 0}</span>
              <span
                className="font-mono text-[11px]"
                style={{ color: on ? s.color : 'transparent' }}
              >
                ✓
              </span>
            </button>
          )
        })}
      </div>

      <div className="font-mono border-t border-gold-muted/30 pt-2 text-[11px] text-parchment/50">
        <code className="text-parchment/70">{ambiguous}</code> niejednoznacznych (białych) z{' '}
        <code className="text-parchment/70">{total}</code> linii.
        {(overlay.build_meta?.caveats?.length ?? 0) > 0 && (
          <div className="mt-2 text-amber-400">⚠ {overlay.build_meta!.caveats!.join(' ')}</div>
        )}
      </div>
    </div>
  )
}
