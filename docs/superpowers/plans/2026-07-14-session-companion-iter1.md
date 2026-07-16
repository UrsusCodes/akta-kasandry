# Session Companion — Iteration 1 Implementation Plan

```yaml
---
date: 2026-07-14
status: active
tags: [plan, area/sessions, area/skills, area/gallery, dep/rpg-recorder]
related: ["docs/superpowers/specs/2026-07-14-session-companion-design.md", "[[TASK_LIST]]"]
---
```

> **For agentic workers:** use `superpowers:subagent-driven-development` or
> `superpowers:executing-plans` to run this plan task-by-task. Pure logic gets tests first
> (`superpowers:test-driven-development`). Steps use `- [ ]` checkboxes.

**Goal (Iteration 1 only):** ship the authoring skills (`session-digest`, `session-feedback` +
`scripts/fetch-comments.ts`), the data-driven **Session Gallery** (component + in-house lightbox +
UG2 manifest, wired inline into the content tree), the UG2 **"Pytania i wątpliwości"** pilot
section, and the UG2 **scene-index** seed. Docs get **Stage M**.

**Design:** `docs/superpowers/specs/2026-07-14-session-companion-design.md` (§3 is Iteration 1).

## Hard constraints (repeat)

- **Stack locked:** React 19 + TS + Vite + Tailwind v4 + Supabase + zustand + react-router v7.
  **NO new dependency.** `zod` and `@supabase/supabase-js` are already dependencies and may be
  used. The lightbox is built in-house on the existing stack.
- **Public repo — no secrets.** `fetch-comments.ts` uses the **anon** key from env
  (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`), loaded via Node 24 `--env-file=.env.local`.
  Comments are publicly readable (`comments_anon_read`). Never commit `.env.local`.
- **Polish** UI strings + content; **English** code / comments / docs.
- **No schema change** in this iteration. **No commit** — hand off for the user to commit.
- Follow existing patterns: `INLINE_PAGES` (`src/routes/NodeView.tsx`), `AnnotatableArticle` +
  `page_key`, `remarkBlockIds` (auto block-ids), `scripts/*.ts` (tsx), `src/lib/supabase.ts`
  select shape (`src/stores/comments.ts`), the `cinematic-slideshow` `SKILL.md` shape.

---

## File map

**New — skills (authoring, not app code)**
- `.claude/skills/session-digest/SKILL.md` (+ `references/house-style.md`, `references/outputs.md`)
- `.claude/skills/session-feedback/SKILL.md`

**New — scripts**
- `scripts/fetch-comments.ts` + `scripts/lib/group-comments.ts` + `scripts/lib/group-comments.test.ts`
- `package.json` — add `"fetch-comments"` script entry

**New — gallery (app)**
- `src/lib/gallery/manifest.ts` (zod schema + `parseGalleryManifest` + `loadGalleryManifest`)
- `src/lib/gallery/manifest.test.ts`
- `src/components/gallery/SessionGallery.tsx`
- `src/components/gallery/Lightbox.tsx`
- `src/components/gallery/SessionGallery.test.tsx` (light)
- `public/gallery/ug2.json`

**New — data**
- `public/transcripts/scene-index/ug2.json`

**Modified**
- `src/routes/NodeView.tsx` — register the Galeria inline page
- `src/generated/content.ts` — add the `05-galeria` node under `sprawy/02-urodzaj-grozy`
- `src/routes/UG2Summary.tsx` — append the "Pytania i wątpliwości" pilot section
- `docs/AktaKasandry_obsidian/TASK_LIST.md` — add Stage M
- `docs/AktaKasandry_obsidian/DOCS_CHANGES_JOURNAL.md`, `work/Index.md` — session-end

**GM/vault action (documented, not code)**
- `PUBLIC/SPRAWY/02 URODZAJ GROZY/05 Galeria.md` — thin stub (GM adds to vault; `build-content`
  must regenerate the same `05-galeria` node this plan hand-adds).

---

## Task list & dependency graph

| ID | Title | Depends on | Batch |
|---|---|---|---|
| **M1** | Gallery manifest schema + loader (+ tests) | — | A |
| **M2** | `fetch-comments.ts` + grouping helper (+ test) | — | A |
| **M3** | Skill `session-digest` | — | A |
| **M4** | Skill `session-feedback` | (references M2 output; can run parallel) | A |
| **M8** | UG2 "Pytania i wątpliwości" pilot content | — | A |
| **M9** | UG2 scene-index seed JSON | (schema in spec §3.1) | A |
| **M5** | `public/gallery/ug2.json` manifest | M1 | B |
| **M6** | `SessionGallery` + `Lightbox` components (+ test) | M1 | B |
| **M7** | Wire Galeria into tree (NodeView + content.ts + vault stub) | M5, M6 | C |
| **M10** | Docs — Stage M + journal + work note | all | D |

**Suggested parallel batches**
- **Batch A (6 agents in parallel):** M1, M2, M3, M4, M8, M9 — no shared files.
- **Batch B (2 in parallel, after M1):** M5, M6.
- **Batch C (1, after M5+M6):** M7.
- **Batch D (1, last):** M10.

> File-collision note: M8 and M7 both leave `src/routes/*` untouched by each other (M8 edits
> `UG2Summary.tsx`, M7 edits `NodeView.tsx` + `content.ts`) — safe in parallel across batches.

---

## Batch A

### M1 — Gallery manifest schema + loader (+ tests) · independent

**Files:** create `src/lib/gallery/manifest.ts`, `src/lib/gallery/manifest.test.ts`.

**What goes in `manifest.ts`:** a `zod` schema (zod is already a dependency) and the inferred
type, plus a pure parser and a runtime loader.

```ts
import { z } from 'zod'
import { withBase } from '@/lib/withBase'

export const GalleryImageSchema = z.object({
  src: z.string().min(1),
  caption: z.string().optional(),
  alt: z.string().optional(),
})
export const GalleryPortraitSchema = z.object({
  src: z.string().min(1),
  character: z.string().min(1),
  player: z.string().optional(),
})
export const GalleryTrackSchema = z.object({ src: z.string().min(1), title: z.string().min(1) })
export const GalleryLinkSchema = z.object({ label: z.string().min(1), to: z.string().min(1) })

export const GalleryManifestSchema = z.object({
  caseKey: z.string().min(1),
  title: z.string().min(1),
  scenes: z.array(GalleryImageSchema).default([]),
  cast: z.array(GalleryPortraitSchema).default([]),
  tracks: z.array(GalleryTrackSchema).default([]),
  links: z.array(GalleryLinkSchema).default([]),
})
export type GalleryManifest = z.infer<typeof GalleryManifestSchema>

/** Pure: validate unknown JSON → typed manifest (throws ZodError on malformed). */
export function parseGalleryManifest(raw: unknown): GalleryManifest {
  return GalleryManifestSchema.parse(raw)
}

/** Runtime loader: fetch public/gallery/<caseKey>.json (http site → fetch OK), validate. */
export async function loadGalleryManifest(caseKey: string): Promise<GalleryManifest> {
  const res = await fetch(withBase(`/gallery/${caseKey}.json`)!)
  if (!res.ok) throw new Error(`gallery manifest ${caseKey}: HTTP ${res.status}`)
  return parseGalleryManifest(await res.json())
}
```

**Acceptance criteria**
- `parseGalleryManifest` returns a typed object for a valid manifest; missing `caseKey`/`title`
  throws; absent `scenes`/`cast`/`tracks`/`links` default to `[]`.
- `loadGalleryManifest` uses `withBase` so it resolves under `/akta-kasandry/` in prod.
- `tsc -b` clean.

**Tests (`manifest.test.ts`, Vitest):**
- valid full manifest parses and preserves all arrays;
- minimal `{caseKey, title}` parses with empty arrays;
- missing `title` throws;
- a scene missing `src` throws.

---

### M2 — `fetch-comments.ts` + grouping helper (+ test) · independent

**Files:** create `scripts/fetch-comments.ts`, `scripts/lib/group-comments.ts`,
`scripts/lib/group-comments.test.ts`; modify `package.json`.

**`scripts/lib/group-comments.ts` (pure, tested):** given a flat array of comment rows
(normalized shape below), group into `{ blockId, quote, threads: [{ root, replies[] }] }[]`,
sorted by first-seen order; replies nest under their `parentId`.

```ts
export type RawComment = {
  id: string; pageKey: string; blockId: string; quote: string
  authorName: string; speakerName: string | null
  body: string; parentId: string | null; createdAt: string; edited: boolean
}
export type FeedbackThread = { root: RawComment; replies: RawComment[] }
export type FeedbackGroup = { blockId: string; quote: string; threads: FeedbackThread[] }
export function groupComments(rows: RawComment[]): FeedbackGroup[] { /* … */ }
```

**`scripts/fetch-comments.ts`** — mirror `scripts/push-vault.ts` header/style:
- top-of-file usage comment: `npx tsx --env-file=.env.local scripts/fetch-comments.ts <page_key>`;
- read `process.env.VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`; if missing, print a clear
  message and `process.exit(1)` (do **not** hardcode anything);
- create a supabase-js client (`db: { schema: 'wiki' }`, no session) and select from `comments`
  with the **same join** as `src/stores/comments.ts` `SELECT` (author `display_name`, speaker
  `name`), `.eq('page_key', pageKey)`, ordered by `created_at`;
- map rows → `RawComment` (pull `anchor.blockId` + `anchor.quote` out of the jsonb `anchor`);
- `groupComments(...)` → write pretty JSON to `scratch/feedback-<page_key-slug>.json` **and**
  echo a human summary (group count, thread count) to stdout;
- **read-only** — never writes to Supabase.

**`package.json`:** add `"fetch-comments": "tsx scripts/fetch-comments.ts"` (the user passes
`--env-file` + page_key; document both forms in the usage comment).

**Acceptance criteria**
- Running with a real `page_key` (e.g. `streszczenie/ug2`) against live Supabase prints a group
  summary and writes the JSON; running without creds exits 1 with a helpful message.
- Uses **anon** key only; no secret in the file; `.env.local` untouched/uncommitted.
- `groupComments` is pure and imported by the script (no DB logic in the helper).

**Tests (`group-comments.test.ts`):**
- two comments on the same `blockId` → one group, two root threads (or thread+reply per
  `parentId`);
- a reply (`parentId` set) nests under its root, not as a new thread;
- comments on different `blockId` → separate groups, preserving first-seen order;
- empty input → `[]`.

---

### M3 — Skill `session-digest` · independent

**Files:** create `.claude/skills/session-digest/SKILL.md`,
`.claude/skills/session-digest/references/house-style.md`,
`.claude/skills/session-digest/references/outputs.md`.

**`SKILL.md`** (frontmatter shape mirrors `~/.claude/skills/cinematic-slideshow/SKILL.md`):
- `name: session-digest`; `description:` trigger — *use when turning a session's transcript
  overlay + GM off-mic notes into a player-facing summary draft, a "Pytania i wątpliwości"
  section, a scene-index, and a gallery manifest for Akta Kasandry.*
- **Inputs:** path to `public/transcripts/data/<slug>-<variant>-overlay.json` + GM off-mic notes.
- **Workflow:** (1) read the overlay via the `src/lib/transcripts/overlay.ts` contract (do not
  invent fields; single-channel read for chronology; histogram by `play.start`, per the
  off-tape-gap caveats); (2) draft the summary in house style (see `references/house-style.md`);
  (3) generate "Pytania i wątpliwości" — each question **its own paragraph**; (4) emit the
  scene-index + gallery manifest (see `references/outputs.md`).
- **Outputs & where they go** — restate exactly:
  - summary draft → appended to the case's `*Summary.tsx` `SUMMARY` string (GM reviews before
    deploy);
  - "Pytania i wątpliwości" → final section of that same summary; **append-only** once players
    comment (editing a question's text changes its `data-block-id` hash and orphans comments) —
    this is a hard rule the skill must state;
  - scene-index → `public/transcripts/scene-index/<slug>.json`, shape
    `{ scenes: [{ id, title, uStart, uEnd, tApprox }] }`;
  - gallery manifest → `public/gallery/<case-key>.json` (schema = M1's `GalleryManifestSchema`).

**`references/house-style.md`:** distilled from `src/routes/UG2Summary.tsx` +
`UG2Narracja.tsx` — 3-act structure, `{sesja:<slug>#<id>}` deep-link syntax (rendered by
`remarkTranscriptAnchors`), right-aligned `<img width="200" align="right">` portrait pattern,
full-width scene image + italic caption, "Podsumowanie rezultatów", "Śmieszne i epickie momenty"
quote reel, Polish throughout, seamless off-mic fills (no ⚠ flags, per the Stage K decision).

**`references/outputs.md`:** the exact JSON shapes for scene-index and gallery manifest, with a
worked UG2 example, and the block-id stability contract.

**Acceptance criteria**
- SKILL.md is self-contained, references real repo paths/exports, and a fresh agent could produce
  all four outputs from an overlay + notes without reading app source.
- No app code changes; skill is guidance + templates only.

---

### M4 — Skill `session-feedback` · independent (references M2 output)

**Files:** create `.claude/skills/session-feedback/SKILL.md`.

- `description:` trigger — *use after players have commented on a summary page, to fold their
  reactions/answers back into the summary as a reviewable diff (no auto-apply).*
- **Workflow:** (1) run `scripts/fetch-comments.ts` for the page's `page_key` (document the
  `npx tsx --env-file=.env.local scripts/fetch-comments.ts <page_key>` invocation) to get the
  grouped-feedback JSON; (2) load the current summary `.tsx` source; (3) propose edits as a
  **unified diff** against the `SUMMARY` string — separate IC flavour from OOC corrections;
  respect the **append-only** rule for "Pytania i wątpliwości" block text; never invent player
  statements; (4) present the diff for GM review — **no auto-apply, no commit**.
- **Rules section:** the block-id append-only contract, the anon-read/no-secret note, and that
  the skill only edits the summary the GM approves.

**Acceptance criteria**
- SKILL.md references `scripts/fetch-comments.ts` and its output shape (M2), the target
  `*Summary.tsx`, and the block-id contract; explicitly forbids auto-apply.

---

### M8 — UG2 "Pytania i wątpliwości" pilot content · independent

**Files:** modify `src/routes/UG2Summary.tsx` (append to the `SUMMARY` template string, before
the closing `` ` `` and the trailing "Wersja robocza" blockquote — place the new section as the
final content section).

**What goes in:** a Polish `## Pytania i wątpliwości` heading, a short intro blockquote explaining
that each question is individually commentable (players click a question to answer), then **4–6
questions, each as its own standalone paragraph** (blank line between — so `remarkBlockIds`
assigns each its own `data-block-id`). Draw questions from genuine session ambiguities
(e.g. Brock's return real vs. guilt; whether Sprouston is followed up; Mortimer's fate; the
purytan sect / Cayda thread; the Klub Kasandry recruitment). Do **not** use a markdown list —
list items share a tighter block model; standalone paragraphs match the anchor model and read as
discrete prompts.

**Acceptance criteria**
- Section renders on `/streszczenie-ug2` (and its in-tree path) below "Śmieszne i epickie
  momenty"; each question paragraph is selectable and gets a distinct `data-block-id` (verify:
  more `[data-block-id]` blocks after the change; each question independently commentable).
- Marked **GM-review-pending** in the journal (M10): the GM approves wording before the next
  deploy; thereafter question text is append-only.
- `tsc -b` clean; existing UG2 tests unaffected.

---

### M9 — UG2 scene-index seed JSON · independent

**Files:** create `public/transcripts/scene-index/ug2.json`.

**What goes in:** the scene-index shape from spec §3.1 / M3's `references/outputs.md`:
`{ "slug": "ug2", "scenes": [ { "id": "...", "title": "...", "uStart": "<utterance-id>",
"uEnd": "<utterance-id>", "tApprox": "<mm:ss>" }, … ] }`. Seed ~10–14 scenes matching the UG2
summary's act structure; pull real utterance-id endpoints from
`public/transcripts/data/ug2-current-overlay.json` (the ids already used as `{sesja:ug2#…}`
anchors in `UG2Summary.tsx` are valid boundary picks — e.g. `5835c7a73370` McBride, `6a4de39928af`
Brock, `66f8c76d776b` Blackwater Creek, `3b313bfb1e3f` Stary Pete, `2a8b3928b40e` bitwa na farmie,
`c3a7c3ed39af` wybuch w jaskini, `a37238c0d8c5` Klub Kasandry epilog). `tApprox` from the
utterance's `play.start` (concat offset).

**Acceptance criteria**
- Valid JSON; every `uStart`/`uEnd` exists in `ug2-current-overlay.json`; scenes in chronological
  order; titles in Polish. This file is **consumed by Iteration 2** (not rendered in Iter 1) — no
  app wiring needed now, but it must validate as clean JSON.

---

## Batch B (after M1)

### M5 — `public/gallery/ug2.json` manifest · depends on M1

**Files:** create `public/gallery/ug2.json` conforming to `GalleryManifestSchema`.

**What goes in:**
- `caseKey: "ug2"`, `title: "Urodzaj Grozy — galeria"`.
- `scenes`: the scene illustrations under `public/img/ug2/*.jpg` (the ~21 woven into the summary
  as the core set: `speakeasy`, `mcbride`, `brock`, `town`, `sprouston`, `carmody`,
  `farm_carmody`, `boar`, `farm_jarvey`, `pete`, `dig`, `jar`, `brendan`, `james_death`, `roades`,
  `camp_roades`, `cave_entrance`, `cave_interior`, `mother`, `explosion`, `dam`, `brock_window`),
  each `src: "/img/ug2/<file>.jpg"` with a **Polish caption** drawn from the summary.
- `cast`: the 10 portraits under `public/img/ug2/cast/*.jpg` (`mort`→Mortimer/Jakub,
  `james`→James Kelly/Nika, `joseph`→Joseph Kelly/Rafał, `fritz`→Fritz/Kamil,
  `mcmiller`→McMiller/Piotr, `corwin`→Dr Arthur Henry Corwin/Jakub, `eleine`→Dr Elaine Howard/Nika,
  `west`→Dr Herbert West/Rafał, `wallace`→Wallace Harvey/Kamil, `cavendish`→Dr Cecil Cavendish/Piotr)
  — `character` + `player` per §Obsada in `UG2Summary.tsx`.
- `tracks`: the 5 mp3s under `public/audio/ug2/*.mp3` (`crossfire`, `docks`, `moss`, `orchard`,
  `root`) with Polish/short titles.
- `links`: Streszczenie `/p/sprawy/02-urodzaj-grozy/01-streszczenie`, Narracja
  `/p/sprawy/02-urodzaj-grozy/02-narracja`, Prezentacja `/p/sprawy/02-urodzaj-grozy/03-prezentacja`,
  Transkrypt `/sesje/ug2`.

**Acceptance criteria**
- `parseGalleryManifest(require('./ug2.json'))` (or the loader in-app) validates with no error.
- Every `src` points at a file that exists under `public/`.

---

### M6 — `SessionGallery` + `Lightbox` components (+ light test) · depends on M1

**Files:** create `src/components/gallery/SessionGallery.tsx`, `Lightbox.tsx`,
`SessionGallery.test.tsx`.

**`SessionGallery.tsx`:** a component taking `{ caseKey: string }` (default UG2 wiring passes
`"ug2"`). On mount, `loadGalleryManifest(caseKey)` into local state with loading/error handling
(mirror the transcript store's load pattern; no zustand store needed — a `useEffect` + `useState`
is enough for a static manifest). Render, using Cthulhu tokens (`teal-dark`, `gold`, `gold-muted`,
`parchment`, `ink`, `font-display`, `font-body` — see `DESIGN_SYSTEM.md`):
- header (title + a row of `links` as internal `<Link>`s / route buttons);
- **Sceny** — responsive CSS grid (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4`) of scene
  thumbnails (`withBase(src)`), click opens the lightbox at that index;
- **Obsada** — portrait grid (reuse the framing from `NodeView`'s `CharacterHub`: aspect-square,
  gold border, name + player caption);
- **Muzyka** — a simple list of track titles (label + optional inline `<audio controls>` is
  **out of scope** for the site's no-audio rule; list titles and link to `/prezentacja/ug2` for
  playback). List tracks as text with a note that audio plays in the presentation.

**`Lightbox.tsx`:** in-house, no dependency. Props `{ images: GalleryImage[]; index: number|null;
onClose; onIndex }`. Fixed full-viewport overlay (`fixed inset-0 z-50 bg-ink/90`), centered image
(`max-w`/`max-h`, `object-contain`), caption below, prev/next zones + `‹ ›` buttons, close `✕`.
Keyboard: `Esc` closes, `←/→` navigate (add/remove a `keydown` listener while open). Trap focus
lightly; restore scroll. Renders nothing when `index === null`.

**Acceptance criteria**
- Gallery renders scenes/cast/tracks/links from the manifest; images carry the base prefix.
- Clicking a scene opens the lightbox on that image; `Esc`/`✕` closes; `←/→` and the arrow
  buttons change image; wraps or clamps at ends (pick clamp).
- Desktop grid + mobile single/double column; no horizontal page scroll.
- `tsc -b` clean.

**Tests (`SessionGallery.test.tsx`, light):**
- given a mocked `loadGalleryManifest` (or a fetch mock) returning a 2-scene manifest, renders 2
  scene thumbnails; clicking the first opens the lightbox (asserts the lightbox image `src`);
  pressing `Escape` closes it. Keep it to render + open/close; no exhaustive interaction.

---

## Batch C (after M5, M6)

### M7 — Wire Galeria into the content tree · depends on M5, M6

**Files:** modify `src/routes/NodeView.tsx`, `src/generated/content.ts`; document the vault stub.

**`NodeView.tsx`:** add to `INLINE_PAGES`:
```ts
'sprawy/02-urodzaj-grozy/05-galeria': () => <SessionGallery caseKey="ug2" />,
```
(import `SessionGallery`; if `INLINE_PAGES` is typed `Record<string, ComponentType>`, wrap in a
tiny local component `UG2Gallery = () => <SessionGallery caseKey="ug2" />` and register that, to
keep the map value a zero-prop component — matching the existing entries).

**`src/generated/content.ts`:** add a node in the `sprawy/02-urodzaj-grozy` `children` array,
after `04-transkrypt`, mirroring the existing stub shape:
```json
{ "name": "05 Galeria", "slug": "05-galeria",
  "path": "sprawy/02-urodzaj-grozy/05-galeria", "kind": "page",
  "body": "[Otwórz galerię](/p/sprawy/02-urodzaj-grozy/05-galeria)\n" }
```
(This is the committed generated tree; the node makes the sub-page appear in `TreeNav` and routes
through `NodeView`.)

**Vault stub (GM/documented):** note in M10 that the GM should add
`PUBLIC/SPRAWY/02 URODZAJ GROZY/05 Galeria.md` (thin stub) so a future `npm run build-content`
regenerates the identical `05-galeria` node instead of dropping the hand-added one.

**Acceptance criteria**
- `/p/sprawy/02-urodzaj-grozy/05-galeria` renders `SessionGallery` inline (URL stays in the case),
  "05 Galeria" appears in the sidebar tree under Urodzaj Grozy.
- The mobile back button (existing `BackButton`) still shows; no regressions to other UG2
  sub-pages.
- `tsc -b` clean; `npm run test:run` green.

---

## Batch D (last)

### M10 — Docs: Stage M + journal + work note · depends on all

**Files:** modify `docs/AktaKasandry_obsidian/TASK_LIST.md` (add **Stage M — Session companion**
with the Iteration-1 items checked as delivered, Iteration 2/3 listed as designed-not-built,
`#stage/m` `#dep/rpg-recorder`), `DOCS_CHANGES_JOURNAL.md` (new dated entry — files touched,
the "no new dep" confirmation, the GM-review-pending flag on UG2 "Pytania", the append-only
block-id contract, the anon-key/no-secret note for `fetch-comments.ts`), `work/Index.md` (a
"Decisions made" line linking the spec + this plan).

**Acceptance criteria**
- Stage M reflects reality: skills + gallery + pilot + scene-index shipped; Iter 2/3 spec-only.
- Journal entry lists every touched file and the key decisions; work/Index links both docs.

---

## Verification (whole iteration)

- `npx tsc -b` clean.
- `npm run test:run` green (new: `manifest.test.ts`, `group-comments.test.ts`,
  `SessionGallery.test.tsx`; existing 43 still pass).
- `npm run dev` → visit `/streszczenie-ug2` (new "Pytania i wątpliwości" section, each question
  commentable) and `/p/sprawy/02-urodzaj-grozy/05-galeria` (gallery grid + lightbox open/close).
- `parseGalleryManifest(public/gallery/ug2.json)` validates; `public/transcripts/scene-index/ug2.json`
  is valid JSON with real utterance ids.
- `npx tsx --env-file=.env.local scripts/fetch-comments.ts streszczenie/ug2` prints a group
  summary + writes the JSON (with live creds), exits 1 with a clear message without creds.
- **No commit** — hand the working tree to the user.
```
