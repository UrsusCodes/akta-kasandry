-- 013 — never expose emails through the anon-readable wiki.profiles.
-- (a) Recreate the first-login trigger WITHOUT the email fallback: leave
--     display_name NULL when no metadata is supplied. MG sets a real name in
--     /admin (or passes display_name in user metadata at account creation).
create or replace function wiki.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = wiki, public, pg_temp
as $$
begin
  insert into wiki.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

-- (b) Sanitize any existing rows where display_name looks like an email.
update wiki.profiles set display_name = null
where display_name like '%@%.%';
