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

Rationale: coc-creator (sister project) is already on this stack and shares the Supabase project. No deviation without explicit user approval.

## Critical external dependencies & coordination

### Shared Supabase project (with coc-creator)

- Same project URL + ANON_KEY as coc-creator (user supplies via `.env`)
- **Isolation via schema `wiki`** — all our tables live there (`wiki.pages`, `wiki.revisions`, `wiki.pins`, `wiki.profiles`)
- Auth is shared — coc-creator account = SSO into akta-kasandry
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

> [!info] Transcript audio is not hosted here
> Per-channel Opus (~300 MB/session) is intentionally NOT committed/streamed. Each chunk shows `chNN @ mm:ss`; the GM fills `public/transcripts/data/audio-links.json` with shareable (Google Drive) links for manual seeking. Revisit GitHub Releases / R2 only if real in-browser playback is ever wanted. Note this is the one place the project's "no audio/video embeds" exclusion is relaxed — and only as external links, not hosted media.

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
- Profile per player in `wiki.profiles` (`role: 'mg' | 'gracz'`)
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
- In-browser Excalidraw editor
- Mobile-first responsive (desktop priority)
- Audio / video embeds
- Per-page comments
- AI-generated content (portraits, handouts, summaries) — separate tooling, not this project

## Conventions

- All docs in English; UI/UX strings, page content, slugs in Polish
- Polish characters must work everywhere — UI, DB, URLs (after slugify), search
- Code, commits, identifiers in English
- Communication with user in Polish
- Stack locked; no new top-level deps without explicit user approval
