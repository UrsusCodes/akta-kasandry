---
date: 2026-05-19
status: active
tags:
  - tasks
---

# Task List

Staged plan mirrors the project spec (a-g). Active stage at top of "In progress"; finished stages move to DONE.

## In progress

Framework scaffolding session — stages A (partial), B (full), C (dry-run only), D1 (editor pick), E1 (placeholder map).

## Backlog (staged)

### Stage A — Setup + Supabase connection + schema migration `#stage/a`

- [x] Scaffold Vite + React 19 + TS project (manual scaffold, repo wasn't empty) — A1
- [x] Add Tailwind v4, wire palette tokens (see `[[DESIGN_SYSTEM]]`) — A2
- [x] Install: `@supabase/supabase-js`, `zustand`, `react-router-dom@7`, `react-hook-form`, `zod`, `react-markdown`, `remark-gfm`, `react-leaflet@5` (bumped from 4 for React 19 peer) — A1
- [x] `.env.example` committed; `.env` gitignored — A1
- [ ] Copy package.json conventions from `coc-creator` (`gh` CLI to inspect) — deferred, current setup mirrors stack
- [ ] Read `coc-creator/docs/CoCCreator_obsidian/TECHNOLOGY_MASTERMIND.md` section **"Shared Supabase with akta-kasandry"** before touching schema — pending user
- [ ] Design `wiki.*` schema DDL + RLS policies (see `[[SUPABASE_AND_SYNC]]`) — pending user
- [ ] Run migration against shared Supabase project — pending user (shared with coc-creator)

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
- [ ] Read pins from `wiki.pins` — pending Supabase
- [ ] Edit mode (role `mg`): click-add, drag-move, right-click-edit/delete — pending auth. **Decision 2026-05-20:** user opted to wait for the Supabase + Auth path rather than ship a localStorage stopgap. Unlock chain: (1) schema migration approval → (2) Auth provider config → (3) RLS for `wiki.pins` → (4) implement edit-mode UI gated by role `mg`.
- [ ] Realtime subscription on `wiki.pins` — pending Supabase
- [ ] Pre-tiled (`gdal2tiles`) version of the 1924 JPG for faster first-paint on slow links — follow-up

### Stage F — Supabase → vault back-sync (pull) `#stage/f`

- [ ] Add `ready_to_sync` column on `wiki.pages` (probably done in stage A) — pending user
- [x] Node CLI pull script (dry-run only) — C2
- [x] Wikilink conversion (app → vault form) via shared `src/lib/wikilinks.ts#appToVault` — C2
- [ ] Diff / preview before writing to filesystem (manual confirm step) — pending Supabase
- [ ] After successful write: flip `ready_to_sync = false` — pending Supabase

### Stage G — Deploy `#stage/g`

- [ ] GH Pages config (`gh-pages` branch or Actions workflow)
- [ ] Build script + `.env` injection
- [ ] First production deploy
- [ ] (Optional) custom domain

### Stage H — Character import from coc-creator `#stage/h` `#dep/coc-creator`

Design ready ([[work/2026-05-20-import-coc-creator-characters]]). DDL in [[SUPABASE_AND_SYNC]]. Implementation blocked on Supabase migration + Auth.

- [x] **User action:** ✅ user will add "Shared Supabase with akta-kasandry" section to coc-creator side (2026-05-20)
- [ ] **User decision:** player-display-name strategy — recommended (b) admin-types-it; awaiting confirmation
- [x] **User decision:** ✅ `wiki.imported_characters` SELECT open to anon (2026-05-20)
- [ ] **User review:** rewritten `[[SUPABASE_AND_SYNC]]` — DDL is now reviewable
- [ ] Migration + RLS — pending schema unlock
- [ ] `/admin/import-characters` route + multi-select UI — pending Auth
- [ ] `<CharacterPage>` renderer for `BADACZE/<slug>` virtual pages
- [ ] `useContentTree()` hook merging vault snapshot + imported characters at runtime

## Out of scope (do not pick up)

- Player image uploads
- In-browser Excalidraw editor
- Mobile-first responsive
- Audio / video embeds
- Per-page comments

## DONE

_(empty)_
