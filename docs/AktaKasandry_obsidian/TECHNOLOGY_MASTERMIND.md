---
date: 2026-05-19
status: active
tags:
  - architecture
  - tech
---

# Technology Mastermind

## Stack (locked)

| Layer | Choice |
|---|---|
| Build | Vite |
| Language | TypeScript |
| UI | React 19 |
| Styling | TailwindCSS v4 |
| State | zustand |
| Routing | react-router-dom v7 |
| Forms | react-hook-form + zod |
| Markdown | react-markdown + remark-gfm + wikilink plugins |
| Backend | Supabase (DB + Auth + Storage + Realtime) |
| Map | react-leaflet (imageOverlay) |
| Deploy | GitHub Pages (static SPA) |

> [!warning] Stack discipline
> Mirrors coc-creator. No new top-level dependencies without explicit user approval. See `[[INTEGRATIONS]]` for shared-Supabase details.

## Routing

Final shape (refactored 2026-05-20 — see [[work/2026-05-20-recursive-content-tree]]):

- `/` — landing (top-level folder/page cards)
- `/p/*` — catch-all; `*` is the slug path (e.g. `/p/tlo-historyczne/miasto/beacon-hill`). Resolves to a `ContentNode` (folder or page) at arbitrary depth.
- `/map` — Boston map
- `/draft` — markdown editor (in-memory, stage D1)
- `/auth/*` — auth routes (Supabase-driven, stage D)
- `/edit/*` — gated editor on a real page (stage D)

URL slugs are slugified (lowercase ASCII + dashes). Display names with Polish diacritics resolved by walking the tree.

## Component tree

Landed in B1, refactored 2026-05-20 to drop fixed-depth views:

- `src/components/AppShell.tsx` — header (logo, top nav: Wiki/Mapa/Draft) + left aside (recursive `<TreeNav>`) + main outlet + footer
- `src/components/TreeNav.tsx` — collapsible Obsidian-style sidebar; folders expand/collapse, page on current route auto-expands ancestor chain
- `src/components/Breadcrumbs.tsx` — derives crumbs from URL segments + tree lookup
- Routes under `src/routes/`:
  - `Landing.tsx` (`/`) — top-level cards
  - `NodeView.tsx` (`/p/*`) — catch-all: renders page body, or folder index + optional folder-body
  - `MapView.tsx` (`/map`) — Leaflet `ImageOverlay` with pins (E1)
  - `DraftView.tsx` (`/draft`) — editor + live preview (D1)
- Not yet built: `RevisionList`, `DiffView`, `AuthGate`, `LoginForm` — wait for stage D

## Content pipeline (PUBLIC vault → site)

The reader is fed by a generated TypeScript module (`src/generated/content.ts`) — not by reading the vault at runtime. Two scripts manage the snapshot:

| Script | Purpose |
|---|---|
| `npm run build-content` | One-shot regenerate. Walks `VAULT_PUBLIC` (default `G:\…\PUBLIC`), writes `src/generated/content.ts`, copies attachments + `EXTRA_ASSETS` (e.g. `boston-map-1924.jpg`) into `public/vault-attachments/by-name/`. |
| `npm run watch-content` | Long-running watcher. Runs the generator once on startup, then re-runs (~500 ms debounce) on any change inside the vault or to a named EXTRA_ASSET. Vite's HMR picks up the regenerated file and reloads the page. |

Both share `scripts/lib/generate.ts` (the core generator) so behaviour stays consistent.

Workflow for dev:

```
terminal A:  npm run dev
terminal B:  npm run watch-content
# edit a .md file in Obsidian → page auto-reloads within ~1 s
```

Generator is read-only against the vault — only writes inside the repo.

## Build / Deploy

- `npm run build` → static `dist/`
- Publish via GitHub Pages (branch `gh-pages` or Actions workflow — decide in stage G)
- Env injection: Vite reads `.env` at build time; `.env.example` committed
- Boston map (`public/maps/boston-map-1924.jpg`, 13 MB) shipped with the build — not fetched at runtime

## See also

- `[[SUPABASE_AND_SYNC]]` — schema, RLS, push/pull scripts, content model
- `[[DESIGN_SYSTEM]]` — design tokens, components, skin
- `[[INTEGRATIONS]]` — coc-creator coordination, content vault, PoC reuse
