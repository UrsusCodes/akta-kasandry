---
date: 2026-05-19
status: decided
tags:
  - decision/made
  - area/ui
  - stage/d
related:
  - "[[TECHNOLOGY_MASTERMIND]]"
---

# Markdown editor choice

## Decision

**`@uiw/react-md-editor`** for `/draft` and (eventually) the page editor.

## Criteria

Pulled from `memories/project.md` + spec:

1. **Polish diacritics** — must accept and render `ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ` without IME glitches.
2. **Same renderer as B3** — preview pane should look identical to read mode. Cuts surprise.
3. **Wikilink hooks** — at minimum, extensible so we can plug in `remarkWikilinks` on the preview side, and ideally on the editor side as well.
4. **Bundle size** — public site loads under shared Supabase free-tier egress; the editor is on `/draft` only, so it's OK to lazy-load, but smaller is better.
5. **Repo activity** — must be current (last release in the last ~6 months).
6. **Custom syntax for `![[embeds]]`** — needed in stage F when image attachments come from `wiki-attachments`.

## Candidates

| | `@uiw/react-md-editor` | `react-markdown-editor-lite` | `milkdown` |
|---|---|---|---|
| Polish chars | ✓ (uses standard `textarea`, no custom IME) | ✓ | ✓ (ProseMirror-backed, IME-safe) |
| Same renderer | ✓ — accepts custom `previewOptions.components`, `remarkPlugins`, `rehypePlugins` — drop in `remarkWikilinks` directly | ✗ — uses its own markdown-it pipeline; would need to fork or replace renderer | ✗ — WYSIWYG, not preview-paned; doesn't map to "same renderer" |
| Wikilink hooks | via remark plugin (already have one) | only at HTML stage | via custom Prosemirror node |
| Bundle | ~150 KB gzipped (incl. markdown plugins it bundles) | ~70 KB | ~250 KB (Prosemirror + plugins) |
| Repo activity | active (releases in 2025) | last release ~2 years old | active but heavy |
| `![[embed]]` extension | trivial — add to `remarkWikilinks` | non-trivial — need markdown-it plugin | hardest — Prosemirror schema |

## Why @uiw/react-md-editor wins

- **Preview reuses our renderer.** `previewOptions={{ remarkPlugins: [...], components: {...} }}` accepts the exact plugins/components from `src/components/Markdown.tsx`. The work I did in B3 carries over with zero extra effort.
- **Plain textarea input.** No exotic IME path = no Polish character surprises. Verified in D1 with `ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ`.
- **One package, not three.** milkdown ships as plugin packages; this would bloat the dep list past what the locked stack allows.

## Trade-offs accepted

- Editor textarea is "plain markdown" — no inline preview of wikilink targets while typing. Acceptable for now; the live-preview pane on the right is sufficient signal.
- ~150 KB on `/draft` only. Stage G can route-level code-split this if it bites.

## What's deferred to stage D proper

- Auth-gated editing on real pages (`/edit/:page`)
- Revision write-on-save into `wiki.revisions`
- Diff + rollback UI
- `![[embed]]` resolution against `wiki-attachments` bucket
