/**
 * Merge a human correction over an utterance to get what the UI should show.
 * A painted speaker counts as confident (assigned), trumping the auto attribution.
 */
import type { Utterance } from './overlay'
import type { Override } from './corrections'

export type EffectiveUtterance = {
  text: string
  speaker_id: string
  speaker_name: string
  assigned: boolean
  edited: boolean // text was changed by the user
  painted: boolean // speaker was set by the user
}

export function effective(u: Utterance, ov: Override | undefined): EffectiveUtterance {
  const painted = !!(ov && ov.speaker_id)
  const edited = !!(ov && ov.text != null)
  return {
    text: edited ? (ov!.text as string) : u.text,
    speaker_id: painted ? (ov!.speaker_id as string) : u.speaker_id,
    speaker_name: painted ? (ov!.speaker_name as string) : u.speaker_name,
    assigned: painted ? true : u.assigned,
    edited,
    painted,
  }
}
