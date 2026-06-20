import { memo, useCallback } from 'react'
import type { MouseEvent } from 'react'
import { useTranscriptStore } from '@/stores/transcript'
import { TranscriptRow } from './TranscriptRow'

/**
 * The whole transcript as a flat, read-only list. Performance relies on
 * `.tv-row`'s `content-visibility:auto` (browser skips off-screen rows) plus
 * memoized rows, so rendering 5000 lines and toggling speakers stays smooth
 * without a windowing library. Hover (→ provenance) and click (→ pin) are
 * delegated from the container via each row's `data-idx`.
 */
function ListImpl() {
  const overlay = useTranscriptStore((s) => s.overlay)
  const speakerOn = useTranscriptStore((s) => s.speakerOn)
  const nameToColor = useTranscriptStore((s) => s.nameToColor)
  const pinnedIdx = useTranscriptStore((s) => s.pinnedIdx)

  const setHover = useTranscriptStore((s) => s.setHover)
  const setPinned = useTranscriptStore((s) => s.setPinned)

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
      if (idx != null) setPinned(idx)
    },
    [setPinned],
  )

  if (!overlay) return null

  return (
    <div onMouseOver={onOver} onMouseLeave={onLeave} onClick={onClick}>
      {overlay.utterances.map((u, idx) => {
        const neutral = !u.assigned || speakerOn[u.speaker_id] === false
        const color = nameToColor[u.speaker_name] || '#8b949e'
        return (
          <TranscriptRow
            key={u.id}
            u={u}
            idx={idx}
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
