import type { Comment } from '@/types'
import { commentMode } from '@/types'
import { Portrait } from './Portrait'

type Props = {
  comment: Comment
  canModerate: boolean
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

/** One comment. IC = character portrait + italic parchment body; OOC = self tile + monospace body. */
export function CommentCard({ comment: c, canModerate, onEdit, onDelete }: Props) {
  const ic = commentMode(c) === 'ic'
  const who = ic ? c.speakerName ?? 'Postać' : c.authorName
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
        {canModerate && (
          <span className="ml-auto flex gap-2">
            <button type="button" className="font-display text-[0.6rem] uppercase text-parchment/60 hover:text-gold" onClick={() => onEdit?.(c.id)}>Edytuj</button>
            <button type="button" className="font-display text-[0.6rem] uppercase text-parchment/60 hover:text-gold-dark" onClick={() => onDelete?.(c.id)}>Usuń</button>
          </span>
        )}
      </div>
      <p className={ic ? 'font-body italic text-parchment text-[0.98rem] leading-snug' : 'font-mono text-[0.8rem] leading-relaxed text-parchment/90'}>
        {c.body}{c.edited && <span className="ml-1 text-[0.6rem] text-parchment/60">(edyt.)</span>}
      </p>
    </div>
  )
}
