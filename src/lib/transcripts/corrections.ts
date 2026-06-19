/**
 * Human corrections to the auto attribution, persisted in localStorage and
 * exportable as JSON (the feedback-loop input back into rpg-recorder).
 *
 * Namespaced per session AND variant (`rpgrec.corrections.<slug>.<variant>`) so
 * corrections never bleed across variants — matches editor.html's keying.
 */

/** Per-utterance override; only changed fields are present. */
export type Override = {
  speaker_id?: string
  speaker_name?: string
  text?: string
}

export type Corrections = Record<string, Override> // keyed by utterance id

const PREFIX = 'rpgrec.corrections'

function key(slug: string, variant: string): string {
  return `${PREFIX}.${slug}.${variant}`
}

export function loadCorrections(slug: string, variant: string): Corrections {
  try {
    const raw = localStorage.getItem(key(slug, variant))
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Corrections) : {}
  } catch {
    return {}
  }
}

export function saveCorrections(slug: string, variant: string, c: Corrections): void {
  try {
    if (Object.keys(c).length === 0) localStorage.removeItem(key(slug, variant))
    else localStorage.setItem(key(slug, variant), JSON.stringify(c))
  } catch {
    /* storage full / disabled — corrections just won't persist */
  }
}

/** Build the export payload documented in transcript-viz/README.md. */
export function buildExport(
  slug: string,
  sessionId: string,
  corrections: Corrections,
  nowIso: string,
): object {
  return {
    session: slug,
    session_id: sessionId,
    exported_at: nowIso,
    count: Object.keys(corrections).length,
    overrides: corrections,
  }
}
