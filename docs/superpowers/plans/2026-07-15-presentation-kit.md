# Presentation Kit — Implementation Plan

```yaml
---
date: 2026-07-15
status: active
tags: [plan, area:presentations, area/packages]
related: ["docs/superpowers/specs/2026-07-15-presentation-kit-design.md", "docs/superpowers/plans/2026-07-15-session-companion-iter2.md", "[[TASK_LIST]]"]
---
```

> **For agentic workers:** use `superpowers:subagent-driven-development` or
> `superpowers:executing-plans`. Pure logic first via `superpowers:test-driven-development`.
> Steps use `- [ ]` checkboxes.

**Goal:** ship the player-facing **Presentation Kit** per
`docs/superpowers/specs/2026-07-15-presentation-kit-design.md`: `scripts/kit-template/`
(editor + shared core logic), `scripts/build-presentation-kit.ts` (kit generator), a GM
runbook, and a UG2 end-to-end dry run.

## Hard constraints (repeat)

- **NO new dependency**; editor is vanilla HTML/CSS/JS, no build step, reorder via ▲▼ buttons.
- **`file://` rules:** editor makes zero network requests (image library embedded as data-URLs
  at build time — runtime conversion is impossible: `fetch()` blocked, `file://` images taint
  canvas); exported deck's only external ref is the theme's Google Fonts `@import` (inherited,
  non-blocking).
- **Trust boundary (spec §4):** the round-trip artifact is `szkic.json`; `KitCore` HTML-escapes
  every text field when generating engine data; the runbook mandates GM regeneration before
  publishing. Never weaken these.
- **Engine untouched:** `public/prezentacja/ug2/{engine.js,base.css,themes/cthulhu.css}` are
  read as-is by the builder — no edits to them, no site source changes at all in this plan.
- **Token injection:** function-form replacement only (`html.replace(token, () => payload)`) —
  the `String.replace` `$`-sequence lesson from the iter-2 review; assert token occurrence
  counts (template-drift guard).
- Polish UI strings / English code+docs; Vitest for pure logic; repo public, no secrets;
  `packages/` stays gitignored (already covers this kit's output); **no commits**.

---

## Pinned contracts (so batch-A tasks can run in parallel)

### Draft schema (`szkic.json`, and the localStorage value)

```js
{
  version: 1,
  slug: 'ug2',
  theme: 'cthulhu',
  acts:   [ { id: 'a1', name: 'Akt I', track: 'docks.mp3' } ],   // track: filename in assets/audio/, or null (no music)
  slides: [ EditorSlide ],
  updatedAt: '2026-07-15T12:00:00.000Z'
}
// EditorSlide (discriminated by template):
// { id, template: 'tytulowy'|'przerywnik'|'obraz'|'cytat'|'final',
//   actId: 'a1'|null,
//   title: '', text: '',
//   image: AssetRef|null, portrait: AssetRef|null, portraitName: '',
//   kb: 'in'|'out'|'left'|'right'|null, night: false, fx: null|'flash'|'pulse',
//   dur: 6500 }
// AssetRef: { kind: 'library', id: '<library id>' } | { kind: 'custom', dataUrl: 'data:image/...' }
```

### Embedded asset library (`window.__KIT__`, injected by the builder)

```js
window.__KIT__ = {
  slug, title,                       // e.g. 'ug2', 'Urodzaj Grozy'
  images: [ { id, label, group: 'scene'|'cast', dataUrl } ],   // group drives library tabs
  tracks: [ { file, label } ],       // file = filename inside assets/audio/
  engineJs, baseCss, themeCss,       // verbatim strings (themeCss WITH its @import)
  themeCssEditor                     // themeCss with the @import line stripped (editor preview)
}
```

### KitCore API (`globalThis.KitCore`, from `scripts/kit-template/kit-core.js`)

```js
KitCore.newDraft(slug)                          // fresh valid draft
KitCore.validateDraft(obj) -> { ok, errors[] }  // schema + version check ('unsupported version' error)
KitCore.escapeHtml(s)                           // & < > " '  → entities
KitCore.draftToEngineData(draft, resolveImage)  // -> { slides: [engine slide], tracks: {name: 'AUDIO'} }
   // resolveImage(assetRef) -> dataUrl string; text fields escaped HERE;
   // act -> {act label, track name}; tracks object maps act-track filenames to
   // placeholder values the serializer rewrites via AUDIO_BASE (see below)
KitCore.serializeSlidesJs(engineData)           // -> the full slides-data <script> body:
   // 'const AUDIO_BASE = "assets/audio/";\nconst TRACKS = {...};\nconst SLIDES = [...];'
   // JSON-serialized, with every '<' escaped to <
KitCore.collectImageRefs(draft)                 // -> unique AssetRefs used (export preflight)
KitCore.draftByteSize(draft)                    // JSON byte length (localStorage guard, warn > 4 MB)
```

`draftToEngineData` template mapping (spec §3.2): `tytulowy→kind:'title'`,
`przerywnik→kind:'card'`, `obraz→kind:'image'` (+ optional single `portraits` entry),
`cytat→kind:'image'` + `portraits:[{img, name}]`, `final→kind:'end'`. `kb` defaults `'in'` for
image-backed slides; slides with `actId` get `act: <name>` and `track: <act's track>`; `track`
omitted when the act has no music (engine keeps the previous cue — its documented behavior).

---

## File map

**New**
- `scripts/kit-template/kit-core.js` — dependency-free IIFE, `globalThis.KitCore` (K1)
- `scripts/kit-template/kit-core.test.ts` — Vitest, imports the .js by side effect (K1)
- `scripts/kit-template/edytor.html` — the 3-panel editor (K2)
- `scripts/build-presentation-kit.ts` — kit generator (K3)
- `docs/RUNBOOKS/presentation-kit.md` — GM runbook (K4)

**Modified**
- `package.json` — `"build-presentation-kit": "tsx scripts/build-presentation-kit.ts"` (K3)
- `docs/AktaKasandry_obsidian/{TASK_LIST,DOCS_CHANGES_JOURNAL}.md`, work note (K6)
- *(already done at spec time: cross-link added to the session-companion spec)*

**Generated (gitignored, dry run K5)**
- `packages/ug2-prezentacja/{edytor.html, assets/audio/*.mp3}`, `packages/ug2-prezentacja.zip`

---

## Task list & dependency graph

| ID | Title | Depends on | Batch |
|---|---|---|---|
| **K1** | `kit-core.js` + Vitest suite | — (contracts pinned above) | A |
| **K2** | `edytor.html` 3-panel editor | — (uses pinned `__KIT__`/KitCore contracts) | A |
| **K4** | GM runbook | — (CLI contract in K3's spec below) | A |
| **K3** | `build-presentation-kit.ts` + npm script | K1, K2 | B |
| **K5** | UG2 end-to-end dry run | K3 (K4 as checklist) | C |
| **K6** | Docs | all | D |

**Parallel batches:** **A** = {K1, K2, K4} → **B** = {K3} → **C** = {K5} → **D** = {K6}.

---

## Batch A

### K1 — `scripts/kit-template/kit-core.js` (+ tests) · independent

**Files:** create `scripts/kit-template/kit-core.js`, `scripts/kit-template/kit-core.test.ts`.

`kit-core.js` is a plain-JS IIFE (`(function(){ ... globalThis.KitCore = {...} })()`), no
imports/exports — loadable as an inline `<script>` (injected by K3) **and** by Vitest via
`import './kit-core.js'` side effect + `globalThis.KitCore`. Implement exactly the pinned API.

Implementation notes:
- `escapeHtml` handles `& < > " '` (order: `&` first).
- `draftToEngineData`: every player-typed string (title, text, act name, portraitName) passes
  through `escapeHtml` — this is the spec-§4 guarantee; image refs resolve through the injected
  `resolveImage` callback (keeps KitCore free of `__KIT__` coupling and testable with stubs).
- `serializeSlidesJs`: build the three `const` statements; values via `JSON.stringify`
  (JSON is valid JS); then escape every `<` to `<` in the serialized output (same reasoning
  as `inlineJson` in `scripts/lib/package-data.ts`). `TRACKS` values are
  `AUDIO_BASE + '<file>'` expressions — generate them as string concatenations referencing the
  `AUDIO_BASE` const so the GM's publish switch is one line.
- `validateDraft`: shape-checks version (`!== 1` → error naming the version), arrays, template
  ids, actId references; returns all errors, never throws.

**Acceptance criteria**
- File runs in a browser as a classic script (no `export`, no `import.meta`); `tsc -b` stays
  clean (`.js` under `scripts/` isn't in the TS program — confirm, don't add it).
- All text in generated engine data is entity-escaped; `serializeSlidesJs` output contains no
  literal `<`.

**Tests (`kit-core.test.ts`)** — at minimum:
- `newDraft` → `validateDraft` ok; corrupt drafts (bad version, unknown template, dangling
  `actId`) → specific errors.
- `draftToEngineData`: each of the 5 templates maps to the right `kind`/fields; act → `act`
  label + `track`; no-music act omits `track`; `<script>alert(1)</script>` in a title comes out
  entity-escaped; `resolveImage` stub called for library refs, custom `dataUrl` passed through.
- `serializeSlidesJs`: output has `AUDIO_BASE`, `TRACKS`, `SLIDES`; `Function(output)` evaluates
  without throwing (smoke-parse); no literal `</script>` possible (assert no `<`).
- `collectImageRefs` dedupes; `draftByteSize` counts UTF-8 bytes (Polish diacritics).

---

### K2 — `scripts/kit-template/edytor.html` · independent

**Files:** create `scripts/kit-template/edytor.html`. Tokens for K3:
`__KIT_TITLE__` (multiple ok), `/*__KIT_DATA__*/null` (exactly once, sets `window.__KIT__`),
`/*__KIT_CORE__*/` (exactly once, replaced with kit-core.js source).

Single file: all editor CSS + JS inline. Cthulhu-flavored editor chrome (reuse the iter-2
package viewer's palette variables — deep teal `#0d2828` / parchment `#f5e6c8` / gold
`#c89b3c`, system serif stack). **Polish UI throughout**; graceful `Brak danych zestawu`
empty-state when `__KIT__` is null (raw template opened directly).

Behaviors (all specified in spec §3; key implementation points):
- **State**: one in-memory draft object; every mutation → render + debounced (500 ms) autosave
  to `localStorage['akta-kasandry:prezentacja-kit:' + slug]`; restore on load if
  `validateDraft` passes (else ignore + console.warn); `Zacznij od nowa` (confirm) resets.
  When `KitCore.draftByteSize(draft) > 4 MB`: persistent warning banner suggesting
  `Zapisz szkic (plik)`; wrap the `localStorage.setItem` in try/catch (quota) and surface the
  same banner on failure.
- **Slide list**: template picker as 5 labeled buttons on `+ Dodaj slajd`; per-row `▲ ▼ Usuń`
  (▲ disabled on first, ▼ on last; Usuń confirms); current slide highlighted.
- **Fields panel** re-renders per template (only that template's fields, per the spec table);
  image/portrait pickers open the **library overlay**: tabs `Sceny / Portrety / Moje` (custom
  uploads), thumbnail grid from `__KIT__.images` data-URLs + draft custom images; `Moje` tab
  hosts the `<input type="file" accept="image/*">` → `FileReader.readAsDataURL` (multi-file ok,
  warn per file > 1.5 MB: `Duży plik — szkic może przekroczyć limit autosave`).
- **Acts editor**: small section above the slide list — add/rename/remove acts, each with a
  track `<select>` from `__KIT__.tracks` + `(bez muzyki)`; removing an act in use blocks with a
  Polish message naming the slides.
- **Preview** (right): `<iframe>`; on current-slide change (debounced 300 ms), build a srcdoc:
  `themeCssEditor` + `baseCss` inline, minimal engine DOM scaffold (copy the `#show` markup
  from `public/prezentacja/ug2/index.html`), a data script with
  `TRACKS = {}` and `SLIDES = [<current slide via draftToEngineData>]`, `engineJs`, plus a
  bootstrap that calls `document.getElementById('btn-start').click()` on DOMContentLoaded
  (starts the engine's render(0) without auto-advance — its documented no-autoplay start).
- **Szkic**: `Zapisz szkic (plik)` → Blob download `szkic-<slug>.json`;
  `Wczytaj szkic` → file input → `validateDraft` → replace or Polish error naming the problems.
- **Eksport**: preflight `collectImageRefs` (any slide with no background on an image template →
  Polish warning listing slide numbers, allow continue); assemble the deck document as a
  template-literal string: `<!doctype html>` + `<style>` theme (**full** `themeCss`, with
  @import) + baseCss + engine DOM scaffold + `<script>` `serializeSlidesJs(engineData)` +
  `<script>` engineJs; `resolveImage` maps library refs to their data-URLs; Blob download
  `prezentacja.html`. Below the button, the standing Polish note: *"Do MG odeślij plik
  szkic-<slug>.json — na jego podstawie MG opublikuje prezentację na stronie."*

**Acceptance criteria**
- Raw template → empty state, no JS errors. With injected `__KIT__` (via K3): full flow works
  from `file://` with DevTools Network showing **zero** requests.
- Create a deck using each of the 5 templates; preview matches the exported deck's rendering
  for the same slide (same engine, same CSS — spot-check one slide side by side).
- Reorder/delete work with correct disabled states; refresh restores the autosaved draft;
  szkic export→import round-trips to a deep-equal draft.
- Export downloads a working standalone deck (full verification in K5).
- Text typed as `<b>test</b>` renders **literally** (escaped) in both preview and export.

*(No unit tests — all data logic is in K1; K2 is exercised by K5.)*

---

### K4 — GM runbook `docs/RUNBOOKS/presentation-kit.md` · independent

**Files:** create `docs/RUNBOOKS/presentation-kit.md` (English; player/GM paste-snippets in
Polish). Mirror the structure of `docs/RUNBOOKS/session-package.md`.

Sections: **Prerequisites** (gallery manifest exists for the slug; engine files present at
`public/prezentacja/ug2/`); **Step 1 build** (`npm run build-presentation-kit -- ug2`, what it
writes, expected sizes: editor ~5–6 MB, audio ~21 MB); **Step 2 zip** (out-dir-aware
`Compress-Archive` line, printed by the builder); **Step 3 Drive** (anyone-with-link viewer);
**Step 4 player instructions** — ready-to-paste Polish snippet: download, **unzip completely**,
open `edytor.html` (Chrome/Edge/Firefox), build slides, send back `szkic-<slug>.json`
(exported `prezentacja.html` is for their own viewing; music only plays while the file stays in
the kit folder); **Step 5 receive & publish (GM)** — the spec-§4 trust boundary spelled out as
procedure: import the player's `szkic.json` into your own kit copy → review every slide's text →
export → place as `public/prezentacja/<name>/index.html` → flip `AUDIO_BASE` to
`'../../audio/<slug>/'` (one commented line at the top of the deck's data script) → route
component mirroring `src/routes/UG2Presentation.tsx` + `INLINE_PAGES` entry + vault stub + hub
bullet (**dual-edit warning**, same as the session-package runbook); **Caveats** — never publish
a player-sent `prezentacja.html` verbatim (arbitrary HTML, same-origin with the site); webfonts
offline fallback; localStorage 4 MB guard meaning.

**Acceptance criteria** — a no-context reader can run the full loop; every command/path matches
K3's actual behavior; the trust-boundary step is impossible to miss (callout box).

---

## Batch B

### K3 — `scripts/build-presentation-kit.ts` (+ npm script) · depends on K1, K2

**Files:** create `scripts/build-presentation-kit.ts`; modify `package.json` (script entry).
`.gitignore` already covers `packages/`.

**CLI:** `npx tsx scripts/build-presentation-kit.ts <slug> [--out <dir>=packages]`
(npm form in the usage header). Behavior:

1. Read `public/gallery/<slug>.json`; exit 1 if missing (point at the `session-digest` skill).
   Validate the consumed fields structurally (caseKey/title strings; scenes/cast/tracks arrays
   with `src` strings) — do **not** import `src/lib/gallery/manifest.ts` (Vite-only `@/` alias
   + `import.meta.env`); note this in a comment.
2. For every scene + cast entry: read the file under `public/` (exit 1 naming any missing path),
   base64-encode → `images[]` entry (`id` = path basename sans extension, prefixed `cast-` for
   portraits to avoid collisions; `label` = caption/character name; `group` = scene|cast;
   `dataUrl` with the correct MIME from the extension). Warn (not fail) if the summed data-URL
   payload exceeds 12 MB.
3. Copy each track file to `packages/<slug>-prezentacja/assets/audio/<basename>`;
   `tracks[] = { file: basename, label: title }`.
4. Read engine sources from `public/prezentacja/ug2/` (`engine.js`, `base.css`,
   `themes/cthulhu.css`); derive `themeCssEditor` by stripping `@import` lines (regex on line
   start); read `scripts/kit-template/kit-core.js` and `edytor.html`.
5. Inject tokens (occurrence-count guards; **function-form replace only**):
   `__KIT_TITLE__` → `` `${manifest.title} — edytor prezentacji` ``; `/*__KIT_CORE__*/` →
   kit-core source; `/*__KIT_DATA__*/null` → `<`-escaped JSON of the `__KIT__` object (reuse
   `inlineJson` from `scripts/lib/package-data.ts` — import it, it's pure).
6. Write `packages/<slug>-prezentacja/edytor.html`; print summary (file sizes), the
   out-dir-aware zip command, the Drive hint, and a pointer to the runbook's player snippet.

**Acceptance criteria**
- `npm run build-presentation-kit -- ug2` produces the kit; `edytor.html` contains
  `window.__KIT__ = {` with no literal `</script>` inside injected payloads; 32 images embedded;
  5 tracks copied; token-drift and missing-file paths exit 1 with the specified messages;
  printed zip hint respects `--out`; `git status` clean of `packages/**`; `tsc -b` clean;
  zero network/Supabase access.

*(No unit tests — orchestration; pure parts are K1 + reused `inlineJson`. K5 is its test.)*

---

## Batch C

### K5 — UG2 end-to-end dry run · depends on K3 (K4 as checklist)

No new repo files. Execute the runbook as its first real run:

- [ ] Build the UG2 kit; record sizes (editor MB, assets MB).
- [ ] Open `packages/ug2-prezentacja/edytor.html` in a browser — **`file://` if the environment
      allows; otherwise local HTTP with an explicit note** (the editor does no fetches, so
      equivalent — same caveat pattern as the iter-2 dry run; the GM owes a true `file://` pass).
- [ ] Author a 6-slide deck exercising **all 5 templates** + 2 acts with different tracks +
      one **custom uploaded image** + Polish diacritics and an intentional `<b>xss</b>` in a
      title (must render literally).
- [ ] Verify: autosave survives a reload; szkic export → `Zacznij od nowa` → szkic import
      restores everything; 4 MB warning fires with a large upload (or lower the threshold
      temporarily via console to prove the path).
- [ ] Export `prezentacja.html`; move it **next to `assets/`**; open it: start screen → play:
      templates render, Ken Burns runs, act crossfade happens at the act boundary, music plays
      from `assets/audio/`, custom image shows, XSS string is literal text.
- [ ] Move the exported file to an empty temp dir and open: everything works **except** music
      (documented degradation — images are inlined, audio is relative).
- [ ] Simulate the GM publish path locally: copy the deck under
      `public/prezentacja/_kit-test/index.html`, flip `AUDIO_BASE` to `'../../audio/ug2/'`,
      `npm run dev`, open `http://localhost:5173/prezentacja/_kit-test/index.html` directly —
      engine plays with the **site's** audio. Then **delete `public/prezentacja/_kit-test/`**
      (nothing kit-related is committed; no route is added in this plan).
- [ ] Zip via the printed command; unzip to a fresh dir; reopen the editor from the unzipped
      copy. Record all measurements for K6.

**Acceptance criteria** — every box observed; the publish simulation proves engine-format
compatibility end-to-end; the test folder under `public/` is removed afterward (verify
`git status`).

---

## Batch D

### K6 — Docs · after all

**Files:** modify `docs/AktaKasandry_obsidian/TASK_LIST.md` (extend **Stage M** with a
"Presentation Kit" checklist — sibling deliverable, not a new stage; keep GM's manual actions
open: Drive upload, first real player round-trip), `DOCS_CHANGES_JOURNAL.md` (entry: decisions
incl. the trust boundary and the build-time data-URL rationale, dry-run measurements),
`work/2026-07-14-session-companion.md` (short cross-link section; the kit note itself can live
in a new `work/2026-07-15-presentation-kit.md` + `work/Index.md` line — follow
`LOGGING_INSTRUCTIONS.md`).

**Acceptance criteria** — docs match reality incl. measured sizes; Index links the new note;
the "never publish player HTML verbatim" rule appears in the journal entry verbatim.

---

## Verification (whole feature)

- `npx tsc -b` clean; `npm run test:run` green (new: `kit-core.test.ts`; all prior suites pass).
- K5's full checklist, including the XSS-literal check in preview AND export, the no-music
  degradation check, and the local publish simulation (then cleaned up).
- `git status`: no `packages/**`, no `public/prezentacja/_kit-test`, no site source changes.
- **No commit** — hand the working tree to the user.
