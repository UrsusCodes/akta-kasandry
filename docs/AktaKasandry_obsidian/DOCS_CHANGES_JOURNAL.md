---
date: 2026-05-19
status: active
tags:
  - journal
---

# Docs Changes Journal

Per-session changelog. Most recent on top. See `[[LOGGING_INSTRUCTIONS]]` for the entry format.

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
