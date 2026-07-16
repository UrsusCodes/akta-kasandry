---
date: 2026-05-19
status: active
tags:
  - memories
  - akta-kasandry
---

# Project: Akta Kasandry

Web wiki/CMS for the Call of Cthulhu campaign **Rozdarte Sumienie** (Polish adaptation, set in Boston 1924). Primary purpose: publish the GM's Obsidian vault to a player-facing website, let players read and (in marked sections) edit pages with version control, and provide an interactive Boston map with pins.

## What this dev vault is (and isn't)

- **Is:** documentation for building the *web app* — the publishing pipeline, the editing layer, the UI.
- **Is not:** the campaign content itself. Campaign material (NPCs, sessions, locations, rules, scenarios) lives in the **content vault** at `G:\My Drive\OBSIDIAN\RPG\Zew Cthulhu\` (Google-Drive synced across the GM's devices).

## Three tiers of content (bigger picture)

The full system has three audiences. This project (the web app) addresses tiers 2 and 3:

1. **GM-only** — full content vault on the GM's local Obsidian, synced via Google Drive. Out of scope for this app.
2. **Player-readable** — the `PUBLIC/` subset of the vault gets auto-published to a static site. *This app builds that site.*
3. **Player-editable** — marked pages can be edited online by players; edits land in Supabase with revision history; the GM manually approves promotion back into the local vault. *This app provides the editing UI and approval flow.*

## Primary scope (user-emphasised)

**UX/UI is the primary deliverable.** The user explicitly said the shape of the page players see — UX and UI — is the most important part of this project, ahead of pipeline and editing layer.

## Stack (locked, mirrors coc-creator)

- React 19 + TypeScript + Vite
- TailwindCSS v4
- Supabase JS SDK (`@supabase/supabase-js`) — auth, db, storage, realtime
- react-hook-form + zod for forms
- zustand for state
- react-router-dom v7
- Markdown: react-markdown + remark-gfm + plugins for wikilink conversion
- Map: react-leaflet (imageOverlay for Boston map)
- **Testing (devDependencies, approved 2026-06-26):** Vitest + jsdom + @testing-library/react + @testing-library/jest-dom + @testing-library/user-event + @testing-library/dom

Rationale: coc-creator (sister project) is already on this stack and shares the Supabase project. No deviation without explicit user approval.

## Critical external dependencies & coordination

### Shared Supabase project (with coc-creator)

- Same project URL + ANON_KEY as coc-creator (user supplies via `.env`)
- **Isolation via schema `wiki`** — all our tables live there (`wiki.pages`, `wiki.revisions`, `wiki.pins`, `wiki.profiles`, `wiki.imported_characters`, `wiki.comments`, `wiki.investigation_cast`)
- **Auth: NOT shared / no SSO** (corrected 2026-06-26 after coc-creator code review). coc-creator is not on Supabase Auth — its players live in `public.players` (bcrypt + custom JWT), `auth.users` is empty. Akta Kasandry uses Supabase Auth independently; MG provisions player accounts. SSO was declined 2026-05-21 (option #1). The earlier "shared SSO" line was an unrealised assumption.
- **Synthetic-email login pattern** (2026-06-27): player accounts use the email form `<login>@kasandra.local` (Auto-Confirmed by MG in the dashboard). The Login screen shows a plain "Login" field; `loginToEmail()` in `src/stores/auth.ts` appends `@kasandra.local` before calling `signInWithPassword`. MG account `storage.station2023@gmail.com` bypasses this (full email entered directly — the `@` check in `loginToEmail` lets it pass through unchanged).
- **Player credentials** are stored LOCAL-ONLY in gitignored `secrets/player-credentials.md`. The repo is PUBLIC — never commit that file. 6 accounts provisioned 2026-06-27: nika, rafalg, piotrs, pawel, kamilk, jakubm.
- **Commentable pages so far** (2026-06-27): `streszczenie/ug2` (UG2Summary route) and `streszczenie/ug2/narracja` (UG2Narracja route). Both share the investigation cast key `streszczenie/ug2`. Adding comments to other pages requires a stable `page_key` and that route to render via `AnnotatableArticle`.
- Storage: dedicated bucket `wiki-attachments` (GM uploads image library, players read-only)
- Free tier — watch egress (especially realtime channels on map pins)
- Coordination doc: `coc-creator/docs/CoCCreator_obsidian/TECHNOLOGY_MASTERMIND.md`, section **"Shared Supabase with akta-kasandry"** — read before touching any shared schema/auth/storage

### Reference repo

- `github.com/UrsusCodes/coc-creator` — same-stack sister project; consult via `gh` CLI when stack patterns are unclear
- coc-creator has **no equivalent dev vault** — it's an older project; only its code and TECHNOLOGY_MASTERMIND.md are relevant here

### PoC reuse (`C:\temp\bookstack-test\`)

Older BookStack PoC. Salvage these assets:

- `cthulhu-skin-minimal.html` — palette + fonts → port to Tailwind v4 theme (stage B)
- `static/boston-map.html` + `boston-map-pins.json` — Leaflet viewer with view + edit mode → port to React component (stage E)
- `import.py` — markdown importer with wikilink conversion, image handling, asterisks cleanup → rewrite in Node or invoke as Python CLI (stage C)

### Content vault

- `G:\My Drive\OBSIDIAN\RPG\Zew Cthulhu\` — GM's master Obsidian vault
- `G:\My Drive\OBSIDIAN\RPG\Zew Cthulhu\PUBLIC\` — published subset (mirror structure: Shelf=L1, Book=L2, Chapter=L3, Page=`.md`)
- `G:\My Drive\OBSIDIAN\RPG\Zew Cthulhu\CLAUDE.md` — vault conventions (Polish characters, wikilinks, folder structure)
- `G:\My Drive\OBSIDIAN\RPG\Zew Cthulhu\boston-map-1924.jpg` — 7803×11702, 13MB; commit into this repo at `public/maps/boston-map-1924.jpg` (don't re-fetch on build)

### rpg-recorder (transcript data producer) `#dep/rpg-recorder`

- `C:\Users\Pawel\rpg-recorder` — sister project that records/transcribes RPG sessions from multiple mics and produces **transcript overlay JSON** (full transcript + competing-mic chunks + attribution probabilities).
- **Boundary:** rpg-recorder = producer, Akta Kasandry = consumer. Single interface = `<slug>-<variant>-overlay.json`, spec at `rpg-recorder/outputs/transcript-viz/data/SCHEMA.md` (mirrored to `src/lib/transcripts/overlay.ts` — do not invent fields).
- The audio/Whisper/attribution pipeline is **not** in this repo. New sessions are produced there and arrive as overlay JSON + a `variants.json` entry. Adding a session here is data-only (no code change).
- Powers the `/sesje` viewer (stage I). Details: [[work/2026-06-19-transcript-viewer-port]].
- **2026-06-22:** viewer is now **read-only on the production variant**; two **session summaries** live (demo routes, to move into the vault): Sól w Ranach (`/streszczenie-demo` + `/cytaty`) and UG 2 (`/streszczenie-ug2` + `/narracja`), with `{sesja:<slug>#<id>}` deep-links. Both sessions end seeding the **Klub / Akta Kasandry** (Sól: Kate = Cassandra Hollister; UG 2: Cassandra Club recruitment).

> [!warning] Read transcript data the right way — two sessions have off-tape gaps
> The epoch `start` clock is a stretched wall-clock, NOT audio time — histogram by `play.start` (or use the concat variant); read a single channel (GM) for chronological plot. **Sól w Ranach lost its climax to a recorder software error; UG 2 lost the night-recon + first shootout to a recording pause** — both must be filled from GM memory. Full lessons + lost-content map: [[work/2026-06-22-transcript-data-lessons]].

> [!info] Transcript audio is not hosted here
> Per-channel Opus (~300 MB/session) is intentionally NOT committed/streamed. Each chunk shows `chNN @ mm:ss`; the GM fills `public/transcripts/data/audio-links.json` with shareable (Google Drive) links for manual seeking. Note this is the one place the project's "no audio/video embeds" exclusion is relaxed — and only as external links, not hosted media.
>
> **2026-07-14 — resolved.** The old "revisit GitHub Releases / R2 if in-browser playback is wanted" question is answered: don't. Instead, the **session companion Iteration 2** (see below) ships a **downloadable per-session package** — self-contained `index.html` + a concat-mix Opus audio sibling, zipped and hosted on the GM's Google Drive, opened locally. `/sesje` itself stays audio-free, the always-on deep-link fallback.
>
> **2026-07-15 — the package model is now real (Iteration 2 shipped).** Pipeline: `npm run build-package -- <slug> --audio <mix>` (`scripts/build-package.ts` + pure `scripts/lib/package-data.ts` + vanilla `scripts/package-template/template.html`) → gitignored `packages/<slug>/` → PowerShell `Compress-Archive` (printed, not executed) → GM uploads to Drive. The concat-mix ffmpeg command lives in `docs/RUNBOOKS/session-package.md` and **runs in rpg-recorder's tree** (producer boundary — a proper export script there is on *their* backlog); the UG2 mix exists at `C:\Users\Pawel\rpg-recorder\outputs\transcript-viz\audio\ug2\ug2-mix.opus` (36.8 MB, duration matches the overlay to the ms). UG2 end-to-end dry run passed (seek verified at 3 scenes; zip 36.9 MB; unzip-and-reopen OK). **GM still owes (open in [[TASK_LIST]]):** acoustic spot-check + a real `file://` open from disk, Drive upload of `packages/ug2.zip`, and pasting the generator's hub bullet into **both** vault `00 HUB.md` and `src/generated/content.ts`.
>
> **2026-07-15 — the session vault is now the standard first step (shipped, same day).** The
> package model above (transcript tool + audio) and the presentation kit are now both
> **bundled** into a per-session Obsidian folder, `npm run build-session-vault -- <slug>
> --audio <sala-mix>`, that also carries the digest draft rewritten for offline correction —
> see the "Session vault" section below for the full contract (deep-link restore comments,
> out-of-range scene fallback, reuse of both builders) and [[TASK_LIST]] for open GM items.
> `rozdarte-sumienie` is the first session to go through rpg-recorder → overlay →
> `session-digest` → all three builders in sequence; its overlay
> (`public/transcripts/data/rozdarte-sumienie-current-overlay.json`, concat, ~7 h 30 m, 4449
> utterances, 7 speakers incl. a "Sala" channel), Sala mix
> (`packages/_audio-src/rozdarte-sumienie-sala.opus`, gitignored), real media
> (`public/img/rozdarte-sumienie/` + `public/audio/rozdarte-sumienie/`, ~32 MB combined),
> scene-index, and gallery manifest all now exist in this repo — the vault built from them
> lives (gitignored) at `packages/rozdarte-sumienie-vault/`.

### 2026-06-26 — Session presentations, case hubs, reusable slideshow skill

- **Cinematic presentation system.** Self-contained, themeable, music-driven slideshow lives at `public/prezentacja/ug2/`, embedded on the site at React route `/prezentacja/ug2` (iframe + fullscreen + back-to-case). Packaged as a **global, reusable skill** `~/.claude/skills/cinematic-slideshow/` (engine + 4 themes: cthulhu/strahd/fantasy/neon + guides) — use it for other sessions/aesthetics. Spec: `docs/superpowers/specs/2026-06-26-ug2-presentation-design.md`.
- **Decision — presentation audio is committed** to the repo (`public/audio/`, ~21 MB, un-ignored) so the live deck has sound; GM confirmed rights. Separate from the transcript "no hosted audio" rule above.
- **Sessions are wired into SPRAWY case hubs.** Each session case has a `00 HUB` vault page + thin stub sub-pages; the sidebar tree lists all sub-pages and `NodeView` special-cases their paths to render the rich React views inline (transcript sub-page redirects to `/sesje`). Pattern mirrors the Boston-map special-case (`INLINE_PAGES`/`REDIRECT_PAGES` in `NodeView.tsx`).
- **Sól w Ranach is hidden from players** (vault folder `_04 SÓL W RANACH`, excluded by the leading `_`; filtered from `/sesje`). Reversible. Only Urodzaj Grozy is player-visible for now.
- **Naming canon (UG 2):** Blackwater Creek, Damien/Brendan Carmody, Henry/Abigail Roades, Ernest McTavish, Jarveyowie, Stary Pete, Dick Sprouston, **Dr Arthur Henry Corwin**, **Elaine** Howard, **Klub Kasandry**. Lore: farm creature = transformed Brendan; the Mother = Abigail Roades (Shub-Niggurath); Mortimer survives insane; epilogue window figure = Brock.

### 2026-07-14 — Session companion (Stage M; Iteration 1 shipped 2026-07-14, Iteration 2 + presentation kit + session vault shipped 2026-07-15, Iteration 3 spec-only)

- **Architecture decision — "no new app."** Generation for session content (summary drafts,
  "Pytania i wątpliwości", scene-index, gallery manifests, and folding player feedback back in)
  lives entirely in **Claude Code skills outside the app**: `.claude/skills/session-digest/` and
  `.claude/skills/session-feedback/` (both project skills — Akta-specific house style / file
  layout, not global). The app never calls an LLM at runtime; it only **renders** the skill's
  output (`.tsx` summary edits, `public/gallery/<case>.json`, `public/transcripts/scene-index/<slug>.json`).
  This restates, and does not reverse, the existing "AI-generated content — separate tooling"
  exclusion below.
- **`scripts/fetch-comments.ts`** — read-only, anon-key (public `wiki.comments` via RLS) helper
  the `session-feedback` skill uses to pull a page's comment threads, grouped by anchor `blockId`.
  No secret; never writes to Supabase.
- **Session gallery** — data-driven, `public/gallery/<case-key>.json` (zod-validated manifest:
  scenes/cast/tracks/links) rendered by `src/components/gallery/SessionGallery.tsx` + an in-house
  `Lightbox.tsx` (no new dependency). First manifest `ug2.json`, wired into the content tree as
  `sprawy/02-urodzaj-grozy/05-galeria`, same `INLINE_PAGES`/vault-stub pattern as the other UG2
  case sub-pages (2026-06-26).
- **UG2 "Pytania i wątpliwości" pilot** — 5 open questions appended to `UG2Summary.tsx`, each its
  own paragraph so `remarkBlockIds` gives each a distinct, individually-commentable
  `data-block-id` (reuses the Stage L margin-comment mechanism with zero extra wiring).
  **GM-review-pending** before deploy; once players comment, question **text is append-only**
  (editing the text changes the hash and orphans existing comments) — this is now a standing
  contract, not just a one-off caveat.
- **Package model (Iteration 2 — shipped 2026-07-15)** — see the rpg-recorder audio callout above
  for the full state: generator + standalone vanilla viewer + GM runbook
  (`docs/RUNBOOKS/session-package.md`) exist; UG2 package built and verified end-to-end; hosted-audio
  approaches (R2/GitHub Releases) stay ruled out. `/sesje` is unaffected. Plan:
  `docs/superpowers/plans/2026-07-15-session-companion-iter2.md`.
- **Session vault (shipped 2026-07-15)** — the new **first-pass distribution model**: a
  per-session, self-contained Obsidian folder (`packages/<slug>-vault/`) that bundles the
  rewritten digest draft, a free-form notes file, the transcript tool, and the presentation
  kit, handed to **one assigned player** as the correction owner before anything from that
  session is published. Reuses the session-package and presentation-kit builders as exported
  functions (`buildSessionPackage`/`buildPresentationKit`) rather than duplicating either.
  Full state (deep-link restore contract, out-of-range scene rule, `rozdarte-sumienie` as the
  first full-pipeline worked example) is in the "Session vault" section below and
  [[work/2026-07-15-session-vault]]. Plan: `docs/superpowers/plans/2026-07-15-session-vault.md`.
- **tldraw approved-but-deferred (Iteration 3, spec only)** — the one pre-approved future
  dependency beyond the locked stack (still needs explicit go-ahead when actually scheduled),
  reopening the old "in-browser Excalidraw editor" exclusion in tldraw's favour. New `wiki.boards`
  table (scene jsonb, last-write-wins, no history) would need the coc-creator shared-Supabase
  coordination guardrail before any DDL.
- Design: `docs/superpowers/specs/2026-07-14-session-companion-design.md`; plan (Iteration 1):
  `docs/superpowers/plans/2026-07-14-session-companion-iter1.md`; work note:
  [[work/2026-07-14-session-companion]].

### 2026-07-15 — Presentation kit (player self-service slide editor, shipped)

- **What it is.** A generated, self-contained folder per session — `edytor.html` (a 3-panel
  Cthulhu-skinned slide editor, no build step) + `assets/audio/*.mp3` — that lets a player build
  their own cinematic recap deck from a session's gallery art, using the existing
  `cinematic-slideshow` engine (`public/prezentacja/ug2/{engine.js,base.css,themes/cthulhu.css}`,
  read-only, never modified by the kit). Distributed the same way as the Iteration-2 session
  package: zipped, hosted on the GM's Google Drive, never the site.
- **Where it lives in the repo:** `scripts/kit-template/kit-core.js` (pure logic,
  `globalThis.KitCore`) + `scripts/kit-template/edytor.html` (the editor template) +
  `scripts/build-presentation-kit.ts` (the generator). Generated output is gitignored under
  `packages/<slug>-prezentacja/`, same as the session package's `packages/<slug>/`.
- **Builder command:** `npm run build-presentation-kit -- <slug> [--out <dir>]`, e.g.
  `npm run build-presentation-kit -- ug2`. Reads `public/gallery/<slug>.json` (must already
  exist — built by the `session-digest` skill) plus the engine sources; writes
  `packages/<slug>-prezentacja/edytor.html` (~5 MB, images inlined as base64 data-URLs) and
  `packages/<slug>-prezentacja/assets/audio/*.mp3` (~20 MB, copied not inlined). Full steps
  (build → zip → Drive → player instructions → GM publish): `docs/RUNBOOKS/presentation-kit.md`.
- **Trust boundary (do not weaken):** the round-trip artifact between player and GM is
  **`szkic.json`, never the exported `prezentacja.html`**. The `cinematic-slideshow` engine
  interpolates slide text into the DOM without HTML-escaping it, and a published deck runs
  same-origin with the live site — so a player-exported HTML file is arbitrary, untrusted markup.
  **Never publish a player-sent `prezentacja.html` verbatim.** The GM instead imports the
  player's `szkic.json` into their own kit copy, reviews every slide's text, and re-exports;
  `KitCore.escapeHtml` / `serializeSlidesJs` guarantee that re-export can never carry unescaped
  player-authored markup, because the escaping happens in the GM's own regeneration step, not in
  anything the player produced directly.
- **UG2 dry run (2026-07-15) found and fixed a real bug**, not just a caveat: `kit-core.js` had a
  source **comment** containing the literal string `</script>`, which truncated the injected
  editor `<script>` block in the browser's HTML tokenizer (dead editor, no console error). Fixed
  by rewording the comment and adding a build-time drift guard in `build-presentation-kit.ts`
  that asserts no injected payload contains a literal `</script` before writing the file. After
  the fix, the full checklist passed clean (93/93 tests, `tsc -b` clean); the GM still owes a
  true `file://` open from disk (verification here ran over local HTTP — sandbox rejects
  `file://`, template does zero fetches either way).
- Design: `docs/superpowers/specs/2026-07-15-presentation-kit-design.md`; plan:
  `docs/superpowers/plans/2026-07-15-presentation-kit.md`; runbook:
  `docs/RUNBOOKS/presentation-kit.md`; work note: [[work/2026-07-15-presentation-kit]].
- **Audio self-containment fix (same day, 2026-07-15).** An exported/edited deck moved away
  from its build-time `assets/audio/` folder lost its music (tracks were relative-path
  references, not embedded). Fixed by base64-encoding every used track into a sibling
  `assets/tracks-data.js` (`window.__KIT_TRACKS__`), loaded by both the editor's live preview
  and the exported deck's own script; added a "Posłuchaj" track-preview button in the editor.
  The runbook's old `AUDIO_BASE`-edit publish step is gone — a reviewed export is now a
  straight file copy.

### 2026-07-15 — Session vault (per-session Obsidian review package, shipped) — new first-pass distribution model

- **What it is.** A generated, self-contained **Obsidian vault folder** per session —
  `packages/<slug>-vault/` — that bundles the `session-digest` skill's draft summary
  (rewritten into Obsidian-safe markdown), a guided free-form notes file
  (`Komentarz do AI.md`), the Iteration-2 transcript tool, and the presentation kit, all in
  one zip. This is now **the standard first step for any finished session**, before a single
  word of it reaches the live site: one assigned player reads it end-to-end in their own
  Obsidian, corrects names/scene order/"what really happened", and answers the digest's open
  questions offline, with the full transcript and (optionally) synced audio at hand. The
  GM later feeds the corrected result back through Akta's AI to produce a reviewable
  site-publish draft — never auto-applied, same posture as `session-feedback`.
- **Where it lives in the repo:** `scripts/lib/vault-summary.ts` (pure Obsidian-markdown
  rewrite logic) + `scripts/lib/vault-manifest.ts` (pure file plan) +
  `scripts/vault-template/**` (static Polish templates) + `scripts/build-session-vault.ts`
  (the generator, `npm run build-session-vault -- <slug> [--summary] [--audio] [--out]`).
  Generated output is gitignored under `packages/<slug>-vault/`, same pattern as the other
  two builders' output.
- **Reuses, never reimplements, the other two builders.** `scripts/build-package.ts` and
  `scripts/build-presentation-kit.ts` were refactored (behavior-preserving) to export
  `buildSessionPackage`/`buildPresentationKit` with an explicit `outDir`; the vault builder
  calls both in place to populate `Narzędzia/transkrypt/` and `Narzędzia/prezentacja/`. A fix
  to either tool automatically benefits every vault built afterward.
- **Deep-link restore contract (do not weaken):** `{sesja:<slug>#<id>}` becomes a visible
  `(scena N · ~H:MM:SS)` label plus a hidden `<!--rs:id-->` HTML comment — invisible in
  Obsidian's reading view, but exactly the string Akta's AI needs to restore the original
  site token later, losslessly, with zero manual re-linking. Range tokens get both clocks and
  `<!--rs:from..to-->`. If a restore comment is ever lost, the un-rewritten draft in
  `docs/superpowers/drafts/` remains the source of truth to re-derive it from. An unknown
  deep-link id makes the build **fail loudly** (throws, names the id) rather than ship a dead
  link.
- **Out-of-range anchors resolve to the *preceding* scene, flagged inexact (`~N`).** Verified
  against real data during planning: 20 of the rozdarte-sumienie draft's 55 distinct
  deep-link anchors fall outside every scene-index range, so simple containment isn't enough
  — `sceneForIndex` (in `vault-summary.ts`) walks scenes ascending and returns the last one
  that had already started.
- **Builder enhancement beyond the original plan:** the vault builder copies the session's
  gallery scene/cast images straight into vault `Media/` at build time, so the rewritten
  summary's `![[...]]` embeds resolve immediately for anything already in
  `public/gallery/<slug>.json` — `Media/` still exists as a genuine drop-zone for anything
  the gallery doesn't have yet, and re-running the builder (always a clean rebuild, never a
  patch) picks up both sources.
- **`rozdarte-sumienie` — first session through the full pipeline, end to end** (shipped
  2026-07-15, same session). rpg-recorder → overlay → `session-digest` draft → `build-package`
  / `build-presentation-kit` / `build-session-vault`, all run against real data for the first
  time in sequence. The session's audio arrived as **4 separate recorder runs**, which
  triggered a stitch bug in rpg-recorder's overlay assembly; the overlay used here
  (`public/transcripts/data/rozdarte-sumienie-current-overlay.json`) was rebuilt working
  around that bug by hand — the fix itself belongs in rpg-recorder (producer side of the
  boundary) and is a backlog note there, not addressed in this repo. Resulting data, all real
  and living in this repo's working tree:
  - **Overlay:** concat timeline, ~7 h 30 m (27023.4 s), 4449 utterances, 7 speakers (6
    players/GM + a dedicated **"Sala" room-mic channel**).
  - **Sala concat mix:** `packages/_audio-src/rozdarte-sumienie-sala.opus` (102.8 MB,
    gitignored, producer-boundary input — same shape as the UG2 mix).
  - **Digest draft:** `docs/superpowers/drafts/2026-07-15-rozdarte-sumienie-summary.md` (60
    deep-link tokens; several character names explicitly flagged uncertain — **GM still
    owes resolving these**).
  - **Scene-index:** `public/transcripts/scene-index/rozdarte-sumienie.json`, 16 scenes.
  - **Gallery manifest:** `public/gallery/rozdarte-sumienie.json` — 20 scenes/handouts, 10
    cast, 8 tracks.
  - **Real media committed:** `public/img/rozdarte-sumienie/` (31 files, 6.7 MB: 10 scene
    photos, 10 cast portraits — Fisk, Kent, Gundberg, Tommy Malone, etc. — and 11
    tome-handout `.webp` pages) and `public/audio/rozdarte-sumienie/` (8 tracks, 26 MB) —
    compressed from a ~180 MB source down to ~32 MB combined.
  - **Vault built:** `packages/rozdarte-sumienie-vault/`, ~153 MB (zip ~103 MB), dominated by
    the bundled transcript tool's Sala audio.
- **GM still owes:** an Obsidian visual open of `packages/rozdarte-sumienie-vault/` (the one
  verification step the sandbox couldn't perform), resolving the draft's remaining uncertain
  NPC/character names, and the eventual site-publish once the assigned player's correction
  pass comes back.
- Design: `docs/superpowers/specs/2026-07-15-session-vault-design.md`; plan:
  `docs/superpowers/plans/2026-07-15-session-vault.md`; runbook:
  `docs/RUNBOOKS/session-vault.md`; work note: [[work/2026-07-15-session-vault]].

### Cross-process memory

- `C:\Users\Pawel\.claude\projects\G--My-Drive-OBSIDIAN-RPG-Zew-Cthulhu\memory\` — Claude Code memory directory for the content vault (separate working context). Includes `project_publikacja_web.md` — the publication-web plan from the content side. Useful for understanding what the GM expects from this app's player-facing side.

## MVP scope (locked — see `[[TASK_LIST]]` for staged breakdown)

### Public reading (no login)

- Navigate Shelf > Book > Chapter > Page
- Markdown render: Polish characters, wikilinks `[[X]]` / `[[X|alias]]` → internal links, images, tables, code blocks, blockquotes
- Always-visible left column listing Shelves (large titles, click navigates)
- Breadcrumbs
- Cthulhu skin (see Visual identity below)

### Auth + edit

- Supabase Auth (email/pass + Google OAuth)
- Profile per player in `wiki.profiles` (`role: 'mg' | 'gracz'`, `color text` — one of 16 palette hex values, added migration 009)
- RLS: read for authenticated, edit per page (author + MG)
- Inline markdown editor (candidates: `react-markdown-editor-lite`, `milkdown` — decision open, see `[[work/Index]]`)
- Revision tracking in `wiki.revisions` + diff view + rollback button

### Interactive Boston map

- `react-leaflet` with `imageOverlay`
- Map as static asset in repo: `public/maps/boston-map-1924.jpg`
- Pins in `wiki.pins` (x int, y int, title, description, label, created_by)
- View mode for everyone; edit mode for role `mg` (click = add, drag = move, right-click = edit/delete)
- Realtime sync — players see new pins immediately

### Vault ↔ Supabase sync

- **PUSH** (Node CLI): `vault PUBLIC/*.md → wiki.pages`. Idempotent; path relative to `PUBLIC/` is the natural key.
- **PULL**: `wiki.pages → vault PUBLIC/`. Filters by `ready_to_sync` flag — only GM-approved edits flow back. Manual confirm step before writing to filesystem.
- Wikilink conversion in both directions.

### Deploy

- GitHub Pages on repo `akta-kasandry`
- `.env.example` committed; `.env` gitignored
- Custom domain optional / later

## Visual identity

- Palette: deep teal `#0d2828` + parchment `#f5e6c8` + gold `#c89b3c`
- Fonts: Cinzel (headings) + Cormorant Garamond (body) + Special Elite (code)
- Source skin: `C:\temp\bookstack-test\cthulhu-skin-minimal.html`
- Desktop priority; mobile must just "render", not optimised

## Implementation stages (spec's a-g)

a. Setup + Supabase connection + schema migration
b. Public reader (nav + markdown render + Cthulhu skin)
c. Vault → Supabase sync (push script + first import from `PUBLIC/`)
d. Auth + edit (editor, revisions, diff, rollback)
e. Boston map with pins
f. Supabase → vault back-sync (pull script with `ready_to_sync` filter)
g. Deploy to GH Pages

### 2026-05-20 — refactored to recursive content tree

Dropped the Shelf/Book/Chapter/Page hierarchy (BookStack artifact). Content is now a single recursive `ContentNode` with `kind: 'folder' | 'page'` and arbitrary nesting — matches Obsidian. Routing collapsed to `/p/*` catch-all; sidebar is `<TreeNav>` (collapsible). `wiki.pages` schema sketch in `SUPABASE_AND_SYNC.md` is now flagged as needing update before migration. Details: [[work/2026-05-20-recursive-content-tree]].

### Current status — 2026-05-19 framework session (model refactored 2026-05-20)

| Stage | Status |
|---|---|
| a — Setup | **COMPLETE 2026-05-20.** Vite + React 19 + TS + Tailwind v4. Cthulhu skin in `@theme`. **`wiki.*` schema migration RAN** (migrations 001..007 in dashboard SQL Editor). Supabase live: 5 tables + RLS + triggers, `wiki-attachments` bucket, MG account `storage.station2023@gmail.com`. `.env.local` populated. Client `src/lib/supabase.ts` ready (dormant). Two setup gotchas documented in runbook (db_schemas GUC propagation, explicit table grants). |
| b — Public reader | **Complete on mock data.** Recursive tree (Obsidian-style, no fixed levels), `/p/*` catch-all routing, collapsible `<TreeNav>` sidebar, breadcrumbs, markdown render with wikilink remark plugin (AST-safe) all live. Polish diacritics verified everywhere. |
| c — Push | Dry-run only (`scripts/push-vault.ts`). `--execute` exits 1. Cleanup pipeline (`collapseAsterisks`, `stripDuplicateH1`) and shared wikilink resolver wired. Image-rewrite still TBD (bucket vs repo open). |
| d — Auth + edit | D1 only: editor `@uiw/react-md-editor` integrated on `/draft` with in-memory state, preview reuses the same renderer as read-mode. Auth, persistence, revisions still pending. |
| e — Map | E1 only: `react-leaflet` + `ImageOverlay` over a 1000×1500 SVG placeholder, 3 mock pins with popovers. Real map (13 MB JPG) and DB-backed pins not done. |
| f — Pull | Dry-run only (`scripts/pull-vault.ts`). `--execute` exits 1. Uses mock content as a stand-in source. |
| g — Deploy | Not started. |

See `[[TASK_LIST]]` for the live checkbox state, `[[DOCS_CHANGES_JOURNAL]]` for what landed when, and `[[work/Index]]` for resolved/open decisions.

### What needs the user before more code can land

1. **Approve and run the `wiki.*` schema migration on Supabase** (coordinate with coc-creator first — see [[INTEGRATIONS]]).
2. **Populate `.env`** (copy `.env.example`, paste shared Supabase URL + anon key).
3. **Copy the real Boston map** from `G:\…\boston-map-1924.jpg` to `public/maps/boston-map-1924.jpg` and update `IMG_URL` in `src/components/BostonMap.tsx`. (Or accept the placeholder for now.)
4. **Confirm SSO with coc-creator** so the Auth flow can be designed without surprises.
5. Decide on the **image rewriting strategy** (`work/Index.md` open question — bucket vs repo).

## Out of scope (deliberate exclusions)

- Player-uploaded images (GM hosts the library)
- Mobile-first responsive (desktop priority)
- ~~In-browser Excalidraw editor~~ — **reopened 2026-07-14** as Stage M / Iteration 3, via **tldraw** (approved-but-deferred dependency) instead of Excalidraw. Spec only, not scheduled.
- ~~Audio / video embeds~~ — **reopened narrowly 2026-07-14, shipped 2026-07-15**: the site itself still hosts no audio; Stage M / Iteration 2's downloadable session package carries audio as a local sibling file opened via `file://`, never streamed from the site.
- ~~Per-page comments~~ — **scoped-in 2026-06-26 as Stage L**: fragment-anchored IC/OOC comments on summary pages, right rail, public read, never editing main content. Non-summary pages and realtime remain deferred.
- AI-generated content (portraits, handouts, summaries) — separate tooling, not this project. **Clarified 2026-07-14** (Stage M): the "separate tooling" is now formalized as Claude Code project skills (`session-digest`, `session-feedback`) that run outside the app and only produce content a human commits — the app itself still never calls an LLM at runtime.

## Conventions

- All docs in English; UI/UX strings, page content, slugs in Polish
- Polish characters must work everywhere — UI, DB, URLs (after slugify), search
- Code, commits, identifiers in English
- Communication with user in Polish
- Stack locked; no new top-level deps without explicit user approval
