---
date: 2026-05-19
status: active
tags:
  - journal
---

# Docs Changes Journal

Per-session changelog. Most recent on top. See `[[LOGGING_INSTRUCTIONS]]` for the entry format.

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
