---
date: 2026-05-20
status: active
tags:
  - supabase
  - sync
  - schema
---

# Supabase & Sync Pipeline

Schema, RLS, sync scripts, content model. This is the source of truth for what will land on Supabase when the migration runs.

> [!warning] Shared Supabase project (with coc-creator)
> Everything we own lives under namespace `wiki` (`wiki.*` tables, `wiki-attachments` bucket).
> - **Never write to `public.*`** — that's coc-creator's territory.
> - **We *read* `public.characters`** (their RLS allows anon SELECT) for the character-import flow. This is documented as a cross-project read in [[INTEGRATIONS]] and needs to be mirrored in coc-creator's docs (user action).

---

## Content model

Recursive tree, Obsidian-style — folders nested freely, leaves are markdown pages. See [[work/2026-05-20-recursive-content-tree]] for why the original Shelf/Book/Chapter hierarchy was dropped.

Page identity = **full path relative to the vault root**, e.g. `ZASADY/Zasady walki/03. Tutorial walki/Part 1 - Przed walką`. Stable across title renames; breaks on folder moves (acceptable).

Two source streams feed the rendered site:

1. **Vault snapshot** (`scripts/build-content.ts`) — generated into `src/generated/content.ts` from `G:\…\PUBLIC\`. This is the dominant content source.
2. **Character snapshots** (admin import — `wiki.imported_characters`) — merged into the tree at runtime under `BADACZE/`.

---

## Schema

```sql
create schema if not exists wiki;

-- Per-user profile + role. One row per auth.users row, created on first login
-- via a trigger (auth.users INSERT → wiki.profiles INSERT with role='gracz').
create table wiki.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  role          text not null default 'gracz' check (role in ('mg', 'gracz')),
  created_at    timestamptz not null default now()
);

-- Wiki pages. Path-keyed (slash-separated slugs from root) so the recursive
-- tree shape isn't hardcoded into columns. `parent_path` is derivable from
-- `path` but stored for cheap sibling lookups.
create table wiki.pages (
  path           text primary key,                 -- e.g. 'zasady/terminy/bijatyka'
  parent_path    text,                             -- '' for root pages, 'zasady/terminy' here
  name           text not null,                    -- display name with diacritics, e.g. 'Bijatyka'
  kind           text not null check (kind in ('folder', 'page')),
  body           text,                             -- markdown, null for pure folders
  ready_to_sync  boolean not null default false,   -- pull script honours this
  updated_at     timestamptz not null default now(),
  updated_by     uuid references wiki.profiles(id)
);
create index on wiki.pages (parent_path);

-- Edit history. Append-only. One row per UPDATE of wiki.pages.body, written by
-- a trigger on wiki.pages.
create table wiki.revisions (
  id              uuid primary key default gen_random_uuid(),
  page_path       text not null references wiki.pages(path) on delete cascade,
  user_id         uuid not null references wiki.profiles(id),
  body_before     text not null,
  body_after      text not null,
  created_at      timestamptz not null default now()
);
create index on wiki.revisions (page_path, created_at desc);

-- Boston map pins. Coordinates in image-local pixels on boston-map-1924.jpg
-- (top-left origin, source resolution 7803×11702).
create table wiki.pins (
  id           uuid primary key default gen_random_uuid(),
  x            integer not null,
  y            integer not null,
  title        text not null,
  description  text,
  label        text,
  created_by   uuid references wiki.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Character snapshots from coc-creator. Admin picks rows in
-- /admin/import-characters, snapshot is upserted on source_id.
-- Design rationale: work/2026-05-20-import-coc-creator-characters.md
create table wiki.imported_characters (
  id                 bigserial primary key,
  source_id          uuid not null unique,         -- public.characters.id
  slug               text not null unique,         -- url segment derived from name

  -- extracted for sort/filter/display:
  name               text not null,
  occupation_id      text,
  era                text,
  status             text,                         -- 'draft' | 'submitted' from source
  source_player_id   uuid,
  player_name        text,                         -- admin-typed at import (public.players is locked)
  portrait_url       text,

  -- whole public.characters row, as-is:
  data               jsonb not null,

  -- snapshot meta:
  source_updated_at  timestamptz not null,         -- public.characters.updated_at at import
  imported_at        timestamptz not null default now(),
  imported_by        uuid references auth.users(id)
);
create index on wiki.imported_characters (source_updated_at);
```

---

## Schema additions — migrations 009–013 (2026-06-26, Stage L)

Run 2026-06-26 in a single transaction. Verified by post-migration audit.

> [!warning] KEY: source_id, not id
> `wiki.comments.speaker_character_id` and `wiki.investigation_cast.character_id` reference `wiki.imported_characters.source_id` (uuid natural key), NOT the bigserial `id`. The plan originally referenced `(id)` which would have failed (uuid column vs bigint PK). The frontend keys characters by `source_id` (stable across re-imports).

```sql
-- 009: player identity colour (one of 16 palette values from src/lib/playerColors.ts)
alter table wiki.profiles add column color text;

-- 010: owner link — which profile owns a given imported character
alter table wiki.imported_characters
  add column owner_profile_id uuid references wiki.profiles(id) on delete set null;
create index on wiki.imported_characters (owner_profile_id);

-- 011: player margin-comments
create table wiki.comments (
  id                   uuid primary key default gen_random_uuid(),
  page_key             text not null,                        -- e.g. 'streszczenie/ug2'
  anchor               jsonb not null,                       -- CommentAnchor JSON (blockId, quote, offset)
  author_profile_id    uuid not null references wiki.profiles(id) on delete cascade,
  speaker_character_id uuid references wiki.imported_characters(source_id) on delete set null,
  body                 text not null,
  parent_id            uuid references wiki.comments(id) on delete cascade,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  edited               boolean not null default false
);
create index on wiki.comments (page_key, created_at);

-- RLS on wiki.comments
alter table wiki.comments enable row level security;
-- public read (comments are public)
create policy comments_anon_read on wiki.comments for select using (true);
-- author inserts as self only
create policy comments_author_insert on wiki.comments for insert
  with check (author_profile_id = auth.uid());
-- author or MG can update/delete
create policy comments_author_update on wiki.comments for update
  using (author_profile_id = auth.uid()
    or exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg'));
create policy comments_author_delete on wiki.comments for delete
  using (author_profile_id = auth.uid()
    or exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg'));

-- grants
grant select on wiki.comments to anon, authenticated;
grant insert, update, delete on wiki.comments to authenticated;

-- 012: which characters appear in the cast of a given summary page
create table wiki.investigation_cast (
  page_key     text not null,
  character_id uuid not null references wiki.imported_characters(source_id) on delete cascade,
  primary key (page_key, character_id)
);
alter table wiki.investigation_cast enable row level security;
create policy cast_anon_read on wiki.investigation_cast for select using (true);
create policy cast_mg_write on wiki.investigation_cast for all
  using (exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg'));

-- anon read on wiki.profiles so public comment cards can show author display_name + color
create policy profiles_anon_read on wiki.profiles for select using (true);

-- 013: email-hardening — close the leak opened by 012's anon profiles read
-- Recreated wiki.handle_new_user WITHOUT the email fallback (display_name is now NULL
-- when no metadata.full_name). Existing email-like display_names nulled out.
-- (Implementation is a function replacement + UPDATE — see migration file for full DDL.)
```

**Known accepted limitation:** the MG branch of `comments_author_update` passes regardless of the new `author_profile_id` value — the app never sends `author_profile_id` on edit, so this is safe in practice. Tighten to a `with check` constraint if ever needed.

---

## RLS policies

Decisions reflected in the matrix below. Anon = unauthenticated visitor (anyone with the URL). Auth = signed-in via Supabase Auth.

| Table | Anon SELECT | Auth SELECT | INSERT/UPDATE/DELETE |
|---|---|---|---|
| `wiki.pages` | ✓ (read-only site) | ✓ | role `mg` or author (`updated_by`) |
| `wiki.revisions` | ✗ | ✓ | trigger-written only; no manual writes |
| `wiki.pins` | ✓ | ✓ | role `mg` |
| `wiki.profiles` | ✓ (`profiles_anon_read`, added migration 012 for comment cards) | ✓ | own row UPDATE only; INSERT via first-login trigger |
| `wiki.imported_characters` | ✓ (open per user decision 2026-05-20) | ✓ | role `mg` |
| `wiki.comments` | ✓ (comments are public) | ✓ | INSERT as self; UPDATE/DELETE as author or MG |
| `wiki.investigation_cast` | ✓ | ✓ | role `mg` |

Sketch policies (full migration writes them out):

```sql
-- wiki.pages: anyone reads, mg or author updates
alter table wiki.pages enable row level security;
create policy pages_anon_read on wiki.pages for select using (true);
create policy pages_mg_write  on wiki.pages for all
  using (exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg'));

-- wiki.imported_characters: open read, mg-only write
alter table wiki.imported_characters enable row level security;
create policy imported_anon_read on wiki.imported_characters for select using (true);
create policy imported_mg_write  on wiki.imported_characters for all
  using (exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg'));
```

---

## Storage

- **Bucket `wiki-attachments`** — image library for vault attachments. Public read; write only by role `mg`.
- Per-page attachments are staged at *generator time* (`scripts/build-content.ts` → `public/vault-attachments/by-name/`) for the live site. The bucket is for *runtime uploads* via the editor (stage D) — not yet wired.

---

## Sync pipeline

### Vault → site (the dominant flow today)

`scripts/build-content.ts` reads `VAULT_PUBLIC` (default `G:\…\PUBLIC\`), generates `src/generated/content.ts`, copies attachments into `public/vault-attachments/by-name/`. Read-only against the vault. Runs once with `npm run build-content`, or auto on changes via `npm run watch-content` (Node `fs.watch` + 500 ms debounce → Vite HMR).

This pipeline is **build-time + dev-time only** — it doesn't touch Supabase.

### Vault → `wiki.pages` (`scripts/push-vault.ts`)

Intended for when the site moves from build-time snapshots to runtime Supabase fetches. Currently **dry-run only** (`--execute` exits 1) because the schema migration hasn't been approved.

When unlocked:

- Walks `VAULT_PUBLIC` recursively, upserts each `.md` into `wiki.pages` keyed by `path`
- Folders get rows too (`kind='folder'`, `body=null`)
- Cleanup pipeline ported from BookStack PoC: collapseAsterisks, stripDuplicateH1, vaultToApp (wikilink rewrite)
- Idempotent: hash content, skip unchanged

### `wiki.pages` → vault (`scripts/pull-vault.ts`)

Back-sync for player-edited pages. Currently **dry-run only**.

When unlocked:

- `SELECT * FROM wiki.pages WHERE ready_to_sync = true`
- Convert wikilinks (app → vault form)
- Preview diff vs current file in `PUBLIC/`
- **Manual confirm step** before writing — GM reviews per page
- After successful write: flip `ready_to_sync = false`

### Character import (`/admin/import-characters` — to build)

Detailed flow in [[work/2026-05-20-import-coc-creator-characters]]. Summary:

1. Admin opens the route (gated by `wiki.profiles.role = 'mg'`).
2. Frontend calls `supabase.from('characters').select(…)` — works as anon because coc-creator's `anon_read_characters` policy is unfiltered.
3. UI shows the list with per-row state (`not imported` / `imported (current)` / `imported (stale)`), multi-select.
4. Admin clicks **Importuj zaznaczone** → for each selected: types player display name → upsert into `wiki.imported_characters`.
5. Site immediately shows new pages under `BADACZE/<slug>` via `useContentTree()` merge.

### Wikilink conversion

Two-way. Shared parser/resolver in `src/lib/wikilinks.ts` (see [[work/2026-05-19-wikilink-plugin]]):

- **Vault form:** `[[Page]]` or `[[Folder/Page|alias]]`. Resolved by node *name* (Obsidian convention).
- **App form:** `[Page](/p/<slug-path>)`. URLs use slug-form.
- Wikilink anchors (`[[Page#Section]]`) — currently stripped (target resolves, anchor dropped). Anchor routing waits for `rehype-slug` (new dep — user approval).

---

## Migration order

Recommended sequence when the schema unlocks. Each step in a separate migration file so the GM can pause between if anything looks off:

1. `001_schema_wiki.sql` — `create schema wiki;`
2. `002_profiles.sql` — `wiki.profiles` + first-login trigger
3. `003_pages.sql` — `wiki.pages` + `wiki.revisions` + RLS
4. `004_pins.sql` — `wiki.pins` + RLS
5. `005_imported_characters.sql` — `wiki.imported_characters` + RLS
6. `006_storage.sql` — `wiki-attachments` bucket policies

After 001–003: unlock `scripts/push-vault.ts --execute`. After 004: unlock pin editing. After 005: unlock `/admin/import-characters`.

---

## Open questions

- **Image storage strategy** — Supabase `wiki-attachments` bucket vs commit attachments into repo. Currently we commit (`public/vault-attachments/by-name/` gitignored, regenerated locally). Decide before stage D editor lets MG upload new images. See [[work/Index]].
- **Realtime channels** — granularity for pins (one channel for all vs per-shelf). Affects free-tier egress. Decide in stage E.
- **Wikilink anchor support** — needs `rehype-slug` (new dep). Decide when an actual anchor link breaks visibly.

---

## See also

- [[INTEGRATIONS]] — cross-project coordination with coc-creator (read of `public.characters`)
- [[work/2026-05-20-import-coc-creator-characters]] — character import design
- [[work/2026-05-20-recursive-content-tree]] — why the schema is path-keyed not hierarchy-keyed
- [[work/2026-05-19-wikilink-plugin]] — wikilink resolver design
