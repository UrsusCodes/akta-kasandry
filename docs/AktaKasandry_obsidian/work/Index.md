---
date: 2026-05-19
status: active
tags:
  - work
  - index
---

# Work Notes — Index

Map of decision notes, explorations, and dated working memos. Each entry links to a file in `work/` with frontmatter, topic, and status.

## Open questions (decisions pending)

- **Session summaries with transcript deep-links** (Stage J) — discussed 2026-06-19, not designed. Open: transcript anchor scheme (utterance id / range / time), summary storage+format, viewer deep-link target (scroll-to + highlight). See [[work/2026-06-19-transcript-viewer-port]] §"Next topic".

- **Import postaci z coc-creator** — [[work/2026-05-20-import-coc-creator-characters]] — design ready, 4 user-action items (coordination doc on their side, player-name strategy, DDL approval, RLS posture). Implementation blocked on those + schema migration.

- ~~**Markdown editor choice**~~ — resolved 2026-05-19: `@uiw/react-md-editor`. See [[work/2026-05-19-editor-choice]].
- **Slugify strategy for Polish characters** — keep diacritics in URLs (percent-encoded), transliterate (`ą` → `a`), or hash. Affects deep-linking + readability + sync key stability. Resolve before stage **c** (push script needs deterministic keys).
- **Realtime channel granularity for pins** — single channel for all pins vs per-shelf vs per-book. Affects free-tier egress. Resolve in stage **e**.
- **Image storage** — Supabase `wiki-attachments` bucket vs commit images into repo. Trade-off: bucket = egress cost + dynamic; repo = bandwidth-free + needs rebuild on image change. Resolve in stage **c**.
- ~~**Wikilink resolution timing**~~ — resolved 2026-05-19: hybrid. Vault-form stored, render resolves via remark plugin; sync scripts use the same shared parser. See [[work/2026-05-19-wikilink-plugin]].

## Decisions made

- 2026-07-15 — [[work/2026-07-15-session-vault|Session vault]] — per-session, self-contained Obsidian review package (`packages/<slug>-vault/`) that bundles the digest draft (rewritten into Obsidian-safe markdown), a free-form notes file, the transcript tool, and the presentation kit, for one assigned player to correct offline before anything is published. **Reuses, never reimplements**, the session package and presentation kit via newly-exported `buildSessionPackage`/`buildPresentationKit`. **Deep-link restore contract: `{sesja:slug#id}` → visible `(scena N · ~mm:ss)` + hidden `<!--rs:id-->` comment**, losslessly invertible by Akta's AI, never auto-applied. Out-of-range deep-link anchors resolve to the *preceding* scene (verified necessary: 20/55 anchors in the rozdarte-sumienie draft fall outside every scene-index range). Builder enhancement: copies gallery images straight into vault `Media/`. Shipped 2026-07-15 alongside `rozdarte-sumienie` run as the **first session through the full pipeline end-to-end** (overlay rebuilt from 4 recorder runs around an rpg-recorder stitch bug; real media, scene-index, and gallery committed). No new dependency, no schema change. Spec: `docs/superpowers/specs/2026-07-15-session-vault-design.md`; plan: `docs/superpowers/plans/2026-07-15-session-vault.md`; runbook: `docs/RUNBOOKS/session-vault.md`.
- 2026-07-15 — [[work/2026-07-15-presentation-kit|Presentation kit]] — player self-service slide editor (`edytor.html` + audio, generated per session), sibling deliverable to the session package, reuses the `cinematic-slideshow` engine. **Trust boundary: the round-trip artifact is `szkic.json`, never the exported `prezentacja.html`** — the engine doesn't HTML-escape slide text, so a player-exported deck is untrusted markup; the GM imports the player's data, reviews it, and re-exports through `KitCore`'s escaping. Shipped 2026-07-15; UG2 dry run found and fixed a real bug (a `</script>` literal in a source comment truncated the injected editor script) then passed clean end-to-end. **Same day: audio self-containment fix** — exported/edited decks now base64-inline every used track via a sibling `assets/tracks-data.js` (`window.__KIT_TRACKS__`) instead of a relative reference, so a downloaded/moved deck keeps its music; added a "Posłuchaj" track-preview button; the runbook's old `AUDIO_BASE`-edit publish step is gone. No new dependency, no schema change. Spec: `docs/superpowers/specs/2026-07-15-presentation-kit-design.md`; plan: `docs/superpowers/plans/2026-07-15-presentation-kit.md`; runbook: `docs/RUNBOOKS/presentation-kit.md`.
- 2026-07-14 — [[work/2026-07-14-session-companion|Session companion]] — "no new app" principle: generation stays in Claude Code skills outside the app (`session-digest`, `session-feedback`), the site only renders results. **Iteration 1 shipped**: authoring skills, `fetch-comments.ts`, data-driven `SessionGallery` + in-house `Lightbox`, UG2 gallery manifest + case-tree wiring, UG2 "Pytania i wątpliwości" pilot (GM-review-pending, append-only block-ids once commented), UG2 scene-index seed. No new dependency, no schema change. **Iteration 2** (downloadable session package with concat-mix audio, hosted on Google Drive, replaces any R2/GitHub-Releases audio hosting) shipped 2026-07-15; **presentation kit** (see above) shipped the same day as a sibling deliverable; **Iteration 3** (shared whiteboard via **tldraw**, approved-but-deferred dependency, reopens the old Excalidraw exclusion) is spec-only, not scheduled. Spec: `docs/superpowers/specs/2026-07-14-session-companion-design.md`; plan: `docs/superpowers/plans/2026-07-14-session-companion-iter1.md`.
- 2026-06-27 — **Comment composer flow + player login model** — guided three-state composer (`CommentComposer.tsx`): idle → select-fragment → compose. Login by name with synthetic-email pattern (`<login>@kasandra.local`). Comment card positioning via pure push-down stack (`src/lib/comments/stack.ts`). Author edit/delete wired. UG2 narration page enabled as a second commentable page. Spec: `docs/superpowers/specs/2026-06-26-comment-composer-flow-design.md`; plan: `docs/superpowers/plans/2026-06-26-comment-composer-flow.md`.
- 2026-06-26 — **Cinematic presentation + reusable skill** — themeable, music-driven slideshow at `public/prezentacja/ug2/`, embedded via route `/prezentacja/ug2` (iframe + fullscreen); packaged as the global `cinematic-slideshow` skill (4 themes). **Decision: presentation audio committed** so the live deck has sound. Sessions wired into SPRAWY case hubs; sub-pages render inline via `NodeView` special-cases; Sól w Ranach hidden (`_`-prefixed vault folder + `/sesje` filter). Spec: `docs/superpowers/specs/2026-06-26-ug2-presentation-design.md`.
- 2026-06-26 — [[work/2026-06-26-player-comments-design|Player margin-comments]] — annotation layer on summary pages; stable `page_key` + content stays in `.tsx`; MG-provisioned accounts; public comments; homegrown anchorer (no new dep); full v1 (anchor-grouped threads + replies + cast-filtered speaker picker). Reopens the scoped-out "per-page comments" exclusion (now scoped to summaries). **Status: spec written, plan + implementation pending.**
- 2026-05-19 — [[work/2026-05-19-wikilink-plugin|Wikilink resolution]] — hybrid: remark plugin for render (AST-safe), string preprocess for sync (C1/C2). Shared parser+resolver in `src/lib/wikilinks.ts`.
- 2026-05-19 — [[work/2026-05-19-editor-choice|Markdown editor]] — `@uiw/react-md-editor`. Preview reuses our react-markdown + remarkWikilinks pipeline; plain textarea = no IME pitfalls with Polish diacritics.
- 2026-05-20 — [[work/2026-05-20-recursive-content-tree|Content model: recursive tree]] — dropped Shelf/Book/Chapter (BookStack artifact). Single `ContentNode` with `kind: 'folder' \| 'page'` + arbitrary nesting. Routing collapsed to `/p/*` catch-all.
- 2026-05-20 — [[work/2026-05-20-public-snapshot-and-osm-map|PUBLIC snapshot + interactive 1924 map]] — content source is now a generator over `G:\…\PUBLIC` (`npm run build-content`). Boston map: Leaflet `ImageOverlay` over the real 1924 Rand McNally JPG (staged by the generator), inside the existing article (no dedicated `/map` route).
- 2026-06-19 — [[work/2026-06-19-transcript-viewer-port|Transcript viewer port]] — `/sesje` section ported from rpg-recorder. Producer/consumer boundary = overlay JSON; audio = manual Drive seek links (no in-app streaming); virtualization via CSS `content-visibility`.
- 2026-06-22 — [[work/2026-06-22-transcript-data-lessons|Transcript data lessons]] — epoch clock ≠ audio time (histogram by `play.start`); read a single channel for chronological plot; lost-content map (Sól climax = software error, UG 2 night-recon/shootout = recording pause); session-summary authoring model.

## Active explorations

_(none yet)_

## Note convention

When creating a work note, place it in `work/` with filename `YYYY-MM-DD-<slug>.md` and frontmatter:

```yaml
---
date: YYYY-MM-DD
status: open | decided | superseded
tags: [decision, area/<area>]
related: ["[[OtherNote]]"]
---
```

Then add a one-line entry above with a wikilink and the status.
