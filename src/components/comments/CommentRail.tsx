import { useState } from 'react'
import type { Comment } from '@/types'
import { groupThreads } from '@/lib/comments/group'
import { CommentCard } from './CommentCard'

type Props = {
  comments: Comment[]
  activeThreadId: string | null
  canModerate: boolean
  onFocusAnchor: (anchorBlockId: string, rootId: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

/** Right rail: grouped by anchor; one quote header per anchor, threads beneath. */
export function CommentRail({ comments, activeThreadId, canModerate, onFocusAnchor, onEdit, onDelete }: Props) {
  const threads = groupThreads(comments)
  // Group threads by anchor so the quote header shows once per fragment.
  const byAnchor = new Map<string, typeof threads>()
  for (const t of threads) {
    const key = `${t.anchor.blockId}|${t.anchor.quote}`
    const arr = byAnchor.get(key) ?? []
    arr.push(t)
    byAnchor.set(key, arr)
  }
  return (
    <div className="rail space-y-3">
      <div className="font-display flex justify-between text-[0.68rem] uppercase tracking-widest text-gold">
        <span>Komentarze</span><span className="text-parchment/60">{comments.length}</span>
      </div>
      {Array.from(byAnchor.values()).map((group) => {
        const anchor = group[0].anchor
        const active = group.some((t) => t.root.id === activeThreadId)
        return (
          <div key={`${anchor.blockId}|${anchor.quote}`} className={['rounded-md border p-2', active ? 'border-gold shadow' : 'border-gold-muted'].join(' ')}>
            <button type="button" onClick={() => onFocusAnchor(anchor.blockId, group[0].root.id)} className="mb-2 block w-full text-left font-body italic text-[0.86rem] text-gold/90 border-l-2 border-gold-muted pl-2">
              „{anchor.quote}"
            </button>
            {group.map((t) => (
              <Thread key={t.root.id} thread={t} canModerate={canModerate} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

function Thread({ thread, canModerate, onEdit, onDelete }: {
  thread: ReturnType<typeof groupThreads>[number]
  canModerate: boolean
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const replies = thread.replies
  return (
    <div className="mt-2 first:mt-0">
      <CommentCard comment={thread.root} canModerate={canModerate} onEdit={onEdit} onDelete={onDelete} />
      {replies.length > 0 && !open && (
        <button type="button" className="mt-2 w-full text-center font-display text-[0.6rem] uppercase tracking-wide text-parchment/60" onClick={() => setOpen(true)}>
          ↓ pokaż {replies.length} {replies.length === 1 ? 'odpowiedź' : 'odpowiedzi'}
        </button>
      )}
      {open && (
        <div className="mt-2 space-y-2 border-t border-dashed border-gold-muted/40 pt-2">
          {replies.map((r) => <CommentCard key={r.id} comment={r} canModerate={canModerate} onEdit={onEdit} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  )
}
