-- 002 — wiki.profiles + first-login trigger + RLS.
--
-- One row per auth.users row, created automatically on signup. Default role
-- is 'gracz' (player); promote to 'mg' (game master) by hand for now:
--
--   update wiki.profiles set role = 'mg' where id = '<uuid-of-mg>';
--
-- Stage D will add an MG-only admin UI for role management.

create table wiki.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  role          text not null default 'gracz' check (role in ('mg', 'gracz')),
  created_at    timestamptz not null default now()
);

grant select on wiki.profiles to anon, authenticated;
grant update on wiki.profiles to authenticated;

-- First-login trigger. When Supabase Auth inserts a row into auth.users
-- (signup), mirror it into wiki.profiles so the user has a place to land.
-- display_name defaults to the email; user can edit later.
create or replace function wiki.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = wiki, public, pg_temp
as $$
begin
  insert into wiki.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  );
  return new;
end;
$$;

-- Trigger name is prefixed with `wiki_` to avoid colliding with coc-creator's
-- trigger on the same auth.users table. They use the Supabase-docs canonical
-- name `on_auth_user_created` to create rows in public.players on signup;
-- if we used the same name, our `drop trigger if exists` above would silently
-- nuke theirs. See INTEGRATIONS.md "Coordination triggers".
drop trigger if exists wiki_on_auth_user_created on auth.users;
create trigger wiki_on_auth_user_created
  after insert on auth.users
  for each row execute function wiki.handle_new_user();

-- RLS
alter table wiki.profiles enable row level security;

-- Signed-in users can read every profile (we render "edited by Janek" etc.).
-- Anon users see nothing — display names only matter once logged in.
create policy profiles_auth_read on wiki.profiles
  for select to authenticated using (true);

-- Users can update their OWN row, but cannot change their role themselves.
-- The `with check` clause forces the new role value to equal the existing one.
create policy profiles_self_update on wiki.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from wiki.profiles where id = auth.uid())
  );

-- INSERT and DELETE are handled by triggers / cascades — no client-side
-- policies needed. With RLS enabled and no INSERT policy, direct client
-- inserts are blocked by default.
