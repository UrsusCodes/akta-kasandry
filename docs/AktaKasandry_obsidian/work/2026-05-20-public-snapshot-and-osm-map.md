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

# PUBLIC snapshot via generator + interactive 1924 map

## What changed

1. **Content source switched from hand-written mock to a generated snapshot of `G:\…\PUBLIC`.** Generator: `scripts/build-content.ts` → `src/generated/content.ts`. Run via `npm run build-content`.
2. **Boston map renders the real 1924 Rand McNally graphic** with Leaflet `ImageOverlay` (pan / zoom / popups — Google-Maps-style UX, but over a static historical map). Pins are image-local pixel coords. The dedicated `/map` route and top-nav link are gone — the map renders inside the existing article at `/p/swiat-npc/boston/mapa-bostonu-1924`.

> An earlier draft of this session used `TileLayer` with OpenStreetMap tiles. That was wrong — the user wants the **period-accurate JPG** as the base; the "Google" framing referred to UX (pan/zoom/pins), not modern map data.

## Generator design

- **Read-only with respect to the vault.** Walks `VAULT_PUBLIC` (default: `G:\My Drive\OBSIDIAN\RPG\Zew Cthulhu\PUBLIC`) and only writes inside the project repo. Never modifies the GM's vault.
- **Image staging.** Every image referenced by a markdown body — Obsidian-style `![[foo.png]]`, markdown `![alt](attachments/foo.png)`, and HTML `<img src="attachments/foo.png">` — gets resolved against a flat index of all image files in the vault (matched by basename, Obsidian-ish first-match). Hits are copied to `public/vault-attachments/by-name/<filename>` and the markdown is rewritten to point at `/vault-attachments/by-name/<filename>`. Misses leave a visible `_(brak: …)_` placeholder.
- **Empty folders kept.** `BADACZE/` and `SPRAWY/` have no `.md` files but stay in the tree as empty nodes — that matches the GM's vault layout.
- **Stable ordering.** Folders first, then files; alphabetical within each (Polish collation).
- **What gets generated.** A single TypeScript module exporting `ContentNode[]` with each page body inlined as a template literal. ~28 pages, ~92 KB. Build-time, no runtime fs.
- **What gets gitignored.** `public/vault-attachments/` (~28 MB of tutorial screenshots) — re-run the generator after cloning. `src/generated/content.ts` *is* committed so the app boots without the generator.

## Interactive 1924 map

- `ImageOverlay` over `boston-map-1924.jpg` (Rand McNally, 7803×11702, ~13 MB) with Leaflet's `CRS.Simple`. Scroll-wheel zoom, pan, marker popups — Google-Maps UX, but the base map is the period graphic.
- The JPG lives one level above `PUBLIC` in the GM's vault (so it isn't itself a wiki article). `scripts/build-content.ts` has an `EXTRA_ASSETS` list that copies it into `public/vault-attachments/by-name/boston-map-1924.jpg` on each `npm run build-content`.
- Pins are image-local pixel coords (top-left origin in `Pin.x`/`Pin.y`; the component flips Y for `CRS.Simple` under the hood). Three rough positions: Hale Manor + Whitlock House (downtown), Mount Auburn Cemetery (may be off the map's NW extent — the GM should nudge).
- The article body has a legacy `<a><img src="http://localhost:8081/boston-map-1924.jpg" …></a>` block from the BookStack PoC — `stripLegacyMapEmbed` removes it so the interactive map slots in cleanly. Rest of the legend renders below.

## Special-pages registry

`src/lib/specialPages.ts` is a tiny registry. Pages whose path matches a constant get a custom component instead of (or in addition to) the markdown body. Currently only `MAP_PAGE_PATH = 'swiat-npc/boston/mapa-bostonu-1924'`. Keep this small; anything reusable should fit into a remark/rehype plugin instead.

## Wikilink anchor support

`parseWikilink` now strips `#anchor` suffixes (e.g. `[[Part 0f - …#MANEWR W WALCE|Manewry]]`). The anchor is dropped on the way to the URL — anchor IDs on headers aren't wired into the renderer yet. Follow-up: add `rehype-slug` and append the anchor to internal links. (Need to count this as a top-level dep change first.)

## Trade-offs accepted

- **Snapshot drifts.** Vault changes don't auto-refresh; user re-runs `npm run build-content`. Acceptable because the eventual replacement is the Supabase-backed loader (stage C `--execute`).
- **Flat attachment dir.** Filename collisions across folders would clobber. Obsidian discourages duplicate filenames; if it bites, switch to mirrored folder structure.
- **Map JPG is 13 MB.** Loaded on first hit of the map article; Leaflet handles tiling at runtime via the overlay's native size. Fine for the audience (~50 players) on broadband; mobile/slow links would benefit from a pre-tiled set (Leaflet `TileLayer` w/ `gdal2tiles` output) — follow-up.
- **Pin positions are guesses.** I placed them by reading the JPG cold; the GM should re-eyeball once the page is up.
