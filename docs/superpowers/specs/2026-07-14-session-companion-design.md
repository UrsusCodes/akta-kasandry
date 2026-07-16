# Session Companion — Design Spec

```yaml
---
date: 2026-07-14
status: active
tags: [spec, area/sessions, area/skills, area/supabase, dep/rpg-recorder, decision/open]
related: ["[[TASK_LIST]]", "[[work/2026-06-26-player-comments-design]]", "docs/superpowers/specs/2026-06-26-ug2-presentation-design.md"]
---
```

> **Scope of this document.** Full design for the "session companion" feature set (three
> iterations). Iteration 1 is fully designed here and has a companion implementation plan at
> `docs/superpowers/plans/2026-07-14-session-companion-iter1.md`. Iterations 2 and 3 are
> designed at the level needed to lock direction and reserve interfaces; they are **not** to be
> implemented from this document — each gets its own plan when scheduled.

---

## 1. Problem & guiding principle

After a session we have three assets that do not currently reinforce each other:

1. the **transcript overlay** (`/sesje`, Stage I) — provenance-rich, machine-produced by
   rpg-recorder, with per-utterance ids that already back `{sesja:<slug>#<id>}` deep-links;
2. the **player-facing summary** (Stage K, e.g. `UG2Summary.tsx`) — house-style narrative with
   deep-links and illustrations, now also a **margin-comment surface** (Stage L);
3. **loose media** — 21+ scene illustrations, 10 cast portraits, presentation audio, the
   cinematic slideshow — scattered under `public/` and only partly surfaced.

Two jobs are unserved:

- **Authoring is manual.** Turning a transcript + off-mic GM memory into a house-style summary,
  and later folding player reactions back in, is hand-work each session.
- **Verification wants audio.** Players who dispute "who said / did what" have no way to listen;
  the site deliberately hosts no audio (egress + the transcript "no hosted audio" rule).

### Principle — **no new app**

Everything extends what exists: the Akta Kasandry site **and** the Claude Code skills pipeline.

- The **site** is the *social / content layer* — public reading, deep-links, margin-comments,
  galleries. Always-on, low-bandwidth, no audio hosting.
- **Downloadable per-session packages** (built by a skill, hosted on the GM's Google Drive) are
  the *verification workbench* — self-contained `index.html` + audio, opened locally, where
  clicking a scene scrolls the transcript **and** seeks the audio.

Generation always lives in **skills outside the app**. The app only ever **renders results**
(summaries, galleries, manifests) — it never calls an LLM at runtime.

### Reopened / clarified exclusions

The original "Out of scope" list (see `memories/project.md`) is consciously amended by this design:

| Old exclusion | New status |
|---|---|
| *In-browser Excalidraw editor* | **Reopened** as **Iteration 3** — a shared whiteboard, but via **tldraw** (approved-but-deferred new dep), not Excalidraw, and only in a later iteration. |
| *Audio / video embeds* | **Reopened, narrowly.** The **site** still hosts no audio. Audio lives only in the **downloadable package** (Iteration 2), referenced by relative `<audio src>` from a local `file://` page. |
| *AI-generated content — separate tooling* | **Clarified, not reversed.** Generation stays in **skills** (`session-digest`, `session-feedback`), outside the app. The app renders the skill's output. This is the boundary, restated, not a new in-app capability. |

---

## 2. System shape (all three iterations)

```
rpg-recorder (producer)                Claude Code skills (authoring)              Akta Kasandry site (render)
────────────────────                   ─────────────────────────────              ───────────────────────────
overlay JSON  ─────────────┐           session-digest ──────────────┐             UG2Summary.tsx  (+ "Pytania")
audio (Opus, off-site)     │  reads    │  writes: summary draft,     ├─ renders → SessionGallery (manifest)
concat-mix (iter 2) ───────┘           │  "Pytania i wątpliwości",   │             /sesje viewer (deep-links)
                                       │  scene-index, gallery mfst   │
                            reads ───►  session-feedback ────────────┘
                            wiki.comments (fetch-comments.ts)  → reviewable diff for GM

                                       package generator (iter 2) ──────────────► index.html + audio  → Google Drive
                                       tldraw board (iter 3) ────── wiki.boards ─► /tablica route
```

Single hard interface with rpg-recorder stays `<slug>-<variant>-overlay.json`
(`src/lib/transcripts/overlay.ts`). Utterance ids remain the anchor currency across summary
deep-links, scene-index, and the package.

---

## 3. Iteration 1 — Authoring skills + gallery + pilot (DESIGNED; see the plan)

Four deliverables, all additive, **no new runtime dependency**, no schema change.

### 3.1 Skill `session-digest` (project skill)

Location: `.claude/skills/session-digest/SKILL.md` (+ `references/`). A **project** skill (not
global) because its house-style rules, deep-link syntax, and file layout are Akta-specific.

**Input:** a session's overlay JSON (`public/transcripts/data/<slug>-<variant>-overlay.json`) +
GM notes on off-mic gaps (the transcript has known holes — see the "off-tape gaps" warning in
`memories/project.md`).

**Outputs (all drafts, GM-review-pending — the skill writes, the GM approves before deploy):**

1. **Player-facing summary draft** in the established house style. The skill studies the live
   exemplars (`src/routes/UG2Summary.tsx`, `UG2Narracja.tsx`) and the Stage K conventions, and
   reproduces: 3-act structure, right-aligned `<img>` portrait thumbnails, full-width scene
   images with italic captions, `{sesja:<slug>#<id>}` deep-links wired through
   `remarkTranscriptAnchors`, a "Podsumowanie rezultatów" block, and a "Śmieszne i epickie
   momenty" quote reel. Off-mic beats are filled from GM memory and (per GM preference set in
   Stage K) written seamlessly rather than flagged.
2. **New final section "Pytania i wątpliwości"** — AI-generated open questions / doubts about
   the session. **Each question is its own paragraph** (not a list item) so that `remarkBlockIds`
   assigns it a **stable `data-block-id`** (FNV-1a hash of the paragraph's normalized text — see
   `src/lib/comments/anchor.ts#shortHash`). Because the summary page is already an
   `AnnotatableArticle`, every question paragraph becomes **individually commentable** with zero
   extra wiring — this is the mechanism that turns the summary into a feedback instrument.
   Stability contract: the block-id is stable as long as the question's text is not edited; the
   skill must therefore treat published question text as append-only (edit → new id → orphaned
   comments).
3. **Scene index** as JSON — an ordered list of `{ id, title, uStart, uEnd, tApprox }` (scene
   title, utterance-id range, approximate timestamp). Reused later by the Iteration-2 package
   generator as the sidebar model. Stored at `public/transcripts/scene-index/<slug>.json`.
4. **Gallery manifest** — see §3.3; the skill emits `public/gallery/<case-key>.json`.

The skill is **authoring guidance + templates**, not app code. It produces `.tsx`/`.json`
content that a human commits.

### 3.2 Skill `session-feedback` + `scripts/fetch-comments.ts`

Location: `.claude/skills/session-feedback/SKILL.md`. Node script:
`scripts/fetch-comments.ts` (style mirrors `scripts/push-vault.ts` — tsx, top-of-file usage
comment, no framework).

- **`fetch-comments.ts`** reads `wiki.comments` for a given `page_key` via `@supabase/supabase-js`
  (already a dependency). Comments are **publicly readable** per RLS (`comments_anon_read`), so
  the script uses the **anon key** only — **no secret**, credentials come from
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (env, loaded with Node 24's native
  `--env-file=.env.local`; no `dotenv` dependency). It joins author `display_name`/`color` and
  speaker `name` (same select shape as `src/stores/comments.ts`) and prints/writes a normalized
  JSON grouped **per question/fragment** (by `anchor.blockId`, with the quoted fragment as the
  group key), threads under their parent.
- **`session-feedback` skill** takes that grouped JSON + the current summary source and instructs
  the AI to **propose summary edits as a reviewable diff** (unified diff or side-by-side against
  the `.tsx` content string). **No auto-apply** — the GM reviews and commits. The skill's rules
  cover: distinguishing IC flavour from OOC corrections, respecting the append-only block-id
  contract for the "Pytania" section, and never inventing player statements.

### 3.3 Session gallery (app render)

A per-case **"Galeria"** sub-page, rendered **inline in the content tree**, following the
existing special-case pattern:

- **Data-driven** from `public/gallery/<case-key>.json` (first manifest: `ug2.json`). Manifest
  carries: scene images (path + caption), cast portraits (path + character name + player),
  music tracks (path + title), and links to the presentation / transcript / summary sub-pages.
- **Component** `SessionGallery` + in-house `Lightbox` — responsive CSS grid + click-to-zoom
  overlay. **No new dependency** — the lightbox is built on the existing stack (React state +
  a fixed-position overlay + keyboard handlers), Cthulhu skin tokens from `DESIGN_SYSTEM.md`
  (`teal-dark`, `gold`, `gold-muted`, `parchment`, `ink`, `font-display`, `font-body`). Image
  paths run through `withBase` for the GH-Pages subpath.
- **Wiring** mirrors the UG2 hub sub-pages (`INLINE_PAGES` in `src/routes/NodeView.tsx`, wired
  2026-06-26): a thin vault stub sub-page appears in the sidebar tree; `NodeView` special-cases
  its path to render `SessionGallery` inline (URL stays inside the case).
- **First manifest (UG2)** references the assets already in the repo: the scene illustrations
  under `public/img/ug2/*.jpg`, the 10 cast portraits under `public/img/ug2/cast/*.jpg`, and the
  presentation audio under `public/audio/ug2/*.mp3` (the gallery lists tracks and links to the
  cinematic presentation; it does **not** introduce a site audio player — playback stays in the
  self-contained presentation deck).

### 3.4 UG2 pilot content — "Pytania i wątpliwości"

A **draft** "Pytania i wątpliwości" section appended to `UG2Summary.tsx`'s `SUMMARY` string,
each question its own paragraph. Clearly **GM-review-pending**: the plan flags that the GM reviews
wording before the next deploy (and that once players comment, question text is append-only).

### 3.5 Docs

Add **Stage M — Session companion** to `docs/AktaKasandry_obsidian/TASK_LIST.md`; journal +
work-note on session end.

---

## 4. Iteration 2 — Downloadable session package (SPEC ONLY — do not implement from here)

**Goal:** a self-contained verification workbench per session, opened locally, with audio.

- **Format:** a single `index.html` per session. Because `fetch()` is **blocked under
  `file://`**, all data (transcript + the Iteration-1 scene-index) is **inlined as
  `<script>` tags** at generate time (e.g. `window.__PKG__ = {…}`), not fetched.
  *(Amended 2026-07-15, iter-2 planning: the inlined transcript is a **trimmed winner-only
  projection** of the overlay — id, seek-seconds, speaker, text — ~0.4 MB for UG2, not the full
  ~4.3 MB provenance overlay with per-chunk data; provenance stays on the site's `/sesje`.)*
  Audio files ship as **siblings** and are referenced with **relative `<audio src="…">`**
  (relative URLs work under `file://`).
- **UI:** a **scene-index sidebar** (fed by `public/transcripts/scene-index/<slug>.json` from
  Iteration 1). Clicking a scene **scrolls the transcript to the utterance range AND seeks the
  audio** to that scene's offset. Reuses the transcript-rendering logic from `/sesje` conceptually
  but as a static, framework-free page (or a tiny prebuilt bundle) so it runs from `file://`.
- **Packaging:** the generator (a skill) zips `index.html` + audio; the **GM uploads the zip to
  Google Drive** and drops the share link on the case hub (a new "Pakiet sesji" hub entry).
- **rpg-recorder change:** a **"concat mix" export step** — a single mono **Opus ~32 kbps**
  concatenated mix per session (small enough to ship in the zip). Playback coordinates use the
  **concat timeline** (`Play` offsets are already concat-stream offsets per
  `overlay.ts` — note the `timeline: 'epoch' | 'concat'` field and the existing "epoch clock ≠
  audio time" caveat; the package must use a concat-timeline overlay or the concat variant).
- **Site stays unchanged.** `/sesje` remains the always-on, no-audio deep-link fallback. The
  package is the opt-in, audio-carrying companion.
- **Open questions for the Iter-2 plan:** whether to reuse the React transcript components in a
  static build vs. a hand-written viewer; exact scene→audio-offset mapping (derive from
  `utterance.play.start` of `uStart`); zip size budget; hosting link placement + whether to
  record the Drive link in a manifest the site reads.

---

## 5. Iteration 3 — Shared whiteboard (SPEC ONLY — do not implement from here)

**Goal:** a shared, editable visual board per investigation for evidence maps / relationship webs.

- **Tech:** **tldraw** — an **approved new dependency, deferred** to this iteration (the one and
  only sanctioned addition beyond the locked stack; still requires the usual explicit go-ahead
  when scheduled). This is the reopening of the "In-browser Excalidraw editor" exclusion, resolved
  in favour of tldraw.
- **Model:** **one board**, with **frames per investigation**. Board scene JSON lives in a **new
  `wiki.boards` table** (`page_key`/board_key, `scene jsonb`, `updated_at`). **Last-write-wins,
  no history** (deliberately simpler than the page-revision model). RLS: **edit for authenticated
  players**, public read.
- **Assets:** an **asset side-panel fed by the gallery manifests** (Iteration 1's
  `public/gallery/<case-key>.json`) — players drag scene images / portraits onto the board.
- **Route:** a `/tablica` (or per-case hub entry). Realtime is optional / deferred (free-tier
  egress), consistent with the pins decision.
- **Open questions for the Iter-3 plan:** tldraw persistence adapter vs. manual save; conflict
  UX under last-write-wins; `wiki.boards` DDL + RLS (coordinate with coc-creator per the shared-
  Supabase guardrail); asset drag source contract with the manifest.

---

## 5a. Sibling deliverable — Presentation Kit (2026-07-15, own spec)

A player self-service **slide editor** distributed as a local package (same
`packages/` + zip + Drive model as Iteration 2), consuming the **gallery manifest** as its
asset source and exporting decks in the **cinematic-slideshow engine format**. Round-trip
back to the GM is the draft JSON (not the exported HTML — trust boundary). Full design:
`docs/superpowers/specs/2026-07-15-presentation-kit-design.md`; plan:
`docs/superpowers/plans/2026-07-15-presentation-kit.md`.

---

## 6. Cross-cutting constraints

- **Stack locked:** React 19 + TS + Vite + Tailwind v4 + Supabase + zustand + react-router v7.
  **No new dependency in Iteration 1.** tldraw is the only pre-approved future addition (Iter 3).
- **Public repo:** no secrets. The feedback script uses the **anon** key (public comments) from
  env, never committed.
- **i18n split:** Polish UI strings + content; English code / comments / docs.
- **Follow existing patterns:** `INLINE_PAGES`/`REDIRECT_PAGES` (NodeView), `AnnotatableArticle`
  + `page_key`, `remarkBlockIds`, `useContentStore`, `scripts/*.ts` (tsx), the
  `cinematic-slideshow` skill's SKILL.md shape.
- **Tests:** Vitest + Testing Library harness exists. Pure logic (manifest parsing, comment
  grouping) gets unit tests; component tests stay light (render + lightbox open/close).
- **Shared Supabase:** Iteration 1 touches **no schema**. Iterations 2–3 that do (Iter 3's
  `wiki.boards`) must follow the coordination guardrail before any DDL.

---

## 7. Interfaces reserved by this design

| Interface | Owner | First producer | First consumer |
|---|---|---|---|
| `public/gallery/<case-key>.json` (gallery manifest) | Iter 1 | `session-digest` skill | `SessionGallery` (Iter 1), presentation-kit builder (§5a), board asset panel (Iter 3) |
| `public/transcripts/scene-index/<slug>.json` (scene index) | Iter 1 | `session-digest` skill | package generator (Iter 2) |
| "Pytania i wątpliwości" paragraph block-ids | Iter 1 | `session-digest` skill | margin-comments (existing), `session-feedback` (Iter 1) |
| grouped-feedback JSON (`fetch-comments.ts` output) | Iter 1 | `fetch-comments.ts` | `session-feedback` skill |
| concat-mix Opus + concat-timeline overlay | Iter 2 | rpg-recorder | package `index.html` |
| `wiki.boards` (scene jsonb, LWW) | Iter 3 | `/tablica` editor | `/tablica` viewer |
| cinematic-slideshow engine format (`TRACKS`/`SLIDES` globals) | pre-existing (skill) | GM decks, presentation-kit exports (§5a) | `/prezentacja/*` iframes, kit preview |
| presentation-kit draft `szkic.json` | §5a | player's `edytor.html` | GM regeneration → publish (trust boundary, §5a spec §4) |
