import { CharacterSheet, mapCharacterRowToSheet } from '@/vendor/coc-character-sheet'
import type { PublicCharactersRow } from '@/vendor/coc-character-sheet'
import type { ImportedCharacterData } from '@/types'

/**
 * Renders an imported character via coc-creator's vendored <CharacterSheet>.
 * The raw snapshot (`character.data`, an allowlisted public.characters row) is
 * fed through the bundle's adapter, which recomputes derived attributes
 * (PW/PM/PP/PO/krzepa/ruch/unik) from characteristics rather than trusting the
 * frequently-empty stored `derived` column.
 *
 * The sheet is a dark-theme component, so it lives inside a gold-framed dark
 * panel (see vendor/coc-character-sheet/VENDOR.md §6). A wiki-styled title +
 * snapshot provenance footer wrap it to match the rest of the site.
 */
export function CharacterPage({ character }: { character: ImportedCharacterData }) {
  // The dedicated `portrait_url` column on `imported_characters` is always the
  // canonical portrait (set by importOne from the freshest source data).
  // Override whatever portrait fields are in the JSONB snapshot so the sheet
  // always shows the same portrait as the tile — even for rows imported before
  // portrait_url was added to the allowlist, or when the adapter's fallback
  // chain would otherwise prefer a legacy profile_portrait_url.
  const row: PublicCharactersRow = {
    ...(character.data as unknown as PublicCharactersRow),
    portrait_url: character.portrait_url ?? undefined,
  }
  const props = mapCharacterRowToSheet(row)

  return (
    <article>
      <header className="mb-6">
        <h1 className="font-display text-4xl uppercase tracking-widest text-parchment">
          {character.name}
        </h1>
        <p className="font-mono mt-2 text-xs text-parchment/60">
          {[character.occupation_id, character.era, character.status].filter(Boolean).join(' · ')}
          {character.player_name ? ` · Gracz: ${character.player_name}` : ''}
        </p>
      </header>

      <div className="rounded-lg border border-gold-muted bg-coc-surface p-5 text-coc-text shadow-lg">
        <CharacterSheet {...props} />
      </div>

      <p className="font-mono mt-6 text-xs text-parchment/40">
        Snapshot z coc-creator · zaimportowano {fmtDate(character.imported_at)} · źródło zmienione{' '}
        {fmtDate(character.source_updated_at)}
      </p>
    </article>
  )
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pl-PL')
  } catch {
    return iso
  }
}
