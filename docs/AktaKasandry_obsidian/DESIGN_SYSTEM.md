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

Loading strategy (`@fontsource` vs Google Fonts CDN) — decide in stage B. **All three must support Polish diacritics** — verify before locking.

## Layout

- **Desktop priority** — mobile renders but is not optimised
- **Left column always visible** — Shelf list, large titles, click navigates
- **Breadcrumbs** below header on every content page
- **Cthulhu mood** — restrained, parchment-on-teal, gold accents only on affordances (no cosmetic gold)

## Component patterns

_(to be established as we build — capture each pattern here once it lands in code, with a short rationale)_

## Skin reference

- Source HTML: `C:\temp\bookstack-test\cthulhu-skin-minimal.html`
- Port: stage B → Tailwind v4 theme + base components
- No one-off CSS — everything as Tailwind tokens / utility classes

## Mockups & explorations

See `outputs/mockups/` for visual explorations. Each mockup file has a `.md` companion with context and decisions.
