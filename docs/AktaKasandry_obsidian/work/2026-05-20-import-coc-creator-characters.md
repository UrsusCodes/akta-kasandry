---
date: 2026-05-20
status: open
tags:
  - decision/open
  - area/supabase
  - area/sync
  - dep/coc-creator
related:
  - "[[INTEGRATIONS]]"
  - "[[SUPABASE_AND_SYNC]]"
  - "[[memories/project]]"
---

# Importing characters + players from coc-creator

User wants admin-driven selective import of characters (and the players who own them) from the sister project `UrsusCodes/coc-creator` for display on the akta-kasandry player-facing wiki. Re-import overwrites; new characters get added.

## What we learned about coc-creator

Findings from the Explore-agent reconnaissance (see commit/branch logs):

- coc-creator uses **`public.*` schema** exclusively. No `wiki.*` references.
- The Obsidian docs in coc-creator **do NOT mention akta-kasandry or a shared Supabase** anywhere. The shared-database arrangement is currently one-sided — documented in `memories/project.md` + `INTEGRATIONS.md` on our side, invisible to their team-of-one.
- **Relevant tables:**
  - `public.characters` — character sheets. Wide JSONB columns (`characteristics`, `derived`, `backstory`, `equipment`, `occupation_skill_points`, `personal_skill_points`, `perks`); plus typed columns: `name`, `age`, `gender`, `occupation_id`, `era`, `method`, `status` (`draft|submitted`), `player_id`, `profile_portrait_url`, `card_portrait_url`, `card_portrait_crop_data`, `residence`, `birthplace`, `cash`, `assets`, `spending_level`, `created_at`, `updated_at`.
  - `public.players` — opaque to anon (RLS = service_role only). Fields: `id`, `name`, `login`, `password_hash`, `is_active`. **No email, no avatar.**
  - `public.player_codes` — junction `player_id ↔ invite_code_id`.
  - `public.edit_permissions`, `public.pending_edits`, `public.portrait_generations` — not needed for import.
- **RLS on characters: `anon_read_characters` has NO row filter** — any anon reader sees *all* characters, drafts included. Our wiki client (anon-key) can read them directly with `select` on `public.characters`. No `SECURITY DEFINER` workaround needed.
- Character `updated_at` is maintained by a `BEFORE UPDATE` trigger — usable as a freshness signal in our admin UI ("imported X is now stale, source moved at Y").

## Decision sketch (open for review)

### 1. Snapshot, not live read

Store a copy in `wiki.imported_characters` rather than render straight from `public.characters`. Reasons:

- Honours CLAUDE.md's "never touch `public.*`" — *reading* is technically OK because of their `anon_read_characters` policy, but we'd be exposing draft / in-progress data to players the moment the GM edits something in coc-creator. A snapshot is the GM saying "yes, *this version* is canon for the wiki right now".
- Lets us link characters via wikilinks the same way as vault content (the wiki resolver walks one tree).
- Decouples our render lifecycle from theirs — they can ship a coc-creator migration without our pages 500-ing.

### 2. Proposed table

```sql
CREATE TABLE wiki.imported_characters (
  -- snapshot identity
  id              BIGSERIAL    PRIMARY KEY,
  source_id       UUID         NOT NULL UNIQUE,    -- public.characters.id
  slug            TEXT         NOT NULL UNIQUE,    -- url segment, derived from name

  -- extracted for indexing/sorting/display in lists
  name            TEXT         NOT NULL,
  occupation_id  TEXT,
  era             TEXT,
  status          TEXT,                            -- 'draft' | 'submitted' from source
  source_player_id UUID,                           -- public.characters.player_id
  player_name     TEXT,                            -- denormalised from public.players.name at import-time
  portrait_url    TEXT,                            -- whichever of card/profile we prefer

  -- the rest, as-is from the source row (lets us add fields to the UI later
  -- without re-importing if the JSON already has them)
  data            JSONB        NOT NULL,           -- whole public.characters row snapshot

  -- snapshot meta
  source_updated_at  TIMESTAMPTZ NOT NULL,         -- copy of source row at import
  imported_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  imported_by        UUID         REFERENCES auth.users (id)
);
CREATE INDEX ON wiki.imported_characters (source_updated_at);
```

**RLS:**

- `SELECT` open to authenticated (anon if we let players see character pages without login — TBD).
- `INSERT` / `UPDATE` / `DELETE` only for `auth.users` with `wiki.profiles.role = 'mg'`.

**Re-import semantics:** `INSERT … ON CONFLICT (source_id) DO UPDATE SET …` — same source character upserts in-place, `imported_at` refreshes, `source_updated_at` overwrites. New characters get a new row. Removed characters in coc-creator stay in our table until admin explicitly removes them (we don't auto-delete — that'd surprise players).

### 3. Player display

Players table is opaque (service_role-only). Two options:

- **(a) Denormalise at import.** Read `players.name` via a `SECURITY DEFINER` function that coc-creator would need to add (`get_player_display_name(uuid) → text`). Adds a coordination dependency on them.
- **(b) Show what we already have.** `characters.player_id` is a UUID; we just record it as-is. Admin manually types the display name on import. No new dependency.

Going with (b) for v1 — single-GM workflow, the GM knows which player owns which character. Promote to (a) only if it becomes annoying.

### 4. Admin UI

New route `/admin/import-characters`, gated by Auth role `mg`:

1. On open: `supabase.from('characters').select('id, name, occupation_id, era, status, player_id, updated_at, profile_portrait_url')`.
2. Cross-reference local `wiki.imported_characters` to compute per-row state: `not imported`, `imported (current)`, `imported (stale — source updated at Y)`.
3. Table: portrait thumb · name · era · occupation · status (draft/submitted) · imported state · checkbox. Filter inputs above.
4. Buttons: **Importuj zaznaczone** (upsert), **Odśwież nieaktualne** (re-import where `source_updated_at > snapshot`), **Usuń z wiki** (admin-confirmed delete).
5. After successful import, show a toast linking to the new wiki page.

### 5. Where character pages live in the tree

Each imported character renders as a virtual page under `BADACZE/` (currently empty in PUBLIC — perfect fit). The `contentTree` resolver merges the vault snapshot (`src/generated/content.ts`) with imported characters fetched at runtime from Supabase. Implementation:

- Add a `useContentTree()` hook that returns the merged tree (vault + imported characters loaded async).
- The merge inserts character nodes as `kind: 'page'` under a `BADACZE` folder node.
- A custom `<CharacterPage>` component renders a structured layout (portrait, characteristic block, occupation, equipment, backstory) — *not* free-form markdown.
- Wikilinks in vault content can target characters by name; the resolver picks them up because they're in the merged tree.

### 6. Out of scope for v1

- Real-time updates of imported data (no Supabase realtime sub).
- Bulk export back to coc-creator (one-way only).
- Image proxying (we reference coc-creator's portrait URLs directly; they're already public).
- Player self-service ("claim my character") — admin-only import.

## Open coordination items (user action)

1. **Tell the coc-creator side this is happening.** Add a "Shared Supabase with akta-kasandry" section to their `TECHNOLOGY_MASTERMIND.md` that mentions: we read `public.characters` via anon-key, we never write to `public.*`, our writes are confined to `wiki.*`. Mirror our `INTEGRATIONS.md` boundary statement.
2. **Decide on player display name strategy** — option (a) `SECURITY DEFINER` function or option (b) admin-types-it. Default proposal: (b).
3. **Approve the proposed `wiki.imported_characters` DDL** above (or revise) — needed before any of the schema migration is run.
4. **Confirm RLS posture:** is the `SELECT` policy open to anon (so unauthenticated players see character pages) or authenticated-only (login wall on character pages)?

Once those four are answered, we can: (i) write the migration, (ii) build `/admin/import-characters`, (iii) extend the renderer with `<CharacterPage>`. None of those start before the four answers land.
