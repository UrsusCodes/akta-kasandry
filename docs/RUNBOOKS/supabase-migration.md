---
date: 2026-05-20
status: active
tags:
  - runbook
  - supabase
  - stage/a
---

# Runbook: Supabase migration (from empty database to working MG)

Step-by-step for the first time you wire akta-kasandry to the shared Supabase project. Estimated time: **20–30 minutes**, half of which is waiting for coc-creator to give you collaborator access.

Re-runnable on any new environment (staging, restore-from-backup). Each section says what to do, where, and how to verify it worked.

---

## Prerequisites

You need:

- [ ] **Confirmation from coc-creator owner** that they're OK with us creating schema `wiki` in the shared project. Show them [SUPABASE_AND_SYNC.md](../AktaKasandry_obsidian/SUPABASE_AND_SYNC.md) Schema section.
- [ ] **Collaborator access** to the Supabase project (Organization settings → Members → Invite, role: `Developer` or higher).
- [ ] A modern browser (you'll spend most of this in the Supabase dashboard).
- [ ] `npm install` already run in this repo (you have node_modules).

---

## Phase 1 — Wire the client (5 min)

You can do this *before* migrations land. The client just won't work until later, but it's good to have it ready.

### 1.1 Get the credentials

In Supabase dashboard → **Settings → API**, copy:

- **Project URL** (looks like `https://xxxxxxxxx.supabase.co`)
- **Project API keys → `anon` `public`** (a long `eyJ…` JWT)

### 1.2 Populate `.env`

In the repo root:

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://xxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VAULT_PUBLIC=G:\My Drive\OBSIDIAN\RPG\Zew Cthulhu\PUBLIC
```

`.env` is gitignored — won't leak. Don't share the anon key in screenshots either.

### 1.3 Verify

```bash
npm run build
```

Should still succeed. Nothing imports `src/lib/supabase.ts` yet — the build only confirms the env vars are syntactically valid.

---

## Phase 2 — Run the migrations (10 min)

> 📝 **Order swapped from earlier draft.** In the new Supabase UI, exposing a schema (Phase 3 below) requires the schema to already exist in the DB. So we create it first, expose it after.

We use the dashboard SQL Editor, not Supabase CLI — chosen for the project (per [work/Index.md](../AktaKasandry_obsidian/work/Index.md)).

> ⚠️ **Run files in order. Stop and read the output after each.** If any error appears, do NOT continue. Fix or revert before the next file.

> 🛑 **Never run `supabase db push` from this repo.** The shared Supabase project uses one global `supabase_migrations.schema_migrations` table, and coc-creator already owns the `001..022` sequence there. If `db push` runs from here it tries to register our `001..006` as new migrations and collides with their history. **Both sides run migrations manually via SQL Editor** — this is part of the shared-database contract ([[INTEGRATIONS]]).

### 3.1 Open the editor

Dashboard → **Database → SQL Editor → New query**.

### 3.2 Run each migration

For each file under `supabase/migrations/` in this repo, in numeric order:

1. Open the local file (e.g. `supabase/migrations/001_schema_wiki.sql`)
2. Copy its entire contents
3. Paste into the SQL Editor
4. Click **Run** (or press `Ctrl+Enter`)
5. Verify: bottom panel shows "Success. No rows returned." or row counts. **No red errors.**
6. Move to the next file.

The seven files, in order:

| # | File | Purpose |
|---|---|---|
| 1 | `001_schema_wiki.sql` | Create `wiki` schema + default privileges |
| 2 | `002_profiles.sql` | `wiki.profiles` + first-login trigger + RLS |
| 3 | `003_pages.sql` | `wiki.pages` + `wiki.revisions` + revision trigger + RLS |
| 4 | `004_pins.sql` | `wiki.pins` + RLS |
| 5 | `005_imported_characters.sql` | `wiki.imported_characters` + RLS |
| 6 | `006_storage.sql` | RLS policies on `storage.objects` for the `wiki-attachments` bucket |
| 7 | `007_grants.sql` | **explicit** table/sequence grants for anon + authenticated (the `alter default privileges` in 001 doesn't reliably cover SQL-Editor-created tables) |

### 2.3 Verify after each migration

After `001`: in the dashboard → **Database → Schemas**, you should see `wiki` listed.

After `002`: in **Database → Tables → wiki**, you should see `profiles` with the columns `id, display_name, role, created_at`.

After `003`: `pages` + `revisions` appear.

After `004`: `pins` appears.

After `005`: `imported_characters` appears.

After `006`: in **Database → Policies → storage.objects**, you should see four "wiki-attachments …" policies.

After `007`: no visible change, but the API queries in Phase 6 will start returning `[]` instead of 404.

---

## Phase 3 — Expose the `wiki` schema (1 min, but easy to miss)

PostgREST (the auto-generated REST layer) only serves schemas explicitly listed in Data API settings. Without this, `supabase.from('pages')` returns 404 even though the table exists.

### 3.1 Add `wiki` to exposed schemas

In the new Supabase UI: dashboard → **Settings → Data API → Settings tab** (not "Settings → API" — that's only for keys now).

In **Exposed schemas** dropdown → click the field → search for `wiki` (now visible because Phase 2 created it) → check the box. **Save.**

The dropdown should now read "3 of 3 schemas exposed" (graphql_public, public, wiki).

> ⚠️ **Known issue (2026-05-20): the dashboard Save may not propagate to PostgREST.** We hit this — dashboard showed "3 of 3 exposed" but the API still returned `PGRST106 Invalid schema: wiki`. The `pgrst.db_schemas` GUC on the `authenticator` role wasn't written. **Fix it directly in SQL Editor:**
>
> ```sql
> -- diagnose: does the authenticator role have wiki in its config?
> select rolname, rolconfig from pg_roles where rolname = 'authenticator';
> -- if rolconfig has no pgrst.db_schemas (or it lacks wiki), set it explicitly:
> alter role authenticator set pgrst.db_schemas = 'public, graphql_public, wiki';
> notify pgrst, 'reload config';
> ```
>
> Wait ~10s, then re-test. This is a **project-wide** setting shared with coc-creator — adding `wiki` is additive (their `public, graphql_public` access is untouched). **Caveat:** if anyone clicks Save in coc-creator's Data API settings later, it may overwrite this GUC and drop `wiki` — just re-run the `alter role` line.

### 3.2 Verify

Going forward, with **Automatically expose new tables** ON (default), any new tables you add to the `wiki` schema later are auto-exposed (but still need the grants from `007_grants.sql` — re-run it).

---

## Phase 4 — Create the storage bucket (2 min)

Storage buckets can't be created via SQL — has to be done in the dashboard.

### 4.1 Create the bucket

Dashboard → **Storage → New bucket**:

- **Name**: `wiki-attachments` (exact spelling — matches the policies in 006)
- **Public bucket**: ✅ ON (so the player-facing site can `<img>` from it)
- **File size limit**: default (50 MiB) is fine
- **Allowed MIME types**: leave empty (allow all)

Click Save.

### 4.2 Verify

Browse to **Storage → wiki-attachments** — should be empty but accessible.

The policies installed in 006 govern who can write to it.

---

## Phase 5 — Create the MG account (3 min)

We don't have a signup UI yet (stage D). For now you'll sign up via the dashboard and self-promote.

### 5.1 Confirm Auth providers

Dashboard → **Authentication → Providers**:

- **Email** should be enabled by default. Confirm.
- (Google OAuth — defer to stage D, requires a Google Cloud Project.)

### 5.2 Sign up

Dashboard → **Authentication → Users → Add user → Create new user**:

- **Email**: your real email
- **Password**: pick something
- **Auto Confirm User**: ✅ ON (skip email verification for now)

Click Create. The user appears in the list with a fresh UUID.

### 5.3 Promote to MG

Open SQL Editor again:

```sql
-- Replace 'your.email@example.com' with the email you used above.
update wiki.profiles
   set role = 'mg'
 where id = (select id from auth.users where email = 'your.email@example.com');

-- Verify:
select id, display_name, role from wiki.profiles;
```

The row should show `role = 'mg'`.

---

## Phase 6 — Smoke-test from the app (2 min)

Quick check that the client wiring works.

### 6.1 Start the dev server

```bash
npm run dev
```

Open the page in browser, press **F12 → Console**, paste:

```js
// Doesn't matter that the import path is "@/..." in code — at runtime it's bundled.
// We can just hit the network directly to verify.
fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/pages?select=path,name&limit=1`, {
  headers: {
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    'Accept-Profile': 'wiki',
  },
}).then(r => r.json()).then(console.log);
```

Expected output: `[]` (empty array — table exists but no rows yet). Anything else (404, 401, error message) means something in Phase 2 / 3 is off.

### 6.2 What if it fails?

| Symptom | Likely cause | Fix |
|---|---|---|
| `PGRST106 Invalid schema: wiki` | `wiki` not in PostgREST's `db_schemas` (dashboard Save didn't propagate) | Phase 3.1 known-issue block — `alter role authenticator set pgrst.db_schemas` + `notify pgrst, 'reload config'` |
| `404 Not Found` (schema IS exposed) | tables lack anon/authenticated GRANT — role sees no privilege → "not found" | Run `007_grants.sql` |
| `relation "wiki.pages" does not exist` | 003 didn't run | Re-run 003 |
| `401 Unauthorized` | wrong anon key in `.env` | Check Phase 1.1 |
| `invalid request: column does not exist` | partial migration | Drop the schema with `drop schema wiki cascade;` and re-run from 001 |

---

## What's now unlocked

After this runbook completes successfully:

- ✅ Database schema is in place
- ✅ MG account exists
- ✅ Client wired to env vars

The app still uses build-time content (`src/generated/content.ts`); to swap to runtime Supabase, the next steps are:

- Unblock `npm run push-vault --execute` so the first batch of pages from `PUBLIC/` lands in `wiki.pages`
- Implement the MG admin UI (`/admin/import-characters`)
- Wire the editor on `/draft` to save into `wiki.pages` (stage D)
- Wire the map editor to write to `wiki.pins` (stage E proper)

Those are tracked in [TASK_LIST.md](../AktaKasandry_obsidian/TASK_LIST.md).

---

## Rollback (if it all goes wrong)

To wipe everything we created and start over:

```sql
-- 1. Drop our schema (cascades to all tables and triggers)
drop schema if exists wiki cascade;

-- 2. Drop the trigger on auth.users (named uniquely with the `wiki_` prefix
--    so this won't touch coc-creator's `on_auth_user_created`).
drop trigger if exists wiki_on_auth_user_created on auth.users;

-- 2b. Remove wiki from PostgREST's exposed schemas (project-wide setting).
--     Only do this if akta-kasandry is being fully removed — coc-creator
--     doesn't use wiki so this is safe for them either way.
alter role authenticator reset pgrst.db_schemas;
notify pgrst, 'reload config';

-- 3. Drop the storage policies (named uniquely so we don't hit coc-creator)
drop policy if exists "wiki-attachments anon read" on storage.objects;
drop policy if exists "wiki-attachments mg insert" on storage.objects;
drop policy if exists "wiki-attachments mg update" on storage.objects;
drop policy if exists "wiki-attachments mg delete" on storage.objects;

-- 4. (Manual) Delete the wiki-attachments bucket from dashboard Storage page.
```

Then re-run from Phase 3.

This doesn't touch coc-creator's `public.*` schema — their data is safe.
