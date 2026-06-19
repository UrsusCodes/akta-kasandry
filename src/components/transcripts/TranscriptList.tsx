import { memo, useCallback } from 'react'
import type { MouseEvent } from 'react'
import { useTranscriptStore } from '@/stores/transcript'
import { effective } from '@/lib/transcripts/effective'
import { TranscriptRow } from './TranscriptRow'

/**
 * The whole transcript as a flat list. Performance relies on `.tv-row`'s
 * `content-visibility:auto` (browser skips off-screen rows) plus memoized
 * rows, so rendering 5000 lines and toggling speakers stays smooth without a
 * windowing library. Hover/click/dblclick are delegated from the container via
 * each row's `data-idx`, so we attach three handlers instead of 15000.
 */
function ListImpl() {
  const overlay = useTranscriptStore((s) => s.overlay)
  const speakerOn = useTranscriptStore((s) => s.speakerOn)
  const corrections = useTranscriptStore((s) => s.corrections)
  const nameToColor = useTranscriptStore((s) => s.nameToColor)
  const pinnedIdx = useTranscriptStore((s) => s.pinnedIdx)
  const paintMode = useTranscriptStore((s) => s.paintMode)
  const paintSpeakerId = useTranscriptStore((s) => s.paintSpeakerId)

  const setHover = useTranscriptStore((s) => s.setHover)
  const setPinned = useTranscriptStore((s) => s.setPinned)
  const paintUtterance = useTranscriptStore((s) => s.paintUtterance)

  const idxFrom = (e: MouseEvent): number | null => {
    const el = (e.target as HTMLElement).closest('[data-idx]') as HTMLElement | null
    if (!el) return null
    const v = parseInt(el.dataset.idx || '', 10)
    return isNaN(v) ? null : v
  }

  const onOver = useCallback(
    (e: MouseEvent) => {
      const idx = idxFrom(e)
      if (idx != null) setHover(idx)
    },
    [setHover],
  )

  const onLeave = useCallback(() => setHover(null), [setHover])

  const onClick = useCallback(
    (e: MouseEvent) => {
      const idx = idxFrom(e)
      if (idx == null) return
      if (paintMode && paintSpeakerId) paintUtterance(idx, paintSpeakerId)
      else setPinned(idx)
    },
    [paintMode, paintSpeakerId, paintUtterance, setPinned],
  )

  if (!overlay) return null

  return (
    <div onMouseOver={onOver} onMouseLeave={onLeave} onClick={onClick}>
      {overlay.utterances.map((u, idx) => {
        const ov = corrections[u.id]
        const eff = effective(u, ov)
        const neutral = !eff.assigned || speakerOn[eff.speaker_id] === false
        const color = nameToColor[eff.speaker_name] || '#8b949e'
        return (
          <TranscriptRow
            key={u.id}
            u={u}
            idx={idx}
            override={ov}
            color={color}
            neutral={neutral}
            pinned={idx === pinnedIdx}
          />
        )
      })}
    </div>
  )
}

export const TranscriptList = memo(ListImpl)
