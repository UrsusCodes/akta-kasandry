-- 003 — wiki.pages + wiki.revisions + RLS + revision-write trigger.
--
-- Pages are path-keyed (slash-separated slugs from the vault root, e.g.
-- 'zasady/terminy/bijatyka'). Folders get rows too (kind='folder', body=null).
-- Recursive content tree — no shelf/book/chapter levels. See
-- work/2026-05-20-recursive-content-tree.md for rationale.
--
-- Revisions are append-only — every UPDATE that changes `body` writes a row.
-- This is what powers the diff + rollback in stage D.

create table wiki.pages (
  path           text primary key,                 -- 'zasady/terminy/bijatyka'
  parent_path    text,                             -- 'zasady/terminy', '' for root
  name           text not null,                    -- display name with diacritics
  kind           text not null check (kind in ('folder', 'page')),
  body           text,                             -- markdown; null for folders
  ready_to_sync  boolean not null default false,   -- pull script flag
  updated_at     timestamptz not null default now(),
  updated_by     uuid references wiki.profiles(id)
);
create index pages_parent_path_idx on wiki.pages (parent_path);

create table wiki.revisions (
  id           uuid primary key default gen_random_uuid(),
  page_path    text not null references wiki.pages(path) on delete cascade,
  user_id      uuid not null references wiki.profiles(id),
  body_before  text not null,
  body_after   text not null,
  created_at   timestamptz not null default now()
);
create index revisions_page_path_idx on wiki.revisions (page_path, created_at desc);

-- Revision trigger: append a wiki.revisions row whenever wiki.pages.body
-- changes. updated_at is also bumped here so callers don't have to remember.
create or replace function wiki.write_revision()
returns trigger
language plpgsql
security definer
set search_path = wiki, public, pg_temp
as $$
begin
  if old.body is distinct from new.body then
    insert into wiki.revisions (page_path, user_id, body_before, body_after)
    values (
      new.path,
      coalesce(new.updated_by, auth.uid()),
      coalesce(old.body, ''),
      coalesce(new.body, '')
    );
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists pages_revision_on_update on wiki.pages;
create trigger pages_revision_on_update
  before update on wiki.pages
  for each row execute function wiki.write_revision();

-- RLS
alter table wiki.pages enable row level security;
alter table wiki.revisions enable row level security;

-- Anyone reads pages (public wiki).
create policy pages_anon_read on wiki.pages for select using (true);

-- MG can do everything to pages. Per-author update + ready_to_sync workflow
-- come in stage D; start simple.
create policy pages_mg_all on wiki.pages for all to authenticated
  using (exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg'))
  with check (exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg'));

-- Revisions: authenticated read, no client writes (trigger does the inserts
-- under SECURITY DEFINER → bypasses RLS).
create policy revisions_auth_read on wiki.revisions for select to authenticated using (true);
