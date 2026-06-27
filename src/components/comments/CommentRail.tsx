import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Comment } from '@/types'
import { groupThreads } from '@/lib/comments/group'
import { resolveAnchor } from '@/lib/comments/anchor'
import { stackComments } from '@/lib/comments/stack'
import { CommentCard } from './CommentCard'

type Props = {
  comments: Comment[]
  activeThreadId: string | null
  currentUserId: string | null
  isMG: boolean
  onFocusAnchor: (anchorBlockId: string, rootId: string) => void
  onEdit?: (id: string, body: string) => void | Promise<{ error?: string }>
  onDelete?: (id: string) => void | Promise<{ error?: string }>
  /** The article element to measure anchors against. Only used on lg+ screens. */
  containerEl?: HTMLElement | null
}

// ─── anchor-group key ────────────────────────────────────────────────────────

function groupKey(blockId: string, quote: string) {
  return `${blockId}|${quote}`
}

// ─── matchMedia guard (jsdom may not have it) ────────────────────────────────

function isDesktop(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(min-width: 1024px)').matches
}

// ─── positioned-mode hook ─────────────────────────────────────────────────────

/**
 * Computes absolute top values (px) for each anchor-group card.
 * Returns an empty Map when positioning should not be applied.
 */
function useAnchorPositions(
  containerEl: HTMLElement | null | undefined,
  anchorKeys: string[],         // ordered list of group keys
  anchorMap: Map<string, { blockId: string; quote: string }>,
  cardRefs: React.MutableRefObject<Map<string, HTMLDivElement | null>>,
  railRef: React.RefObject<HTMLDivElement | null>,
  headerRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
  // re-run when these change
  _comments: Comment[],
  _activeThreadId: string | null,
): Map<string, number> {
  const [tops, setTops] = useState<Map<string, number>>(new Map)

  const compute = () => {
    if (!enabled || !containerEl || !railRef.current) {
      setTops(new Map)
      return
    }

    const railRect = railRef.current.getBoundingClientRect()
    // Floor: no card should sit above the header inside the rail.
    const floor = headerRef.current ? headerRef.current.getBoundingClientRect().height : 0

    let prevBottom = floor
    const items = anchorKeys.map((key) => {
      const anchor = anchorMap.get(key)
      const card = cardRefs.current.get(key)
      const height = card ? card.getBoundingClientRect().height : 0

      let desiredTop = prevBottom
      if (anchor) {
        const range = resolveAnchor(
          {
            blockId: anchor.blockId,
            quote: anchor.quote,
            prefix: '',
            suffix: '',
            startOffset: 0,
            endOffset: 0,
          },
          containerEl,
        )
        if (range) {
          const r = range.getBoundingClientRect()
          // Offset relative to the rail container, clamped below the header.
          desiredTop = Math.max(r.top - railRect.top, floor)
        }
      }
      prevBottom = desiredTop + height
      return { key, desiredTop, height }
    })

    // Sort by desiredTop so stacking respects document order.
    items.sort((a, b) => a.desiredTop - b.desiredTop)

    const placed = stackComments(items, 12)
    const next = new Map(placed.map(({ key, top }) => [key, top]))

    // Guard: only update state if something changed (prevents render loops).
    setTops((prev) => {
      if (prev.size !== next.size) return next
      for (const [k, v] of next) {
        if (prev.get(k) !== v) return next
      }
      return prev
    })
  }

  // Re-compute after every paint when dependencies change.
  useLayoutEffect(() => {
    if (!enabled || !containerEl) { setTops(new Map); return }

    compute()

    // ResizeObserver on the article container.
    let ro: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(compute)
      ro.observe(containerEl)
      if (railRef.current) ro.observe(railRef.current)
    }

    // Window resize fallback.
    window.addEventListener('resize', compute)

    // Images inside the article shift layout as they load.
    const imgs = Array.from(containerEl.querySelectorAll<HTMLImageElement>('img'))
    imgs.forEach((img) => img.addEventListener('load', compute))

    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', compute)
      imgs.forEach((img) => img.removeEventListener('load', compute))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, containerEl, anchorKeys.join(' '), _comments, _activeThreadId])

  return tops
}

// ─── main component ───────────────────────────────────────────────────────────

/** Right rail: grouped by anchor; one quote header per anchor, threads beneath. */
export function CommentRail({
  comments,
  activeThreadId,
  currentUserId,
  isMG,
  onFocusAnchor,
  onEdit,
  onDelete,
  containerEl,
}: Props) {
  const threads = groupThreads(comments)

  // Group threads by anchor so the quote header shows once per fragment.
  const byAnchor = new Map<string, typeof threads>()
  for (const t of threads) {
    const key = groupKey(t.anchor.blockId, t.anchor.quote)
    const arr = byAnchor.get(key) ?? []
    arr.push(t)
    byAnchor.set(key, arr)
  }

  const anchorKeys = Array.from(byAnchor.keys())

  // Map key → anchor info for resolveAnchor calls.
  const anchorMap = new Map(
    anchorKeys.map((key) => {
      const group = byAnchor.get(key)!
      return [key, { blockId: group[0].anchor.blockId, quote: group[0].anchor.quote }]
    }),
  )

  // Refs for measuring card heights.
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map)
  const railRef = useRef<HTMLDivElement | null>(null)
  const headerRef = useRef<HTMLDivElement | null>(null)

  // Desktop breakpoint — reactive.
  const [desktop, setDesktop] = useState<boolean>(isDesktop)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(min-width: 1024px)')
    const handler = (e: MediaQueryListEvent) => setDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const positioningEnabled = desktop && !!containerEl

  const tops = useAnchorPositions(
    containerEl,
    anchorKeys,
    anchorMap,
    cardRefs,
    railRef,
    headerRef,
    positioningEnabled,
    comments,
    activeThreadId,
  )

  // Minimum height of the rail so it encloses all absolutely-positioned cards.
  let minHeight: number | undefined
  if (positioningEnabled && tops.size > 0) {
    let maxBottom = 0
    for (const key of anchorKeys) {
      const top = tops.get(key) ?? 0
      const card = cardRefs.current.get(key)
      const h = card ? card.getBoundingClientRect().height : 0
      maxBottom = Math.max(maxBottom, top + h)
    }
    minHeight = maxBottom
  }

  return (
    <div
      ref={railRef}
      className={positioningEnabled ? 'relative' : 'rail space-y-3'}
      style={minHeight !== undefined ? { minHeight } : undefined}
    >
      {/* Header always at the top of the rail */}
      <div
        ref={headerRef}
        className={[
          'font-display flex justify-between text-[0.68rem] uppercase tracking-widest text-gold',
          positioningEnabled ? 'mb-3' : '',
        ].join(' ')}
      >
        <span>Komentarze</span>
        <span className="text-parchment/60">{comments.length}</span>
      </div>

      {anchorKeys.map((key) => {
        const group = byAnchor.get(key)!
        const anchor = group[0].anchor
        const active = group.some((t) => t.root.id === activeThreadId)

        const top = tops.get(key)

        const style =
          positioningEnabled && top !== undefined
            ? { position: 'absolute' as const, top, left: 0, right: 0 }
            : undefined

        return (
          <div
            key={key}
            ref={(el) => { cardRefs.current.set(key, el) }}
            style={style}
            className={[
              'rounded-md border p-2',
              active ? 'border-gold shadow' : 'border-gold-muted',
            ].join(' ')}
          >
            <button
              type="button"
              onClick={() => onFocusAnchor(anchor.blockId, group[0].root.id)}
              className="mb-2 block w-full text-left font-body italic text-[0.86rem] text-gold/90 border-l-2 border-gold-muted pl-2"
            >
              „{anchor.quote}"
            </button>
            {group.map((t) => (
              <Thread key={t.root.id} thread={t} currentUserId={currentUserId} isMG={isMG} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ─── Thread sub-component ─────────────────────────────────────────────────────

function Thread({
  thread,
  currentUserId,
  isMG,
  onEdit,
  onDelete,
}: {
  thread: ReturnType<typeof groupThreads>[number]
  currentUserId: string | null
  isMG: boolean
  onEdit?: (id: string, body: string) => void | Promise<{ error?: string }>
  onDelete?: (id: string) => void | Promise<{ error?: string }>
}) {
  const [open, setOpen] = useState(false)
  const replies = thread.replies
  return (
    <div className="mt-2 first:mt-0">
      <CommentCard comment={thread.root} currentUserId={currentUserId} isMG={isMG} onEdit={onEdit} onDelete={onDelete} />
      {replies.length > 0 && !open && (
        <button
          type="button"
          className="mt-2 w-full text-center font-display text-[0.6rem] uppercase tracking-wide text-parchment/60"
          onClick={() => setOpen(true)}
        >
          ↓ pokaż {replies.length} {replies.length === 1 ? 'odpowiedź' : 'odpowiedzi'}
        </button>
      )}
      {open && (
        <div className="mt-2 space-y-2 border-t border-dashed border-gold-muted/40 pt-2">
          {replies.map((r) => (
            <CommentCard key={r.id} comment={r} currentUserId={currentUserId} isMG={isMG} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
