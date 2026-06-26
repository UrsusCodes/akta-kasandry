import { withBase } from '@/lib/withBase'

type Props = {
  color: string
  name: string
  portraitUrl: string | null
  kind: 'character' | 'self'
  size?: number
}

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase()
}

/**
 * Identity portrait. Character = rectangular photo (or monogram fallback) with
 * the player's colour as border. Self = round tile, player-colour border, name
 * initials. Colour always carries player identity; shape says character vs self.
 */
export function Portrait({ color, name, portraitUrl, kind, size = 34 }: Props) {
  const ring = { borderColor: color }
  if (kind === 'character' && portraitUrl) {
    return (
      <img
        src={withBase(portraitUrl)}
        alt={name}
        width={size * 0.82}
        height={size}
        style={ring}
        className="shrink-0 rounded-[3px] border-2 object-cover"
      />
    )
  }
  if (kind === 'character') {
    return (
      <div
        style={{ ...ring, width: size * 0.82, height: size }}
        className="font-display flex shrink-0 items-end justify-center rounded-[3px] border-2 bg-gradient-to-b from-parchment-warm to-teal-dark text-[0.72rem] text-ink"
      >
        {initials(name)}
      </div>
    )
  }
  return (
    <div
      style={{ ...ring, width: size, height: size, color }}
      className="font-mono flex shrink-0 items-center justify-center rounded-full border-2 bg-teal-deep text-[0.56rem] uppercase"
      title={name}
    >
      {initials(name)}
    </div>
  )
}
