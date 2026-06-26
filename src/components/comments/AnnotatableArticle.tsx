import { useEffect, useRef, useState } from 'react'
import { Markdown } from '@/components/Markdown'
import { CommentRail } from './CommentRail'
import { ComposeBubble } from './ComposeBubble'
import { useHighlights } from './useHighlights'
import { createAnchor } from '@/lib/comments/anchor'
import type { CommentAnchor } from '@/types'
import { useCommentsStore } from '@/stores/comments'
import { useAuthStore } from '@/stores/auth'
import { DEFAULT_PLAYER_COLOR } from '@/lib/playerColors'
import type { SpeakerOption } from './SpeakerPicker'

type Props = {
  pageKey: string
  children: string
  /** Speaker options for the current player on this investigation (cast-filtered). */
  speakerOptions?: SpeakerOption[]
}

export function AnnotatableArticle({ pageKey, children, speakerOptions = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pending, setPending] = useState<{ anchor: CommentAnchor; quote: string } | null>(null)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)

  const comments = useCommentsStore((s) => s.comments)
  const load = useCommentsStore((s) => s.load)
  const add = useCommentsStore((s) => s.add)
  const user = useAuthStore((s) => s.user)
  const displayName = useAuthStore((s) => s.displayName)
  const color = useAuthStore((s) => s.color) ?? DEFAULT_PLAYER_COLOR
  const role = useAuthStore((s) => s.role)

  useEffect(() => { void load(pageKey) }, [pageKey, load])
  useHighlights(containerRef.current, comments, activeBlockId)

  const onMouseUp = () => {
    if (!user) return // only logged-in players can comment
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !containerRef.current) return
    const range = sel.getRangeAt(0)
    // startContainer is usually a text node (use its parent), but a triple-click
    // / boundary selection can hand back the element itself — handle both so the
    // block-id lookup never silently misses the clicked block.
    const start = range.startContainer
    const from = start instanceof Element ? start : start.parentElement
    const block = from?.closest('[data-block-id]') as HTMLElement | null
    if (!block || !containerRef.current.contains(block)) return
    const anchor = createAnchor(range, block)
    if (anchor && anchor.quote.trim()) setPending({ anchor, quote: anchor.quote })
  }

  const focusAnchor = (blockId: string) => {
    setActiveBlockId(blockId)
    const el = containerRef.current?.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(blockId)}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div ref={containerRef} onMouseUp={onMouseUp} className="min-w-0 flex-1">
        <Markdown>{children}</Markdown>
        {pending && (
          <div className="sticky bottom-4 z-20 mx-auto max-w-xl">
            <ComposeBubble
              quote={pending.quote}
              speakerOptions={speakerOptions}
              selfName={displayName ?? 'Ja'}
              color={color}
              onSubmit={async ({ speakerCharacterId, body }) => {
                const res = await add({ pageKey, anchor: pending.anchor, speakerCharacterId, body, parentId: null })
                if (!res.error) { setPending(null); window.getSelection()?.removeAllRanges() }
                return res
              }}
              onCancel={() => setPending(null)}
            />
          </div>
        )}
      </div>
      <aside className="w-full shrink-0 lg:w-[330px]">
        <CommentRail
          comments={comments}
          activeThreadId={null}
          canModerate={role === 'mg'}
          onFocusAnchor={(blockId) => focusAnchor(blockId)}
        />
      </aside>
    </div>
  )
}
