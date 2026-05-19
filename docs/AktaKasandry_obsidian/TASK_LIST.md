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

- [ ] Supabase Auth setup (email/pass + Google OAuth) — coordinate with coc-creator SSO
- [ ] `wiki.profiles` table + role field, plus first-login trigger
- [ ] RLS policies for read/edit
- [ ] Inline markdown editor — pick one (`[[work/Index]]`)
- [ ] `wiki.revisions` write hook on page UPDATE
- [ ] Diff view + rollback button

### Stage E — Boston map with pins `#stage/e`

- [ ] Commit `boston-map-1924.jpg` (13MB) into `public/maps/`
- [ ] `react-leaflet` `ImageOverlay` component
- [ ] Read pins from `wiki.pins`
- [ ] Edit mode (role `mg`): click-add, drag-move, right-click-edit/delete
- [ ] Realtime subscription on `wiki.pins`

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

## Out of scope (do not pick up)

- Player image uploads
- In-browser Excalidraw editor
- Mobile-first responsive
- Audio / video embeds
- Per-page comments

## DONE

_(empty)_
