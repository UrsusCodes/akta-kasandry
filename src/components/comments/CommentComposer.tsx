import type { SpeakerOption } from './SpeakerPicker'
import { ComposeBubble } from './ComposeBubble'

export type ComposerMode = 'idle' | 'selecting' | 'composing'

type Props = {
  mode: ComposerMode
  quote: string | null
  hasFragment: boolean
  speakerOptions: SpeakerOption[]
  selfName: string
  color: string
  /** 'rail' = sticky inside the desktop rail; 'bottom' = fixed bar at the viewport bottom (mobile). */
  variant?: 'rail' | 'bottom'
  onStart: () => void
  onConfirmFragment: () => void
  onCancel: () => void
  onSubmit: (input: { speakerCharacterId: string | null; body: string }) => Promise<{ error?: string }>
}

function wrapClass(variant: 'rail' | 'bottom'): string {
  return variant === 'bottom'
    ? 'fixed inset-x-0 bottom-0 z-30 border-t border-gold bg-teal-deep p-3 shadow-xl'
    : 'sticky top-2 z-20 mb-3'
}

/**
 * Guided comment composer. Three states: an "Add comment" button (idle), a
 * "mark the fragment" bar (selecting), and the compose box (composing, reusing
 * ComposeBubble). Pure/prop-driven — AnnotatableArticle owns the state machine
 * and the selection capture.
 */
export function CommentComposer({
  mode, quote, hasFragment, speakerOptions, selfName, color, variant = 'rail',
  onStart, onConfirmFragment, onCancel, onSubmit,
}: Props) {
  if (mode === 'idle') {
    return (
      <div className={wrapClass(variant)}>
        <button
          type="button"
          onClick={onStart}
          className="font-display w-full rounded border border-gold bg-teal-dark px-3 py-2 text-[0.7rem] uppercase tracking-widest text-gold transition hover:bg-gold hover:text-teal-deep"
        >
          + Dodaj komentarz
        </button>
      </div>
    )
  }

  if (mode === 'selecting') {
    return (
      <div className={wrapClass(variant)}>
        <div className="rounded-lg border border-gold bg-teal-dark p-3 shadow-xl">
          <p className="font-display mb-2 text-[0.66rem] uppercase tracking-wide text-gold">
            Zaznacz fragment w treści…
          </p>
          {quote && (
            <p className="mb-2 border-l-2 border-gold-muted pl-2 font-body text-[0.82rem] italic text-gold/80">
              „{quote}"
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="font-display text-[0.62rem] uppercase tracking-wide text-parchment/70 hover:text-parchment">
              Anuluj
            </button>
            <button
              type="button"
              disabled={!hasFragment}
              onClick={onConfirmFragment}
              className="font-display rounded border border-gold bg-teal-deep px-3 py-1 text-[0.62rem] uppercase tracking-wide text-gold hover:bg-gold hover:text-teal-deep disabled:opacity-50"
            >
              Potwierdź
            </button>
          </div>
        </div>
      </div>
    )
  }

  // composing
  return (
    <div className={wrapClass(variant)}>
      <ComposeBubble
        quote={quote ?? ''}
        speakerOptions={speakerOptions}
        selfName={selfName}
        color={color}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </div>
  )
}
