import { useEffect, useRef, useState } from 'react'
import { Markdown } from '@/components/Markdown'
import { CommentRail } from './CommentRail'
import { CommentComposer, type ComposerMode } from './CommentComposer'
import { useIsDesktop } from './useIsDesktop'
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
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  // Force the rail to re-measure once the article container has mounted.
  const [, forceUpdate] = useState(0)
  const [mode, setMode] = useState<ComposerMode>('idle')
  const isDesktop = useIsDesktop()

  const comments = useCommentsStore((s) => s.comments)
  const load = useCommentsStore((s) => s.load)
  const add = useCommentsStore((s) => s.add)
  const user = useAuthStore((s) => s.user)
  const displayName = useAuthStore((s) => s.displayName)
  const color = useAuthStore((s) => s.color) ?? DEFAULT_PLAYER_COLOR
  const role = useAuthStore((s) => s.role)

  useEffect(() => { void load(pageKey) }, [pageKey, load])
  // Bump after mount so the rail can measure against the real container element.
  useEffect(() => { forceUpdate(1) }, [])
  useHighlights(containerRef.current, comments, activeBlockId)

  const onMouseUp = () => {
    if (!user || mode !== 'selecting') return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !containerRef.current) return
    const range = sel.getRangeAt(0)
    const start = range.startContainer
    const from = start instanceof Element ? start : start.parentElement
    const block = from?.closest('[data-block-id]') as HTMLElement | null
    if (!block || !containerRef.current.contains(block)) return
    const anchor = createAnchor(range, block)
    if (anchor && anchor.quote.trim()) setPending({ anchor, quote: anchor.quote })
  }

  const focusAnchor = (blockId: string, rootId?: string) => {
    setActiveBlockId(blockId)
    if (rootId !== undefined) setActiveThreadId(rootId)
    const el = containerRef.current?.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(blockId)}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const resetComposer = () => {
    setMode('idle')
    setPending(null)
    window.getSelection()?.removeAllRanges()
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div ref={containerRef} onMouseUp={onMouseUp} className="min-w-0 flex-1">
        <Markdown>{children}</Markdown>
      </div>
      <aside className="w-full shrink-0 lg:w-[330px]">
        {user && (
          <CommentComposer
            mode={mode}
            quote={pending?.quote ?? null}
            hasFragment={!!pending}
            speakerOptions={speakerOptions}
            selfName={displayName ?? 'Ja'}
            color={color}
            variant={isDesktop ? 'rail' : 'bottom'}
            onStart={() => setMode('selecting')}
            onConfirmFragment={() => setMode('composing')}
            onCancel={resetComposer}
            onSubmit={async ({ speakerCharacterId, body }) => {
              const res = await add({ pageKey, anchor: pending!.anchor, speakerCharacterId, body, parentId: null })
              if (!res.error) resetComposer()
              return res
            }}
          />
        )}
        <CommentRail
          comments={comments}
          activeThreadId={activeThreadId}
          canModerate={role === 'mg'}
          onFocusAnchor={(blockId, rootId) => focusAnchor(blockId, rootId)}
          containerEl={containerRef.current}
        />
      </aside>
    </div>
  )
}
