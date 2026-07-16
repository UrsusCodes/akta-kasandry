---
date: 2026-05-19
status: active
tags:
  - tasks
---

# Task List

Staged plan mirrors the project spec (a-g). Active stage at top of "In progress"; finished stages move to DONE.

## In progress

Stages A, B, E, G, H, **I**, **J**, **K**, **L**, **M** (iter 1 + 2): **complete**. K = Sól + UG 2 summaries, off-mic fills, illustrations, **cinematic presentation** + reusable skill, case hubs wired into the tree. L = player margin-comments — full interaction layer live in production, 6 player accounts provisioned. M = session companion — iter 1 (authoring skills, data-driven gallery, "Pytania i wątpliwości" pilot, scene-index seed) + iter 2 (**downloadable session package**: generator + standalone viewer + runbook, UG2 dry run passed 2026-07-15) + **presentation kit** (player self-service slide editor: generator + editor + runbook, UG2 dry run passed 2026-07-15, self-contained-audio fix 2026-07-15) + **session vault** (per-session Obsidian review package reusing both builders, `rozdarte-sumienie` run end-to-end as the first full-pipeline worked example, 2026-07-15, GM owes an Obsidian visual open + NPC-name resolution + eventual publish); iteration 3 spec-only. C (dry-run only), D1 (editor live, no persistence yet), F (dry-run only).

## Backlog (staged)

### Stage A — Setup + Supabase connection + schema migration `#stage/a`

- [x] Scaffold Vite + React 19 + TS project (manual scaffold, repo wasn't empty) — A1
- [x] Add Tailwind v4, wire palette tokens (see `[[DESIGN_SYSTEM]]`) — A2
- [x] Install: `@supabase/supabase-js`, `zustand`, `react-router-dom@7`, `react-hook-form`, `zod`, `react-markdown`, `remark-gfm`, `react-leaflet@5` (bumped from 4 for React 19 peer) — A1
- [x] `.env.example` committed; `.env` gitignored — A1
- [x] Design `wiki.*` schema DDL + RLS policies — done in `[[SUPABASE_AND_SYNC]]` (rewritten 2026-05-20), DDL in `supabase/migrations/001..006.sql`
- [x] Supabase client init (`src/lib/supabase.ts`) — lazy, env-driven, default schema `wiki`
- [x] Migration runbook (`docs/RUNBOOKS/supabase-migration.md`) — step-by-step for SQL Editor mode
- [x] ✅ **DONE 2026-05-20** — `.env.local` populated (legacy anon JWT from shared project)
- [x] ✅ `wiki` exposed (via `alter role authenticator set pgrst.db_schemas` — dashboard Save didn't propagate, see runbook known-issue)
- [x] ✅ migrations 001..007 run in SQL Editor (007 = explicit grants, added after hitting 404 on missing table grants)
- [x] ✅ `wiki-attachments` bucket created (public)
- [x] ✅ MG account `storage.station2023@gmail.com` (role `mg`), created via dashboard + promoted via SQL
- [x] ✅ coc-creator-Claude added their `INTEGRATIONS.md` + reviewed our plan (4 non-blocking flags folded in)
- [x] ✅ smoke test passed — `wiki.pages` and `wiki.imported_characters` both return `[]` via anon REST

**STAGE A COMPLETE.** Supabase live. Unblocks: push-vault `--execute` (C), pin editing (E), character import (H), page editor save (D).

### Stage B — Public reader `#stage/b`

- [x] Routing skeleton (react-router v7) with public routes — B1
- [x] Cthulhu skin: port palette + fonts from `C:\temp\bookstack-test\cthulhu-skin-minimal.html` into Tailwind v4 theme — A2 (moved up)
- [x] Left-sidebar Shelf list (always visible, large titles) — B1
- [x] Breadcrumbs component — B1
- [x] Mock content data (B2) — 3 shelves, books, chapters, pages with Polish content + wikilinks
- [x] Markdown render: Polish characters, wikilinks `[[X]]` / `[[X|alias]]` → internal links, images, tables, code, blockquotes — B3

### Stage C — Vault → Supabase sync (push) `#stage/c`

- [x] Node CLI script reading `VAULT_PUBLIC` env (fallback `./sample-vault`) recursively — C1 (dry-run only)
- [x] Path-relative-to-vault as natural key — C1
- [x] Wikilink conversion (vault → app form) via shared `src/lib/wikilinks.ts#vaultToApp` — decided in `[[work/2026-05-19-wikilink-plugin]]`
- [ ] Image reference rewriting — `[[work/Index]]` still open (bucket vs repo)
- [x] Asterisks-and-cruft cleanup (`collapseAsterisks` + `stripDuplicateH1` in `scripts/lib/cleanup.ts`) — C1
- [ ] First full import of `PUBLIC/` — pending Supabase migration (user approval needed)

### Stage D — Auth + edit `#stage/d`

- [ ] Supabase Auth setup (email/pass + Google OAuth) — coordinate with coc-creator SSO — pending user
- [ ] `wiki.profiles` table + role field, plus first-login trigger — pending Supabase
- [ ] RLS policies for read/edit — pending Supabase
- [x] Inline markdown editor — `@uiw/react-md-editor` ([[work/2026-05-19-editor-choice]]); integrated on `/draft` with in-memory zustand store + live preview — D1
- [ ] `wiki.revisions` write hook on page UPDATE — pending Supabase
- [ ] Diff view + rollback button — pending Supabase

### Stage E — Boston map with pins `#stage/e`

- [x] Boston map — Leaflet `ImageOverlay` over real `boston-map-1924.jpg` (Rand McNally, 7803×11702, staged by `npm run build-content` from one level above PUBLIC). Inside the existing PUBLIC article ([[work/2026-05-20-public-snapshot-and-osm-map]]).
- [x] Pin markers + popovers (mock data only, no DB yet) — E1
- [x] ✅ Read pins from `wiki.pins` — E1 (2026-05-20), mock fallback when no creds
- [x] ✅ Edit mode (role `mg`): click-add, drag-move, delete — E2/E3 (2026-05-20). Gated `isMG && source==='supabase'` + RLS.
- [x] ✅ Edit existing pin (title/label/desc/color) — 2026-05-20. "Edytuj" in popover opens the overlay form pre-filled; saves via updatePin.
- [x] ✅ Pin colors (10-option palette) + colored markers + color picker — 2026-05-20
- [x] ✅ Pin list below map (grouped by color, alpha, click-to-focus) — 2026-05-20
- [ ] Realtime subscription on `wiki.pins` — deferred (free-tier egress; single-MG doesn't need it yet)

**STAGE E feature-complete for v1.** View + full CRUD (add/move/edit/delete) + colors + grouped list, all MG-gated (UI + RLS). Realtime is the only deferred item.
- [ ] Pre-tiled (`gdal2tiles`) version of the 1924 JPG for faster first-paint on slow links — follow-up

### Stage F — Supabase → vault back-sync (pull) `#stage/f`

- [ ] Add `ready_to_sync` column on `wiki.pages` (probably done in stage A) — pending user
- [x] Node CLI pull script (dry-run only) — C2
- [x] Wikilink conversion (app → vault form) via shared `src/lib/wikilinks.ts#appToVault` — C2
- [ ] Diff / preview before writing to filesystem (manual confirm step) — pending Supabase
- [ ] After successful write: flip `ready_to_sync = false` — pending Supabase

### Stage G — Deploy `#stage/g`

- [x] ✅ GH Pages via Actions workflow (`.github/workflows/deploy.yml`) — 2026-05-20
- [x] ✅ Build + `.env` injection via repo secrets (VITE_SUPABASE_URL/ANON_KEY)
- [x] ✅ First production deploy — **live at https://ursuscodes.github.io/akta-kasandry/**
- [x] ✅ SPA fallback (index.html→404.html), base path `/akta-kasandry/`, image base prefix via `withBase`
- [x] ✅ Repo public (`UrsusCodes/akta-kasandry`), auto-deploy on push to main
- [ ] (Optional) custom domain
- [x] ✅ (Maintenance) bump Actions to Node 24 — 2026-05-21
- [ ] (Cosmetic) deep links return HTTP 404 status (SPA still works) — only fixable by a host with real SPA fallback; accepted GH Pages tradeoff

**STAGE G COMPLETE.** Site is live, auto-deploys on push.

### Stage H — Character import from coc-creator `#stage/h` `#dep/coc-creator`

Design ready ([[work/2026-05-20-import-coc-creator-characters]]). DDL in [[SUPABASE_AND_SYNC]]. All decisions made 2026-05-20. Implementation complete 2026-05-21.

- [x] ✅ Coordination doc on coc-creator side (user action) — 2026-05-20
- [x] ✅ Player-display-name = admin-types-it, grouped by source_player_id, localStorage cache — 2026-05-20
- [x] ✅ RLS for `wiki.imported_characters` SELECT = anon — 2026-05-20
- [x] ✅ DDL approved — 2026-05-20
- [x] ✅ Migration `005_imported_characters.sql` — run as part of 001..007 batch 2026-05-20
- [x] ✅ `/admin/import` route with player-grouped UI, player-name inputs, select/import/remove — 2026-05-20
- [x] ✅ `<CharacterPage>` renderer — vendored `CharacterSheet` from coc-creator, portrait + sheet — 2026-05-21
- [x] ✅ `useContentStore` merging vault snapshot + imported characters under `BADACZE/` — 2026-05-20
- [x] ✅ Portrait fix: read `portrait_url` (canonical coc-creator field) — 2026-05-21

### Stage I — Transcript provenance viewer `#stage/i` `#dep/rpg-recorder`

Ported from rpg-recorder. Full rationale: [[work/2026-06-19-transcript-viewer-port]]. Producer/consumer boundary = `<slug>-<variant>-overlay.json` (schema mirrored to `src/lib/transcripts/overlay.ts`).

- [x] ✅ Data layer: 11 overlays (Sol w Ranach ×7, UG 2 ×4) + trimmed `variants.json` + `audio-links.json` in `public/transcripts/data/` — 2026-06-19
- [x] ✅ Overlay TS types + lib (`format`/`data`/`audioLinks`/`corrections`/`effective`) — 2026-06-19
- [x] ✅ `useTranscriptStore` (manifest, current slug/variant, speaker toggles, pin/hover, paint, corrections) — 2026-06-19
- [x] ✅ Renderer as React/Cthulhu components; `content-visibility` virtualization (5000 rows, no new dep) — 2026-06-19
- [x] ✅ Provenance panel: competing chunks with % bars, 5-method votes, audio seek links — 2026-06-19
- [x] ✅ Editor: paint speaker / edit text / localStorage / export JSON — 2026-06-19
- [x] ✅ Routes `/sesje` + `/sesje/:slug?v=`, full-bleed AppShell, "Sesje" nav — 2026-06-19
- [ ] **Audio playback** — deferred by decision (manual Drive seek links). Revisit GitHub Releases / R2 only if real in-browser playback is wanted.

**STAGE I COMPLETE (viewer + corrections).** Adding a session is data-only.

### Stage J — Session summaries with transcript deep-links `#stage/j` `#decision/open`

Per-session/per-investigation summaries authored from the transcript + GM conversation, where summary paragraphs/sections **deep-link into the matching transcript section**. Discussed 2026-06-19, not yet designed.

- [ ] Decide the transcript **anchor scheme** (utterance id / id-range / time window) for stable deep-links
- [ ] Decide summary **storage + format** (vault page? new `wiki.*` table? frontmatter block?)
- [ ] Viewer **deep-link target**: scroll-to + highlight an utterance or range from a URL (e.g. `/sesje/:slug?v=…#u=<id>`)
- [ ] Authoring flow (GM writes summary; how the anchors get attached)

### Stage J — Session-summary deep-links `#stage/j`

- [x] ✅ `remarkTranscriptAnchors` — `{sesja:<slug>#<id>}` / `..` ranges → "↪ transkrypt" pills → `/sesje/<slug>?u=<id>` — 2026-06-20
- [x] ✅ Viewer deep-link target — `?u=` scroll/flash/pin (single id or range) — 2026-06-20
- [x] ✅ Wired into shared `Markdown` renderer — 2026-06-20

**STAGE J COMPLETE.** Anchors use the deployed (epoch) variant's utterance ids.

### Stage K — Session summaries `#stage/k` `#dep/rpg-recorder`

Player-facing session summaries authored from transcript + GM memory, in the "Znak Życia" house style, with `{sesja:…}` deep-links. Currently on demo routes; **to be moved into the vault** under the right `SPRAWY/` cases.

- [x] ✅ **Sól w Ranach** — `/streszczenie-demo` + `/streszczenie-demo/cytaty` (Western CoC; climax lost to recorder software error, reconstructed from GM memory, flagged, no anchors) — 2026-06-20
- [x] ✅ **Urodzaj Grozy (UG 2)** — `/streszczenie-ug2` (3-act, dual gangster+academic group) + `/streszczenie-ug2/narracja` (long-form, sub-agent) — 2026-06-22
- [x] ✅ **UG 2 — off-mic fills** (night recon + dawn shootout, academics' town intro, cave fight) from GM memory into both pages; flags dropped per GM (seamless narrative) — 2026-06-26
- [x] ✅ UG 2 — **"Śmieszne i epickie momenty"** section with deep-linked quotes — 2026-06-26
- [x] ✅ Folded narrative extras (Cayda / „Drogi Ernesti"→McTavish, cave) into the short summary — 2026-06-26
- [x] ✅ Naming canon + lore fixes (Brendan vs Mother/Abigail, Brock epilogue, Mortimer survives, **Dr Arthur Henry Corwin**, Elaine, Klub Kasandry) — 2026-06-26
- [x] ✅ Illustrations: 21 scene images + 10 cast portraits (from Supabase `portraits`) woven into both pages — 2026-06-26
- [x] ✅ **Cinematic presentation** `/prezentacja/ug2` (standalone slideshow + iframe route + fullscreen; **audio committed**) + gunfight SFX via ffmpeg — 2026-06-26
- [x] ✅ Reusable **`cinematic-slideshow` skill** (global `~/.claude/skills/`, 4 themes) + spec `docs/superpowers/specs/2026-06-26-ug2-presentation-design.md` — 2026-06-26
- [x] ✅ **Case hubs** for UG 2 + Sól + all sub-pages in the tree (NodeView inline special-case; transcript → `/sesje`); TreeNav extra indent — 2026-06-26
- [x] ✅ **Sól w Ranach hidden** from players (`_04 SÓL W RANACH` vault folder + `/sesje` filter); reversible — 2026-06-26
- [ ] Swap two presentation placeholders when GM generates them (rats "Coś tu gnije", 3 m giant "Trzymetrowa postać")
- [ ] Un-hide Sól w Ranach when ready (rename `_04 SÓL W RANACH` → `04 SÓL W RANACH`, regenerate, drop the `/sesje` filter)
- [ ] (Optional) switch the `/sesje` viewer to the `concat` variant for sane real-time timestamps — would require re-anchoring all markers to concat ids
- [ ] (Optional) audio — fill `audio-links.json` with Drive links so chunk ▶ links work

**STAGE K COMPLETE.** Both sessions summarized, illustrated, deep-linked, and wired into SPRAWY case hubs; UG 2 also has a cinematic presentation. Adding a future session reuses the `cinematic-slideshow` skill + the hub/stub pattern.

### Stage L — Player margin-comments `#stage/l` `#dep/coc-creator`

Players leave IC/OOC comments anchored to text fragments of summary pages, in a right rail; main content untouched. Full implementation shipped 2026-06-26 (24 tasks, 7 phases, TDD with two-stage review). See [[work/2026-06-26-player-comments-design]] and `docs/superpowers/plans/2026-06-26-player-comments.md`.

- [x] ✅ Brainstorm + mockup (v1→v3), spec, 24-task implementation plan — 2026-06-26
- [x] ✅ coc-creator coordination + auth-model correction (no SSO) + email-leak fix (migration 013) — 2026-06-26
- [x] ✅ Vitest + Testing Library harness (first test framework, approved) — 28 → 43 tests green — 2026-06-26/27
- [x] ✅ Pure logic: `playerColors.ts`, `anchor.ts` (createAnchor/resolveAnchor/shortHash/normalizeText/fuzzy/orphan), `group.ts` (groupThreads), `speakerOptions.ts` (speakerOptionsFor) — 2026-06-26
- [x] ✅ Migrations 009–013 run (one transaction, verified) — `wiki.profiles.color`, `imported_characters.owner_profile_id`, `wiki.comments`, `wiki.investigation_cast`, email-hardening + anon profiles read — 2026-06-26
- [x] ✅ `useCommentsStore` (load/add/edit/remove, mock fallback), `useCastStore` (owner/cast/profiles) — 2026-06-26
- [x] ✅ UI components: Portrait, SpeakerPicker, CommentCard, CommentRail, ComposeBubble, useHighlights (CSS Custom Highlight API), AnnotatableArticle — 2026-06-26
- [x] ✅ `remarkBlockIds` plugin; 16 `::highlight` rules in `index.css` — 2026-06-26
- [x] ✅ Wire-in on `/streszczenie-ug2` via AnnotatableArticle + cast-filtered speakerOptions — 2026-06-26
- [x] ✅ Admin owner/cast UI in `/admin/import` (owner dropdown + investigation-cast checkbox) — 2026-06-26
- [x] ✅ `tsc -b` clean; `src/**/*.ts` removed from `tsconfig.node.json` include — 2026-06-26
- [x] ✅ Docs (Task 24): journal, TASK_LIST, memories/project.md, SUPABASE_AND_SYNC, INTEGRATIONS — 2026-06-26
- [x] ✅ **Guided comment composer** (`CommentComposer.tsx`) — idle → select → compose; login-gated; desktop sticky / mobile fixed bottom bar; `ComposeBubble` hides speaker picker for OOC players — 2026-06-27
- [x] ✅ **Comment card positioning** — absolute vertical offset from fragment + push-down collision (`src/lib/comments/stack.ts`, TDD); recomputes on resize/img-load; header floor; desktop-only (`useIsDesktop.ts`) — 2026-06-27
- [x] ✅ **Login by name** — `loginToEmail()` maps `username → username@kasandra.local`; Polish invalid-creds message — 2026-06-27
- [x] ✅ **Author edit/delete** — `CommentCard` shows Edytuj/Usuń for comment author OR MG; inline edit + delete-confirm wired to store — 2026-06-27
- [x] ✅ **UG2 narration comments** — `UG2Narracja.tsx` via `AnnotatableArticle` with own page_key `streszczenie/ug2/narracja`, shared cast `streszczenie/ug2`; verified live — 2026-06-27
- [x] ✅ **Content fix** — Jakub's academic "Dr Edwin Thorne" → "Arthur Henry Corwin" in UG2Summary + UG2Narracja — 2026-06-27
- [x] ✅ **Player accounts provisioned** — 6 accounts (nika/rafalg/piotrs/pawel/kamilk/jakubm), synthetic emails, Auto-Confirmed; display_name + color set via SQL; 10 UG2 characters assigned owner + cast; credentials in gitignored `secrets/player-credentials.md` — 2026-06-27
- [ ] ⚠️ **Cast-store load burst** — ~25 redundant Supabase calls on UG2 page mount (profiles/imported_characters/investigation_cast); suspected `useEffect(..., [user, loadCast])` re-fires on `user` reference change; fix = depend on `user?.id`. Diagnose + fix to spare free-tier egress.
- [ ] Import name mismatch: Nika's academic imported as "Eleine Howard", content canon says "Elaine" — unify (rename in import data) when convenient
- [ ] Comments on non-UG2 pages (Znak Życia, vault pages) — each needs a stable `page_key`; vault pages need `NodeView` to opt into `AnnotatableArticle`
- [ ] **Deferred polish:** realtime comment updates; inline dot markers on text; multi-level replies
- [ ] Move summaries from demo routes into the vault under their final `page_key` (unblocks comments persisting across route changes)

**STAGE L COMPLETE** — full interaction layer live in production; 6 player accounts provisioned; all login/compose/edit/delete paths verified.

### Stage M — Session companion `#stage/m` `#dep/rpg-recorder`

Authoring skills + data-driven session gallery + feedback loop + downloadable session package + session vault, extending Stage K/L. Design: `docs/superpowers/specs/2026-07-14-session-companion-design.md`; plans: `docs/superpowers/plans/2026-07-14-session-companion-iter1.md` + `docs/superpowers/plans/2026-07-15-session-companion-iter2.md` + `docs/superpowers/plans/2026-07-15-session-vault.md`; work notes: [[work/2026-07-14-session-companion]], [[work/2026-07-15-presentation-kit]], [[work/2026-07-15-session-vault]]. **Iteration 1 complete 2026-07-14**, **Iteration 2 complete 2026-07-15**, **presentation kit + session vault complete 2026-07-15** — all additive, **no schema change, no new dependency**. Iteration 3 (shared tldraw whiteboard) is **spec-only** — not implemented.

- [x] ✅ Skill `session-digest` (project skill, `.claude/skills/session-digest/` + `references/house-style.md` + `references/outputs.md`) — turns an overlay + GM off-mic notes into a summary draft, "Pytania i wątpliwości", scene-index, and gallery manifest — 2026-07-14
- [x] ✅ Skill `session-feedback` (project skill, `.claude/skills/session-feedback/`) — folds player comments back into a summary as a reviewable diff; no auto-apply — 2026-07-14
- [x] ✅ `scripts/fetch-comments.ts` + `scripts/lib/group-comments.ts` (+ test) — anon-key read of `wiki.comments` for a `page_key`, grouped by `blockId`/thread; `npm run fetch-comments` — 2026-07-14
- [x] ✅ `src/lib/gallery/manifest.ts` — zod schema + `parseGalleryManifest` + `loadGalleryManifest` (+ test) — 2026-07-14
- [x] ✅ `src/components/gallery/{SessionGallery,Lightbox}.tsx` (+ light test) — in-house click-to-zoom lightbox, no new dependency — 2026-07-14
- [x] ✅ `public/gallery/ug2.json` — first manifest (22 scenes, 10 cast, 5 tracks, 4 links; all paths verified on disk) — 2026-07-14
- [x] ✅ Galeria wired into the content tree — `NodeView.tsx` `INLINE_PAGES` + `content.ts` node + vault stub; live at `/p/sprawy/02-urodzaj-grozy/05-galeria` — 2026-07-14
- [x] ✅ UG2 "Pytania i wątpliwości" pilot section (5 questions, each its own paragraph → own `data-block-id`) appended to `UG2Summary.tsx` — **GM-review-pending before deploy**; append-only once players comment — 2026-07-14
- [x] ✅ `public/transcripts/scene-index/ug2.json` seed (11 scenes, real utterance ids, chronological) — Iteration-2 input, no app wiring yet — 2026-07-14
- [ ] GM reviews/approves "Pytania i wątpliwości" wording before the next deploy (question 5 references hidden "Sól w Ranach" — GM decides teaser vs. rewrite)
- [x] ✅ `.gitignore` fixed (`.claude/` → `.claude/*` + `!.claude/skills/`) so the two new skills can be committed — 2026-07-14
- [x] ✅ **Iteration 2 — downloadable session package** (plan `docs/superpowers/plans/2026-07-15-session-companion-iter2.md`) — 2026-07-15:
	- [x] ✅ `scripts/lib/package-data.ts` (+ 12 tests) — pure payload builder: **winner-only trimmed projection** (~0.5 MB vs 4.3 MB raw overlay), pinned seek rule `play.start ?? (concat ? start : null)`, `inlineJson` escapes `</script>`
	- [x] ✅ `scripts/package-template/template.html` — standalone vanilla viewer: scene sidebar, `content-visibility` rows, sticky audio, follow-mode, no-audio fallback, zero network, Polish UI, Cthulhu palette
	- [x] ✅ `scripts/build-package.ts` + `npm run build-package` + `packages/` gitignored — CLI (slug + optional `--audio`); prints zip command, Drive reminder, ready-to-paste hub bullet
	- [x] ✅ GM runbook `docs/RUNBOOKS/session-package.md` — ffmpeg amix→dynaudnorm→libopus 32k mono, `Compress-Archive`, dual-edit hub warning, Safari caveat; mix-as-rpg-recorder-export flagged for their backlog
	- [x] ✅ **UG2 end-to-end dry run PASS** — real mix `ug2-mix.opus` (36.8 MB, 9514.4065 s — matches overlay duration to the ms) produced in rpg-recorder's tree; `packages/ug2/` built; seek verified programmatically at 3 scenes (early/middle/late, `currentTime == seekSec` exactly); zip 36.9 MB; unzip-and-reopen verified. Caveat: sandbox rejects `file://`, so verification ran over a local static HTTP server (equivalent — template does no fetch)
	- [x] ✅ (stretch) transcript text filter — diacritic-insensitive (text + speaker), debounced, Polish-pluralized match counter; follow-mode guarded while filtering; no-audio `.seekable` cursor nit fixed
- [ ] **GM: acoustic spot-check** — listen to `ug2-mix.opus` at a few points + open `packages/ug2/index.html` from disk via `file://` (the one step the sandbox couldn't do)
- [ ] **GM: upload `packages/ug2.zip` to Google Drive** (share: anyone with the link, viewer)
- [ ] **GM: paste the hub link** (ready-to-paste bullet printed by the generator) into vault `PUBLIC/SPRAWY/02 URODZAJ GROZY/00 HUB.md` **and** its mirror in `src/generated/content.ts` — **both places**
- [ ] rpg-recorder side (their backlog): turn the runbook's ffmpeg concat-mix one-liner into a proper export script
- [ ] **Iteration 3 (spec only)** — shared whiteboard via **tldraw** (the one approved-but-deferred new dependency beyond the locked stack, replaces the old "Excalidraw" idea); new `wiki.boards` table (scene jsonb, last-write-wins, no history — coordinate with coc-creator per the shared-Supabase guardrail); `/tablica` route; asset side-panel fed by gallery manifests
- [x] ✅ **Presentation kit — player self-service slide editor** (sibling deliverable to the session
	  package, plan `docs/superpowers/plans/2026-07-15-presentation-kit.md`, design
	  `docs/superpowers/specs/2026-07-15-presentation-kit-design.md`, work note
	  [[work/2026-07-15-presentation-kit]]) — 2026-07-15:
	- [x] ✅ `scripts/kit-template/kit-core.js` (+ 26 Vitest tests, incl. HTML-embedding regression
		  test) — pure draft/validate/escape/serialize logic, `globalThis.KitCore`
	- [x] ✅ `scripts/kit-template/edytor.html` — 3-panel Cthulhu editor (slide list / fields / live
		  `<iframe srcdoc>` preview), autosave, szkic file export/import, `prezentacja.html` export
	- [x] ✅ `scripts/build-presentation-kit.ts` + `npm run build-presentation-kit` — base64-embeds
		  images at build time (forced by `file://`: blocked `fetch()`, canvas-tainting), copies
		  audio as sibling files, token-injects `edytor.html`; drift guards incl. a **new
		  `</script`-in-source guard** (see K5 blocker below)
	- [x] ✅ GM runbook `docs/RUNBOOKS/presentation-kit.md` — build → zip → Drive → player
		  instructions → **receive & publish**, trust-boundary callout
	- [x] ✅ Gallery manifest gained optional `caseName` field (`"Urodzaj Grozy"` for `ug2`)
	- [x] ✅ **UG2 end-to-end dry run PASS** — found and fixed a **real blocker**: `kit-core.js` had
		  a source comment containing a literal `</script>`, which truncated the injected editor
		  script in the browser's HTML tokenizer (dead editor). Fixed + guarded, re-ran clean:
		  6-slide deck via real UI events (5 templates, 2 acts/tracks, both Ken Burns variants,
		  custom uploaded PNG, `<b>xss</b>` title escaped end-to-end), autosave reload-restore,
		  szkic round-trip deep-equal, export 552 KB opens+plays (audio HTTP 206), zip 23.5 MB
		  unzip-reopen OK, local publish simulation (site route, `AUDIO_BASE` flip) PASS. Suite
		  93/93, `tsc -b` clean. Caveat: verified over local HTTP (sandbox rejects `file://`); GM
		  owes a true `file://` pass.
	- [ ] **GM: true `file://` open** of `packages/ug2-prezentacja/edytor.html` from disk
	- [ ] **GM: upload `packages/ug2-prezentacja.zip` to Google Drive** (anyone with the link,
		  viewer) and send the runbook's Step 4 player snippet
	- [ ] **First real player round-trip** — a player builds a deck, sends back
		  `szkic-ug2.json`, GM reviews and publishes per runbook Step 5 (nothing here exercised
		  until this happens)
- [x] ✅ **Audio self-containment fix (presentation kit)** — 2026-07-15: exported/edited decks
	  broke when moved away from their build-time `assets/` folder because tracks were
	  referenced by relative path instead of embedded. Fixed by base64-encoding every used
	  track into a sibling `assets/tracks-data.js` (`window.__KIT_TRACKS__`, basename → data
	  URI), loaded by both the editor's live preview and the exported `prezentacja.html`; added
	  a "Posłuchaj" track-preview button next to each act's track picker in the editor; the
	  runbook's old "edit the `AUDIO_BASE` line to publish" step is gone — the export is
	  already fully self-contained, so publishing is a straight copy.
- [x] ✅ **Session vault — per-session Obsidian review package** (sibling deliverable to the
	  session package + presentation kit, reuses both as exported functions; plan
	  `docs/superpowers/plans/2026-07-15-session-vault.md`, design
	  `docs/superpowers/specs/2026-07-15-session-vault-design.md`, runbook
	  `docs/RUNBOOKS/session-vault.md`, work note [[work/2026-07-15-session-vault]]) —
	  2026-07-15:
	- [x] ✅ `scripts/build-package.ts` / `scripts/build-presentation-kit.ts` refactored,
		  behavior-preserving, to export `buildSessionPackage` / `buildPresentationKit`
		  (explicit `outDir`); each CLI's `main()` is now a thin argv-parsing wrapper around its
		  exported function, letting the vault builder invoke both tools in place without
		  reimplementing either
	- [x] ✅ `scripts/lib/vault-summary.ts` (+ 27 tests) — pure Obsidian-markdown rewrite of a
		  digest draft: `{sesja:<slug>#<id>}` deep-links → visible `(scena N · ~H:MM:SS)` label
		  + hidden `<!--rs:id-->` restore comment (losslessly invertible back to the site
		  token); out-of-range ids resolve to the *preceding* scene, flagged `~N`; `/sesje/<slug>`
		  links → pointer at the vault's own bundled transcript tool; site-absolute
		  `<img src="/img/<slug>/...">` / markdown images → `![[basename]]` embeds; "Pytania i
		  wątpliwości" paragraphs → `[!question]` callouts, with an optional trailing
		  `{q-after:<heading>}` marker to relocate a question next to a specific `###` heading
	- [x] ✅ `scripts/lib/vault-manifest.ts` (+ 8 tests) — `planVaultFiles(slug)`, the exact
		  static/derived vault-relative file plan the builder writes (excludes the two
		  builder-owned tool subtrees)
	- [x] ✅ `scripts/vault-template/**` — static Polish vault templates: `START TUTAJ.md`
		  (onboarding), `Komentarz do AI.md` (guided free-form notes — the round-trip payload),
		  `Narzędzia/Otwórz narzędzia.md`, `Media/_Wrzuć tu media.md` (auto-filled checklist),
		  `.obsidian/{app,appearance}.json` (opens straight into reading view, no plugin-trust
		  prompt), empty `Media/{portrety,sceny,muzyka,zdjecia-z-gry,materialy}/`
	- [x] ✅ `scripts/build-session-vault.ts` + `npm run build-session-vault` — CLI assembling
		  `packages/<slug>-vault/`: the rewritten `Streszczenie — <Session>.md`, the static
		  notes, the transcript tool at `Narzędzia/transkrypt/` (via `buildSessionPackage`), the
		  presentation kit at `Narzędzia/prezentacja/` (via `buildPresentationKit`) — **and now
		  also copies the session's gallery scene/cast images straight into vault `Media/`**, so
		  the rewritten summary's `![[...]]` embeds resolve out of the box for any image already
		  in the gallery manifest, no manual media-drop step needed for those
	- [x] ✅ GM runbook `docs/RUNBOOKS/session-vault.md` — build → (optional) Sala mix → enrich
		  media (optional, re-run) → zip → Drive → hand to one assigned player as correction
		  owner → round trip: corrected `Streszczenie…md` + `Komentarz do AI.md` fed to Akta's
		  AI, which restores `<!--rs:ID-->` → `{sesja:…#ID}` and produces a reviewable publish
		  draft — **never auto-applied**, same trust posture as `session-feedback`
	- [x] ✅ **`rozdarte-sumienie` — first session run through the full pipeline, end to end**
		  (rpg-recorder → overlay → digest → package → presentation kit → vault). Overlay
		  rebuilt from **4 separate recorder runs** after working around a stitch bug in
		  rpg-recorder (their software, tracked as a backlog note there, not fixed in this
		  repo); result: `rozdarte-sumienie-current-overlay.json`, concat timeline, **~7 h 30 m**
		  (27023.4 s), **4449 utterances**, **7 speakers** including a dedicated "Sala" room
		  mic. Sala concat mix at `packages/_audio-src/rozdarte-sumienie-sala.opus` (102.8 MB,
		  gitignored). Digest draft `docs/superpowers/drafts/2026-07-15-rozdarte-sumienie-summary.md`;
		  scene-index (16 scenes, `public/transcripts/scene-index/rozdarte-sumienie.json`);
		  gallery manifest (20 scenes/handouts, 10 cast, 8 tracks,
		  `public/gallery/rozdarte-sumienie.json`). Real media committed at
		  `public/img|audio/rozdarte-sumienie/` — compressed from ~180 MB source down to
		  ~32 MB (31 images/6.7 MB across scene photos, 10 cast portraits — Fisk, Kent,
		  Gundberg, Tommy Malone, etc. — and 11 tome-handout `.webp` pages; 8 music
		  tracks/26 MB). Vault built at `packages/rozdarte-sumienie-vault/` (~153 MB, zip
		  ~103 MB, dominated by the transcript tool's bundled Sala audio).
	- [x] ✅ Full suite green — **134 tests** (27 new `vault-summary.test.ts`, 8 new
		  `vault-manifest.test.ts`), `npx tsc -b` clean; `git status` clean of `packages/**`;
		  **nothing committed**, working tree handed to the GM per the plan's hard constraint
	- [ ] **GM: open the built vault in Obsidian** ("Open folder as vault" →
		  `packages/rozdarte-sumienie-vault/`) to visually confirm reading view, deep-link
		  labels, image embeds, and `[!question]` callouts render as expected — the one
		  verification step the sandbox couldn't perform
	- [ ] **GM: resolve the remaining uncertain character/NPC identities** flagged inline in the
		  rozdarte-sumienie draft's "Pytania i wątpliwości" section (several names are marked
		  *niepewne* — see the draft) before treating the summary as review-ready
	- [ ] **GM: eventual site-publish** of the corrected rozdarte-sumienie summary once the
		  assigned player's round trip comes back — feeds the existing Stage K/L pipeline (case
		  hub page, margin comments, gallery, downloadable package, presentation kit), same as
		  Sól/UG 2
	- [ ] **rpg-recorder backlog note (their side, not this repo)** — the 4-run stitch bug that
		  forced a manual overlay-rebuild workaround for rozdarte-sumienie should get a proper
		  fix in rpg-recorder; flag it there next time that project is touched

**STAGE M — ITERATIONS 1 + 2 + PRESENTATION KIT + SESSION VAULT COMPLETE.** Full test suite green (134/134), `tsc -b` clean. GM owes: session-package spot-check listen + `file://` open + Drive upload + dual hub-link paste (Iteration 2); kit `file://` open + Drive upload + first player round-trip (presentation kit); and, for the session vault, an Obsidian visual open of `packages/rozdarte-sumienie-vault/`, resolving the draft's remaining uncertain NPC names, and the eventual site-publish once the assigned player's correction pass comes back. Iteration 3 reserved as a designed interface, not scheduled.

## Out of scope (do not pick up)

- Player image uploads
- Mobile-first responsive
- ~~In-browser Excalidraw editor~~ — **reopened 2026-07-14** as Stage M / Iteration 3, via **tldraw** instead of Excalidraw (spec only, not scheduled)
- ~~Audio / video embeds~~ — **reopened narrowly 2026-07-14, shipped 2026-07-15**: the site itself still hosts no audio; Stage M / Iteration 2's downloadable session package carries audio as a local sibling file, opened via `file://`, never streamed from the site
- ~~Per-page comments~~ — **reopened 2026-06-26** as Stage L, scoped to summary pages, fragment-anchored, never editing main content (see [[work/2026-06-26-player-comments-design]])

## DONE

_(empty)_
