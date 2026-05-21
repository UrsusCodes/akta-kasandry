---
date: 2026-05-19
status: active
tags:
  - tasks
---

# Task List

Staged plan mirrors the project spec (a-g). Active stage at top of "In progress"; finished stages move to DONE.

## In progress

Stages A, B, E, G, H: **complete**. C (dry-run only), D1 (editor live, no persistence yet), F (dry-run only). Next: vault push `--execute` (C), or page editing persistence (D), or back-sync (F).

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

## Out of scope (do not pick up)

- Player image uploads
- In-browser Excalidraw editor
- Mobile-first responsive
- Audio / video embeds
- Per-page comments

## DONE

_(empty)_
