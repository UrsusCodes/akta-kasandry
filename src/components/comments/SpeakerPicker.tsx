import { Portrait } from './Portrait'

export type SpeakerOption = { characterId: string; name: string; portraitUrl: string | null }

type Props = {
  options: SpeakerOption[]
  selfName: string
  color: string
  value: string | null // characterId or null (self)
  onPick: (characterId: string | null) => void
}

/** Pick who speaks: one of the player's investigation characters (IC) or self (OOC). */
export function SpeakerPicker({ options, selfName, color, value, onPick }: Props) {
  const cell = (active: boolean) =>
    [
      'flex flex-col items-center gap-1 rounded-md border p-1.5 cursor-pointer',
      active ? 'border-gold bg-gold/10' : 'border-transparent hover:border-gold-muted',
    ].join(' ')
  return (
    <div className="flex flex-wrap items-end gap-2">
      {options.map((o) => (
        <button key={o.characterId} type="button" className={cell(value === o.characterId)} onClick={() => onPick(o.characterId)}>
          <Portrait color={color} name={o.name} portraitUrl={o.portraitUrl} kind="character" />
          <span className="font-display text-[0.64rem] text-parchment">{o.name}</span>
        </button>
      ))}
      <button type="button" className={cell(value === null)} onClick={() => onPick(null)}>
        <Portrait color={color} name={selfName} portraitUrl={null} kind="self" />
        <span className="font-display text-[0.64rem] text-parchment">Ja ({selfName})</span>
      </button>
    </div>
  )
}
