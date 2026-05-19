# Akta Kasandry — Claude Code Project Manual

Web wiki/CMS for the Call of Cthulhu campaign **Rozdarte Sumienie** (Polish adaptation, Boston 1924). Publishes the GM's Obsidian vault to a player-facing site, lets players edit marked pages online with version control, and provides an interactive Boston map with pins.

**Language rule:** all documentation in English. UI/UX strings, page content, slugs in Polish. Code, commits, identifiers in English. Communication with the user in Polish.

---

## Session Start

Read these on every session, in order:

1. `docs/AktaKasandry_obsidian/memories/project.md` — persistent project context
2. `docs/AktaKasandry_obsidian/TASK_LIST.md` — current state of work
3. `docs/AktaKasandry_obsidian/DOCS_CHANGES_JOURNAL.md` — last 2-3 entries from recent sessions
4. `docs/AktaKasandry_obsidian/work/Index.md` — map of work notes; follow links relevant to the current task

Read on-demand when the task touches that area:

- `TECHNOLOGY_MASTERMIND.md` — routing, build, deploy, component arch
- `DESIGN_SYSTEM.md` — styles, components, layout, Cthulhu skin tokens
- `SUPABASE_AND_SYNC.md` — schema, RLS, push/pull scripts, content model
- `INTEGRATIONS.md` — anything that crosses into coc-creator's territory (shared Supabase, SSO, Auth) or touches the content vault
- `LOGGING_INSTRUCTIONS.md` — doc conventions when in doubt

## Session End

Triggered by user saying "zapisz" / "koniec" / "save" — and proactively suggest it when context is ~80% full.

1. Append entry to `DOCS_CHANGES_JOURNAL.md` (date, session topic, files touched, decisions made, open questions)
2. Update `TASK_LIST.md` — move completed items to DONE, add discovered items to backlog
3. Update `memories/project.md` only if non-obvious state changed (new external dep, decision that affects future sessions, change in coordination with coc-creator)
4. If any decision is worth preserving long-term — drop a note in `work/` and link from `work/Index.md`
5. Confirm files saved; do **not** auto-commit unless explicitly asked

## Obsidian Conventions

This vault is opened in Obsidian — use Obsidian-native syntax:

- **Wikilinks:** `[[TASK_LIST]]`, `[[work/2026-05-19-editor-choice|editor choice]]`. Prefer wikilinks over markdown links for in-vault references.
- **Tags:** hierarchical, lowercase, slash-separated — `#stage/a`, `#area/supabase`, `#decision/open`, `#dep/coc-creator`
- **YAML frontmatter** at top of every non-trivial file:

  ```yaml
  ---
  date: YYYY-MM-DD
  status: active | superseded | archived
  tags: [tag1, tag2]
  ---
  ```

- **Embeds:** `![[outputs/mockups/nav-sketch-v1.png]]` to inline images
- **Callouts** for emphasis:

  ```
  > [!warning] Shared Supabase
  > Schema changes must be coordinated with coc-creator.
  ```

## File Reference

| File | Purpose | Update when |
|---|---|---|
| `TASK_LIST.md` | Stage a-g plan + active sprint + backlog + DONE | Every session — move items between sections |
| `TECHNOLOGY_MASTERMIND.md` | Stack, routing, component tree, build, deploy | Architecture decision made or revised |
| `DESIGN_SYSTEM.md` | Palette, typography, components, Cthulhu skin tokens | Visual decision made; new component pattern established |
| `SUPABASE_AND_SYNC.md` | `wiki.*` schema, RLS, push/pull, content model | Schema migration written; sync flow refined |
| `INTEGRATIONS.md` | Shared Supabase with coc-creator, Auth/SSO, content vault | Cross-project coordination needed; relationship changes |
| `LOGGING_INSTRUCTIONS.md` | Conventions for journal + work notes | Convention shifts |
| `DOCS_CHANGES_JOURNAL.md` | Per-session changelog | Every session end |
| `memories/project.md` | Persistent cross-session context | Non-obvious state changes |
| `work/Index.md` | Map of decision notes / explorations | New decision documented |
| `outputs/mockups/` | UI mockups + design comps (each with `.md` companion) | New mockup made |
| `outputs/screenshots/` | Progress snapshots | Visible feature shipped |

## Project-specific guardrails

> [!warning] Shared Supabase project with coc-creator
> Before writing or modifying any schema, RLS policy, Auth setting, or Storage bucket:
> 1. Read `INTEGRATIONS.md` for current coordination state.
> 2. Check `coc-creator/docs/CoCCreator_obsidian/TECHNOLOGY_MASTERMIND.md` (via `gh` CLI) for any updates from coc-creator-Claude.
> 3. Stay strictly within `wiki.*` schema and `wiki-attachments` bucket. Never touch `public.*`.
> 4. Be mindful of free-tier egress.

> [!info] Content lives elsewhere
> Campaign material (Shelves > Books > Chapters > Pages) lives in the GM's Obsidian content vault at `G:\My Drive\OBSIDIAN\RPG\Zew Cthulhu\PUBLIC\`. This dev vault documents how we *publish and edit* that content — it does not store the content itself.

> [!info] Stack is locked
> React 19 + TS + Vite + Tailwind v4 + Supabase + zustand + react-router v7 + react-hook-form + zod. Mirrors coc-creator. Do not introduce new top-level dependencies without explicit user approval.
