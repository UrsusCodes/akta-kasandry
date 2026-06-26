-- 012 — which characters belong to an investigation (summary page_key), plus
-- a safe anon read of profile identity columns for rendering public comments.
-- NOTE: character_id references wiki.imported_characters(source_id) — the uuid
-- natural key — NOT the bigserial id (see migration 011).

create table wiki.investigation_cast (
  page_key     text not null,
  character_id uuid not null references wiki.imported_characters(source_id) on delete cascade,
  primary key (page_key, character_id)
);
grant select on wiki.investigation_cast to anon, authenticated;
grant insert, delete on wiki.investigation_cast to authenticated;

alter table wiki.investigation_cast enable row level security;
create policy cast_public_read on wiki.investigation_cast for select using (true);
create policy cast_mg_write on wiki.investigation_cast for all to authenticated
  using (exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg'))
  with check (exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg'));

-- Anon must read author display_name + colour to render public comments.
-- Migration 002 already GRANTed select on wiki.profiles to anon, but its only
-- RLS policy (profiles_auth_read) is authenticated-only, so anon currently sees
-- nothing. Add an anon read policy. The table holds no secrets (email lives in
-- auth.users, not here; migration 013 additionally guarantees display_name is
-- never an email). The grant below is idempotent/redundant-safe.
grant select on wiki.profiles to anon;
create policy profiles_anon_read on wiki.profiles
  for select to anon using (true);
