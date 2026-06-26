-- 011 — player margin-comments on summary pages.
-- See docs/AktaKasandry_obsidian/work/2026-06-26-player-comments-design.md
-- NOTE: speaker_character_id references wiki.imported_characters(source_id) — the
-- uuid natural key — NOT the bigserial id. The frontend keys characters by
-- source_id (stable across re-imports); the bigint id is never exposed.
create table wiki.comments (
  id                   uuid primary key default gen_random_uuid(),
  page_key             text not null,
  anchor               jsonb not null,
  author_profile_id    uuid not null references wiki.profiles(id) on delete cascade,
  speaker_character_id uuid references wiki.imported_characters(source_id) on delete set null,
  body                 text not null check (length(btrim(body)) > 0),
  parent_id            uuid references wiki.comments(id) on delete cascade,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  edited               boolean not null default false
);
create index comments_page_key_idx on wiki.comments (page_key);
create index comments_parent_idx on wiki.comments (parent_id);

grant select on wiki.comments to anon, authenticated;
grant insert, update, delete on wiki.comments to authenticated;

alter table wiki.comments enable row level security;

-- Public read (decision 2026-06-26: all comments public).
create policy comments_public_read on wiki.comments
  for select using (true);

-- A signed-in user may insert only as themselves.
create policy comments_author_insert on wiki.comments
  for insert to authenticated
  with check (author_profile_id = auth.uid());

-- Author may edit/delete their own; MG may edit/delete any.
create policy comments_author_update on wiki.comments
  for update to authenticated
  using (
    author_profile_id = auth.uid()
    or exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg')
  )
  with check (
    author_profile_id = auth.uid()
    or exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg')
  );

create policy comments_author_delete on wiki.comments
  for delete to authenticated
  using (
    author_profile_id = auth.uid()
    or exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg')
  );
