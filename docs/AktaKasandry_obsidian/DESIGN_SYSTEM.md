---
date: 2026-05-19
status: active
tags:
  - design
  - ui
---

# Design System

UX/UI is the primary scope of this project. Treat this file as the source of truth for visual decisions.

## Palette

| Token | Hex | Use |
|---|---|---|
| `--color-teal` | `#0d2828` | Deep background, headers |
| `--color-parchment` | `#f5e6c8` | Page background, body text on dark |
| `--color-gold` | `#c89b3c` | Accent, links, key affordances |

Map these into Tailwind v4 theme tokens. Source HTML reference: `C:\temp\bookstack-test\cthulhu-skin-minimal.html`.

## Typography

| Family | Use |
|---|---|
| Cinzel | Headings (h1–h3) |
| Cormorant Garamond | Body text, paragraphs |
| Special Elite | Code, monospace, typewriter affect |

Loading strategy: **Google Fonts CDN via `<link>` in `index.html`**. Loaded fonts: Cinzel 500/700, Cormorant Garamond 400/500/700 (italic 400/700), Special Elite. All three confirmed to render Polish diacritics correctly (verified on `App.tsx` sample, A2).

## Layout

- **Desktop priority** — mobile renders but is not optimised
- **Left column always visible** — Shelf list, large titles, click navigates
- **Breadcrumbs** below header on every content page
- **Cthulhu mood** — restrained, parchment-on-teal, gold accents only on affordances (no cosmetic gold)

## Tailwind v4 tokens (live in `src/index.css` under `@theme`)

| Token | CSS var | Utility classes |
|---|---|---|
| Deep teal | `--color-teal-deep` | `bg-teal-deep`, `text-teal-deep`, `border-teal-deep` |
| Teal dark (gradient end) | `--color-teal-dark` | `bg-teal-dark`, … |
| Parchment | `--color-parchment` | `bg-parchment`, `text-parchment` |
| Parchment warm (table bg) | `--color-parchment-warm` | `bg-parchment-warm` |
| Gold (accent) | `--color-gold` | `bg-gold`, `text-gold`, `border-gold` |
| Gold muted (rules) | `--color-gold-muted` | `border-gold-muted`, … |
| Gold dark (link rest) | `--color-gold-dark` | `text-gold-dark`, … |
| Ink (body on parchment) | `--color-ink` | `text-ink`, `bg-ink` |
| Rule (table border) | `--color-rule` | `border-rule` |
| `--font-display` | Cinzel | `font-display` |
| `--font-body` | Cormorant Garamond | `font-body` |
| `--font-mono` | Special Elite | `font-mono` |

`.prose-cthulhu` class on the markdown article applies the full skin (headers, links, code, blockquote, table, image) without per-element utility classes — keep it for rendered markdown only.

## Component patterns

_(to be established as we build — capture each pattern here once it lands in code, with a short rationale)_

## Skin reference

- Source HTML: `C:\temp\bookstack-test\cthulhu-skin-minimal.html`
- Port: stage B → Tailwind v4 theme + base components
- No one-off CSS — everything as Tailwind tokens / utility classes

## Mockups & explorations

See `outputs/mockups/` for visual explorations. Each mockup file has a `.md` companion with context and decisions.
