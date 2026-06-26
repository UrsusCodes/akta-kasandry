---
date: 2026-05-19
status: active
tags:
  - tasks
---

# Task List

Staged plan mirrors the project spec (a-g). Active stage at top of "In progress"; finished stages move to DONE.

## In progress

Stages A, B, E, G, H, **I**, **J**: **complete**. **K (session summaries): in progress** — Sól w Ranach + UG 2 summaries live, but **UG 2 is missing the off-mic night-recon + first shootout** (see Stage K). C (dry-run only), D1 (editor live, no persistence yet), F (dry-run only).

> [!important] NEXT SESSION — first task
> Get from the GM the beats of UG 2's **nocny zwiad + pierwsza strzelanina z ludźmi Carmodych** (off-mic, between negotiations and the academics) and insert a flagged "⚠ poza nagraniem" section into both `/streszczenie-ug2` and `/streszczenie-ug2/narracja`. Then optionally: UG 2 quotes page; fold the narrative's extra details into the short summary.

## Backlog (staged)

### Stage A — Setup + Supabase connection + schema migration `#stage/a`

- [x] Scaffold Vite + React 19 + TS project (manual scaffold, repo wasn't empty) — A1
- [x] Add Tailwind v4, wire palette tokens (see `[[DESIGN_SYSTEM]]`) — A2
- [x] Install: `@supabase/supabase-js`, `zustand`, `react-router-dom@7`, `react-hook-form`, `zod`, `react-markdown`, `remark-gfm`, `react-leaflet@5` (bumped from 4 for React 19 peer) — A1
- [x] `.env.example` committed; `.env` gitignored — A1
- [x] Design `wiki.*` schema DDL + RLS policies — done in `[[SUPABASE_AND_SYNC]]` (rewritten 2026-05-20), DDL in `supabase/migrations/001..006.sql`
- [x] Supabase client init (`src/lib/supabase.ts`) — lazy, env-driven, default schema `wiki`
- [x] Migration runbook (`docs/RUNBOOKS/supabase-migration.md`) — step-by-step for SQL Editor mode
- [x] ✅ **DONE 2026-05-20** — `.env.local` populated (legacy anon JWT from shared project)
- [x] ✅ `wiki` exposed (via `alter role authenticator set pgrst.db_schemas` — dashboard Save didn't propagate, see runbook known-issue)
- [x] ✅ migrations 001..007 run in SQL Editor (007 = explicit grants, added after hitting 404 on missing table grants)
- [x] ✅ `wiki-attachments` bucket created (public)
- [x] ✅ MG account `storage.station2023@gmail.com` (role `mg`), created via dashboard + promoted via SQL
- [x] ✅ coc-creator-Claude added their `INTEGRATIONS.md` + reviewed our plan (4 non-blocking flags folded in)
- [x] ✅ smoke test passed — `wiki.pages` and `wiki.imported_characters` both return `[]` via anon REST

**STAGE A COMPLETE.** Supabase live. Unblocks: push-vault `--execute` (C), pin editing (E), character import (H), page editor save (D).

### Stage B — Public reader `#stage/b`

- [x] Routing skeleton (react-router v7) with public routes — B1
- [x] Cthulhu skin: port palette + fonts from `C:\temp\bookstack-test\cthulhu-skin-minimal.html` into Tailwind v4 theme — A2 (moved up)
- [x] Left-sidebar Shelf list (always visible, large titles) — B1
- [x] Breadcrumbs component — B1
- [x] Mock content data (B2) — 3 shelves, books, chapters, pages with Polish content + wikilinks
- [x] Markdown render: Polish characters, wikilinks `[[X]]` / `[[X|alias]]` → internal links, images, tables, code, blockquotes — B3

### Stage C — Vault → Supabase sync (push) `#stage/c`

- [x] Node CLI script reading `VAULT_PUBLIC` env (fallback `./sample-vault`) recursively — C1 (dry-run only)
- [x] Path-relative-to-vault as natural key — C1
- [x] Wikilink conversion (vault → app form) via shared `src/lib/wikilinks.ts#vaultToApp` — decided in `[[work/2026-05-19-wikilink-plugin]]`
- [ ] Image reference rewriting — `[[work/Index]]` still open (bucket vs repo)
- [x] Asterisks-and-cruft cleanup (`collapseAsterisks` + `stripDuplicateH1` in `scripts/lib/cleanup.ts`) — C1
- [ ] First full import of `PUBLIC/` — pending Supabase migration (user approval needed)

### Stage D — Auth + edit `#stage/d`

- [ ] Supabase Auth setup (email/pass + Google OAuth) — coordinate with coc-creator SSO — pending user
- [ ] `wiki.profiles` table + role field, plus first-login trigger — pending Supabase
- [ ] RLS policies for read/edit — pending Supabase
- [x] Inline markdown editor — `@uiw/react-md-editor` ([[work/2026-05-19-editor-choice]]); integrated on `/draft` with in-memory zustand store + live preview — D1
- [ ] `wiki.revisions` write hook on page UPDATE — pending Supabase
- [ ] Diff view + rollback button — pending Supabase

### Stage E — Boston map with pins `#stage/e`

- [x] Boston map — Leaflet `ImageOverlay` over real `boston-map-1924.jpg` (Rand McNally, 7803×11702, staged by `npm run build-content` from one level above PUBLIC). Inside the existing PUBLIC article ([[work/2026-05-20-public-snapshot-and-osm-map]]).
- [x] Pin markers + popovers (mock data only, no DB yet) — E1
- [x] ✅ Read pins from `wiki.pins` — E1 (2026-05-20), mock fallback when no creds
- [x] ✅ Edit mode (role `mg`): click-add, drag-move, delete — E2/E3 (2026-05-20). Gated `isMG && source==='supabase'` + RLS.
- [x] ✅ Edit existing pin (title/label/desc/color) — 2026-05-20. "Edytuj" in popover opens the overlay form pre-filled; saves via updatePin.
- [x] ✅ Pin colors (10-option palette) + colored markers + color picker — 2026-05-20
- [x] ✅ Pin list below map (grouped by color, alpha, click-to-focus) — 2026-05-20
- [ ] Realtime subscription on `wiki.pins` — deferred (free-tier egress; single-MG doesn't need it yet)

**STAGE E feature-complete for v1.** View + full CRUD (add/move/edit/delete) + colors + grouped list, all MG-gated (UI + RLS). Realtime is the only deferred item.
- [ ] Pre-tiled (`gdal2tiles`) version of the 1924 JPG for faster first-paint on slow links — follow-up

### Stage F — Supabase → vault back-sync (pull) `#stage/f`

- [ ] Add `ready_to_sync` column on `wiki.pages` (probably done in stage A) — pending user
- [x] Node CLI pull script (dry-run only) — C2
- [x] Wikilink conversion (app → vault form) via shared `src/lib/wikilinks.ts#appToVault` — C2
- [ ] Diff / preview before writing to filesystem (manual confirm step) — pending Supabase
- [ ] After successful write: flip `ready_to_sync = false` — pending Supabase

### Stage G — Deploy `#stage/g`

- [x] ✅ GH Pages via Actions workflow (`.github/workflows/deploy.yml`) — 2026-05-20
- [x] ✅ Build + `.env` injection via repo secrets (VITE_SUPABASE_URL/ANON_KEY)
- [x] ✅ First production deploy — **live at https://ursuscodes.github.io/akta-kasandry/**
- [x] ✅ SPA fallback (index.html→404.html), base path `/akta-kasandry/`, image base prefix via `withBase`
- [x] ✅ Repo public (`UrsusCodes/akta-kasandry`), auto-deploy on push to main
- [ ] (Optional) custom domain
- [x] ✅ (Maintenance) bump Actions to Node 24 — 2026-05-21
- [ ] (Cosmetic) deep links return HTTP 404 status (SPA still works) — only fixable by a host with real SPA fallback; accepted GH Pages tradeoff

**STAGE G COMPLETE.** Site is live, auto-deploys on push.

### Stage H — Character import from coc-creator `#stage/h` `#dep/coc-creator`

Design ready ([[work/2026-05-20-import-coc-creator-characters]]). DDL in [[SUPABASE_AND_SYNC]]. All decisions made 2026-05-20. Implementation complete 2026-05-21.

- [x] ✅ Coordination doc on coc-creator side (user action) — 2026-05-20
- [x] ✅ Player-display-name = admin-types-it, grouped by source_player_id, localStorage cache — 2026-05-20
- [x] ✅ RLS for `wiki.imported_characters` SELECT = anon — 2026-05-20
- [x] ✅ DDL approved — 2026-05-20
- [x] ✅ Migration `005_imported_characters.sql` — run as part of 001..007 batch 2026-05-20
- [x] ✅ `/admin/import` route with player-grouped UI, player-name inputs, select/import/remove — 2026-05-20
- [x] ✅ `<CharacterPage>` renderer — vendored `CharacterSheet` from coc-creator, portrait + sheet — 2026-05-21
- [x] ✅ `useContentStore` merging vault snapshot + imported characters under `BADACZE/` — 2026-05-20
- [x] ✅ Portrait fix: read `portrait_url` (canonical coc-creator field) — 2026-05-21

### Stage I — Transcript provenance viewer `#stage/i` `#dep/rpg-recorder`

Ported from rpg-recorder. Full rationale: [[work/2026-06-19-transcript-viewer-port]]. Producer/consumer boundary = `<slug>-<variant>-overlay.json` (schema mirrored to `src/lib/transcripts/overlay.ts`).

- [x] ✅ Data layer: 11 overlays (Sol w Ranach ×7, UG 2 ×4) + trimmed `variants.json` + `audio-links.json` in `public/transcripts/data/` — 2026-06-19
- [x] ✅ Overlay TS types + lib (`format`/`data`/`audioLinks`/`corrections`/`effective`) — 2026-06-19
- [x] ✅ `useTranscriptStore` (manifest, current slug/variant, speaker toggles, pin/hover, paint, corrections) — 2026-06-19
- [x] ✅ Renderer as React/Cthulhu components; `content-visibility` virtualization (5000 rows, no new dep) — 2026-06-19
- [x] ✅ Provenance panel: competing chunks with % bars, 5-method votes, audio seek links — 2026-06-19
- [x] ✅ Editor: paint speaker / edit text / localStorage / export JSON — 2026-06-19
- [x] ✅ Routes `/sesje` + `/sesje/:slug?v=`, full-bleed AppShell, "Sesje" nav — 2026-06-19
- [ ] **Audio playback** — deferred by decision (manual Drive seek links). Revisit GitHub Releases / R2 only if real in-browser playback is wanted.

**STAGE I COMPLETE (viewer + corrections).** Adding a session is data-only.

### Stage J — Session summaries with transcript deep-links `#stage/j` `#decision/open`

Per-session/per-investigation summaries authored from the transcript + GM conversation, where summary paragraphs/sections **deep-link into the matching transcript section**. Discussed 2026-06-19, not yet designed.

- [ ] Decide the transcript **anchor scheme** (utterance id / id-range / time window) for stable deep-links
- [ ] Decide summary **storage + format** (vault page? new `wiki.*` table? frontmatter block?)
- [ ] Viewer **deep-link target**: scroll-to + highlight an utterance or range from a URL (e.g. `/sesje/:slug?v=…#u=<id>`)
- [ ] Authoring flow (GM writes summary; how the anchors get attached)

### Stage J — Session-summary deep-links `#stage/j`

- [x] ✅ `remarkTranscriptAnchors` — `{sesja:<slug>#<id>}` / `..` ranges → "↪ transkrypt" pills → `/sesje/<slug>?u=<id>` — 2026-06-20
- [x] ✅ Viewer deep-link target — `?u=` scroll/flash/pin (single id or range) — 2026-06-20
- [x] ✅ Wired into shared `Markdown` renderer — 2026-06-20

**STAGE J COMPLETE.** Anchors use the deployed (epoch) variant's utterance ids.

### Stage K — Session summaries `#stage/k` `#dep/rpg-recorder`

Player-facing session summaries authored from transcript + GM memory, in the "Znak Życia" house style, with `{sesja:…}` deep-links. Currently on demo routes; **to be moved into the vault** under the right `SPRAWY/` cases.

- [x] ✅ **Sól w Ranach** — `/streszczenie-demo` + `/streszczenie-demo/cytaty` (Western CoC; climax lost to recorder software error, reconstructed from GM memory, flagged, no anchors) — 2026-06-20
- [x] ✅ **Urodzaj Grozy (UG 2)** — `/streszczenie-ug2` (3-act, dual gangster+academic group) + `/streszczenie-ug2/narracja` (long-form, sub-agent) — 2026-06-22
- [ ] **UG 2 — write the off-mic night-recon + first human shootout** (between negotiations and academics; recording was paused) — from GM memory, flagged section, both pages. **← first task next session**
- [ ] UG 2 — "śmieszne i epickie momenty" page (have gems: „insane bullshit", „nie chcę żadnej laski dynamitu", „let me die")
- [ ] Fold the UG 2 narrative's extra details (Cayda / „Drogi Ernesti" letter, the cave temptation) into the short summary
- [ ] Move summaries from demo routes into the vault (`SPRAWY/02 URODZAJ GROZY/`, and a case for Sól w Ranach); decide final routing
- [ ] (Optional) switch the `/sesje` viewer to the `concat` variant for sane real-time timestamps — would require re-anchoring all markers to concat ids
- [ ] (Optional) audio — fill `audio-links.json` with Drive links so chunk ▶ links work

### Stage L — Player margin-comments `#stage/l` `#dep/coc-creator`

Players leave IC/OOC comments anchored to text fragments of summary pages, in a right rail; main content untouched. **Design-only so far** (2026-06-26): mockup validated (`.superpowers/brainstorm/v3.html`), spec + plan written. See [[work/2026-06-26-player-comments-design]] and `docs/superpowers/plans/2026-06-26-player-comments.md`.

- [x] ✅ Brainstorm + mockup (v1→v3), spec, 24-task implementation plan — 2026-06-26
- [x] ✅ coc-creator coordination + auth-model correction (no SSO) + email-leak fix (migration 013) — 2026-06-26
- [ ] **MG actions (blockers):** invite players (coc-creator emails) in Supabase; run migrations 009–013; assign colours + character owners + investigation cast in `/admin`
- [ ] Execute the plan in a fresh session (Phase 0–1 = anchorer/colours/UI on mocks can start before MG actions)
- [ ] Deferred polish: realtime comments; per-author fragment tint; inline dot markers; move summaries to vault under the same `page_key`

## Out of scope (do not pick up)

- Player image uploads
- In-browser Excalidraw editor
- Mobile-first responsive
- Audio / video embeds
- ~~Per-page comments~~ — **reopened 2026-06-26** as Stage L, scoped to summary pages, fragment-anchored, never editing main content (see [[work/2026-06-26-player-comments-design]])

## DONE

_(empty)_
