-- 001 — create the `wiki` schema.
--
-- Everything akta-kasandry writes lives under `wiki.*`. Run this first.
-- Never touch `public.*` (coc-creator's territory) — see INTEGRATIONS.md.
--
-- ⚠️ AFTER running this file, also go to:
--    Supabase dashboard → Settings → API → Exposed schemas
--    and ADD `wiki` to the comma-separated list.
-- Without that, the JS client won't see wiki.* tables (PostgREST hides
-- non-exposed schemas).

create schema if not exists wiki;

-- Let the anon + authenticated roles "see" the schema. Per-table RLS still
-- enforces who can read what; this just allows the connection to resolve names.
grant usage on schema wiki to anon, authenticated;

-- Default privileges for objects created later in this schema. New tables/
-- sequences/functions inherit these without explicit grants per migration.
alter default privileges in schema wiki grant select on tables to anon, authenticated;
alter default privileges in schema wiki grant insert, update, delete on tables to authenticated;
alter default privileges in schema wiki grant usage, select on sequences to authenticated;
alter default privileges in schema wiki grant execute on functions to authenticated;
