---
date: 2026-05-19
status: active
tags:
  - conventions
  - meta
---

# Logging & Documentation Conventions

## Where to write

| Type of content | Goes in |
|---|---|
| One-shot architectural decision | `work/YYYY-MM-DD-<slug>.md` + entry in `work/Index.md` |
| Stable architecture spec | `TECHNOLOGY_MASTERMIND.md`, `DESIGN_SYSTEM.md`, `SUPABASE_AND_SYNC.md`, `INTEGRATIONS.md` |
| Per-session changelog | Append entry to `DOCS_CHANGES_JOURNAL.md` |
| Cross-session persistent context | `memories/project.md` |
| Current sprint work | `TASK_LIST.md` |
| Mockups / sketches | `outputs/mockups/` (with `.md` companion) |
| Progress screenshots | `outputs/screenshots/` (with `.md` companion) |

## Frontmatter (required on every doc)

```yaml
---
date: YYYY-MM-DD          # date created or last meaningful edit
status: active | superseded | archived
tags: [tag1, tag2]
---
```

## Tags

Hierarchical, lowercase, slash-separated:

- `area/supabase`, `area/ui`, `area/sync`, `area/map`, `area/auth`
- `stage/a` ... `stage/g`
- `decision/open`, `decision/made`, `decision/superseded`
- `dep/coc-creator` for anything that crosses into coc-creator's territory

## Wikilinks

Prefer `[[file]]` or `[[file|alias]]` over markdown links for in-vault references. Use markdown links for external URLs.

## DOCS_CHANGES_JOURNAL entries

One entry per session. Most recent on top. Format:

```markdown
## YYYY-MM-DD — <one-line session topic>

**Files touched:**
- `path/to/file.ext` — what changed
- `another/file.md` — what changed

**Decisions:**
- <decision>

**Open questions / next steps:**
- <next step>
```

Older sessions (past ~20 entries) can be summarised or pruned during a Session End.

## When in doubt

- Bias toward writing it down. A stale note can be pruned; a missing note is lost.
- Link rather than duplicate. If a fact lives in `memories/project.md`, reference it from elsewhere.
- One file, one topic. Don't append unrelated content to existing files.
