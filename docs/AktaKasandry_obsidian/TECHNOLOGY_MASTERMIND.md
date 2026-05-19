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

## Routing (to be finalised in stage A)

Sketch:

- `/` — landing / shelf list
- `/s/:shelf` — shelf page
- `/s/:shelf/b/:book` — book page
- `/s/:shelf/b/:book/c/:chapter` — chapter page
- `/s/:shelf/b/:book/c/:chapter/p/:page` — page render
- `/s/:shelf/b/:book/p/:page` — page when chapter is absent
- `/map` — Boston map
- `/auth/*` — auth routes (Supabase-driven)
- `/edit/:page` — gated editor

Open question: Polish characters in URL slugs — see `[[work/Index]]`.

## Component tree

_(to be designed)_

High-level intent:

- `AppShell` (left Shelf nav, breadcrumbs, route outlet)
  - `ShelfList`, `BookList`, `ChapterList`, `PageView`
  - `MapView`, `MapEditTools`
  - `Editor`, `RevisionList`, `DiffView`
  - `AuthGate`, `LoginForm`

## Build / Deploy

- `npm run build` → static `dist/`
- Publish via GitHub Pages (branch `gh-pages` or Actions workflow — decide in stage G)
- Env injection: Vite reads `.env` at build time; `.env.example` committed
- Boston map (`public/maps/boston-map-1924.jpg`, 13 MB) shipped with the build — not fetched at runtime

## See also

- `[[SUPABASE_AND_SYNC]]` — schema, RLS, push/pull scripts, content model
- `[[DESIGN_SYSTEM]]` — design tokens, components, skin
- `[[INTEGRATIONS]]` — coc-creator coordination, content vault, PoC reuse
