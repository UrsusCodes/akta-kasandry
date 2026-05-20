import type { ImportedCharacterData } from '@/types'

/**
 * Renders an imported character sheet from the JSONB snapshot. The exact shape
 * of coc-creator's `data` is only partly known, so every section guards for
 * missing / differently-shaped fields and simply omits what isn't there.
 */
export function CharacterPage({ character }: { character: ImportedCharacterData }) {
  const d = character.data ?? {}
  const get = <T,>(key: string): T | undefined => d[key] as T | undefined

  const characteristics = asRecord(get('characteristics'))
  const derived = asRecord(get('derived'))
  const backstory = asRecord(get('backstory'))
  const equipment = get('equipment')
  const age = get<number | string>('age')
  const gender = get<string>('gender')
  const residence = get<string>('residence')
  const birthplace = get<string>('birthplace')
  const appearance = get<string>('appearance')

  return (
    <article className="prose-cthulhu bg-parchment p-8">
      <header className="not-prose mb-6 flex items-start gap-5">
        {character.portrait_url && (
          <img
            src={character.portrait_url}
            alt={character.name}
            className="h-32 w-32 shrink-0 rounded border border-gold-muted object-cover"
          />
        )}
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider text-ink">
            {character.name}
          </h1>
          <p className="font-mono mt-1 text-sm text-ink/70">
            {[character.occupation_id, character.era, character.status]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {character.player_name && (
            <p className="font-body mt-1 text-ink/80">Gracz: {character.player_name}</p>
          )}
        </div>
      </header>

      {(age || gender || residence || birthplace) && (
        <section className="not-prose mb-5">
          <Detail label="Wiek" value={age} />
          <Detail label="Płeć" value={gender} />
          <Detail label="Miejsce zamieszkania" value={residence} />
          <Detail label="Miejsce urodzenia" value={birthplace} />
        </section>
      )}

      {characteristics && (
        <Section title="Charakterystyki">
          <KeyValueGrid record={characteristics} />
          {character.data.luck != null && (
            <p className="font-body mt-2">
              <strong>Szczęście:</strong> {String(character.data.luck)}
            </p>
          )}
        </Section>
      )}

      {derived && (
        <Section title="Wartości pochodne">
          <KeyValueGrid record={derived} />
        </Section>
      )}

      {appearance && (
        <Section title="Wygląd">
          <p className="font-body">{appearance}</p>
        </Section>
      )}

      {backstory && Object.keys(backstory).length > 0 && (
        <Section title="Historia">
          {Object.entries(backstory).map(([k, v]) => (
            <div key={k} className="mb-2">
              <strong className="font-display text-sm uppercase tracking-wider text-ink">
                {humanize(k)}
              </strong>
              <p className="font-body">{renderScalar(v)}</p>
            </div>
          ))}
        </Section>
      )}

      {Array.isArray(equipment) && equipment.length > 0 && (
        <Section title="Ekwipunek">
          <ul className="font-body list-disc pl-5">
            {equipment.map((item, i) => (
              <li key={i}>{renderScalar(item)}</li>
            ))}
          </ul>
        </Section>
      )}

      <p className="font-mono mt-8 text-xs text-ink/40">
        Snapshot z coc-creator · zaimportowano {fmtDate(character.imported_at)} · źródło
        zmienione {fmtDate(character.source_updated_at)}
      </p>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="not-prose mb-5">
      <h2 className="font-display mb-2 border-b border-gold-muted pb-1 text-lg uppercase tracking-wider text-ink">
        {title}
      </h2>
      {children}
    </section>
  )
}

function KeyValueGrid({ record }: { record: Record<string, unknown> }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
      {Object.entries(record).map(([k, v]) => (
        <div key={k} className="flex justify-between border-b border-rule/60 py-0.5">
          <span className="font-display text-sm uppercase tracking-wider text-ink/80">
            {humanize(k)}
          </span>
          <span className="font-mono text-sm text-ink">{renderScalar(v)}</span>
        </div>
      ))}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: unknown }) {
  if (value == null || value === '') return null
  return (
    <p className="font-body">
      <strong>{label}:</strong> {renderScalar(value)}
    </p>
  )
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function renderScalar(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function humanize(key: string): string {
  return key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pl-PL')
  } catch {
    return iso
  }
}
