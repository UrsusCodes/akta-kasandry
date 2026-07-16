---
date: 2026-07-15
status: decided
tags: [decision, area/sessions, area/skills, area/gallery, area/packages, dep/rpg-recorder]
related: ["docs/superpowers/specs/2026-07-14-session-companion-design.md", "docs/superpowers/plans/2026-07-14-session-companion-iter1.md", "docs/superpowers/plans/2026-07-15-session-companion-iter2.md", "docs/superpowers/plans/2026-07-15-presentation-kit.md", "[[TASK_LIST]]", "[[work/2026-06-22-transcript-data-lessons]]", "[[work/2026-06-26-player-comments-design]]", "[[work/2026-07-15-presentation-kit]]"]
---

# Session companion — design + Iterations 1–2 implementation

## Problem

Three session-related assets didn't reinforce each other: the transcript overlay viewer
(`/sesje`, Stage I), the player-facing summary (Stage K, e.g. `UG2Summary.tsx`, now also a
margin-comment surface per Stage L), and loose media (scene illustrations, cast portraits,
presentation audio) scattered under `public/` and only partly surfaced. Two jobs were unserved:
authoring a summary from a transcript + GM memory was hand-work each session, and players who
dispute "who said / did what" had no way to listen (the site deliberately hosts no audio).

## Guiding principle — no new app

Everything extends what exists rather than adding a new surface:

- The **site** stays the social/content layer — public reading, deep-links, margin-comments,
  galleries. Always-on, low-bandwidth, no audio hosting.
- **Downloadable per-session packages** (Iteration 2, shipped 2026-07-15) become the
  *verification workbench* — a self-contained `index.html` + audio, opened locally from Google
  Drive, where clicking a scene scrolls the transcript **and** seeks the audio.
- Generation always lives in **Claude Code skills outside the app**. The app only ever **renders**
  results (summaries, galleries, manifests) — it never calls an LLM at runtime.

## Reopened exclusions

Two entries in `memories/project.md` § Out of scope are consciously amended:

| Old exclusion | New status |
|---|---|
| In-browser Excalidraw editor | Reopened as **Iteration 3** — a shared whiteboard via **tldraw** (approved-but-deferred new dependency), not Excalidraw. Spec only; not scheduled. |
| Audio / video embeds | Reopened narrowly. The **site** still hosts no audio. Audio lives only inside the **Iteration 2 downloadable package** (shipped 2026-07-15), referenced by a relative `<audio src>` from a local `file://` page. |

"AI-generated content — separate tooling" is clarified, not reversed: generation stays in skills
(`session-digest`, `session-feedback`) outside the app; the app renders the skill's output.

## Iteration 1 — shipped 2026-07-14

Four deliverables, all additive, no new runtime dependency, no schema change:

1. **Skill `session-digest`** (`.claude/skills/session-digest/`) — reads a session's overlay JSON
   + GM off-mic notes, produces a house-style summary draft, a "Pytania i wątpliwości" section
   (each question its own paragraph → stable `data-block-id` via `remarkBlockIds`), a scene-index
   JSON, and a gallery manifest. All outputs are drafts — GM reviews before deploy.
2. **Skill `session-feedback`** (`.claude/skills/session-feedback/`) + `scripts/fetch-comments.ts`
   — reads `wiki.comments` for a `page_key` with the **anon key only** (comments are public via
   RLS `comments_anon_read`; no secret, no `dotenv` — Node 24 `--env-file`), groups by
   `blockId`/thread via the pure `scripts/lib/group-comments.ts`, and the skill proposes summary
   edits as a **reviewable unified diff** — no auto-apply, GM commits.
3. **Session gallery** — `src/lib/gallery/manifest.ts` (zod schema + parser + `withBase`-aware
   loader), `src/components/gallery/{SessionGallery,Lightbox}.tsx` (in-house click-to-zoom
   overlay, Cthulhu skin tokens, no new dependency), first manifest `public/gallery/ug2.json`
   (22 scenes, 10 cast, 5 tracks, 4 links). Wired into the content tree exactly like other UG2
   case sub-pages: `NodeView.tsx` `INLINE_PAGES` + `src/generated/content.ts` node + a vault stub
   so `npm run build-content` will regenerate the same node.
4. **UG2 pilot content** — "Pytania i wątpliwości" appended to `UG2Summary.tsx`'s `SUMMARY`
   string, 5 questions as standalone paragraphs. **GM-review-pending**: wording needs GM approval
   before the next deploy, and once players comment, question text becomes append-only (editing
   text changes the hash and orphans existing comments).

Also seeded `public/transcripts/scene-index/ug2.json` (11 scenes, real utterance-id boundaries,
chronological) — an Iteration-2 input with no app wiring yet.

**Verification:** 20 test files / 53 tests green (`manifest.test.ts`, `group-comments.test.ts`,
`SessionGallery.test.tsx` new; 43 prior unaffected); `npx tsc -b` clean. No commit made — working
tree handed to the user per the plan's hard constraint.

## Iteration 2 — downloadable session package (shipped 2026-07-15)

A self-contained `index.html` per session with a scene-index sidebar; clicking a scene scrolls the
transcript **and** seeks a concat-mix Opus audio sibling file. All data is
inlined as `<script>` tags at generate time because `fetch()` is blocked under `file://`. Packaged
(zip) and hosted on the GM's Google Drive — **not** the site, not GitHub Releases, not R2. Requires
an rpg-recorder "concat mix" export step (mono Opus ~32 kbps, single file per session, using the
concat timeline). `/sesje` is unchanged and stays the always-on, no-audio deep-link fallback.

This decision **resolves** the open note in `memories/project.md`'s rpg-recorder section ("Revisit
GitHub Releases / R2 only if real in-browser playback is ever wanted") — the answer is: don't;
ship a downloadable local package instead.

**Implemented 2026-07-15** per `docs/superpowers/plans/2026-07-15-session-companion-iter2.md` —
see the shipped section below.

## Iteration 2 — shipped 2026-07-15

All plan tasks landed (T1–T5 + T7 stretch), no new dependency, no schema change, no site source
touched:

1. **Payload builder** `scripts/lib/package-data.ts` (+ 12 Vitest tests) — pure, I/O-free.
   Key refinement over the original spec: the inlined data is a **trimmed winner-only projection**
   (`window.__PKG__`, ~0.5 MB) rather than the raw provenance overlay (4.3 MB) — chunks/methods
   belong to `/sesje`, not the package (design spec §4 amended). Pinned seek rule:
   `seekSec = play.start ?? (timeline === 'concat' ? start : null)`, computed at build time.
   `inlineJson()` escapes `<` so `</script>` can never break the inline script.
2. **Standalone viewer** `scripts/package-template/template.html` — hand-written vanilla
   HTML/CSS/JS (no second Vite build target): scene sidebar, `content-visibility: auto` rows
   (the site viewer's virtualization trick, framework-free), sticky audio bar, follow-mode
   (throttled binary-search row/scene highlight + optional auto-scroll), graceful no-audio
   fallback, zero network under `file://`, Polish UI, Cthulhu palette inline.
3. **Generator** `scripts/build-package.ts` (`npm run build-package -- <slug> [--audio <mix>]`),
   output to gitignored `packages/<slug>/`; prints the `Compress-Archive` zip command, the
   Drive reminder, and the ready-to-paste Polish hub bullet (with `<WKLEJ-LINK-DRIVE>`
   placeholder) for **both** paste targets.
4. **GM runbook** `docs/RUNBOOKS/session-package.md` — mix → build → zip → Drive → hub link.
   The ffmpeg one-liner (`amix` of all channels → `dynaudnorm` → libopus 32 kbps mono) runs in
   rpg-recorder's tree (producer boundary); turning it into a proper export script is flagged
   for **their** backlog. Includes the dual-edit hub warning (vault `00 HUB.md` + the
   `src/generated/content.ts` mirror — iter-1 review lesson) and the macOS-Safari `.opus` caveat.
5. **UG2 end-to-end dry run — PASS.** Real mix
   `C:\Users\Pawel\rpg-recorder\outputs\transcript-viz\audio\ug2\ug2-mix.opus` (36.8 MB,
   9514.4065 s — matches `overlay.duration` to the ms); `packages/ug2/` built; scene seek
   verified programmatically at three points (early / middle / late, `currentTime == seekSec`
   exactly, incl. near-EOF); zip 36.9 MB; unzip-to-a-fresh-dir-and-reopen verified. *Caveat:*
   the browser sandbox rejects `file://`, so verification ran over a local static HTTP server —
   equivalent, since the template performs zero fetches.
6. **Stretch (T7):** diacritic-insensitive transcript filter (matches text + speaker) with
   300 ms debounce and a Polish-pluralized match counter; follow-mode auto-scroll guarded while
   filtering; a no-audio `.seekable`-cursor nit fixed.

**Verification:** 21 test files / 65 tests green; `npx tsc -b` clean; `git status` clean of
`packages/**`; no commit — working tree handed to the user.

**GM's remaining manual actions (open, tracked in [[TASK_LIST]]):**

- [ ] Acoustic spot-check listen of the mix + final `file://` open of `packages/ug2/index.html`
      from disk (the one step the sandbox couldn't perform).
- [ ] Upload `packages/ug2.zip` to Google Drive (anyone with the link, viewer).
- [ ] Paste the hub bullet into vault `PUBLIC/SPRAWY/02 URODZAJ GROZY/00 HUB.md` **and** its
      mirror in `src/generated/content.ts` — both places.

## Sibling deliverable — presentation kit (shipped 2026-07-15)

Not part of this document's iteration numbering (separate plan, separate design), but built the
same day on top of the same gallery-manifest data model and worth cross-linking: a **player
self-service slide editor** (`edytor.html` + audio, generated per session, same Google-Drive
distribution pattern as Iteration 2's package). Where Iteration 2 turns a transcript into a
*listenable* verification workbench, the presentation kit turns a session's gallery art into an
*editable* deck-building tool, reusing the `cinematic-slideshow` engine (2026-06-26) as its
render target. Full design/decisions/K5 dry-run record: [[work/2026-07-15-presentation-kit]]
(plan `docs/superpowers/plans/2026-07-15-presentation-kit.md`, runbook
`docs/RUNBOOKS/presentation-kit.md`). Its central rule — the round-trip artifact between player
and GM is `szkic.json`, never the exported `prezentacja.html` — mirrors this document's
"generation stays outside the app, the app only renders" principle: the *editor* is player-facing
tooling, but only the GM's own re-export, never a player's raw HTML, ever reaches the site.

## Iteration 3 — shared whiteboard via tldraw (spec only, not implemented)

**tldraw** approved as a deferred new dependency — the one sanctioned addition beyond the locked
stack, still requiring explicit go-ahead when scheduled. Model: one board with frames per
investigation; scene JSON in a new `wiki.boards` table (`page_key`/`board_key`, `scene jsonb`,
`updated_at`), last-write-wins, no revision history (deliberately simpler than the page-revision
model). RLS: edit for authenticated players, public read. An asset side-panel would be fed by the
Iteration 1 gallery manifests. Route `/tablica` (or per-case hub entry). Any DDL must go through
the coc-creator shared-Supabase coordination guardrail before being written.

## Open items

- ✅ DONE — `.gitignore` fixed: `.claude/` → `.claude/*` plus `!.claude/skills/` (the negation
  only works because the parent match is `.claude/*`, not the directory itself), so the two new
  skills can be committed.
- GM must approve "Pytania i wątpliwości" wording; question 5 references the currently-hidden
  "Sól w Ranach" session — GM decides teaser phrasing vs. rewrite before deploy.
- ✅ DONE (2026-07-15) — Iteration 2 planned (`docs/superpowers/plans/2026-07-15-session-companion-iter2.md`)
  and shipped; see the "Iteration 2 — shipped" section above, incl. the GM's three open manual
  actions (spot-check + `file://` open, Drive upload, dual hub-link paste).
- Iteration 3 still needs its own implementation plan when scheduled — this document and the
  design spec only reserve the interface (see spec §7 for the full interface table).
