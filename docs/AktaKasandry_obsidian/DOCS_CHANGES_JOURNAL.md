---
date: 2026-05-19
status: active
tags:
  - journal
---

# Docs Changes Journal

Per-session changelog. Most recent on top. See `[[LOGGING_INSTRUCTIONS]]` for the entry format.

---

## 2026-06-22 — Transcript viewer simplified to read-only + first session summaries (Sól w Ranach, UG 2)

Long session continuing the `/sesje` work. Outcome: read-only viewer on the production variant, plus two full session summaries with transcript deep-links.

**Viewer simplified (Stage I).** Dropped variant switching — always loads the session's default (latest production) variant; removed the variant pill bar. Trimmed shipped data to just the two production overlays (`sol-w-ranach-parallel-split-epoch`, `ug2-current`) — deleted 9 non-default overlays (~31 MB), `variants.json` now one variant per session. Removed in-view editing (paint speaker, text edit, export corrections, copy-anchor, chunk "przypisz"); read components no longer apply localStorage corrections. `VariantBar` → `SessionHeader`. Editor capabilities stay in the store for a future separate edit screen. Kept: transcript, speaker toggles, competing chunks with %, audio seek links, 5-method votes, summary deep-links.

**Session summaries (Stage K — NEW).** Built `remarkTranscriptAnchors` plugin: `{sesja:<slug>#<utteranceId>}` (and `..` ranges) in markdown → "↪ transkrypt" pills → `/sesje/<slug>?u=<id>`; SessionView reads `?u=`, scrolls/flashes/pins the line; ProvenancePanel "⎘ Kotwica" copies the token (later removed in the read-only pass). Pages (all demo routes, to be moved into the vault later):
- `/streszczenie-demo` — **Sól w Ranach** summary (Western CoC; Salt Hills, New Mexico), + `/streszczenie-demo/cytaty`.
- `/streszczenie-ug2` — **Urodzaj Grozy (UG 2)** summary (Prohibition Boston gangster + academics dual-group), + `/streszczenie-ug2/narracja` (long-form continuous narrative produced by a sub-agent).

**Two campaign sessions reconstructed** (rosters + plots) — both end by seeding the **Klub / Akta Kasandry** (the project namesake). Sól: Kate = Cassandra Hollister. UG 2: Dr Eleine Howard recruited to the Cassandra Club. Recurring motifs across sessions: a Pastor, a water-bound Mythos creature, the Howard family, the Cassandra org.

**CRITICAL DATA LESSON (epoch vs concat).** The overlay `timeline: "epoch"` clock (`utterance.start`) is a stretched wall-clock, NOT real audio time — it spreads recorded audio across the real evening incl. break gaps, so `start` jumps. To reason about "what's on the tape" you MUST histogram by `play.start` (or use the `concat` variant), never by epoch `start`. I burned a lot of time concluding content was "missing" from epoch-`start` gaps when it wasn't. Best reading trick for plot: dump a **single channel** (e.g. the GM, `Paweł MG`) sorted by `play.start` — one mic is linear, giving a clean chronological narration spine (sorting ALL speakers by concat `start` interleaves per-channel clocks and scrambles scenes). Full write-up: [[work/2026-06-22-transcript-data-lessons]].

**Genuinely lost content (needs GM memory, not recoverable from tape):**
- **Sól w Ranach** — the whole climax (fort → ceremony → killing Boston → tunnels, ~beats 6–11) was lost to a **recorder software error** (confirmed by the user via the rpg-recorder side). Reconstructed in the summary from the GM's account, flagged "⚠ nagranie urwane", no anchors. Recorded part ends at "dawn of day 3, heading to the crater".
- **UG 2** — the **night recon + first human shootout** (between the Carmody negotiations and the academics entering) fell into a **deliberate recording pause** ([1:21:07] GM "Wyłączę teraz recording" for food + off-mic price-negotiation; resumes [1:23] already at the academics). NOT yet written — **first task next session** is to get these beats from the GM and insert a flagged "off-mic" section into both UG 2 pages.

**Recording length note (UG 2).** Audio is continuous ~2h38m (concat, 0 gaps) but that's *on-mic recorded* time — the GM paused recording several times (food, off-mic negotiation, mic recharges, dead mics). The epoch variant spreads it over ~8h45 wall-clock with big gaps, but those gap *sizes* are the same unreliable epoch derivation — treat as "a long evening with several substantial breaks", not exact. No absolute time-of-day in `build_meta`; reliable clock would need the raw `data/sessions/f14eae5b8f7b/` chunk timestamps in rpg-recorder.

**Audio still not hosted.** Decision unchanged: no in-app streaming; `audio-links.json` skeleton committed for manual Google-Drive seek links (GM to fill). Viewer shows `chNN @ mm:ss` + optional external link.

**Files:** `src/routes/{SummaryDemo,QuotesDemo,UG2Summary,UG2Narracja,SessionView,Sessions}.tsx`, `src/components/transcripts/{SessionHeader,Legend,TranscriptList,TranscriptRow,ProvenancePanel}.tsx` (VariantBar deleted), `src/lib/remarkTranscriptAnchors.ts`, `src/components/Markdown.tsx`, `src/router.tsx`, `src/index.css`, `public/transcripts/data/*` (trimmed). Plus a private GM-only note in the content vault: `G:\…\Zew Cthulhu\Sol w Ranach - ciete cytaty (GM only).md` (off-`PUBLIC/`, one cut edgy quote).

**Open:** UG 2 "śmieszne i epickie momenty" page not made; the missing UG 2 fragments (above); maybe switch viewer to the `concat` variant for sane timestamps (would require re-anchoring ~all markers); move summaries from demo routes into the vault; fold the narrative's extra details (Cayda/the "Drogi Ernesti" letter, the cave temptation) into the short UG 2 summary.

---

## 2026-06-19 — Feature: transcript provenance viewer (`/sesje`), ported from rpg-recorder

New section to read session transcripts with **competing-microphone chunks + attribution probabilities**, switch attribution variants, and correct speaker/text. Ported from the sister project rpg-recorder; full rationale in [[work/2026-06-19-transcript-viewer-port]].

**Architecture:** rpg-recorder = producer, Akta Kasandry = consumer. Single interface = `<slug>-<variant>-overlay.json` (spec mirrored from rpg-recorder's `SCHEMA.md` into `src/lib/transcripts/overlay.ts`). Audio pipeline NOT ported. Adding a session is data-only (overlay JSON + `variants.json` entry) — no code change.

**Audio decision — no in-app streaming.** Evaluated commit-to-repo / GitHub Releases / R2 / Drive-sharding; chose **manual seek links**. Each chunk shows `chNN @ mm:ss`; filling `audio-links.json` with a per-channel URL turns it into an external link to seek manually (supports sharded channels via segments). No audio committed (~300 MB/session avoided).

**Files added:**
- Data: `public/transcripts/data/` — 11 overlays (Sol w Ranach ×7, UG 2 ×4) + trimmed `variants.json` + `audio-links.json` skeleton (~39 MB JSON, no audio).
- `src/lib/transcripts/{overlay,format,data,audioLinks,corrections,effective}.ts`
- `src/stores/transcript.ts`
- `src/components/transcripts/{TranscriptList,TranscriptRow,ProvenancePanel,Legend,VariantBar}.tsx`
- `src/routes/{Sessions,SessionView}.tsx`

**Files changed:** `src/router.tsx` (+2 routes), `src/components/AppShell.tsx` (full-bleed `/sesje` + "Sesje" nav link), `src/index.css` (transcript console styles + `content-visibility` virtualization).

**Notable choices:** renderer rewritten as React/TS in the Cthulhu skin (not embedded HTML); 5000-row virtualization via CSS `content-visibility:auto` (no new dependency); ambiguous lines (`assigned:false`) render neutral with `?`; corrections persist per `<slug>.<variant>` in localStorage and export as JSON.

**Verified:** both sessions load; chunk % (48/36/16, sum 1.0, sorted winner→prob); variant switch (5094↔3550); paint + text edit persist; `tsc -b` + `vite build` green; data in `dist/`. Page screenshots hang in the headless renderer (known upstream caveat) — verified via a11y snapshot + DOM eval.

**Open follow-up (next session topic):** per-session summaries authored from transcript + GM conversation, with summary sections deep-linking into transcript sections (needs an anchor scheme + scroll-to/highlight target in the viewer).

---

## 2026-05-21 — Fix: portrait_url not shown in character importer

Characters whose portrait lives in `public.characters.portrait_url` (coc-creator's canonical field — a public Storage URL) had no thumbnail in the AdminImport list and no portrait in the CharacterSheet, because our column allowlist only fetched the legacy `profile_portrait_url` / `card_portrait_url` fields (both `null` for newer characters like Eleine Howard).

**Fix:**

- `src/lib/characterColumns.ts` — added `portrait_url` and `art_gallery` to the explicit allowlist (reviewed + approved per import design doc §7).
- `src/stores/characters.ts` — `SourceCharacter` now carries `portrait_url`; `importOne` derives the snapshot portrait preferring `portrait_url`, then the legacy fields as fallback.
- `src/routes/AdminImport.tsx` — thumbnail in the character list uses the same preference order (`portrait_url ?? profile_portrait_url ?? card_portrait_url`).

Characters with only legacy fields (Lillian Whitley) still work. Characters with no portrait anywhere (James Kelly) correctly show none.

Verified against live data: `portrait_url= SET` for all 3 characters in the DB; live bundle confirmed to contain `portrait_url`.

---

## 2026-05-21 — Content: reformat "Cytaty i sytuacje z sesji"

The "03 Cytaty i sytuacje z sesji" page under SPRAWY/01 ZNAK ŻYCIA rendered poorly — the original file used raw `_italics_` for scene descriptions inside blockquotes that conflicted with the player-quote style. Reformatted to use `---` separators between scenes and consistent `> **Speaker:** text` quote style.

`src/generated/content.ts` regenerated after the vault file was edited.

---

## 2026-05-21 — Fix: index pasted images from the whole vault

The new SPRAWY content showed `_(brak: Pasted image ….png|337)_` placeholders — the images weren't found. Root cause: Obsidian dumps pasted images into the **vault root** (`G:\…\Zew Cthulhu\`), outside `PUBLIC/`, but the generator's image index only scanned `PUBLIC/`.

**Fix (`scripts/lib/generate.ts`):**

- `indexImages` now scans `dirname(vault)` (the whole vault), not just PUBLIC, so vault-root pasted images are found. Only images *referenced* by a published page get staged, so scanning wider doesn't copy unreferenced vault images.
- Added `IMAGE_INDEX_SKIP` (memory/node_modules/.trash/.git) — narrower than `EXCLUDE_DIRS` because the index MUST descend into `attachments/` (tutorial screenshots live there). `.obsidian` etc. caught by the dotfile check.

**Result:** 54 → 66 attachments staged (the 12 pasted images), 0 `(brak:)` placeholders. Spaced filenames URL-encoded (`%20`) by `encodeURIComponent`; files on disk keep literal spaces — served fine.

Files: `scripts/lib/generate.ts`, regenerated `src/generated/content.ts`, +12 images in `public/vault-attachments/by-name/`.

---

## 2026-05-21 — Content refresh from PUBLIC (added SPRAWY + renames)

Re-ran `npm run build-content` after the GM added content + renamed folders in the vault.

- **Added:** `SPRAWY/` now populated — 3 cases (`01 ZNAK ŻYCIA` with sub-pages 00 HUB / 01 Wstęp / 02 Streszczenie / 03 Cytaty… / 04 Transkrypt… / 05 Fan content, `02 URODZAJ GROZY`, `03 ROZDARTE SUMIENIE`). Page count 28 → 34.
- **Renames applied:** e.g. `ZASADY/Zasady walki` index renamed to `01. HUB` (was `01. Wstęp i spis treści`).
- **Preserved:** Mapa Bostonu 1924 + all existing articles (Bijatyka, Terminy, full combat tutorial) intact — nothing deleted.
- **No code fix needed:** top-level slugs + `MAP_PAGE_PATH` (`swiat-npc/boston/mapa-bostonu-1924`) unchanged, so the interactive-map special-case still resolves.
- No new attachments (added content is text; 54 images unchanged).

Only `src/generated/content.ts` changed. Build clean. Pushed → auto-deploy.

---

## 2026-05-20 — Live deploy on GitHub Pages (Stage G)

Repo public + first production deploy. **Live: https://ursuscodes.github.io/akta-kasandry/**

**Repo:** `UrsusCodes/akta-kasandry` (public, same org as coc-creator). `.env*` gitignored; `public/vault-attachments/` (41 MB incl. Boston map) committed so CI builds have images without vault access.

**Deploy setup (commit "feat: GitHub Pages deploy"):**

- `vite.config.ts` — base `/akta-kasandry/` in build, `/` in dev (project-site subpath).
- `src/router.tsx` — basename from `import.meta.env.BASE_URL`.
- `src/lib/withBase.ts` + Markdown `img` override + BostonMap `IMG_URL` — prefix root-absolute `/vault-attachments/…` with the base so images load under the subpath.
- `.github/workflows/deploy.yml` — `npm ci` → build with `VITE_SUPABASE_*` repo secrets → `cp index.html 404.html` (SPA fallback) → `actions/deploy-pages`.
- `.npmrc` — `legacy-peer-deps=true` for CI `npm ci`.

**Go-live steps done (some by user, some via gh/api):**

- Repo flipped public (user-confirmed; safety layer required explicit go).
- Pages enabled with `build_type=workflow` via API.
- Secrets `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` set from `.env.local` (piped, not echoed).
- First push-triggered run failed only at the deploy step (Pages not yet enabled); after enabling + secrets, a dispatched run succeeded (build ✓ / deploy ✓).

**Verification (curl against live):** root 200; deep link serves the full SPA (404.html fallback — HTTP 404 status is cosmetic, app loads + routes); assets at `/akta-kasandry/assets/…`; `boston-map-1924.jpg` 200.

**Decisions / caveats:**

- GH Pages deep-link returns HTTP 404 status (body is the SPA, works in browser). Only a host with real SPA fallback (Cloudflare Pages/Vercel) eliminates it — accepted tradeoff.
- Node 20 action deprecation warnings (deadline June 2026) — bump later.
- Auto-deploy: every push to `main` rebuilds + redeploys.

**Open questions / next steps:** custom domain (optional); migrate Actions to Node 24 before June 2026.

---

## 2026-05-20 — Imported characters in the tree (H2)

Imported characters now appear as pages under `BADACZE/<player>/<character>` and render as character sheets. Required moving the reader from a static content tree to a dynamic (merged) one.

**Files touched:**

- `src/types.ts` — `ContentNode.character?` field + `ImportedCharacterData` type.
- `src/stores/content.ts` — new. Holds the merged tree (static PUBLIC snapshot + imported characters grafted under `BADACZE/`). `load()` fetches `wiki.imported_characters`, groups by player (`player_name` or `Gracz #<shortid>`), builds `BADACZE/<player-slug>/<char-slug>` subtree. Static tree is the synchronous default.
- `src/routes/CharacterPage.tsx` — new. Renders a sheet from the JSONB snapshot (portrait, occupation/era/status, player, details, characteristics grid, derived, appearance, backstory, equipment). Defensive against unknown/missing field shapes.
- `src/routes/NodeView.tsx` — reads tree from content store; renders `<CharacterPage>` when `node.character` is set.
- `src/components/TreeNav.tsx`, `src/components/Breadcrumbs.tsx`, `src/routes/Landing.tsx` — switched from importing the static tree to reading the content store.
- `src/components/AppShell.tsx` — calls content `load()` on mount.
- `src/routes/AdminImport.tsx` — reloads the content tree after import/remove so new pages appear immediately in the sidebar.

**Decisions:**

- **Player folder grouping**: `player_name` (admin-typed) if present, else `Gracz #<source_player_id[0:8]>`. Matches the requested `BADACZE / <gracz> / <postać>` structure.
- **Content store, not static import**: components subscribe to a zustand store so imported characters merge in at runtime. The static `src/generated/content.ts` remains the synchronous seed.
- **Wikilink resolver still static**: `[[Character]]` won't resolve yet (resolver reads the static tree). Acceptable v1 — characters aren't wikilink targets in existing content. Revisit if needed.

**Verification:** `npm run build` clean.

**Open questions / next steps:** test the full loop — import a character, see it appear under BADACZE/<player>/ in the sidebar + a rendered sheet. Then: tune the CharacterPage layout once we see real coc-creator JSONB shapes; consider re-import "refresh stale" bulk action.

---

## 2026-05-20 — Edit existing pins (Stage E feature-complete)

Added in-place editing of existing pins — the last CRUD gap.

**Files touched:**

- `src/components/BostonMap.tsx` — popover (edit mode) now has **Edytuj** + **Usuń** buttons. "Edytuj" opens the same overlay form pre-filled with the pin's title/label/description/color; save calls `updatePin`. The form is shared between add and edit (`pending` vs `editing` state drives header, button label "Dodaj"/"Zapisz", and which store method runs). Map clicks are ignored while editing so they don't pop a competing "new pin" form.

**Decisions:**

- One shared overlay form for both add + edit — `editing: Pin | null` and `pending: {x,y} | null` are mutually exclusive; `submitForm` branches on which is set.

**Verification:** `npm run build` clean.

Stage E is now feature-complete for v1: view + add + move + edit + delete + colors + grouped list, all MG-gated (UI `isMG && source==='supabase'` + `wiki.pins` RLS). Only realtime sync remains deferred.

---

## 2026-05-20 — Map pin polish: dbl-click fix, colors, pin list

Three user-requested improvements to pin editing.

**1. Double-click placement bug.** In edit mode a double-click panned/zoomed the map (Leaflet's `doubleClickZoom`), and the form appearing as a block above the map reflowed the layout — together they shifted where the pin landed. Fixed: `doubleClickZoom={!editMode}` + the new-pin form is now an `absolute` overlay (top-right of the map), so it no longer reflows.

**2. Pin colors.** 10-option palette in `src/lib/pinColors.ts` (muted, period-appropriate: Złoto/Miedź/Rdza/Krew/Śliwka/Atrament/Patyna/Mech/Cyna/Kość). Migration `008_pins_color.sql` adds `wiki.pins.color` (nullable, defaults gold). Color picker (swatches) in the add-pin form; markers render in their color via a cached `divIcon` factory. `Pin` type + mock pins + store all carry `color`.

**3. Pin list below the map.** New `PinList` component: all pins grouped by color (palette order) then alphabetical (Polish collation) within each group. Each group shows a swatch + color name + count. Clicking a pin flies the map to it and opens its popup — done via per-marker refs (`markerRefs`) + the map instance captured from `MapContainer ref={setMap}`.

**Files touched:**

- `supabase/migrations/008_pins_color.sql` — new (adds color column)
- `src/lib/pinColors.ts` — new (palette + `colorName`/`colorOrder` helpers)
- `src/types.ts`, `src/mocks/pins.ts`, `src/stores/pins.ts` — color field threaded through
- `src/components/BostonMap.tsx` — doubleClickZoom fix, overlay form, color picker, colored icons, marker refs, fly-to-on-list-click, `PinList`

**Decisions:**

- Marker refs + `MapContainer ref={setMap}` (react-leaflet v5 returns the Leaflet map from the ref) — clean way to drive imperative `flyTo` + `openPopup` from the list.
- divIcon cache keyed by hex — avoids rebuilding identical icons every render.

**Verification:** `npm run build` clean.

**Reminder for user:** run migration `008_pins_color.sql` in SQL Editor before the color field works against the live table (existing pins backfilled to gold).

**Open questions / next steps:** edit-existing-pin text/color still pending (delete+re-add for now). Otherwise Stage E is feature-complete for v1. Next: C+reader-swap → D (page editing), or H (character import).

---

## 2026-05-20 — Map pin editing (Stage E proper)

MG can now manage pins on the Boston map through the app. Backed by `wiki.pins`.

**Files touched:**

- `src/stores/pins.ts` — (from E1) reads `wiki.pins`, mock fallback, CRUD methods.
- `src/components/BostonMap.tsx` — edit mode:
  - **Toolbar** "Tryb edycji: WŁ/WYŁ" — only rendered for MG on the live table (`isMG && source === 'supabase'`).
  - **Add**: click empty map in edit mode → `MapClickHandler` (useMapEvents) captures coords → form panel (title required, label, description) → `addPin` → `wiki.pins` insert.
  - **Move**: markers are `draggable` in edit mode → `dragend` → `updatePin` with new x/y.
  - **Delete**: marker popup gets "Usuń pin" button in edit mode → `deletePin`.
  - Coord conversion `latlngToXY` mirrors Y (CRS.Simple measures from bottom) + clamps to image bounds.
  - Edit mode auto-disables on logout (`useEffect` on `isMG`).
- `supabase/seeds/pins.sql` — (from E1) optional 3-pin seed.

**Decisions:**

- **Edit affordances gated twice**: UI hides them unless `isMG && source==='supabase'`, and `wiki.pins` RLS rejects non-MG writes at the DB. Belt + suspenders.
- **New-pin form is a panel above the map**, not a Leaflet popup — popups re-render and lose form state mid-typing.
- **Reload after each mutation** instead of optimistic update — table is tiny, keeps store logic trivial. Realtime sub deferred (free-tier egress; single-MG doesn't need live multi-client sync yet).
- **Editing an existing pin's text** (title/label/description) not built yet — drag-move + delete + re-add covers it for now. Small follow-up: add an "Edytuj" form to the popup.

**Verification:** `npm run build` clean.

**Open questions / next steps:** test the full add/drag/delete loop against live `wiki.pins` (run the seed first if you want starter pins). Then: edit-existing-text polish, realtime sub, or move to next stage (C+reader-swap → page editing, or H import).

---

## 2026-05-20 — Auth login UI (Stage D — login half)

First use of the live Supabase backend from the frontend. MG/Admin login; player editing deferred per user.

**Files touched:**

- `src/stores/auth.ts` — new. Zustand auth store: `init()` (loads session + profile role, subscribes to `onAuthStateChange`), `signIn`, `signOut`. Degrades gracefully when credentials absent (`enabled: false` → site stays anon-readable). `useIsMG()` selector. First module to actually import `getSupabase()`.
- `src/routes/Login.tsx` — new. Email/password form (react-hook-form native validation — avoided `@hookform/resolvers` to stay within the locked dep list). Shows a clear "Supabase not configured" message when disabled. Redirects back to origin (`location.state.from`) after login.
- `src/components/AppShell.tsx` — calls `init()` on mount; header shows "DisplayName (MG)" + Wyloguj when signed in, "Zaloguj" link otherwise. Auth affordances only render when `enabled`.
- `src/router.tsx` — `/login` route.

**Decisions:**

- **No `@hookform/resolvers` / zodResolver.** Login validation is trivial (email format + required); react-hook-form's native `register` rules cover it. Keeps the dep list locked.
- **Graceful degradation.** Without `.env`, `enabled=false` — no login UI, site is pure anon read. So the build/dev works for anyone who clones without credentials.
- **MG-only scope for now.** Player signup/editing deferred (user: "edycja przez graczy jest dalej w planie"). No signup form yet — accounts created via dashboard, role promoted via SQL.

**Verification:** `npm run build` clean. Bundle now 1.84 MB (supabase-js pulled in) — code-split is a stage-G follow-up.

**Open questions / next steps:** what does MG edit first — pages (needs push-vault --execute + reader swap) or pins (isolated)? Asking the user.

---

## 2026-05-20 — Supabase migration executed — Stage A complete

Ran the full migration against the shared Supabase project (dashboard SQL Editor mode). Stage A is done — first working backend.

**What landed live:**

- Schema `wiki` + 5 tables (`profiles`, `pages`, `revisions`, `pins`, `imported_characters`) + triggers (`wiki_on_auth_user_created`, `write_revision`, `set_updated_at`) + RLS policies.
- `wiki` exposed in PostgREST; explicit table grants for anon/authenticated.
- Bucket `wiki-attachments` (public) + 4 storage policies.
- MG account `storage.station2023@gmail.com` (role `mg`).
- `src/lib/supabase.ts` ready (still dormant — no component imports it yet).

**Two gotchas hit + fixed (now in repo for next time):**

1. **db_schemas didn't propagate.** Dashboard showed "3 of 3 schemas exposed" but PostgREST returned `PGRST106 Invalid schema: wiki`. The `pgrst.db_schemas` GUC on the `authenticator` role was never written by the dashboard Save. Fixed with `alter role authenticator set pgrst.db_schemas = 'public, graphql_public, wiki'` + `notify pgrst, 'reload config'`. Documented as a known-issue in the runbook.
2. **Missing table grants.** After exposing the schema, queries returned 404 — the tables created in 002..006 lacked anon/authenticated SELECT grants (the `alter default privileges` in 001 didn't apply through SQL Editor). Added `007_grants.sql` with explicit `grant ... on all tables in schema wiki`. Confirmed: `wiki.imported_characters` and `wiki.pages` both return `[]` after.

**Files touched (this entry):**

- `supabase/migrations/007_grants.sql` — new, explicit grants (idempotent)
- `supabase/migrations/001_schema_wiki.sql` — comment flagging that 007 is the real source of truth for grants
- `docs/RUNBOOKS/supabase-migration.md` — 7-file table, two known-issue blocks, troubleshooting rows, rollback resets db_schemas GUC
- `docs/AktaKasandry_obsidian/TASK_LIST.md` — Stage A marked complete

**Decisions:**

- `alter role authenticator set pgrst.db_schemas` is a manual SQL step (project-wide, additive — coc-creator unaffected). Kept out of migration files because it's a project setting, not schema DDL. **Caveat logged:** if coc-creator clicks Save in their Data API settings, it may drop `wiki` — re-run the `alter role` line.

**Open questions / next steps:**

- Storage "broad SELECT policy" hygiene warning — drop anon SELECT on storage.objects, add mg-only (public bucket serves images via `/object/public/` regardless). Pending user go-ahead.
- Pick the next stage to build: C (push-vault --execute), E (pin editing), H (character import), or D (page editor save).

---

## 2026-05-20 — coc-creator review feedback folded in

coc-creator-Claude reviewed our plan, landed an `INTEGRATIONS.md` on their side, and surfaced 4 non-blocking flags. Captured here so they don't get lost.

**Files touched:**

- `docs/AktaKasandry_obsidian/INTEGRATIONS.md` — replaced the "coordination doc is one-sided" warning with success callout. New "Cross-project integration surfaces (load-bearing)" table listing `anon_read_characters` as the load-bearing public API contract. New "Coordination triggers" sections (us→them, them→us; 4 triggers each side ping the other). Full feedback log at the bottom.
- `docs/AktaKasandry_obsidian/work/2026-05-20-import-coc-creator-characters.md` — section 6 updated with the portrait-URL-drift mitigation as v2 follow-up. New section 7 with the column allowlist (32 explicit names; admin UI extractor must use this, never `select *`). Coordination items section now references the four resolved flags.
- `docs/RUNBOOKS/supabase-migration.md` — explicit warning never to run `supabase db push` from this repo (sequence collision in the shared `schema_migrations` table — both sides run SQL Editor by hand).
- `supabase/migrations/005_imported_characters.sql` — header comment expanded to flag the column-allowlist constraint on the future admin UI.

**Decisions:**

- DDL doesn't change — the `data jsonb` column stays, but the *extractor* feeding it must use the allowlist. Constrains the future admin UI, not the storage.
- Portrait mirroring deferred to v2 as `wiki-attachments/imported-characters/<source_id>.{ext}` at import time. v1 accepts URL drift; admin re-imports when they notice.
- Migration mode confirmed: SQL Editor only, never `supabase db push`. Both sides hold the same rule.

**Verification:** build still clean.

**Open questions / next steps:** user has Supabase access; proceeding through the runbook (Phase 1 → 6).

---

## 2026-05-20 — Supabase migration prep: SQL files + client + runbook

User asked what they need to do to actually run the migration. Prepared everything that doesn't require Supabase access — gated steps only need their decisions + dashboard time.

**Files touched:**

- `supabase/migrations/001_schema_wiki.sql` — `create schema wiki` + default privileges. Comment flags the dashboard step (Settings → API → Exposed schemas → add `wiki`).
- `supabase/migrations/002_profiles.sql` — `wiki.profiles` + first-login trigger on `auth.users` + RLS (auth-read, self-update with role-locked `with check`).
- `supabase/migrations/003_pages.sql` — `wiki.pages` + `wiki.revisions` + revision-write trigger (`SECURITY DEFINER`) + RLS (anon-read, mg-write).
- `supabase/migrations/004_pins.sql` — `wiki.pins` + `set_updated_at` trigger + RLS (anon-read, mg-write).
- `supabase/migrations/005_imported_characters.sql` — `wiki.imported_characters` + RLS (anon-read per 2026-05-20 decision, mg-write).
- `supabase/migrations/006_storage.sql` — RLS policies on `storage.objects` for `wiki-attachments` (anon read, mg insert/update/delete). Bucket itself is created via dashboard.
- `src/lib/supabase.ts` — lazy Supabase client init, reads env, default schema `wiki`, throws clear error when credentials missing.
- `docs/RUNBOOKS/supabase-migration.md` — 6-phase step-by-step: prerequisites, client wire, expose schema, run migrations, create bucket, create MG account, smoke-test. Includes verify checks and a rollback section.
- `docs/AktaKasandry_obsidian/TASK_LIST.md` — Stage A user-action items spelled out.
- `docs/AktaKasandry_obsidian/TECHNOLOGY_MASTERMIND.md` — link to runbook.

**Decisions:**

- **Migration mode: dashboard SQL Editor** (user choice 2026-05-20). Files are committed in repo for audit + repeatability, but executed manually. Supabase CLI is the natural upgrade if we add staging.
- **No `Database` codegen yet.** `src/lib/supabase.ts` types the client as the default `SupabaseClient` (with a cast to swallow the schema-typed return from `createClient`). When we want compile-time table typing, run `supabase gen types typescript` and update the cast.
- **`first-login trigger`** sets default `role='gracz'`. Promotion to `'mg'` is a manual UPDATE for now; admin UI for role management is stage D.
- **Revision trigger writes via `SECURITY DEFINER`** so it bypasses RLS on `wiki.revisions` (which is read-only for clients).

**Verification:** `npm run build` clean. No file imports `src/lib/supabase.ts` yet — it's wired but dormant until the migration lands.

**Open questions / next steps:** All gated on the user running through the runbook. When migration lands: unblock `npm run push-vault --execute`; then stage D / E proper.

---

## 2026-05-20 — Auto-refresh watcher for vault changes

User asked for an auto-update script — edit a `.md` in Obsidian, see the change in the running site without re-running the generator by hand.

**Files touched:**

- `scripts/lib/generate.ts` — new. Extracted the generator core (walk, image-stage, serialize, EXTRA_ASSETS copy) from `build-content.ts` so both the one-shot script and the watcher can call `generateContent({ vault })`.
- `scripts/build-content.ts` — slimmed to a thin entry that calls `generateContent` once.
- `scripts/watch-content.ts` — new. Initial regen on startup; then watches `dirname(VAULT)` recursively with Node's built-in `fs.watch` (`recursive: true` works fine on Windows, project's primary platform). Filters to changes inside PUBLIC or to a named EXTRA_ASSET; debounces ~500 ms; ignores `.obsidian/`, swap files, tmp.
- `package.json` — `watch-content` script wired.
- `docs/AktaKasandry_obsidian/TECHNOLOGY_MASTERMIND.md` — added a "Content pipeline" section explaining the two-terminal workflow.

**Decisions:**

- **Node built-in `fs.watch`, not chokidar.** Chokidar would be more robust on Linux/macOS but is a new top-level dep. Windows (the project's host) has solid native recursive watching. If we ever support Linux/macOS for dev, swap in chokidar then.
- **Watch `dirname(VAULT)`, not VAULT itself.** That way we also catch changes to EXTRA_ASSETS (e.g. swapping the Boston map JPG) without a second watcher.
- **Two-terminal workflow** (`npm run dev` + `npm run watch-content`) instead of bundling into a single command. Keeps each script doing one thing; user can stop the watcher independently of the dev server.
- **No new deps.** rehype-raw was the last; the watcher is built on Node built-ins.

**Verification:** smoke test — watcher starts cleanly, completes initial regen in ~300 ms (28 pages, 54 attachments), then idles waiting for events. Build clean.

**Open questions / next steps:** Test a real edit-and-save loop against the live Obsidian vault — should be transparent but worth a single end-to-end check.

---

## 2026-05-20 — Add rehype-raw to preserve GM's HTML img formatting

Follow-up to the code-block fix. User opted to add `rehype-raw` (~6 KB gzipped) so the GM's `<img width="220" align="right">` thumbnail pattern survives the render — was either that or keep the simplified markdown-only rendering that lost GM intent.

**Files touched:**

- `package.json` — `rehype-raw: ^7.0.0` added.
- `src/components/Markdown.tsx` — `rehypePlugins: [rehypeRaw]` added.
- `src/routes/DraftView.tsx` — same plugin wired into the `/draft` preview pane (matches read-mode behaviour).
- `scripts/build-content.ts` — reverted the HTML→markdown img conversion. The `<img>` HTML now passes through unchanged; only its `src` is rewritten to `/vault-attachments/by-name/…`.
- `src/index.css` — added attribute selectors `img[align="right"]` / `img[align="left"]` mapping to `float` + margin (modern HTML dropped the `align` attribute's default behaviour); plus `clear: both` on headers so floats don't bleed into the next section.

**Decisions:**

- Trusted vault → raw HTML rendered without sanitization is OK for now. **Stage D (player-edited pages) will need a sanitizer** — `rehype-sanitize` is the obvious companion. Noted as a follow-up; don't ship player editing without it.
- Floats cleared on h1/h2/h3 to avoid the classic float-overflows-next-section problem.

**Verification:** build clean; regenerated content shows GM's full `<img>` tags intact with rewritten `src`. HMR live in dev.

**Open questions / next steps:** Add `rehype-sanitize` before stage D editing is unlocked. New top-level dep — same approval path as today.

---

## 2026-05-20 — Fix: markdown rendering bugs (code-block trap + HTML imgs)

User screenshot showed all page bodies rendered as raw monospace text with wikilinks shown as literal `[[Name]]`. Two root causes:

1. **The content generator was indenting every line of body strings** when serializing them into `src/generated/content.ts` (for pretty-print). Each line in the generated string had 14+ leading spaces, which CommonMark interprets as an indented code block → react-markdown rendered the entire body as `<pre><code>…</code></pre>`, so no plugins fired (no `remark-gfm`, no `remarkWikilinks`, no `<p>` wrapping). Fix: `serializeTree` now uses `JSON.stringify(tree, null, 2)` — strings are properly escaped, no per-line whitespace damage.
2. **Raw `<img>` HTML tags rendered as literal text** because react-markdown ignores raw HTML by default and we don't have `rehype-raw`. Fix: `rewriteImages` in the generator now converts `<img src="…" alt="…" width="…" align="…">` to markdown `![alt](src)`. Side effect: GM's `width`/`align`/`style` attributes are lost — images render full-width in document flow rather than right-aligned thumbnails with text wrap.

**Files touched:**

- `scripts/build-content.ts` — `serializeTree` swapped to `JSON.stringify`; `rewriteImages` final `<img>` pass now emits markdown img form.
- `src/index.css` — added `overflow-wrap: anywhere` to `.prose-cthulhu` and `display: block; overflow-x: auto` on tables — safety nets for long URLs and wide tables.
- `src/generated/content.ts` — regenerated; bodies are now clean JSON strings.

**Decisions:**

- **No rehype-raw in this commit.** Adding it would let us keep the GM's `<img width="220" align="right">` semantics (thumbnails with text wrap) but it's a new top-level dep — gated on explicit user approval per `memories/project.md`. Convert-to-markdown was the safer default.
- If the user later wants to preserve `width`/`align`, the work would be: install `rehype-raw`, pass it as a `rehypePlugin` in `src/components/Markdown.tsx` + `src/routes/DraftView.tsx`, and skip the HTML→markdown conversion in `rewriteImages`.

**Verification:** `npm run build` clean; HMR live in dev; regenerated content has 0 leading-whitespace traps and 0 raw `<img>` tags (only one remains, in the map article — stripped at render time by `stripLegacyMapEmbed`).

**Open questions / next steps:** Ask user whether to add `rehype-raw` to preserve GM's right-aligned image formatting (separate work-note + commit).

---

## 2026-05-20 — Boston map: switch from OSM tiles back to real 1924 JPG

User flagged that I'd misread the spec — they wanted the 1924 Rand McNally graphic *as the base layer*, with Google-Maps-style UX on top (pan/zoom/pins). Earlier in the same session I'd built it as OSM tiles. Corrected.

**Files touched:**

- `scripts/build-content.ts` — added `EXTRA_ASSETS` list, copies `boston-map-1924.jpg` from one level above the vault into `public/vault-attachments/by-name/`.
- `src/components/BostonMap.tsx` — back to `ImageOverlay` + `CRS.Simple`, points at the staged 13 MB JPG. Scroll-wheel zoom, pan, popups preserved.
- `src/mocks/pins.ts` — pin coords back to image-local x/y on the 7803×11702 source. Rough positions guessed from a cold read of the JPG; GM should nudge.
- `src/types.ts` — `Pin` back to `{ x, y }`.
- `docs/AktaKasandry_obsidian/work/2026-05-20-public-snapshot-and-osm-map.md` — corrected to describe the JPG approach (kept filename for link-stability; renamed heading).
- `docs/AktaKasandry_obsidian/work/Index.md`, `TASK_LIST.md` — updated.

**Decisions:**

- The 1924 JPG lives next to PUBLIC (not inside it) — the generator's `EXTRA_ASSETS` list copies it across. Same path on every refresh; rest of the pipeline is unchanged.
- 13 MB JPG ships once per first map view. Pre-tiling via `gdal2tiles` would chunk it for faster first-paint; noted as a follow-up, not done.

**Verification:** dev server returns 200 on the map article; `GET /vault-attachments/by-name/boston-map-1924.jpg` → 200, Content-Length 13683422. Build clean.

**Open questions / next steps:** Pin positions need the GM to eyeball — Mount Auburn might be off the NW extent of the Rand McNally cut.

---

## 2026-05-20 — PUBLIC snapshot + OSM tile map

User asked for a live version backed by the real `G:\…\PUBLIC` structure and an interactive (Google-Maps-style) Boston map instead of the static SVG placeholder.

**Files touched:**

- `scripts/build-content.ts` — new generator. Walks `VAULT_PUBLIC` (default `G:\…\PUBLIC`), writes `src/generated/content.ts` with the full tree (~28 pages, ~92 KB), copies referenced images to `public/vault-attachments/by-name/`, rewrites Obsidian / markdown / HTML image refs to that flat dir.
- `package.json` — `build-content` script wired.
- `src/generated/content.ts` — autogenerated snapshot; committed for boot-on-clone.
- `src/content/index.ts` — re-exports `contentTree` from generated. The single import point for components and scripts.
- `src/mocks/content.ts` — deleted (replaced by content/).
- `src/lib/wikilinks.ts` — `parseWikilink` now strips `#anchor` from the target so wikilinks like `[[Part 0f - …#MANEWR W WALCE|Manewry]]` resolve to the page (anchor dropped for now; rehype-slug follow-up).
- `src/lib/specialPages.ts` — new tiny registry: `MAP_PAGE_PATH` constant + `stripLegacyMapEmbed` helper.
- `src/components/BostonMap.tsx` — rewritten on OpenStreetMap `TileLayer` (lat/lng pins, scroll-wheel zoom, attribution). No `ImageOverlay` any more.
- `src/mocks/pins.ts` — pin coords swapped to real lat/lng (Hale Manor / Whitlock House / Mount Auburn).
- `src/types.ts` — `Pin` now `{ lat, lng }` instead of `{ x, y }`.
- `src/routes/NodeView.tsx` — special-cases `MAP_PAGE_PATH`: renders `<BostonMap />` above the cleaned-up article body.
- `src/routes/MapView.tsx` — deleted. Map article is reached via the content tree, not a top-nav.
- `src/router.tsx` — `/map` route removed.
- `src/components/AppShell.tsx` — `Mapa` link removed from top nav.
- `src/stores/draft.ts` — sample text now references real PUBLIC pages (`[[Bijatyka]]`, `[[Mapa Bostonu 1924|mapa]]`, `[[Tutorial walki — hub]]`, `[[Duży sukces]]`).
- `public/maps/boston-placeholder.svg` — deleted.
- `.gitignore` — `public/vault-attachments/` added (the 28 MB of screenshots are regenerated on demand).
- `docs/AktaKasandry_obsidian/work/2026-05-20-public-snapshot-and-osm-map.md` — new work note.
- `docs/AktaKasandry_obsidian/work/Index.md`, `TASK_LIST.md` — updated.

**Decisions:**

- Generator is read-only against the vault — only writes inside the repo. Re-run via `npm run build-content` after PUBLIC changes.
- Attachments copied flat (`by-name/<basename>`). Filename collisions across folders would clobber; Obsidian discourages duplicates and the current vault has none.
- Image references rewritten in the generator, not at render time — keeps the rendered markdown stable and avoids re-parsing on every page render.
- OSM tiles (no API key, free tier). Period-accurate 1924 tiles deferred — separate research follow-up.
- Wikilink anchors: stripped on parse for now (`#section` part dropped). `rehype-slug` would let us route to the anchor — note it costs a new top-level dep; gated on explicit user approval.

**Verification:**

- `npm run build-content` → 28 pages, 54 attachments staged.
- `npm run build` → clean (2.8s).
- Dev server (HMR reload, port 5174 since 5173 was held by a previous instance) returns 200 on `/`, `/p/swiat-npc/boston/mapa-bostonu-1924` (with the OSM map), `/p/zasady/terminy/bijatyka`, `/p/zasady/zasady-walki/tutorial-walki/part-1-przed-walka` (with tutorial screenshots), and `/vault-attachments/by-name/01-mapa-spotkanie-na-drodze.png` (image is served).

**Open questions / next steps:**

- `rehype-slug` adoption (anchor support for wikilinks) — costs a top-level dep, ask user.
- Period-accurate Boston 1924 tile layer — separate research.

---

## 2026-05-20 — Refactor: drop Shelf/Book/Chapter, use recursive Obsidian-style tree

User flagged the fixed Shelf > Book > Chapter > Page hierarchy as a BookStack artifact. The real vault is just folders nested freely. Replaced the data model and most of the UI in a single commit.

**Files touched:**

- `src/types.ts` — `Shelf`/`Book`/`Chapter`/`Page` deleted; single `ContentNode` with `kind: 'folder' | 'page'` + arbitrary nesting.
- `src/lib/tree.ts` — new: `slugify`, `walkTree`, `findByPath`, `findByWikilinkTarget`, `buildTree`. Wikilinks support `[[Page]]` (whole-tree first-match) and `[[Folder/Sub/Page]]` (path-form by name) — Obsidian convention.
- `src/mocks/content.ts` — rewritten as `buildTree({…})` over a nested object. 12 mock pages, depth 2–3, all top-level folders shown in the screenshot's style.
- `src/lib/wikilinks.ts` — resolver swapped to `findByWikilinkTarget`; relative imports so tsx scripts can pick it up.
- `src/router.tsx` — collapsed to 4 routes: `/`, `/p/*` (catch-all), `/map`, `/draft`.
- `src/components/TreeNav.tsx` — new: recursive collapsible sidebar (▸/▾ indicator, auto-expand ancestor chain on route change).
- `src/components/AppShell.tsx` — swapped sidebar to `<TreeNav>`.
- `src/components/Breadcrumbs.tsx` — derives crumbs from URL segments + tree lookup.
- `src/routes/NodeView.tsx` — new: catch-all view, handles page bodies and folder-with-children equally.
- `src/routes/Landing.tsx` — top-level node cards.
- `src/routes/ShelfView.tsx`, `BookView.tsx`, `ChapterView.tsx`, `PageView.tsx` — deleted.
- `scripts/lib/walk.ts` — recursive walker; honours `attachments/`, `memory/` exclusions seen in the real vault.
- `scripts/push-vault.ts`, `scripts/pull-vault.ts` — adjusted to flat-path model.
- `docs/AktaKasandry_obsidian/work/2026-05-20-recursive-content-tree.md` — new work note with rationale + trade-offs.
- `docs/AktaKasandry_obsidian/work/Index.md` — decision logged.
- `docs/AktaKasandry_obsidian/TECHNOLOGY_MASTERMIND.md` — routing + component-tree sections updated.
- `docs/AktaKasandry_obsidian/SUPABASE_AND_SYNC.md` — added "schema sketch needs update" banner at top.

**Decisions:**

- Single `ContentNode { kind: 'folder' \| 'page' }`. No artificial hierarchy levels.
- URL slugs are slug-form (lowercase ASCII + dashes). Display names with diacritics resolved by walking the tree.
- Wikilinks still by **name**. Two forms supported: leaf (`[[Page]]`) and path (`[[Folder/Page]]`).
- `walkVault` now recursive; excludes `attachments/` and `memory/` siblings as seen in the screenshot.
- `wiki.pages` schema needs update (banner added to SUPABASE_AND_SYNC.md) — should become `path TEXT PRIMARY KEY` + `name` + `body` + `ready_to_sync`, no shelf/book/chapter columns.

**Verification:**

- `npm run build` → clean (3.5 s, same bundle ±1 KB).
- `npx tsx scripts/push-vault.ts` → walks 3 fixture pages at depth 3 inside `sample-vault/`.
- `npx tsx scripts/pull-vault.ts` → enumerates all 12 mock pages.
- Dev server (HMR) reloads cleanly. `curl http://localhost:5173/p/tlo-historyczne/miasto/beacon-hill` returns 200.

**Open questions / next steps:** Refresh the `wiki.pages` DDL sketch in `SUPABASE_AND_SYNC.md` so it matches the recursive model before the migration runs.

---

## 2026-05-19 — Framework session TL;DR

**What shipped today (10 commits on `main`):**

- A1+A2 — Vite + React 19 + TS + Tailwind v4 scaffold; locked stack deps; Cthulhu skin ported to `@theme` tokens (palette, Cinzel/Cormorant/Special Elite, `.prose-cthulhu` for rendered markdown). Polish diacritics verified.
- B1 — `AppShell` with always-visible Shelf sidebar, breadcrumbs, full routing tree (`/`, `/s/:shelf`, `/s/:shelf/b/:book`, `/c/:chapter`, `/p/:page`, `/map`, `/draft`).
- B2 — Mock content tree: 3 shelves × 5 books × ~10 pages, Polish text + wikilinks + GFM tables + code + blockquotes + images.
- B3 — Markdown render via `react-markdown` + `remark-gfm` + custom `remarkWikilinks` (AST-level, code-safe). Shared parser/resolver in `src/lib/wikilinks.ts`. Decision documented in `work/2026-05-19-wikilink-plugin`.
- C1 — `scripts/push-vault.ts` dry-run; cleanup ported from `import.py`; `--execute` gated in code with a clear approval-needed error.
- C2 — `scripts/pull-vault.ts` dry-run; symmetric `--execute` gating; mock content used as stand-in source until Supabase wires up.
- E1 — `BostonMap` component with `react-leaflet` `ImageOverlay` over a 1000×1500 SVG placeholder; 3 mock pins with popovers in Cthulhu skin. Real 13 MB JPG deliberately not committed.
- D1 — `@uiw/react-md-editor` integrated on `/draft` with in-memory zustand store; preview uses the same remark pipeline as read mode. Decision documented in `work/2026-05-19-editor-choice`.

**Final build:** clean — see next entry's verification.

**Where to start next session (Paweł):**

1. Open the dev server (`npm run dev`) and click through `/`, a shelf, a book, a page (verify wikilink links work), `/map`, `/draft` (type Polish, watch preview).
2. Read `memories/project.md` "Current status" + "What needs the user" — three concrete unblockers waiting.
3. Easiest next step that doesn't need Supabase: copy the real `boston-map-1924.jpg` and swap `IMG_URL` in `BostonMap.tsx`.
4. When ready for Supabase: coordinate with coc-creator (see `INTEGRATIONS.md`), then port `SUPABASE_AND_SYNC.md`'s draft DDL into a migration and run it. Once schema exists, both `--execute` paths can be unlocked one at a time.

**What is *not* done and *not* faked:**

- No Supabase migration was run.
- No `.env` was populated (only `.env.example`).
- No auth provider was configured.
- No GH Pages deploy.
- No real Boston map JPG was copied into the repo.
- Push/pull scripts run dry-run only — `--execute` exits 1 on both.

---

## 2026-05-19 — D1: Markdown editor (`/draft`)

**Files touched:**

- `docs/AktaKasandry_obsidian/work/2026-05-19-editor-choice.md` — comparison of `@uiw/react-md-editor` vs `react-markdown-editor-lite` vs `milkdown`. Decision: uiw.
- `src/stores/draft.ts` — zustand store; in-memory only (no persistence) with a polish-flavoured initial sample.
- `src/routes/DraftView.tsx` — `MDEditor` with `preview="live"`. Preview pane wired with the same `remarkGfm` + `remarkWikilinks` plugins and the same react-router-aware `<a>` override as `src/components/Markdown.tsx`.
- `docs/AktaKasandry_obsidian/work/Index.md` — editor question marked resolved.

**Decisions:**

- Editor pick: `@uiw/react-md-editor` — full rationale in the work note. Key driver: preview accepts our existing remark plugins, so no second rendering pipeline.
- In-memory only. Stage D proper will replace with auth-gated write to `wiki.pages` + `wiki.revisions`.
- Editor uses `data-color-mode="light"` on its parent — the package's dark-mode CSS would clash with the parchment background.

**Verification:** `npm run build` → 3.3 s; JS 1.53 MB (gzip 509 KB). Code-split deferred to stage G per the work note's accepted trade-off.

**Open questions / next steps:** Final — update `memories/project.md` with what shipped + what waits for user; final journal entry.

---

## 2026-05-19 — E1: BostonMap placeholder

**Files touched:**

- `public/maps/boston-placeholder.svg` — 1000×1500 inline SVG: dark teal background, ribbed grid, double gold frame, Cinzel "BOSTON / A.D. 1924" title. Deliberately *not* the 13 MB real map — the placeholder communicates "this is where the map will live".
- `src/mocks/pins.ts` — 3 mock pins (Beacon Hill, North End, Whitcomb's antique shop) with image-local coords + `title`/`label`/`description`.
- `src/components/BostonMap.tsx` — `MapContainer` w/ `CRS.Simple`, `ImageOverlay`, `Marker` x3, popover formatted with the Cthulhu skin. Custom `divIcon` (gold dot) avoids the default Leaflet PNG which Vite won't ship correctly from `node_modules`.
- `src/routes/MapView.tsx` — wraps `<BostonMap />` with a heading + explanatory blurb.

**Decisions:**

- y-axis mirroring (`IMG_HEIGHT - pin.y`) so pin coordinates use top-left origin like image software, while Leaflet's `CRS.Simple` measures from the bottom.
- No edit mode yet — that needs auth + Supabase pin storage (stage D + E proper). Popover already shows the data the editor will write back.
- Map JS bundle is ~220 KB. Dynamic import / route-level code split is a stage-G optimization, noted but not implemented here.

**Verification:** `npm run build` → 2.0 s; chunk warning on map JS (expected — leaflet is heavy).

**Open questions / next steps:** D1 — pick + integrate markdown editor for `/draft`.

---

## 2026-05-19 — C2: Pull-vault script (dry-run only)

**Files touched:**

- `scripts/pull-vault.ts` — symmetric to push: enumerates rows that would be written back to the vault, runs them through `appToVault` (app-form internal links → `[[wikilink]]`), prints `vault-path`/`title`/`hash`/`bytes`. `--execute` exits 1 with a three-pronged approval reminder (schema, `ready_to_sync` from stage F, manual confirm).
- `docs/AktaKasandry_obsidian/TASK_LIST.md` — stage F partials marked done.

**Decisions:**

- Until Supabase is wired, the pull script uses `mocks/content` as a stand-in source — gives a visible, hash-stable output without faking network calls.
- Writeback gating message names all three blockers (schema, flag, manual confirm) so the user has a checklist when they unblock.

**Verification:** dry-run prints 8 mock rows; `--execute` exits 1.

**Open questions / next steps:** E1 — Boston map placeholder + pins.

---

## 2026-05-19 — C1: Push-vault script (dry-run only)

**Files touched:**

- `scripts/push-vault.ts` — CLI entry. Reads `VAULT_PUBLIC` (falls back to `./sample-vault`), discovers pages by Shelf > Book > [Chapter] > `.md` layout, runs the cleanup pipeline and prints what would be upserted. `--execute` writes a clear "schema migration needs user approval" error and exits 1.
- `scripts/lib/walk.ts` — `walkVault()` + `VaultPage` shape; honours exclude dirs (`memory/`, `.obsidian/`, etc.) and `_`/`.`/`.excalidraw.md` filters from `import.py`.
- `scripts/lib/cleanup.ts` — `collapseAsterisks`, `stripDuplicateH1`, `slugify`, `contentHash` (FNV-1a 32-bit). Pure functions, ported from `import.py`.
- `src/lib/wikilinks.ts` — switched `@/mocks/content` and `@/types` imports to relative paths so `tsx` (script runtime) can resolve them without the Vite alias.
- `tsconfig.node.json` — added `@/*` path + included `src/**/*.ts` so the build understands transitive imports from scripts into src.
- `sample-vault/Kampania/Tlo historyczne/Miasto/Beacon Hill.md`, `…/Ludzie/Alistair Whitcomb.md`, `…/Sesje/Sesja 1 - List.md` — fixture (3 pages, exercises wikilinks + collapseAsterisks).

**Decisions:**

- `--execute` gating is enforced **in code**, not just docs — the script exits 1 before any I/O if the flag is passed (sync with coc-creator on shared Supabase first).
- Natural key is `path-from-vault` (`Kampania/Tlo historyczne/Miasto/Beacon Hill.md`), not slug — stable across title renames, breaks only on file moves (acceptable, matches Obsidian usage).
- Shared cleanup vs renderer lives in two places by design: `scripts/lib/cleanup.ts` for push-side mutation; `src/lib/remarkWikilinks.ts` for render-side AST traversal. Both call the same `parseWikilink`/`resolveWikilink`.
- Image rewriting (bucket vs repo) deferred — still open in `work/Index.md`.

**Verification:**

- `npx tsx scripts/push-vault.ts` on the 3-page fixture → all 3 listed, hashes stable, cleanup pipeline visible.
- `npx tsx scripts/push-vault.ts --execute` → exit 1 with the migration-approval error.
- `npm run build` → 1.4 s, clean.

**Open questions / next steps:** C2 — pull script (same shape, app→vault direction).

---

## 2026-05-19 — B3: Markdown render + wikilinks

**Files touched:**

- `src/lib/wikilinks.ts` — shared parser/resolver: `parseWikilink`, `findWikilinks`, `resolveWikilink`, `vaultToApp`, `appToVault`. Single source of truth for both renderer and sync.
- `src/lib/remarkWikilinks.ts` — remark plugin walking the AST, replacing `[[…]]` text matches with `link` nodes (or `emphasis` for broken targets). Skips `code`/`inlineCode` subtrees so wikilink syntax inside code stays literal.
- `src/components/Markdown.tsx` — react-markdown wrapper: `remark-gfm` + `remarkWikilinks`, custom `a` component routes internal `/…` URLs through react-router `<Link>`, external links open in new tab.
- `src/routes/PageView.tsx` — swaps the `<pre>` placeholder for `<Markdown>`.
- `docs/AktaKasandry_obsidian/work/2026-05-19-wikilink-plugin.md` — new work note explaining hybrid AST-plugin + string-preprocess approach.
- `docs/AktaKasandry_obsidian/work/Index.md` — wikilink-resolution-timing question marked resolved.

**Decisions:**

- Hybrid approach: remark plugin for render (AST-safe), string preprocess for C1/C2 sync. Detailed rationale in the work note.
- Resolver walks the tree by **page title**, not slug — matches Obsidian's convention. Cheap on mock data; precompute a title→url map if it bites at Supabase scale.
- Broken wikilinks render as italic plain text (`<em>` carrying a `data.wikilinkBroken` flag). No render crash on missing targets.

**Verification:** `npm run build` → 1.5 s; JS 462 kB (react-markdown is heavy, gzip 147 kB — fine for the planned audience).

**Open questions / next steps:** C1 — push-vault dry-run, reusing `vaultToApp`.

---

## 2026-05-19 — B1: AppShell + routing

**Files touched:**

- `src/components/AppShell.tsx` — header (logo + top nav Półki/Mapa/Draft) + left aside (Shelf list) + main `<Outlet />` + footer; sidebar always visible, active route highlighted
- `src/components/Breadcrumbs.tsx` — derives crumb chain from URL params via mock helpers
- `src/routes/Landing.tsx`, `ShelfView.tsx`, `BookView.tsx`, `ChapterView.tsx`, `PageView.tsx`, `MapView.tsx`, `DraftView.tsx` — route components
- `src/router.tsx` — full route tree per `TECHNOLOGY_MASTERMIND.md` (8 routes: `/`, `/s/:shelf`, `/s/:shelf/b/:book`, `/s/:shelf/b/:book/c/:chapter`, `/s/:shelf/b/:book/c/:chapter/p/:page`, `/s/:shelf/b/:book/p/:page`, `/map`, `/draft`)
- `src/App.tsx` — removed (replaced by AppShell)
- `docs/AktaKasandry_obsidian/TECHNOLOGY_MASTERMIND.md` — component tree section updated to reflect what landed

**Decisions:**

- `BookView` handles both branches: book-with-chapters and book-with-flat-pages. Routing covers both shapes.
- `PageView` currently renders raw markdown in `<pre>` — B3 swaps for `react-markdown` + wikilink plugin.
- Sidebar lists shelves only (per spec — "Shelf list, always visible, large titles"). Drilldown happens in main column.

**Verification:** `npm run build` → 703 ms; CSS 13.7 kB, JS 303 kB. Visual nav check pending in dev server.

**Open questions / next steps:** B3 — wire `react-markdown` + remark-gfm + wikilink plugin into `PageView`.

---

## 2026-05-19 — B2: Mock content tree

**Files touched:**

- `src/types.ts` — type defs: `Shelf > Book > Chapter > Page`, plus `Crumb`, `Pin`
- `src/mocks/content.ts` — 3 shelves (Kampania, Mechanika, Okult i mity), 5 books, mix of chapter/no-chapter books. Pages contain Polish diacritics, GFM tables, fenced code, blockquotes (incl. callout-style `> [!note]`), images (placehold.co), wikilinks `[[Page]]` and `[[Page|alias]]`. Includes typed `findShelf` / `findBook` / `findChapter` / `findPage` helpers.

**Decisions:**

- Wikilinks reference page **titles** (not slugs) — matches how Obsidian-native vault content will arrive. Resolver in B3 will walk the tree by title.
- Books may have `chapters?` *or* `pages?` directly — mirrors the spec's optional-chapter routing (`/s/:shelf/b/:book/p/:page`).
- Mock helpers live next to mock data; in stage C the same module becomes the Supabase-backed lookup layer (swap the source, keep the API).

**Verification:** TS strict-mode clean.

**Open questions / next steps:** B1 — AppShell + routing.

---

## 2026-05-19 — A2: Cthulhu skin → Tailwind v4 theme

**Files touched:**

- `src/index.css` — `@theme` block with palette (`teal-deep`, `parchment`, `gold`, `ink`, etc.) and font tokens; `.prose-cthulhu` class for markdown bodies (headers, links, code, blockquote, table, image)
- `src/App.tsx` — Polish-diacritic verification sample using Tailwind utility classes generated from theme tokens
- `docs/AktaKasandry_obsidian/DESIGN_SYSTEM.md` — token reference table + font-loading decision

**Decisions:**

- Skin port: 1:1 from `C:\temp\bookstack-test\cthulhu-skin-minimal.html` — colours, fonts, header/code/blockquote/table semantics
- Tailwind v4 theme syntax (`@theme { --color-* }`) auto-generates `bg-*` / `text-*` / `border-*` utility classes
- Fonts via Google Fonts `<link>` (already in `index.html`) — Cinzel + Cormorant Garamond + Special Elite all render Polish diacritics (verified on sample text)
- `.prose-cthulhu` class encapsulates the markdown body styles — no per-element utility classes inside rendered pages

**Verification:** `npm run build` → 655 ms, CSS 8.28 kB. Sample renders ąćęłńóśźż / ĄĆĘŁŃÓŚŹŻ correctly.

**Open questions / next steps:** B1 — layout shell with left sidebar, breadcrumbs, route outlet.

---

## 2026-05-19 — A1: Vite scaffold + deps

**Files touched:**

- `package.json` — created with locked stack deps (React 19 + TS + Vite 6 + Tailwind v4 + Supabase + zustand + react-router 7 + react-hook-form + zod + react-markdown + remark-gfm + react-leaflet 5 + leaflet + @uiw/react-md-editor)
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` — strict TS config, `@/*` path alias
- `vite.config.ts` — React + Tailwind v4 plugin (`@tailwindcss/vite`), `@` alias
- `index.html` — Google Fonts (Cinzel, Cormorant Garamond, Special Elite), `lang="pl"`
- `.env.example` — placeholders for `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VAULT_PUBLIC`
- `src/main.tsx`, `src/router.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts` — minimal bootable shell

**Decisions:**

- Manual scaffold (not `npm create vite`) — repo not empty, would clobber `CLAUDE.md` / `docs/`
- `react-leaflet` bumped 4→5 — v4 peer-deps React 18, we're on React 19
- Build script uses `npx tsc -b && npx vite build` — Bash PATH on Windows doesn't see `node_modules/.bin`
- `npm install --legacy-peer-deps` — some transitive peers still on React 18; no runtime breakage observed
- `@uiw/react-md-editor` chosen for D1 (justified in stage-D work note when written)

**Verification:** `npm run build` → 711 ms, 286 kB JS, 7 kB CSS.

**Open questions / next steps:** A2 — port Cthulhu skin tokens to Tailwind v4 `@theme`.

---

## 2026-05-19 — Vault scaffolded

**Files touched:**

- `CLAUDE.md` — created (Session Start/End workflow, Obsidian conventions, file reference table, project guardrails)
- `docs/AktaKasandry_obsidian/memories/project.md` — created (comprehensive seed memory: scope, stack, integrations, MVP, conventions)
- `docs/AktaKasandry_obsidian/work/Index.md` — created with pre-seeded open questions (editor choice, slugify, realtime granularity, image storage, wikilink resolution timing)
- `docs/AktaKasandry_obsidian/TASK_LIST.md` — created with staged backlog a-g
- `docs/AktaKasandry_obsidian/TECHNOLOGY_MASTERMIND.md` — created (stack, routing sketch, component tree placeholder, build/deploy)
- `docs/AktaKasandry_obsidian/DESIGN_SYSTEM.md` — created (palette, fonts, layout intent, skin reference)
- `docs/AktaKasandry_obsidian/SUPABASE_AND_SYNC.md` — created (content model, proposed schema, RLS sketch, push/pull script flow, wikilink conversion)
- `docs/AktaKasandry_obsidian/INTEGRATIONS.md` — created (coc-creator shared Supabase, content vault, PoC reuse, GH Pages)
- `docs/AktaKasandry_obsidian/LOGGING_INSTRUCTIONS.md` — created (where to write what, frontmatter, tags, wikilinks, journal format)

**Decisions:**

- Vault structure approved by user
- Three project-specific docs split out from the generic seed template: `DESIGN_SYSTEM`, `SUPABASE_AND_SYNC`, `INTEGRATIONS` (instead of one big TECHNOLOGY_MASTERMIND)
- `outputs/` kept light — only `mockups/` and `screenshots/`, no AI-gen subfolders
- `STRATEGY_AND_TACTICS.md` deliberately omitted — MVP scope is locked in the spec

**Open questions / next steps:**

- Implementation starts in the next session. Read `memories/project.md` + `TASK_LIST.md` first.
- Open decisions tracked in `[[work/Index]]`: editor choice, slugify strategy, realtime granularity, image storage, wikilink resolution timing.
- Stage A first action: read `coc-creator/docs/CoCCreator_obsidian/TECHNOLOGY_MASTERMIND.md` section "Shared Supabase with akta-kasandry" before designing schema.
