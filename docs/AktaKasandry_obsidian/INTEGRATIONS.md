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

> [!warning] Coordination doc is currently one-sided (2026-05-20)
> Recon on `UrsusCodes/coc-creator` via `gh` (see [[work/2026-05-20-import-coc-creator-characters]]) found **no mention of akta-kasandry anywhere in their docs.** Their `TECHNOLOGY_MASTERMIND.md` has no "Shared Supabase with akta-kasandry" section yet. The shared-database arrangement is documented only on our side. **User action:** add a coordination section on coc-creator's side before any cross-schema work lands, so their future maintenance doesn't accidentally break us.

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
