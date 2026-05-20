# coc-character-sheet — vendor bundle

Self-contained copy of coc-creator's **responsive, web-native** character card
(Path 1 from `work/2026-05-20-card-html-for-akta-kasandry.md`). Drop the whole
`coc-character-sheet/` folder into akta-kasandry at `src/vendor/coc-character-sheet/`.

Generated 2026-05-21 from coc-creator. Type-checks clean standalone
(`tsc --moduleResolution Bundler --jsx react-jsx`, exit 0) and the adapter was
run against a real production character row (see Fixture).

---

## 1. What this is

A React component `<CharacterSheet/>` that renders a CoC 7e investigator sheet
(characteristics, derived attributes, skills, Drive+Pillars or traditional
backstory, positions, contacts, sessions, equipment) for **screen display**.
Plus the adapter that turns a raw `public.characters` DB row into its props.

This is NOT the A4 print card (that's the HTML-v2 pipeline, a separate thing).
The `cardFrontMap` / `backTocV2Map` exports are bundled too in case you later
build the print card, but they are not needed for screen rendering.

---

## 2. Entry API (exact signatures)

```ts
import { CharacterSheet, mapCharacterRowToSheet } from '@/vendor/coc-character-sheet'
// (barrel = coc-character-sheet/index.ts)

// 1) map the raw public.characters row (your wiki.imported_characters.data jsonb)
function mapCharacterRowToSheet(row: PublicCharactersRow): SheetProps
//    SheetProps = { character: CharacterSheetData }

// 2) render
<CharacterSheet {...props} />        // props: SheetProps  ⇒  <CharacterSheet character={...} />
```

Full example:

```tsx
import { CharacterSheet, mapCharacterRowToSheet } from '@/vendor/coc-character-sheet'

function CharacterPage({ imported }: { imported: { data: unknown } }) {
  const props = mapCharacterRowToSheet(imported.data as PublicCharactersRow)
  return (
    <div className="bg-coc-surface text-coc-text p-4 rounded-lg">  {/* dark wrapper — see §6 */}
      <CharacterSheet {...props} />
    </div>
  )
}
```

`mapCharacterRowToSheet` / `PublicCharactersRow` are defined in `adapter.ts`.
`CharacterSheetData` (the props shape) is exported from `components/CharacterSheet.tsx`.

### Does the map take the raw row? — YES (via the adapter)

You asked whether `cardFrontMap.ts` / `backTocV2Map.ts` take a raw
`public.characters` row. **They do not** — they take the app's processed
`CharacterSheetData`. The adapter (`adapter.ts`, written for you) bridges raw
row → `CharacterSheetData`. So your pipeline is:

```
public.characters row  ──mapCharacterRowToSheet──▶  { character }  ──▶  <CharacterSheet/>
                       ──(.character)──▶ characterToCardFrontData(...)  // only if you build the print card
```

### CRITICAL: `derived` is recomputed, not read from the row

coc-creator computes HP/MP/SAN/DB/build/move/dodge at runtime; the DB
`derived` column is often empty (`{}`). The adapter **recomputes** them from
`characteristics` via `calculateDerived()`. If a row has incomplete
characteristics (a draft), it falls back to the stored `derived`. You don't
have to do anything — just don't be surprised the stored `derived` is ignored
for complete characters. Verified correct on the fixture (e.g. HP =
⌊(CON+SIZ)/10⌋).

---

## 3. External npm dependencies

| Package | Version in coc-creator | Used by | In your locked list? |
|---|---|---|---|
| `react` | ^19.2.0 | the 3 components (JSX + `ReactNode` type) | ✅ yes |
| `react-dom` | ^19.2.0 | (peer, runtime only) | ✅ yes |

**That's the entire external surface.** No `lucide-react`, no `clsx`, no
`framer-motion`, no `date-fns`, no icon libs, no UI-kit, no router, no store,
no context/provider, no Supabase client. The maps/adapter/data/types import
**zero** npm packages. Confirmed by full transitive trace.

> Works on React 18 too (only basic JSX + `ReactNode` are used), but it was
> generated from a React 19.2 codebase.

---

## 4. Tailwind tokens (`coc-*`) → values

You're on Tailwind v4 (`@theme` in CSS). coc-creator is too — here is its
`@theme` block. Paste the tokens you need into your CSS `@theme { }`:

```css
@theme {
  /* dark-theme palette the component was designed against */
  --color-coc-bg:            #1a1a1a;
  --color-coc-surface:       #242424;
  --color-coc-surface-light: #2e2e2e;
  --color-coc-border:        #3a3a3a;
  --color-coc-text:          #e8e6e3;
  --color-coc-text-muted:    #9a9a9a;
  --color-coc-accent:        #4a7c59;
  --color-coc-accent-light:  #5a9c6a;
  --color-coc-danger:        #c44040;
  --color-coc-warning:       #c49a40;
  --color-coc-gold:          #c4a840;   /* not used by these components, included for completeness */
}
```

**Tokens actually referenced by the bundled components** (define at least these):

| Token | Value | Where |
|---|---|---|
| `coc-surface-light` | `#2e2e2e` | char cells, position/contact cards, Badge default bg |
| `coc-border` | `#3a3a3a` | portrait border, Badge default border |
| `coc-text-muted` | `#9a9a9a` | all labels |
| `coc-accent` | `#4a7c59` | MiniStat bg (`/10`), Badge success bg (`/20`) |
| `coc-accent-light` | `#5a9c6a` | Badge success text |
| `coc-danger` | `#c44040` | Badge danger (text + `/20` bg + `/30` border) |
| `coc-warning` | `#c49a40` | Badge warning + "Do zatwierdzenia" pills |

For the recommended dark wrapper you'll also want `coc-bg` / `coc-surface` /
`coc-text`. Other classes used are stock Tailwind (`text-yellow-400`,
`font-mono`, grid/flex utilities) — no config needed.

The `/10`, `/20`, `/30` are Tailwind opacity modifiers on the token — they work
automatically once the base `--color-coc-*` is defined.

---

## 5. Fonts

**None required.** The component uses only `font-mono` (stock Tailwind
monospace stack) for numeric values and inherits your body font elsewhere.

> The A4 print card needs EB Garamond / Cinzel / Cormorant Garamond — but you
> are NOT using the print card in Path 1. You already have Cinzel + Cormorant
> Garamond anyway; EB Garamond is only relevant if you later build the print
> card.

---

## 6. What will NOT work standalone — and how to fix it

1. **It's a DARK-THEME component.** Cells use `bg-coc-surface-light` (#2e2e2e,
   dark) and value text inherits the ambient color. On a light wiki page you'd
   get dark cells with dark text = unreadable. **Fix (pick one):**
   - **(recommended)** render inside a dark wrapper:
     `<div className="bg-coc-surface text-coc-text">…</div>` (as in the §2
     example). The card becomes a self-contained dark panel on your page.
   - OR remap the `--color-coc-*` tokens to light-theme values in your
     `@theme` if you want it to blend into a light page (you control the hex).

2. **No global CSS, no `html/body/*` selectors, no `<style>`, no `@page`/print.**
   100% Tailwind utility classes — fully scoped, safe to drop into a page.
   (This is the whole reason Path 1 beats injecting the print HTML.)

3. **Extensionless imports** (`from './lib/derived'`). Correct for Vite/esbuild
   (`moduleResolution: "Bundler"` — you already have it). Node's bare ESM
   resolver won't load them without a bundler; irrelevant for your Vite app.

4. **`@/` alias is gone.** All imports inside the bundle are relative. The only
   `@/...` is in the *example* in this doc — change it to wherever you place
   the folder.

5. **`admin_notes` is intentionally dropped** by the adapter (Keeper-only
   notes). The raw `wiki.imported_characters.data` jsonb may still contain it —
   do not surface it elsewhere on the player-facing wiki.

6. **Portrait URL** — adapter picks `profile_portrait_url → portrait_url →
   card_portrait_url`, all absolute Supabase Storage public URLs. If your
   import snapshot strips these, the portrait just doesn't render (guarded).

---

## 7. File tree (21 files)

```
coc-character-sheet/
  index.ts                      barrel — import from here
  adapter.ts                    mapCharacterRowToSheet + PublicCharactersRow  (NEW, written for you)
  VENDOR.md                     this file
  components/
    CharacterSheet.tsx          the responsive sheet (was src/components/shared/CharacterSheet.tsx)
    CharacterDescriptions.tsx   "Portret z cech" narrative block
    Badge.tsx                   tiny pill (was src/components/ui/Badge.tsx)
  lib/
    cardFrontMap.ts             CharacterSheetData → CardFrontData (print card, optional)
    backTocV2Map.ts             CharacterSheetData → CardBackData  (print card, optional)
    derived.ts                  calculateDerived() — HP/MP/SAN/DB/build/move/dodge
    characterDescriptions.ts    stat → narrative paragraph logic
    utils.ts                    halfValue / fifthValue / clamp / formatSigned
  data/
    skills.ts                   skill catalog + getSkillDisplayName/getSkillBase/getBaseSkillId/getSpecialization
    occupations.ts              68+ occupations (~2100 lines)
    characteristics.ts          STR..EDU defs + CHARACTERISTIC_MAP
    drivePillars.ts             DRIVES catalog (Drive+Pillars variant)
    weapons.ts, weaponsV2.ts, blackMarket.ts   weapon catalogs (for print-card weapon parsing)
    damageBonusTable.ts         STR+SIZ → damage bonus / build
  types/
    common.ts                   Era, CreationMethod, CharacteristicKey, ERA_LABELS, METHOD_LABELS
    character.ts                Backstory, MainPosition, ContactV2, DerivedAttributes, …
    skill.ts, occupation.ts     supporting types
  fixtures/
    character-row.json          real public.characters row (Arthur Henry Corwin, profesor)
    expected-sheetprops.json    mapCharacterRowToSheet(character-row.json) output — assert against this
```

A `vendor-export/tsconfig.check.json` (one level up in coc-creator) shows the
exact compiler options the bundle was validated with — copy them if you want a
standalone type-check in your repo.

---

## 8. Fixture (verify your port without our runtime)

`fixtures/character-row.json` — a real submitted character (Arthur Henry
Corwin, profesor, classic 1920s, Drive+Pillars backstory, 60 equipment items,
3 contacts, 2 additional positions). `admin_notes` already stripped.

`fixtures/expected-sheetprops.json` — the exact output of
`mapCharacterRowToSheet(character-row.json)`, produced by running the bundled
adapter. Spot values you can assert:

```
characteristics: { STR:65, CON:70, SIZ:45, DEX:45, APP:45, INT:80, POW:60, EDU:70 }
derived:         { hp:11, mp:12, san:60, db:"0", build:0, move_rate:8, dodge:22 }
```

To re-verify after porting: feed `character-row.json` to your
`mapCharacterRowToSheet` and deep-equal against `expected-sheetprops.json`.

---

## 9. If something pulls in too much

It doesn't. The trace is closed: 21 files, only `react` external, no context /
provider / store / global CSS. The single judgment call we made for you is the
adapter (raw row → props, recomputing `derived`, dropping `admin_notes`). If
your `wiki.imported_characters.data` ever diverges from coc-creator's row shape,
adjust `PublicCharactersRow` + the field mapping in `adapter.ts` — it's a flat,
readable function.
