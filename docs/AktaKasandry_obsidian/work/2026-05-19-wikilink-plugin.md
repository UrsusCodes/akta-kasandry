---
date: 2026-05-19
status: decided
tags:
  - decision/made
  - area/ui
  - area/sync
related:
  - "[[TECHNOLOGY_MASTERMIND]]"
---

# Wikilink resolution: remark plugin vs string preprocessing

## Context

Player-readable pages contain wikilinks in Obsidian-native syntax: `[[Page]]` and `[[Page|alias]]`. Both the renderer (B3) and the sync scripts (C1/C2) need to know how these map to internal URLs.

## Options

1. **Remark plugin** — walk the markdown AST, replace text matching `[[…]]` with `link` nodes. Renderer gets clean link nodes; react-markdown's component override does the rest.
2. **String preprocessing** — run `vaultToApp(markdown)` on the raw string before handing it to react-markdown. Replaces `[[X]]` with standard `[X](/url)` syntax.
3. **Custom react-markdown component for text nodes** — intercept text rendering and regex-match the string at render time. Component-level, no plugin.

## Decision: hybrid — remark plugin for render, string preprocessing for sync

- **Render path (B3)** uses `remarkWikilinks` in `src/lib/remarkWikilinks.ts`. Operates on the AST so wikilink syntax inside fenced code or inline code stays literal. Broken targets render as `<em>` with a `data.wikilinkBroken` flag — visually distinct without crashing the page.
- **Sync path (C1/C2)** uses string-level `vaultToApp` / `appToVault` in `src/lib/wikilinks.ts`. The sync scripts already operate on serialised markdown; round-tripping through a parser would be over-engineering for a one-way text transformation.
- Both paths share `parseWikilink` / `resolveWikilink` from `src/lib/wikilinks.ts`. The resolver walks the content tree by **page title** (not slug), matching Obsidian's convention.

## Why not string preprocessing for render too

Mock content already proved the gotcha: a Polish-language page about *the literal wikilink syntax* would have `[[X]]` inside a code block. String-level regex doesn't know about code fences; the AST does.

## Why not a custom react-markdown component

Two-pass complexity: the wikilink would be wrapped in a `<p>` parent that's already been React-rendered, splitting at text boundaries forces awkward fragment juggling. The remark plugin is cleaner and runs once.

## Trade-offs accepted

- Resolution at render time means every PageView walks the tree. Cheap on the mock (≈10 pages); benchmark when Supabase data lands (stage C). If it bites, precompute a `Map<lowercaseTitle, url>` on tree change.
- Broken wikilinks render as italic plain text. Stage D editor will get a "validate links" affordance.
