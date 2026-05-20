---
date: 2026-05-20
status: decided
tags:
  - decision/made
  - area/ui
  - area/sync
related:
  - "[[TECHNOLOGY_MASTERMIND]]"
  - "[[SUPABASE_AND_SYNC]]"
---

# Drop Shelf/Book/Chapter — use Obsidian-style recursive tree

## Why

The original `Shelf > Book > Chapter > Page` hierarchy was inherited from the BookStack PoC. Looking at the GM's real vault (screenshot: `ZASADY/MECHANIKA/Bijatyka.md`, `ZASADY/WALKA/Part 1.md`, plus `attachments/` and `memory/` siblings), the actual structure is just *folders, nested freely, with markdown leaves*. Locking us to a 3-level hierarchy meant either truncating real depth or padding shallower content with artificial levels.

## Decision

Single recursive node type:

```ts
type ContentNode = {
  name: string            // display (diacritics + spaces preserved)
  slug: string            // url-safe segment
  path: string            // slash-joined slug path from root
  kind: 'folder' | 'page'
  children?: ContentNode[]
  body?: string
}
```

A node is **either** a folder (children, no body) **or** a page (body, no children). The shape can later grow to `kind: 'folder', body: '…'` for `Folder/Folder.md` companion files, but the mock vault doesn't need it yet.

## Routing

- `/` — landing (top-level cards)
- `/p/*` — catch-all, the `*` is the slug path (`tlo-historyczne/miasto/beacon-hill`)
- `/map`, `/draft` — unchanged

URLs use **slugs**, not raw names, so they stay ASCII and link-safe. Render side resolves slugs back to display names via tree walk.

## Wikilinks

Still resolved by **name** (Obsidian convention). Two forms supported:

- `[[Page]]` — leaf-form, searches the whole tree, first match wins
- `[[Folder/Sub/Page]]` — path-form by *name*, disambiguates duplicates

Both call `findByWikilinkTarget` in `src/lib/tree.ts`. Push/pull use the same resolver.

## Push/pull

`walkVault` is now recursive (no fixed depth). Natural key for upsert is still the path-from-vault (`Kampania/Sesje/Sezon 1/Sesja 1.md`); the `wiki.pages` schema sketched in `SUPABASE_AND_SYNC.md` needs to drop the `shelf` / `book` / `chapter` columns and just store `path TEXT PRIMARY KEY` + `name` + `body`. **That schema sketch needs an update before the migration runs.**

## What changed in code

- `src/types.ts` — `Shelf`/`Book`/`Chapter`/`Page` deleted; `ContentNode` added
- `src/lib/tree.ts` — new: `slugify`, `walkTree`, `findByPath`, `findByWikilinkTarget`, `buildTree`
- `src/mocks/content.ts` — rewritten as `buildTree({…})` with raw nested object
- `src/lib/wikilinks.ts` — resolver swapped to tree walk
- `src/router.tsx` — collapsed to 4 routes (`/`, `/p/*`, `/map`, `/draft`)
- `src/components/TreeNav.tsx` — new: recursive collapsible sidebar
- `src/components/Breadcrumbs.tsx` — derives from URL segments
- `src/routes/NodeView.tsx` — new: handles both page and folder rendering
- `src/routes/ShelfView.tsx`, `BookView.tsx`, `ChapterView.tsx`, `PageView.tsx` — deleted
- `scripts/lib/walk.ts` — recursive walker
- `scripts/push-vault.ts`, `scripts/pull-vault.ts` — adjusted for new shape

## Trade-offs accepted

- Slug collisions inside one folder are possible (two pages whose names slugify to the same string). Vault-side this is rare; if it bites, `buildTree` can suffix `-2`, `-3`.
- Wikilink leaf-form ambiguity (two pages with the same name in different folders) is resolved by *first match in tree-order*. Documented; GM can disambiguate by switching to `[[Folder/Page]]` form.
