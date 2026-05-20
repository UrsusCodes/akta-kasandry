---
date: 2026-05-19
status: active
tags:
  - integrations
  - dep/coc-creator
---

# Integrations

External systems and sibling projects this app coordinates with. Cross-project changes must be reflected here.

## coc-creator (sibling project, shared Supabase)

**Repo:** `github.com/UrsusCodes/coc-creator`

**Why coupled:** free-tier Supabase allows 2 projects per account; both apps share one project to stay within the limit.

**Isolation strategy:**

- coc-creator owns `public.*` (and any schema it defines)
- akta-kasandry owns `wiki.*` and the bucket `wiki-attachments`
- Auth users are shared — coc-creator account = SSO into akta-kasandry
- Free-tier egress is shared — be mindful (especially on map realtime channels)

**Before changing anything that crosses the boundary:**

1. Read `coc-creator/docs/CoCCreator_obsidian/TECHNOLOGY_MASTERMIND.md`, section **"Shared Supabase with akta-kasandry"** — coc-creator-Claude maintains this section
2. Check `git log` on that file via `gh` CLI for recent updates
3. If you're modifying anything *they* might care about (Auth providers, RLS on `auth.*`, project-level settings, billing-affecting changes), surface it to the user — they may need to brief the coc-creator side

> [!success] Coordination doc landed on coc-creator side (2026-05-20)
> Their side now has `coc-creator/docs/CoCCreator_obsidian/INTEGRATIONS.md` with: (1) `anon_read_characters` as a documented public integration surface, (2) coordination triggers — 4 ops on their side that need to ping us first (see below).

## Cross-project integration surfaces (load-bearing)

These contracts are now load-bearing — changing them on either side without coordination breaks the other.

| Surface | Owner | Consumer | What it does |
|---|---|---|---|
| `anon_read_characters` policy on `public.characters` | coc-creator | akta-kasandry (`/admin/import-characters`) | Lets our admin UI SELECT character rows for snapshot import. Tightening this RLS would break our import flow. |
| `wiki.*` schema | akta-kasandry | (none — internal) | Our writes; never touched by coc-creator. |
| `wiki-attachments` bucket | akta-kasandry | (none — internal) | Player-facing image uploads (stage D). |

## Coordination triggers (from us → them)

We must ping coc-creator before:

- Anything that would require *them* to relax RLS on `public.*` (we don't expect to ever ask)
- Anything materially increasing project-wide egress

## Coordination triggers (from them → us)

Per coc-creator's `INTEGRATIONS.md` — they ping us before:

1. Tightening `anon_read_characters` policy on `public.characters`
2. Rename/drop columns on `public.characters` (additions are safe — our snapshot picks them up)
3. Changing the portraits bucket from public-read to anything narrower
4. Wiring Supabase Auth into coc-creator (their custom auth → Supabase Auth migration)

## Feedback from coc-creator-Claude on the character-import plan (2026-05-20)

Their review of [[work/2026-05-20-import-coc-creator-characters]] flagged four non-blocking concerns. Each tracked here so they don't get lost:

1. **`SELECT *` is forward-risk.** Today `public.characters` has nothing sensitive, but if they ever add a PII/secret column we'd silently snapshot it into `wiki.imported_characters.data` (jsonb). **Action:** the admin UI extractor (when built) must use an explicit allowlist of column names, not `select *`. Allowlist documented in the work note. The `data jsonb` column stays — it's the *shape* of the extractor that's constrained, not the storage.
2. **Never run `supabase db push` from this repo.** Their migration sequence (`001..022`) and ours (`001..006`) collide in the shared `supabase_migrations.schema_migrations` table. Each side runs its own migrations manually via SQL Editor. **Action:** warning added to `docs/RUNBOOKS/supabase-migration.md`.
3. **Portrait URL drift.** Our snapshot stores `portrait_url` from coc-creator. If they delete or move portraits, our wiki shows broken images. The "imported (stale)" state catches data drift but not URL drift. **Action accepted as-is** for v1 — admin re-imports when they notice. Follow-up: mirror portraits into our `wiki-attachments/imported-characters/<source_id>.{ext}` at import time. Tracked in the work note's "future work" section.
4. **`anon_read_characters` is now a public API.** Yesterday it was internal RLS; today it's our integration surface. **Action:** captured in the table above as load-bearing.

**Safe without coordination:**

- Anything strictly inside `wiki.*` schema
- Anything inside `wiki-attachments` bucket
- Frontend changes in this repo

**Requires coordination:**

- Adding Auth providers (OAuth)
- Modifying email templates
- Changing project-level settings (region, plan tier)
- Anything that materially increases egress
- **Reading from `public.*` for our own features** (e.g. character import — [[work/2026-05-20-import-coc-creator-characters]]). Their `anon_read_characters` policy lets us, but tells them *we are doing it*.

> [!info] coc-creator has no dev vault
> coc-creator is an older project — it does not have a `docs/CoCCreator_obsidian/` equivalent of this vault. The `TECHNOLOGY_MASTERMIND.md` file referenced here is a single document in `coc-creator/docs/`, maintained by hand. Treat it as the canonical coordination doc — there's no fuller context behind it.

## Content vault (`G:\My Drive\OBSIDIAN\RPG\Zew Cthulhu\`)

**What it is:** the GM's master Obsidian vault, Google-Drive synced across devices. The campaign content lives here.

**Relevant subfolders / files:**

- `PUBLIC/` — the slice that gets published. Push/pull scripts target this exclusively.
- `boston-map-1924.jpg` — 7803×11702, 13 MB; commit into this app's repo at `public/maps/boston-map-1924.jpg`. Don't re-fetch on every build.
- `CLAUDE.md` — vault conventions (Polish characters, wikilink style, folder structure)

**Cross-process memory:**

- The content vault has its own Claude Code memory directory: `C:\Users\Pawel\.claude\projects\G--My-Drive-OBSIDIAN-RPG-Zew-Cthulhu\memory\`
- Includes `project_publikacja_web.md` — the publication-web plan from the content side, useful for understanding GM expectations on the player-facing UX

## PoC reuse (`C:\temp\bookstack-test\`)

Older BookStack-based PoC. Salvageable assets:

- `cthulhu-skin-minimal.html` — palette + fonts (stage B)
- `static/boston-map.html` + `boston-map-pins.json` — Leaflet viewer with view + edit modes (stage E)
- `import.py` — markdown importer with wikilink conversion, image handling, asterisks cleanup (stage C — port to Node or invoke as Python CLI)

## GitHub Pages

Deploy target. Repo name `akta-kasandry` (TBD whether under user or an org). Static SPA + Supabase from the browser. `.env.example` in repo; secrets injected at build time via repo settings or Actions.
