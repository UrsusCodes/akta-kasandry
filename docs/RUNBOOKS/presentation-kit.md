---
date: 2026-07-15
status: active
tags:
  - runbook
  - area/presentations
  - area/packages
---

# Runbook: presentation kit (player self-service slide editor)

Step-by-step for turning one session's gallery manifest into a downloadable,
self-contained **slide editor** for players — `edytor.html` (no build step, no
internet needed, works from `file://`) plus its music tracks, zipped and
uploaded to Google Drive, linked from the case hub. Players assemble their own
cinematic deck from templates and send back a small draft file; the GM
regenerates the real deck from that draft and publishes it on the site.

Estimated time: **10–15 minutes** for the build/zip/Drive/link loop; the
player's own editing session is separate and happens on their own time; the
GM's publish pass (Step 5) is another **10–15 minutes**.

Re-runnable per session, any time after that session's gallery manifest exists.

Design reference: `docs/superpowers/specs/2026-07-15-presentation-kit-design.md`
(§4 is the trust boundary this runbook exists to enforce).

---

## Prerequisites

- [ ] The session has a **gallery manifest**: `public/gallery/<slug>.json` exists
      (built by the `session-digest` skill), with `scenes[]` / `cast[]` /
      `tracks[]` pointing at real files under `public/`. Without it
      `build-presentation-kit` refuses to run.
- [ ] The engine files are present at `public/prezentacja/ug2/`
      (`engine.js`, `base.css`, `themes/cthulhu.css`) — this is the in-repo
      canonical copy of the `cinematic-slideshow` skill's template and the
      **source of truth** the kit builder reads from. The kit never modifies
      these files.
- [ ] `npm install` already run in this repo (you have `node_modules`).

> [!info] Producer boundary
> The kit only *reads* the gallery manifest and the engine files — both
> already live in this repo, read-only, no Supabase/network access. No new
> app is added to the site by building a kit; the site only changes later,
> in Step 5, when the GM manually publishes a regenerated deck.

---

## Step 1 — build the kit

In this repo (`akta-kasandry`):

```
npm run build-presentation-kit -- <slug>
```

Example for UG2:

```
npm run build-presentation-kit -- ug2
```

This reads `public/gallery/<slug>.json` and the engine sources under
`public/prezentacja/ug2/`, embeds every scene/cast image as a base64 data-URL
(so the editor needs zero network requests, including under `file://`), and
writes:

- `packages/<slug>-prezentacja/edytor.html`
- `packages/<slug>-prezentacja/assets/tracks-data.js` — every track,
  base64-encoded as a data-URI (`window.__KIT_TRACKS__`, basename → data
  URI), loaded by `edytor.html` via `<script src>` (works under `file://`,
  unlike `fetch()`). Kept as a sibling file rather than inlined into
  `edytor.html` itself, to keep the editor document lean; the **exported**
  deck (`prezentacja.html`) inlines the tracks it actually uses directly into
  its own `TRACKS` object, so it is fully self-contained — see Step 5.

The command prints a summary (file sizes), the exact zip command (Step 2),
and a reminder of the player-facing snippet (Step 4).

Expect roughly **5–6 MB** for `edytor.html` (UG2's 32 images inlined) and
**~21 MB** for `assets/tracks-data.js` (UG2's 5 tracks, base64-encoded — about
a third larger than the raw audio) — a ~26–27 MB kit folder before zipping.

---

## Step 2 — zip

The builder prints this command (out-dir-aware — it matches whatever
`--out` you passed, default `packages`); run it as-is (PowerShell, from the
repo root):

```
powershell -Command "Compress-Archive -Path packages\<slug>-prezentacja\* -DestinationPath packages\<slug>-prezentacja.zip -Force"
```

Example for UG2:

```
powershell -Command "Compress-Archive -Path packages\ug2-prezentacja\* -DestinationPath packages\ug2-prezentacja.zip -Force"
```

`-Force` overwrites an existing zip from a previous build. Same
no-Node-zip-library decision as the session package runbook — it doubles as
an "inspect before shipping" checkpoint.

---

## Step 3 — upload to Google Drive

- Upload `packages/<slug>-prezentacja.zip` to Google Drive (same folder you
  use for other campaign materials / session packages).
- Share it: **"Anyone with the link" → Viewer**.
- Copy the shareable link — you'll paste it into the chat message in Step 4.

---

## Step 4 — send player instructions

Paste this into chat/Discord with the players, replacing `<DRIVE-URL>` and
the slug/title:

```
🎬 Chcesz zmontować własną prezentację z sesji „Urodzaj Grozy"? Masz do
tego gotowy edytor:

1. Pobierz i **w całości rozpakuj** ZIP: <DRIVE-URL>
2. Otwórz plik `edytor.html` w przeglądarce (Chrome / Edge / Firefox).
3. Ułóż slajdy z gotowych zdjęć/portretów albo wgraj własne, dodaj muzykę
   do aktów, zobacz podgląd na żywo.
4. Gdy skończysz: kliknij **„Zapisz szkic (plik)"** i odeślij mi plik
   `szkic-<slug>.json` (Discord/mail) — na jego podstawie opublikuję
   prezentację na stronie.

Uwaga: przycisk „Eksportuj prezentację" robi gotowy plik HTML do
**własnego** oglądania — muzyka jest w nim wbudowana, więc plik gra
niezależnie od tego, gdzie go przeniesiesz (np. do folderu Pobrane). Do mnie
wraca **szkic** (`szkic-<slug>.json`), nie ten wyeksportowany plik HTML.
```

---

## Step 5 — receive & publish (GM)

> [!warning] Trust boundary — never publish a player's HTML verbatim
> The cinematic-slideshow engine interpolates slide text into the page
> **without HTML-escaping it**. A published deck runs same-origin with the
> live site (it's an iframe of a static asset, and a Supabase session may
> exist in that browser tab). A player-exported `prezentacja.html` is
> therefore an **arbitrary HTML file**, not trusted content — never copy it
> straight into `public/prezentacja/`, no matter how it looks when opened
> locally.
>
> **The only artifact you accept from a player is `szkic.json`** (data, not
> markup). You regenerate the deck yourself from that data — the kit's own
> export path HTML-escapes every text field (title, text, act, portrait
> captions) during serialization, so a kit-generated deck can never contain
> player-authored markup. The escaping happens in your regeneration step,
> not in anything the player sent you.

1. **Import.** Open your own kit copy (`packages/<slug>-prezentacja/edytor.html`,
   or build a fresh one via Step 1) and use **„Wczytaj szkic"** to load the
   player's `szkic-<slug>.json`.
2. **Review.** Read through every slide's text and act/track assignment in
   the editor. This is the actual security boundary — do it before
   exporting, not after.
3. **Export.** Click **„Eksportuj prezentację"** to produce a fresh,
   GM-reviewed `prezentacja.html`.
4. **Place it.** Copy the exported file to
   `public/prezentacja/<name>/index.html` (`<name>` is a new slug/folder,
   distinct from the kit's own `<slug>` if you're publishing a
   player-remixed cut alongside the GM's original deck). No audio step is
   needed here — the exported deck inlines every track it uses as a base64
   data-URI directly in its `TRACKS` object, so it plays correctly from any
   location, including `public/prezentacja/<name>/`, with no `assets/`
   folder alongside it.
5. **Add a route.** Copy `src/routes/UG2Presentation.tsx` to a new component
   for `<name>` (swap the `SRC` path and the back-link), then wire it in
   the same two places UG2's does:
   - `src/router.tsx` — add `{ path: 'prezentacja/<name>', element: <YourPresentation /> }`
   - `src/routes/NodeView.tsx` — add an `INLINE_PAGES` entry so the case's
     vault stub page renders the component inline (see the existing
     `'sprawy\02-urodzaj-grozy\03-prezentacja': UG2Presentation` line for
     the pattern).
6. **Vault stub + hub bullet.**

> [!warning] Dual-edit — do not paste in only one place
> Same lesson as the session-package runbook: the site's tree/hub content
> is generated from the vault but committed as a static mirror in
> `src/generated/content.ts`. Add the vault stub page (so the tree/INLINE_PAGES
> path resolves) **and** add the hub bullet in **both**:
> 1. **Vault stub page** — a thin page under the case's folder in the GM's
>    content vault (e.g. `PUBLIC/SPRAWY/<case>/0X presentation-page.md`),
>    matching the `INLINE_PAGES` path from step 5.
> 2. **Site mirror** — the hub page's `body` field in
>    `src/generated/content.ts` (search for the hub's `path`) gets the
>    matching bullet linking to `/p/sprawy/<case>/0X-...`.

A generic `PresentationPage` component (parameterized instead of copy-pasted
per case) is a reasonable later refactor once there's more than one
published kit-derived deck — not required for the first one.

---

## Caveats

- **Never publish a player-sent `prezentacja.html` verbatim.** Covered above
  in Step 5's warning — repeating it here because it's the one rule in this
  runbook that must never be skipped, even "just this once" or "I read
  through it and it looked fine."
- **Exported decks are self-contained (audio inlined).** `prezentacja.html`
  embeds every track actually used by the draft as a base64 data-URI right
  in its `TRACKS` object — it plays correctly from anywhere the file ends up
  (a player's Downloads folder, `public/prezentacja/<name>/`, anywhere else),
  with no `assets/` folder needed alongside it. This is what the kit's
  `assets/tracks-data.js` (`window.__KIT_TRACKS__`) exists for — see Step 1.
- **Webfonts fallback.** `edytor.html` makes zero network requests (the kit
  builder strips the theme's Google Fonts `@import` from the editor's
  embedded CSS copy) — the editor's own display falls back to the theme's
  serif stack. The **exported/published deck keeps** the `@import`,
  identical to today's decks: fonts load when online, degrade silently to
  Georgia/serif offline. This is the single permitted external reference in
  either file, inherited from the engine theme, non-blocking by nature.
- **localStorage 4 MB guard.** The editor autosaves the draft to
  `localStorage` on every change. Browsers cap `localStorage` around ~5 MB
  per origin; the editor warns once the draft (mostly custom-uploaded
  images) crosses ~4 MB and points at **„Zapisz szkic (plik)"** as the
  durable copy. Autosave keeps working best-effort past that point, but
  don't rely on it — if a player reports a warning, tell them to save the
  file and keep it somewhere safe rather than trusting the browser.
- **Re-running overwrites.** Running `build-presentation-kit` again for the
  same slug overwrites `packages/<slug>-prezentacja/` in place. If you need
  to keep an older kit build around, rename/move the folder or zip first.
- **`packages/` is never committed** — gitignored, same as the session
  package. The zip and its Drive link are the only durable distribution
  artifact.

---

## What this unlocks

After this runbook completes:

- Players have a self-service tool to cut their own cinematic recap of a
  session, using the same engine and art as the GM's decks.
- The GM stays the sole publisher: nothing a player builds reaches the live
  site without passing through the GM's own kit copy and review (Step 5).
- The `cinematic-slideshow` engine and its published decks are untouched —
  the kit is purely an authoring front-end that happens to speak the same
  data format.
