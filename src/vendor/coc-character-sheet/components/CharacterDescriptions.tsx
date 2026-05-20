import { CHARACTERISTIC_MAP } from '../data/characteristics'
import { getCharacterDescriptions } from '../lib/characterDescriptions'
import type { Characteristics } from '../types/character'

interface CharacterDescriptionsProps {
  characteristics: Characteristics | Record<string, number>
}

/**
 * "Portret z cech" — narrative paragraphs derived deterministically from the
 * character's characteristic values. Renders nothing when every stat falls
 * inside the average band.
 */
export function CharacterDescriptions({ characteristics }: CharacterDescriptionsProps) {
  const descriptions = getCharacterDescriptions(characteristics as Characteristics)
  if (descriptions.length === 0) return null

  return (
    <section className="space-y-2">
      <h4 className="text-sm font-medium text-coc-text-muted uppercase tracking-wider">
        Portret z cech
      </h4>
      <ul className="space-y-2">
        {descriptions.map(({ stat, text }) => (
          <li key={stat} className="text-sm">
            <span className="text-coc-text-muted font-mono mr-2">
              {CHARACTERISTIC_MAP[stat].abbreviation}
            </span>
            <span className="whitespace-pre-wrap">{text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
