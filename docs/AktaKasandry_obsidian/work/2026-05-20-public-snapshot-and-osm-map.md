---
date: 2026-05-20
status: decided
tags:
  - decision/made
  - area/sync
  - area/ui
  - area/map
related:
  - "[[work/2026-05-20-recursive-content-tree]]"
  - "[[SUPABASE_AND_SYNC]]"
---

# PUBLIC snapshot via generator + OSM tile map

## What changed

1. **Content source switched from hand-written mock to a generated snapshot of `G:\…\PUBLIC`.** Generator: `scripts/build-content.ts` → `src/generated/content.ts`. Run via `npm run build-content`.
2. **Boston map replaced with OpenStreetMap tiles** (free, no API key, Leaflet's `TileLayer`). Pins are lat/lng on real WGS84 coordinates. The dedicated `/map` route and top-nav link are gone — the map renders inside the existing article at `/p/swiat-npc/boston/mapa-bostonu-1924`.

## Generator design

- **Read-only with respect to the vault.** Walks `VAULT_PUBLIC` (default: `G:\My Drive\OBSIDIAN\RPG\Zew Cthulhu\PUBLIC`) and only writes inside the project repo. Never modifies the GM's vault.
- **Image staging.** Every image referenced by a markdown body — Obsidian-style `![[foo.png]]`, markdown `![alt](attachments/foo.png)`, and HTML `<img src="attachments/foo.png">` — gets resolved against a flat index of all image files in the vault (matched by basename, Obsidian-ish first-match). Hits are copied to `public/vault-attachments/by-name/<filename>` and the markdown is rewritten to point at `/vault-attachments/by-name/<filename>`. Misses leave a visible `_(brak: …)_` placeholder.
- **Empty folders kept.** `BADACZE/` and `SPRAWY/` have no `.md` files but stay in the tree as empty nodes — that matches the GM's vault layout.
- **Stable ordering.** Folders first, then files; alphabetical within each (Polish collation).
- **What gets generated.** A single TypeScript module exporting `ContentNode[]` with each page body inlined as a template literal. ~28 pages, ~92 KB. Build-time, no runtime fs.
- **What gets gitignored.** `public/vault-attachments/` (~28 MB of tutorial screenshots) — re-run the generator after cloning. `src/generated/content.ts` *is* committed so the app boots without the generator.

## OSM map

- `TileLayer` with `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`. Attribution shown per OSM ToS.
- `BostonMap` centered on `42.3601, -71.0589`, zoom 13.
- Pins moved from image-local x/y to WGS84 lat/lng. Three placed: Hale Manor, Whitlock House (fictional, on real downtown streets), Mount Auburn Cemetery (real).
- The article body has a legacy `<a><img src="http://localhost:8081/boston-map-1924.jpg" …></a>` block from the BookStack PoC — `stripLegacyMapEmbed` removes it so the interactive map slots in cleanly. Rest of the legend renders below.

## Special-pages registry

`src/lib/specialPages.ts` is a tiny registry. Pages whose path matches a constant get a custom component instead of (or in addition to) the markdown body. Currently only `MAP_PAGE_PATH = 'swiat-npc/boston/mapa-bostonu-1924'`. Keep this small; anything reusable should fit into a remark/rehype plugin instead.

## Wikilink anchor support

`parseWikilink` now strips `#anchor` suffixes (e.g. `[[Part 0f - …#MANEWR W WALCE|Manewry]]`). The anchor is dropped on the way to the URL — anchor IDs on headers aren't wired into the renderer yet. Follow-up: add `rehype-slug` and append the anchor to internal links. (Need to count this as a top-level dep change first.)

## Trade-offs accepted

- **Snapshot drifts.** Vault changes don't auto-refresh; user re-runs `npm run build-content`. Acceptable because the eventual replacement is the Supabase-backed loader (stage C `--execute`).
- **Flat attachment dir.** Filename collisions across folders would clobber. Obsidian discourages duplicate filenames; if it bites, switch to mirrored folder structure.
- **OSM not period-accurate.** Tiles show modern Boston, not 1924. Period tiles exist (BPL, Lyrasis) but would need a separate work note + a stable hosting URL. Acceptable for "ala Google Maps" framework demo.
