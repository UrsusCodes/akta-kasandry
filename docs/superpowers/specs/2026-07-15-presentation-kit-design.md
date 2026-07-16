# Presentation Kit — Design Spec (player self-service slide editor)

```yaml
---
date: 2026-07-15
status: active
tags: [spec, area/sessions, area/packages, area/presentations]
related: ["docs/superpowers/specs/2026-07-14-session-companion-design.md", "docs/superpowers/plans/2026-07-15-presentation-kit.md", "[[TASK_LIST]]"]
---
```

> Sibling deliverable to the **session companion** (see its spec §7 — interface table). Reuses
> two of its interfaces: the **gallery manifest** (`public/gallery/<slug>.json`) as the asset
> source, and the **local-package distribution model** (gitignored `packages/`, zip, GM's Google
> Drive) proven by the iter-2 session package.

## 1. Problem & shape

The GM can produce cinematic session presentations (`/prezentacja/ug2`, engine from the global
`cinematic-slideshow` skill), but players can't. Players have takes, favorite scenes, and their
own photos — and no tooling short of hand-editing `slides.js`.

**Presentation Kit** = a per-session, downloadable, self-service **slide editor** for players:

```
packages/<slug>-prezentacja/          (gitignored; zipped → GM's Google Drive)
  edytor.html      standalone vanilla-JS editor app (works under file://, no build, no network);
                   the image library (scenes + portraits from public/gallery/<slug>.json) is
                   EMBEDDED in it as base64 data-URLs at kit-build time — see §3.4 for why
  assets/
    audio/         music tracks ← from the manifest's "tracks" (audio stays on disk: it is
                   never inlined, and the exported deck references it relatively)
```

The player opens `edytor.html` locally, assembles a deck from **templates**, and exports either:

- **`szkic.json`** — the draft (small, data-only) → **this is what goes back to the GM**;
- **`prezentacja.html`** — a self-contained deck (engine + data + base64 images) for the
  player's own local viewing/sharing.

No new app on the site; no new dependency; no schema change; nothing committed under `packages/`.

## 2. Compatibility target — the cinematic-slideshow engine

The deck format is the **existing engine's contract**, verbatim (source of truth for the kit:
the in-repo copy `public/prezentacja/ug2/{engine.js, base.css, themes/cthulhu.css}`, which is
the deployed instance of `~/.claude/skills/cinematic-slideshow/template/`):

- `index.html` loads theme CSS + `base.css`, then a data script defining globals `TRACKS`
  (name → audio path) and `SLIDES` (ordered array), then `engine.js`.
- Slide fields used by the kit: `kind` (`title | image | card | end`), `image`, `portraits`
  (`[{img,name}]`), `title`, `text`, `act`, `dur`, `track`, `kb` (`in|out|left|right`), `fx`
  (`flash|pulse`), `night`. (`cast` grids, `sfx`, and `{q:true}` mystery portraits stay
  GM-authored — out of the kit's v1 UI, but harmless if present in a draft the GM edits.)
- Controls, crossfade, Ken Burns, start screen: engine as-is — **the kit never modifies
  engine.js**.

## 3. Editor design

### 3.1 Three panels (Polish UI, desktop-first)

1. **Lista slajdów** (left): ordered list, `+ Dodaj slajd` opens a **template picker**;
   per-slide `▲ ▼` reorder buttons and `Usuń` (with confirm). Deliberately **no drag & drop** —
   hand-rolled DnD is the most fragile part of a no-dependency editor and buttons are simpler
   and keyboard-friendly; revisit only on player feedback.
2. **Pola szablonu** (middle): the current slide's fields. Text inputs for title/text/act;
   **background and portrait chosen by CLICK from a thumbnail asset library** (thumbnails are
   the embedded data-URLs — see §3.4 — so the library renders with zero requests);
   Ken Burns picker (`przybliżenie / oddalenie / w lewo / w prawo / brak`), `night` checkbox,
   `fx` select, duration slider (4–12 s). **Music is assigned per act, not per slide**: the
   editor keeps an ordered **Akty** list (act name + track from the asset library); each slide
   picks its act; export derives `track` (and the `act` label) from it — matching how the GM's
   decks map one cue per act.
3. **Podgląd** (right): live preview of the current slide via **true engine rendering** — an
   `<iframe srcdoc>` rebuilt (debounced) from the embedded engine + theme + a one-slide
   `SLIDES` array, auto-started (programmatic click of the engine's start button), with
   `TRACKS = {}` so preview never plays audio. Chosen over a CSS approximation because the
   engine is embedded in the kit anyway and `srcdoc` needs no build step and no network; drift
   between preview and export becomes impossible.

### 3.2 Templates (five, mirroring the UG2 deck's real usage)

| Template (PL) | Engine mapping | Exposed fields |
|---|---|---|
| **Tytułowy** | `kind:'title'` + `image` | tło, tytuł, podtytuł, kb |
| **Przerywnik aktu** | `kind:'card'` | akt, tytuł, tekst, fx |
| **Obraz + tekst** | `kind:'image'` | tło, tytuł, tekst, portret (opcjonalny), kb, night, fx |
| **Cytat** | `kind:'image'` + `portraits` (speaker) | tło, portret mówiącego + podpis, cytat (text), kb |
| **Finał** | `kind:'end'` | tytuł, tekst |

Templates are an *editor* concept (they preset and constrain fields); the stored draft keeps the
template id so re-editing shows the right form, and the export maps to plain engine slides.

### 3.3 Drafts

- **Autosave** to `localStorage` under `akta-kasandry:prezentacja-kit:<slug>` on every change
  (debounced). On open: restore, with a `Zacznij od nowa` escape hatch.
- **Export/import szkic** as `szkic-<slug>.json` (Blob download / file input). Draft schema:
  `{ version: 1, slug, theme: 'cthulhu', acts: [{ id, name, track }], slides: [EditorSlide],
  updatedAt }` — versioned for forward migration.
- **Custom images** (player's own): `<input type="file">` → `FileReader` → base64 data-URL,
  stored in the draft and used directly in preview/export. localStorage practical limit is
  ~5 MB: the editor warns when the draft exceeds ~4 MB and suggests exporting `szkic.json`
  (autosave keeps working on a best-effort basis; the file export is the durable copy).

### 3.4 Export (`prezentacja.html`)

One button → assembles a **single self-contained HTML** and downloads it via a Blob URL (works
under `file://`): theme CSS + `base.css` + `engine.js` inlined; `SLIDES`/`TRACKS` serialized
from the draft; **all used images inlined as base64 data-URLs**. Why build-time embedding: the
editor itself *cannot* convert on-disk images to data-URLs at runtime — `fetch()` is blocked
under `file://`, and drawing a `file://` image to a `<canvas>` taints it (`toDataURL` throws
`SecurityError`). So the **kit builder** base64-encodes every gallery image once, at build
time, into the editor's embedded asset library (~5 MB for UG2's 32 images — acceptable for a
Drive download); the editor and the export then just reuse those data-URLs, and player uploads
are data-URLs from `FileReader` already.
**Music is not inlined**: `TRACKS` uses a single `AUDIO_BASE` constant (default
`'assets/audio/'`) + filenames, so the deck has sound when it sits in the kit folder, and the
GM edits that single `const AUDIO_BASE = "assets/audio/";` line when publishing. Rationale:
tracks are 3–10 MB each (UG2 total
~21 MB) — inlining would triple-carry audio the player already has, for no benefit on the
publish path (the site already hosts these tracks).

## 4. Trust boundary — the round trip (IMPORTANT)

The engine **interpolates slide text into HTML without escaping** (its `esc()` is a no-op —
verified in `public/prezentacja/ug2/engine.js`). A published deck runs same-origin with the
site (iframe of a static asset), where a Supabase session may exist. Therefore:

- **The player's return artifact is `szkic.json` (data), not the HTML.** An exported
  `prezentacja.html` from a player is an arbitrary HTML file and must be treated as such —
  never published verbatim.
- **The GM publishes by regenerating**: import the player's `szkic.json` into the GM's own kit
  (or hand it to the `cinematic-slideshow` skill), review the content, export locally, publish
  that. The kit's own export path **HTML-escapes every text field** (title, text, act, portrait
  captions) during serialization, so a kit-generated deck contains no player-authored markup —
  but the *regenerate-from-data* step is what makes the guarantee hold regardless of what file
  the player sends.
- Publishing steps (GM): drop the regenerated deck as
  `public/prezentacja/<name>/index.html`, copy/point audio (the `AUDIO_BASE` switch — e.g.
  `../../audio/ug2/`), add a route component mirroring `src/routes/UG2Presentation.tsx`
  (iframe + fullscreen + back-link, ~60 lines), an `INLINE_PAGES` entry, a vault stub, and the
  hub bullet (dual-edit: vault + `content.ts`). Documented in the runbook; a generic
  `PresentationPage` component is a possible later refactor, not required now.

## 5. Offline/network posture

`edytor.html` performs **zero network requests** (the kit builder strips the theme's Google
Fonts `@import` from the editor's embedded copy; display fonts fall back to the theme's serif
stack). The **exported deck keeps** the `@import` — identical to today's published decks: fonts
load when online/published, degrade silently to Georgia/serif offline. This is the single
permitted external reference, inherited from the engine theme, non-blocking by nature.

## 6. Kit generator

`scripts/build-presentation-kit.ts` (tsx; `npm run build-presentation-kit -- <slug>`), mirroring
`build-package.ts` conventions **including its review fixes** (function-form token replacement —
never `String.replace` with a raw string payload; out-dir-aware printed hints):

- Input: `public/gallery/<slug>.json` (the iter-1 manifest — scenes/cast/tracks with real
  repo paths). The builder validates the fields it consumes (it cannot reuse
  `src/lib/gallery/manifest.ts`, whose `@/` alias + `import.meta.env` are Vite-only).
- Copies referenced assets from `public/` into `packages/<slug>-prezentacja/assets/…`.
- Reads engine/base/theme from `public/prezentacja/ug2/` (in-repo canonical copy) and the
  editor template + kit-core logic from `scripts/kit-template/`, injects via tokens, writes
  `edytor.html`.
- Prints: sizes, the `Compress-Archive` zip command (out-dir-aware), Drive hint, and the
  player-facing Polish instruction snippet the GM can paste into chat.

## 7. Testable pure logic (Vitest)

Shared browser/Node logic lives in `scripts/kit-template/kit-core.js` — a dependency-free IIFE
assigning `globalThis.KitCore` (loadable both as an inline `<script>` with no build step and by
Vitest via side-effect import). Tested: draft schema validation/migration, template → engine
slide conversion (incl. act → track derivation and HTML-escaping of all text fields),
`serializeSlidesJs` (JSON-based, `<` escaped as `<`), image-reference collection for
export, and the localStorage size guard. The kit *builder* gets the same treatment as
`build-package.ts` (pure parts in `scripts/lib/`, orchestration untested, exercised by the dry
run).

## 8. Out of scope (v1)

- `cast`-grid, `sfx`, and `{q:true}` slides in the editor UI (GM-authored decks keep them).
- Themes other than **cthulhu** in the kit (engine supports them; kit pins the campaign look).
- Mobile editing; drag-and-drop reorder; multi-deck management inside one editor instance
  (one draft per slug); collaborative editing.
- Any site-side upload/inbox for returned drafts — the return channel is "send the GM a file"
  (Discord/mail), consistent with the campaign's existing Drive-and-links workflow.
