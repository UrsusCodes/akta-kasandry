import { useState } from 'react'
import type { Comment } from '@/types'
import { commentMode } from '@/types'
import { Portrait } from './Portrait'

type Props = {
  comment: Comment
  currentUserId: string | null
  isMG: boolean
  onEdit?: (id: string, body: string) => void | Promise<{ error?: string }>
  onDelete?: (id: string) => void | Promise<{ error?: string }>
}

/** One comment. IC = character portrait + italic body; OOC = self tile + monospace.
 * The author (or MG) can edit/delete; others see no controls. */
export function CommentCard({ comment: c, currentUserId, isMG, onEdit, onDelete }: Props) {
  const ic = commentMode(c) === 'ic'
  const who = ic ? c.speakerName ?? 'Postać' : c.authorName
  const canManage = isMG || (currentUserId !== null && c.authorProfileId === currentUserId)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(c.body)

  const saveEdit = async () => {
    const body = draft.trim()
    if (!body) return
    await onEdit?.(c.id, body)
    setEditing(false)
  }
  const confirmDelete = () => {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm('Usunąć komentarz?')) return
    void onDelete?.(c.id)
  }

  return (
    <div className="rounded-md border border-gold-muted bg-teal-deep p-2.5">
      <div className="mb-1.5 flex items-center gap-2">
        <Portrait
          color={c.authorColor}
          name={who}
          portraitUrl={ic ? c.speakerPortraitUrl : null}
          kind={ic ? 'character' : 'self'}
          size={28}
        />
        <span className="font-display text-[0.78rem] leading-tight text-parchment">
          {who}
          <span className="block text-[0.56rem] uppercase tracking-wide text-parchment/60">
            {ic ? `${c.authorName} · w roli` : 'poza rolą'}
          </span>
        </span>
        {canManage && !editing && (
          <span className="ml-auto flex gap-2">
            <button type="button" className="font-display text-[0.6rem] uppercase text-parchment/60 hover:text-gold" onClick={() => { setDraft(c.body); setEditing(true) }}>Edytuj</button>
            <button type="button" className="font-display text-[0.6rem] uppercase text-parchment/60 hover:text-gold-dark" onClick={confirmDelete}>Usuń</button>
          </span>
        )}
      </div>
      {editing ? (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            className="font-body w-full rounded border border-gold-muted bg-parchment px-2 py-1 text-ink outline-none focus:border-gold"
          />
          <div className="mt-1 flex justify-end gap-2">
            <button type="button" className="font-display text-[0.6rem] uppercase text-parchment/70 hover:text-parchment" onClick={() => setEditing(false)}>Anuluj</button>
            <button type="button" disabled={!draft.trim()} className="font-display rounded border border-gold px-2 py-0.5 text-[0.6rem] uppercase text-gold hover:bg-gold hover:text-teal-deep disabled:opacity-50" onClick={saveEdit}>Zapisz</button>
          </div>
        </div>
      ) : (
        <p className={ic ? 'font-body italic text-parchment text-[0.98rem] leading-snug' : 'font-mono text-[0.8rem] leading-relaxed text-parchment/90'}>
          {c.body}{c.edited && <span className="ml-1 text-[0.6rem] text-parchment/60">(edyt.)</span>}
        </p>
      )}
    </div>
  )
}
