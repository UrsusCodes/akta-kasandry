---
date: 2026-05-19
status: active
tags:
  - supabase
  - sync
  - schema
---

# Supabase & Sync Pipeline

Schema, RLS, sync scripts, and content model live here — they're tightly coupled.

> [!warning] Shared Supabase project
> Everything we own lives under namespace `wiki` (`wiki.*` tables, `wiki-attachments` bucket). Never touch `public.*` or any other schema — that belongs to coc-creator. See `[[INTEGRATIONS]]`.

> [!warning] Schema sketch needs update (2026-05-20)
> The DDL below predates the refactor to a recursive content tree ([[work/2026-05-20-recursive-content-tree]]). The fixed `shelf` / `book` / `chapter` columns are gone — `wiki.pages` should use `path TEXT PRIMARY KEY` + `name` + `body` + `ready_to_sync`, with `parent_path` derivable from `path`. Treat any column lists below as historical until this file is rewritten.

## Content model

Mirrors the content vault's `PUBLIC/` folder:

| Level | Name | Storage |
|---|---|---|
| 1 | Shelf | top-level folder under `PUBLIC/` |
| 2 | Book | folder inside Shelf |
| 3 | Chapter (optional) | folder inside Book |
| Leaf | Page | `.md` file (Polish characters, wikilinks, images, tables) |

A page's identity is its **path relative to `PUBLIC/`**, e.g., `ZASADY/Zasady walki/Tutorial walki/Part 1 - Przed walka`. This is the natural key for sync idempotency.

## Schema (proposed — finalise in stage A)

```sql
create schema if not exists wiki;

create table wiki.profiles (
  id uuid primary key references auth.users(id),
  display_name text,
  role text not null check (role in ('mg', 'gracz'))
);

create table wiki.pages (
  id uuid primary key default gen_random_uuid(),
  path text unique not null,            -- relative to PUBLIC/, natural key
  shelf text not null,
  book text not null,
  chapter text,
  title text not null,
  content text not null,                -- markdown
  ready_to_sync boolean default false,  -- pull script honours this
  updated_at timestamptz default now(),
  updated_by uuid references wiki.profiles(id)
);

create table wiki.revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references wiki.pages(id) on delete cascade,
  user_id uuid not null references wiki.profiles(id),
  content_before text not null,
  content_after text not null,
  created_at timestamptz default now()
);

create table wiki.pins (
  id uuid primary key default gen_random_uuid(),
  x int not null,
  y int not null,
  title text not null,
  description text,
  label text,
  created_by uuid references wiki.profiles(id),
  created_at timestamptz default now()
);

-- Character import from coc-creator. Snapshot model:
--   admin selects characters in /admin/import-characters,
--   row is upserted on source_id, source_updated_at tracks staleness.
-- Detailed design: work/2026-05-20-import-coc-creator-characters.md
create table wiki.imported_characters (
  id bigserial primary key,
  source_id uuid not null unique,       -- public.characters.id
  slug text not null unique,            -- url segment, derived from name

  name text not null,
  occupation_id text,
  era text,
  status text,                          -- 'draft' | 'submitted' from source
  source_player_id uuid,
  player_name text,                     -- admin-entered (no public.players access)
  portrait_url text,

  data jsonb not null,                  -- whole source row snapshot

  source_updated_at timestamptz not null,
  imported_at timestamptz not null default now(),
  imported_by uuid references auth.users(id)
);
create index on wiki.imported_characters (source_updated_at);
```

## RLS policies (sketch — finalise in stage A / D)

- `wiki.pages`: public SELECT (no auth for reading); UPDATE only by author (`updated_by`) or role `mg`.
- `wiki.revisions`: SELECT by authenticated; INSERT by authenticated (or via trigger on `wiki.pages` UPDATE); no UPDATE / DELETE.
- `wiki.pins`: public SELECT; INSERT / UPDATE / DELETE only by role `mg`.
- `wiki.profiles`: SELECT all authenticated; INSERT on first login via trigger; UPDATE own row only.

## Storage

- Bucket `wiki-attachments`: public read; write only by role `mg`.

## Push script (vault → Supabase)

CLI (Node), invoked from project root:

- Walks `G:\My Drive\OBSIDIAN\RPG\Zew Cthulhu\PUBLIC\` recursively
- For each `.md`: parse path → derive `shelf` / `book` / `chapter` / `title`, normalise wikilinks (vault → app form), upsert into `wiki.pages` keyed by `path`
- Idempotent on re-run (no duplicates, no spurious revisions for unchanged content)
- Asterisks-and-cruft cleanup (port from `C:\temp\bookstack-test\import.py`)
- Image references: rewrite to point at `wiki-attachments` URLs, or leave relative and resolve client-side — decide in stage C (see `[[work/Index]]`)

## Pull script (Supabase → vault)

CLI (Node):

- `SELECT * FROM wiki.pages WHERE ready_to_sync = true`
- For each row: convert wikilinks (app → vault form); preview diff vs current file in `PUBLIC/`
- **Manual confirm step** before writing — GM reviews per page
- After successful write: flip `ready_to_sync = false`

## Wikilink conversion

Two directions:

- **Vault form:** `[[Page Name]]` or `[[Page Name|alias]]` — `Page Name` is unique within the vault
- **App form:** `[[<path>]]` or canonical URL — to be finalised in stage C

Open: whether resolution happens at push-time (store app-form in DB) or render-time (store vault-form, resolve in React). See `[[work/Index]]`.

## Open questions

See `[[work/Index]]` for: slugify strategy for Polish characters, image storage location, realtime channel granularity, wikilink resolution timing.
