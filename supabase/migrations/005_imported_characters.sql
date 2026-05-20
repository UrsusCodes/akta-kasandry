-- 005 — wiki.imported_characters + RLS.
--
-- Snapshot table for selective import of public.characters from coc-creator.
-- Admin picks rows in /admin/import-characters, snapshot upserts on source_id.
-- See: docs/AktaKasandry_obsidian/work/2026-05-20-import-coc-creator-characters.md
--
-- We never write to public.* — only read public.characters via the
-- anon_read_characters policy coc-creator already has in place.

create table wiki.imported_characters (
  id                 bigserial primary key,
  source_id          uuid not null unique,         -- public.characters.id
  slug               text not null unique,         -- url segment derived from name

  -- columns extracted for sort / filter / display in lists:
  name               text not null,
  occupation_id      text,
  era                text,
  status             text,                         -- 'draft' | 'submitted' from source
  source_player_id   uuid,                         -- coc-creator's player UUID
  player_name        text,                         -- admin-typed at import (public.players is locked)
  portrait_url       text,

  -- whole public.characters row, as-is — JSONB lets the source add fields
  -- later without forcing us to migrate this table.
  data               jsonb not null,

  -- snapshot meta:
  source_updated_at  timestamptz not null,         -- copy of public.characters.updated_at at import
  imported_at        timestamptz not null default now(),
  imported_by        uuid references auth.users(id)
);
create index imported_characters_source_updated_at_idx
  on wiki.imported_characters (source_updated_at);
create index imported_characters_source_player_id_idx
  on wiki.imported_characters (source_player_id);

alter table wiki.imported_characters enable row level security;

-- SELECT open to anon — player wiki doesn't gate behind login.
-- Decision: 2026-05-20, work/2026-05-20-import-coc-creator-characters.md.
create policy imported_anon_read on wiki.imported_characters for select using (true);

-- INSERT / UPDATE / DELETE only for MG (admin import UI).
create policy imported_mg_write on wiki.imported_characters for all to authenticated
  using (exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg'))
  with check (exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg'));
