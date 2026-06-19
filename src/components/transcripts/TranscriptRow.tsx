import { memo } from 'react'
import type { Utterance } from '@/lib/transcripts/overlay'
import type { Override } from '@/lib/transcripts/corrections'
import { effective } from '@/lib/transcripts/effective'
import { fmtTime, tint, chipText } from '@/lib/transcripts/format'

type Props = {
  u: Utterance
  idx: number
  override: Override | undefined
  color: string
  neutral: boolean // ambiguous OR speaker toggled off
  pinned: boolean
}

/**
 * One transcript line. Memoized: re-renders only when its own utterance,
 * correction, neutral flag, color or pinned state changes — hovering other
 * rows never touches it. `data-idx` drives the list's event delegation.
 */
function RowImpl({ u, idx, override, color, neutral, pinned }: Props) {
  const eff = effective(u, override)
  const dissent =
    !neutral && u.methods && Object.values(u.methods).some((v) => v && v !== eff.speaker_name)

  const style = neutral
    ? { borderLeftColor: 'rgba(245,230,200,0.28)' }
    : { borderLeftColor: color, background: tint(color, 0.1) }

  return (
    <div
      data-idx={idx}
      className={
        'tv-row flex cursor-pointer items-baseline gap-2.5 border-l-[3px] px-3 py-1.5 ' +
        'transition-colors hover:bg-parchment/5 ' +
        (pinned ? 'tv-active ' : '')
      }
      style={style}
    >
      <span className="font-mono shrink-0 text-[11px] leading-5 text-parchment/40 tabular-nums">
        {fmtTime(u.start)}
      </span>

      <span
        className="shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold leading-none"
        style={
          neutral
            ? { border: '1px solid rgba(245,230,200,0.3)', color: 'rgba(245,230,200,0.7)' }
            : { background: color, color: chipText(color) }
        }
      >
        {neutral && <span className="opacity-70">? </span>}
        {eff.speaker_name}
      </span>

      <span className={'font-body min-w-0 flex-1 text-[15px] leading-snug ' + (neutral ? 'text-parchment/85' : 'text-parchment')}>
        {eff.text}
      </span>

      <span className="shrink-0 flex items-center gap-1 self-center">
        {eff.painted && (
          <span className="font-mono rounded-sm bg-gold/20 px-1 text-[9px] uppercase text-gold" title="speaker set by you">
            ✎
          </span>
        )}
        {eff.edited && (
          <span
            className="font-mono rounded-sm bg-gold/20 px-1 text-[9px] uppercase text-gold"
            title={`edited — original: ${u.text}`}
          >
            edit
          </span>
        )}
        {dissent && (
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400"
            title="attribution methods disagree"
          />
        )}
      </span>
    </div>
  )
}

export const TranscriptRow = memo(RowImpl)
