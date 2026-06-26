import { useState } from 'react'
import { SpeakerPicker, type SpeakerOption } from './SpeakerPicker'

type Props = {
  quote: string
  speakerOptions: SpeakerOption[]
  selfName: string
  color: string
  onSubmit: (input: { speakerCharacterId: string | null; body: string }) => Promise<{ error?: string }>
  onCancel: () => void
}

/** Compose popover shown after a text selection. */
export function ComposeBubble({ quote, speakerOptions, selfName, color, onSubmit, onCancel }: Props) {
  const [speaker, setSpeaker] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    if (!body.trim()) return
    setBusy(true); setErr(null)
    const { error } = await onSubmit({ speakerCharacterId: speaker, body: body.trim() })
    setBusy(false)
    if (error) setErr(error)
  }

  return (
    <div className="rounded-lg border border-gold bg-teal-dark p-3 shadow-xl">
      <p className="mb-2 font-body italic text-[0.85rem] text-gold/80 border-l-2 border-gold-muted pl-2">„{quote}"</p>
      <SpeakerPicker options={speakerOptions} selfName={selfName} color={color} value={speaker} onPick={setSpeaker} />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder={speaker ? 'Napisz w roli postaci…' : 'Notka od Ciebie…'}
        className="font-body mt-2 w-full rounded border border-gold-muted bg-parchment px-2 py-1.5 text-ink outline-none focus:border-gold"
      />
      {err && <p className="mt-1 font-mono text-xs text-gold-dark">{err}</p>}
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="font-display text-[0.62rem] uppercase tracking-wide text-parchment/70 hover:text-parchment">Anuluj</button>
        <button type="button" disabled={busy || !body.trim()} onClick={submit} className="font-display rounded border border-gold bg-teal-deep px-3 py-1 text-[0.62rem] uppercase tracking-wide text-gold hover:bg-gold hover:text-teal-deep disabled:opacity-50">
          {busy ? 'Zapis…' : 'Dodaj'}
        </button>
      </div>
    </div>
  )
}
