-- 007 — explicit table-level grants for the Data API roles.
--
-- Run LAST, after 002..006 (all tables + sequences must exist).
--
-- Why this exists: 001 sets `alter default privileges in schema wiki …` which
-- is supposed to grant SELECT/INSERT/etc. to anon/authenticated for tables
-- created *afterwards*. In practice, when 002..006 were run through the
-- dashboard SQL Editor, those default privileges did NOT reliably apply to the
-- new tables — PostgREST then returned 404 (role has no table privilege →
-- treated as "not found"). This file grants explicitly on the existing tables.
--
-- Idempotent — safe to re-run any time (e.g. after adding more tables, just
-- re-run this).

grant usage on schema wiki to anon, authenticated;

-- Read for everyone; writes for signed-in users (RLS still scopes *which* rows).
grant select on all tables in schema wiki to anon, authenticated;
grant insert, update, delete on all tables in schema wiki to authenticated;

-- bigserial (wiki.imported_characters.id) needs sequence access for inserts.
grant usage, select on all sequences in schema wiki to authenticated;

-- Tell PostgREST to re-read so the grants take effect immediately.
notify pgrst, 'reload schema';
