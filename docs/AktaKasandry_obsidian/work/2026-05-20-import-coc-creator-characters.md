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

### 3. Player display — decided (b), with grouping UX

Players table is opaque (service_role-only). Decided **(b) admin-types-it** (2026-05-20). UX requirement from user: admin needs to *see the set of characters owned by the same player* to recognise whose they are (no displayable name on coc-creator side beyond `player_id` UUID).

**UI shape:** characters grouped by `source_player_id`. Each group is a collapsible block with a single "Imię gracza: ___" input that applies to all characters chosen from that group:

```
▾ Gracz #abc12345 (3 postaci)        Imię gracza: [_________]
    [✓] Catburgler        (occupation, era, status)
    [ ] Soldier
    [✓] Lumberjack

▾ Gracz #def67890 (1 postać)         Imię gracza: [_________]
    [✓] Profesor
```

Hashed-short UUID prefix as the visible identifier (`#abc12345` = first 8 chars of the source UUID). Admin clicks on a character row to peek at portrait + occupation + a few traits — helps them pin who's who if they're not sure from the character name alone.

When admin types a name in the player-level input, it applies to every checked character in that group on save. Cached per session — re-opening the page restores prior typed names by `source_player_id` (in `localStorage` until we wire it into the profile).

Promote to (a) `SECURITY DEFINER` only if it becomes annoying.

### 4. Admin UI

New route `/admin/import-characters`, gated by Auth role `mg`:

1. On open: `supabase.from('characters').select('id, name, occupation_id, era, status, player_id, updated_at, profile_portrait_url')` plus `supabase.from('imported_characters').select(...)` on our side. Group the result by `source_player_id` in the client.
2. Per-row state computed against local: `not imported`, `imported (current)`, `imported (stale — source updated at Y)`.
3. Render: collapsible group per player (see section 3). Each group has a single "Imię gracza" input plus the character checkboxes.
4. Buttons (top-level): **Importuj zaznaczone** (upsert with the typed player_name applied), **Odśwież nieaktualne** (re-import everything where `source_updated_at > snapshot`, preserves existing `player_name`), **Usuń z wiki** (admin-confirmed delete).
5. After successful import, toast linking to the new wiki page(s).

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

## Open coordination items — status 2026-05-20

All four decisions resolved. Implementation now blocks only on:

- Supabase schema migration being run (user → coordinate with coc-creator first)
- Auth provider setup (user → with coc-creator for SSO)

1. **✅ Coordination doc on coc-creator side** — user confirmed they'll add a "Shared Supabase with akta-kasandry" section to `coc-creator/docs/CoCCreator_obsidian/TECHNOLOGY_MASTERMIND.md`.
2. **✅ Player display name strategy** — option (b) admin-types-it. Plus UX: characters grouped by `source_player_id` in the admin UI; single name input per player; `localStorage` cache between sessions.
3. **✅ RLS for `wiki.imported_characters` SELECT** — open to anon.
4. **✅ DDL approval** — DDL in `SUPABASE_AND_SYNC.md` approved as-is.

Implementation order when schema+Auth unlock: (i) migration scripts (`005_imported_characters.sql`) → (ii) `/admin/import-characters` UI with grouped layout → (iii) `<CharacterPage>` renderer → (iv) `useContentTree()` merge.
