# Session Companion — Iteration 2 Implementation Plan (session package generator)

```yaml
---
date: 2026-07-15
status: active
tags: [plan, area/sessions, area/packages, dep/rpg-recorder]
related: ["docs/superpowers/specs/2026-07-14-session-companion-design.md", "docs/superpowers/plans/2026-07-14-session-companion-iter1.md", "[[TASK_LIST]]"]
---
```

> **For agentic workers:** use `superpowers:subagent-driven-development` or
> `superpowers:executing-plans` to run this plan task-by-task. Pure logic gets tests first
> (`superpowers:test-driven-development`). Steps use `- [ ]` checkboxes.

**Goal (Iteration 2):** a downloadable, self-contained **per-session package** — one
`index.html` (transcript inlined as a `<script>` payload, framework-free vanilla viewer) + a
sibling concat-mix Opus audio file — built by `scripts/build-package.ts`, zipped, uploaded by the
GM to Google Drive, linked from the case hub. Clicking a scene in the sidebar **scrolls the
transcript AND seeks the audio**. The site's `/sesje` viewer stays unchanged as the always-on,
no-audio deep-link fallback.

**Design:** `docs/superpowers/specs/2026-07-14-session-companion-design.md` §4
(amended 2026-07-15: the inlined transcript is a **trimmed winner-only projection**, not the full
provenance overlay).

## Hard constraints (repeat)

- **Stack locked; NO new dependency.** The viewer is hand-written vanilla HTML/CSS/JS (no React
  build, no Tailwind build — inline CSS). The generator is a `tsx` script like the existing
  `scripts/*.ts`. Zipping uses PowerShell `Compress-Archive` (documented command, printed by the
  generator) — **no Node zip library**.
- **Public repo — no secrets**; the package pipeline touches no Supabase at all.
- **Polish** viewer UI strings; **English** code / comments / docs.
- **Producer boundary respected:** the concat-mix audio is an **rpg-recorder output**. This repo
  only documents the exact ffmpeg command and consumes the resulting file via `--audio <path>`.
  No audio is ever committed to this repo (`packages/` is gitignored).
- **No commit** — hand the working tree to the user.
- **`file://` rules:** no `fetch()`, no external requests (no CDN, no webfonts — system font
  stacks only); audio via **relative** `<audio src="audio/<slug>-mix.opus">`.

---

## Verified facts this plan builds on (do not re-derive)

Checked 2026-07-14 against real data — implementers can rely on these:

1. **UG2's deployed overlay is already `timeline: "concat"`** —
   `public/transcripts/data/ug2-current-overlay.json`, 4693 utterances, `duration: 9514.406 s`
   (~2 h 39 m). The scene-index ids (M9) are ids from **this** variant.
2. **Seek field, pinned:** `utterance.play.start` = seconds into that utterance's winner-channel
   **concatenated** Opus stream (`play.audio_file`), per rpg-recorder's
   `outputs/transcript-viz/data/SCHEMA.md` ("Playback coordinates are ALWAYS the concat-stream
   coordinates carried in the `play` blocks"). All 4693 UG2 utterances have non-null
   `play.start`; max `|play.start − start|` = 2.33 s.
3. **A mono mixdown preserves those offsets.** All 6 UG2 channel streams are time-aligned
   concat streams of near-identical length (9514.406 / 9514.307 s — max drift 0.1 s), so one
   mixed file can be seeked with any utterance's `play.start` regardless of winner channel
   (±0.1 s worst case, inaudible for verification purposes).
4. **UG2 per-channel audio exists** at
   `C:\Users\Pawel\rpg-recorder\outputs\transcript-viz\audio\ug2\ch00.opus … ch05.opus`
   (~36 MB each, 16 kbps mono). **No mixed file exists yet** — the dry-run task produces it
   (ffmpeg is on PATH on this machine; verified `N-119595`).
5. **Payload size:** trimmed winner-only projection of UG2 = **~420 KB** of JSON (vs 4.3 MB raw
   overlay with chunks). Inline the projection, never the raw overlay.
6. **Speaker colors** come from `overlay.speakers[].color` (e.g. Jakub M `#4a9eff`, Paweł MG
   `#ff922b`) — "distinct, legible hex; safe to use directly" per the overlay contract.
7. **Reusable pure helpers:** `src/lib/transcripts/format.ts` (`fmtTime`, `tint`, `chipText`)
   has no Vite/DOM dependency — importable from `scripts/` under tsx (same pattern as
   `push-vault.ts` importing `src/lib/wikilinks.ts`).
8. **`variants.json` shape** (site copy at `public/transcripts/data/variants.json`):
   `sessions[slug] = { label, session_id, default_variant, variants: [{ id, file, … }] }` —
   resolve slug → default variant → overlay filename through it.
9. **Estimated deliverable size:** 9514 s × 32 kbps ≈ **38 MB** mix + ~0.6 MB `index.html` →
   **~39 MB zip** (Opus doesn't recompress). Comfortable for Google Drive.

---

## Key decisions (resolving the spec's open questions)

| Question | Decision | Why |
|---|---|---|
| Viewer tech | **Standalone vanilla HTML/CSS/JS template**, generated from `scripts/package-template/template.html` | The read-only row UI is trivial (time + speaker chip + text — see `TranscriptRow.tsx`); everything React adds there (store, hover-provenance, editor, corrections) is out of scope for the package. Packaging the React app would need a second Vite build target + audio plumbing for marginal reuse. The proven perf trick (`content-visibility: auto` on rows — comment in `TranscriptList.tsx`) is plain CSS and framework-independent. rpg-recorder's own `outputs/transcript-viz/index.html` + `scripts/inline_viz_data.py` is prior art for the inline-`<script>`-globals pattern. |
| Inlined data | **Trimmed projection** `window.__PKG__` (contract below), not the raw overlay | 0.4 MB vs 4.3 MB; provenance/chunks belong to `/sesje`, not the package. Spec amended accordingly. |
| Generator | `scripts/build-package.ts` (tsx), output to gitignored `packages/<slug>/` | Mirrors existing scripts; no build-system change. |
| Zip | **PowerShell `Compress-Archive`**, printed as a copy-paste command by the generator (not executed by it) | Node has no built-in zip; a dependency needs approval we're avoiding; the GM is on Windows 11. Keeping it manual also gives the GM a natural "inspect before shipping" checkpoint. |
| Audio input | `--audio <path>` optional CLI arg; file is **copied** to `packages/<slug>/audio/<slug>-mix.opus`. Without it the package still builds — player hidden, seeks disabled, note shown | Producer boundary: the mix is made in rpg-recorder; the builder just consumes a file path. Graceful degradation per coordinator requirement. |
| Concat mix | Documented **ffmpeg one-liner** to run in rpg-recorder (runbook task T4); for UG2 the dry-run runs it against the existing `ch00–ch05.opus` | Channels verified time-aligned (fact 3), so `amix` of all channels preserves `play.start`. Adding a script to rpg-recorder's pipeline is their follow-up; the interface is just "one Opus file per session". |
| Utterance→time | `seekSec = u.play?.start ?? (overlay.timeline === 'concat' ? u.start : null)` — computed **at build time** into the payload | Pins the SCHEMA rule; the viewer never touches overlay semantics. Fallback only valid on concat timelines (on epoch the transcript clock diverges by hundreds of seconds — SCHEMA). |
| Scene → audio | Scene seek target = its `uStart` utterance's `seekSec`; scene scroll target = its `uStart` row | Scene-index ids were verified against this exact overlay in iter 1 (M9 review). |
| Hub link | **Manual paste by the GM**: one bullet in vault `00 HUB.md` **and** its mirror in `src/generated/content.ts` (both places — lesson from the iter-1 review); the generator prints the exact ready-to-paste line with a `<WKLEJ-LINK-DRIVE>` placeholder | Simplest thing that works; no new tree node needed for an external link; keeps the site fully static. |
| Search in viewer | **Optional stretch task (T7)** — simple substring filter | Core verification loop is scenes + audio + Ctrl+F; a filter box interacts with `content-visibility` and shouldn't block the release. |
| Safari | Documented caveat (runbook): Ogg-Opus `<audio>` plays in Chrome/Edge/Firefox; macOS Safari may refuse | Players are on Windows/desktop browsers; not worth an mp3 double-encode now. |

---

## The payload contract (`window.__PKG__`)

Fixed here so T1 (builder) and T2 (template) can be built **in parallel**:

```ts
type PkgSpeaker = { id: string; name: string; color: string }
type PkgUtterance = {
  id: string          // utterance id (same ids as {sesja:<slug>#<id>} anchors)
  sec: number | null  // seek seconds into the mix (see decision above); null = not seekable
  spk: string         // speaker id → PkgSpeaker
  text: string
  neutral: 0 | 1      // 1 when !assigned → render grey/neutral like the site viewer
}
type PkgScene = {
  id: string; title: string        // from scene-index
  startIdx: number; endIdx: number // resolved utterance array indexes (build-time)
  seekSec: number | null           // uStart utterance's sec
  tApprox: string                  // display string, passed through
}
type PkgPayload = {
  meta: {
    slug: string; sessionName: string; variantId: string
    builtAt: string                // ISO date
    duration: number               // overlay.duration (seconds)
    audioSrc: string | null        // 'audio/<slug>-mix.opus' or null (no-audio build)
  }
  speakers: PkgSpeaker[]
  scenes: PkgScene[]
  utterances: PkgUtterance[]
}
```

Injection: the generator replaces the template token `/*__PKG_JSON__*/null` inside
`<script>window.__PKG__ = /*__PKG_JSON__*/null</script>` with the serialized payload, and
`__PKG_TITLE__` in `<title>`/header. Serialization MUST escape `<` as `<`
(prevents `</script>`/`<!--` breakage inside inline scripts).

---

## File map

**New**
- `scripts/lib/package-data.ts` — pure payload builder + `inlineJson()` (T1)
- `scripts/lib/package-data.test.ts` (T1)
- `scripts/package-template/template.html` — the vanilla viewer (T2)
- `scripts/build-package.ts` — CLI generator (T3)
- `docs/RUNBOOKS/session-package.md` — GM runbook: mix → build → zip → Drive → hub link (T4)

**Modified**
- `package.json` — `"build-package": "tsx scripts/build-package.ts"` (T3)
- `.gitignore` — `packages/` (T3)
- `docs/AktaKasandry_obsidian/TASK_LIST.md`, `DOCS_CHANGES_JOURNAL.md`,
  `work/2026-07-14-session-companion.md` (append iter-2 section), `memories/project.md` if
  warranted (T6)

**Generated (gitignored, dry-run T5)**
- `packages/ug2/index.html`, `packages/ug2/audio/ug2-mix.opus`, `packages/ug2.zip`
- `C:\Users\Pawel\rpg-recorder\outputs\transcript-viz\audio\ug2\ug2-mix.opus` (produced there —
  producer's tree, not this repo)

---

## Task list & dependency graph

| ID | Title | Depends on | Batch |
|---|---|---|---|
| **T1** | `package-data.ts` payload builder (+ tests) | — | A |
| **T2** | Vanilla viewer `template.html` | — (contract above) | A |
| **T4** | GM runbook `session-package.md` | — (CLI contract below) | A |
| **T3** | `build-package.ts` CLI + gitignore + npm script | T1, T2 | B |
| **T5** | UG2 end-to-end dry run (mix + build + `file://` verify + zip) | T3 (T4 as checklist) | C |
| **T7** | *(optional)* transcript text filter in the viewer | T5 | D |
| **T6** | Docs: TASK_LIST / journal / work note | all shipped tasks | D |

**Parallel batches:** **A** = {T1, T2, T4} (no shared files; contracts pinned in this plan) →
**B** = {T3} → **C** = {T5} → **D** = {T6, and T7 only if time permits}.

---

## Batch A

### T1 — `scripts/lib/package-data.ts` payload builder (+ tests) · independent

**Files:** create `scripts/lib/package-data.ts`, `scripts/lib/package-data.test.ts`.

**What goes in `package-data.ts`** (pure, no I/O — mirrors `group-comments.ts` style):

```ts
import type { Overlay } from '../../src/lib/transcripts/overlay'

export type SceneIndexEntry = { id: string; title: string; uStart: string; uEnd: string; tApprox: string }
export type SceneIndexFile = { slug: string; scenes: SceneIndexEntry[] }
// + the Pkg* types from the plan's payload contract (export them)

/** Seek seconds for one utterance — the pinned rule. */
export function seekSecondsFor(u: Utterance, timeline: Overlay['timeline']): number | null

/** Overlay + scene index + audio flag → full PkgPayload. Throws Error (with the
 *  offending id in the message) if a scene's uStart/uEnd is missing from the overlay. */
export function buildPackagePayload(
  overlay: Overlay,
  sceneIndex: SceneIndexFile,
  opts: { variantId: string; audioSrc: string | null; builtAt?: string },
): PkgPayload

/** JSON.stringify with `<` escaped to < — safe inside an inline <script>. */
export function inlineJson(value: unknown): string
```

Implementation notes:
- `startIdx`/`endIdx` via a `Map<id, index>` over `overlay.utterances` (they're pre-sorted).
- Validate `startIdx <= endIdx`; a single-utterance scene (`uStart === uEnd`, exists in the UG2
  seed: `noc-strzelanina`) is legal.
- `PkgUtterance.neutral = u.assigned ? 0 : 1`; `spk = u.speaker_id`; speakers passed through
  from `overlay.speakers` (id/name/color only).
- Do **not** copy `chunks`, `methods`, `channels`, or `build_meta` into the payload.

**Acceptance criteria**
- Pure module; imports only types + nothing with `import.meta`.
- Throws a descriptive error naming the scene id and utterance id when a scene id is absent.
- `inlineJson('</script>')` contains no literal `<`.
- `tsc -b` clean (note: `scripts/` is type-checked via `tsconfig.node.json` like the other
  scripts — follow whatever include pattern `scripts/lib/group-comments.ts` already satisfies).

**Tests (`package-data.test.ts`, Vitest)** — build a ~6-utterance fake overlay fixture:
- `seekSecondsFor`: prefers `play.start`; falls back to `start` only when
  `timeline === 'concat'`; returns null on epoch timeline with null `play.start`.
- `buildPackagePayload`: correct `startIdx`/`endIdx` resolution; single-utterance scene OK;
  missing `uStart` id throws with the id in the message; `audioSrc` passed through; utterances
  trimmed (no `chunks` key on the result — assert via `Object.keys`).
- `inlineJson`: escapes `<` (assert `<` present, `</script>` absent).

---

### T2 — vanilla viewer `scripts/package-template/template.html` · independent

**Files:** create `scripts/package-template/template.html` — one file containing all markup,
CSS (`<style>`), and JS (`<script>`); tokens `__PKG_TITLE__` and `/*__PKG_JSON__*/null`.

**Layout** (desktop-first, must degrade readably at ~900 px by collapsing the sidebar to a
`<details>` block or top strip — keep it simple):

```
┌──────────────────────────────────────────────────────┐
│ topbar: title · session meta · <audio controls>      │  position: sticky
├───────────────┬──────────────────────────────────────┤
│ scene sidebar │ transcript rows (scrollable)         │
│ (fixed col)   │                                      │
└───────────────┴──────────────────────────────────────┘
```

**Behaviors (all vanilla JS, ~150–250 lines):**
- Read `window.__PKG__`; render rows with a single loop building an HTML string (or
  `DocumentFragment`) — 4.7 k rows is fine as one shot when each row has
  `content-visibility: auto; contain-intrinsic-size: auto 2.4em` (the exact trick the site
  viewer relies on — see the comment in `src/components/transcripts/TranscriptList.tsx`).
- Row = `[mm:ss] [speaker chip] text`, left border + subtle background in the speaker's color;
  neutral rows grey (mirror `TranscriptRow.tsx` visuals). Port `fmtTime`/`tint`/`chipText`
  logic **into the template's JS** (they're ~30 lines total; duplicating beats building a JS
  bundling step — note the provenance in a comment).
- **Scene sidebar**: one entry per `scenes[]` (`tApprox · title`). Click →
  `rows[startIdx].scrollIntoView({block:'start'})` + if audio present and `seekSec != null`,
  `audio.currentTime = seekSec` (do **not** auto-play — set the position, let the GM/player
  press play; add a small "▶ od sceny" affordance if trivial).
- **Row click** → seek audio to that row's `sec` (no auto-play). Rows with `sec == null` are
  not clickable for seeking.
- **Follow mode**: on `audio.timeupdate` (throttled ≥ 500 ms), binary-search `utterances[].sec`
  for the current time → highlight the active row (CSS class) and the active scene in the
  sidebar; a checkbox `Podążaj za dźwiękiem` (default on) also scrolls the active row into view.
- **No-audio build** (`meta.audioSrc === null`): hide the `<audio>`, show
  `Pakiet bez audio — tylko transkrypt.`, disable seeking, keep scene-click scrolling.
- **Zero network**: no external URLs anywhere; fonts =
  `Georgia, 'Times New Roman', serif` for text, `Consolas, monospace` for timestamps.
- **Cthulhu-ish inline CSS**: background `#0d2828` (deep teal), text `#f5e6c8` (parchment),
  accents `#c89b3c` (gold), panel `#0a1f1f`; uppercase letterspaced headings. Match the mood of
  `DESIGN_SYSTEM.md` without Tailwind.
- **Polish strings** throughout: `Sceny`, `Podążaj za dźwiękiem`, `Pakiet bez audio — tylko
  transkrypt.`, `Transkrypt sesji`, footer
  `Pakiet offline — pełna wersja z pochodzeniem nagrania: akta na stronie kampanii.`

**Acceptance criteria**
- Opening the raw template directly (payload token = `null`) shows a graceful
  `Brak danych pakietu` message instead of a JS error.
- With a payload injected (T3/T5), renders 4693 rows with smooth scrolling under `file://`
  (spot-check: no multi-second freeze on load, scrollbar drag stays responsive).
- Scene click scrolls + sets `audio.currentTime`; row click seeks; follow-mode highlights.
- No request other than `index.html` and the relative audio file appears in DevTools Network
  under `file://`.
- Works in Chrome and Firefox (Windows). Safari caveat documented in T4, not fixed here.

*(No unit tests — this file is exercised end-to-end by T5. Keep all non-trivial data logic in
T1 where it is tested.)*

---

### T4 — GM runbook `docs/RUNBOOKS/session-package.md` · independent

**Files:** create `docs/RUNBOOKS/session-package.md` (English, like other runbooks; the
copy-paste lines the GM pastes into content are Polish).

**Sections:**

1. **When to use** — one package per finished session, after the scene-index exists
   (`session-digest` skill, iter 1).
2. **Step 1 — concat mix (rpg-recorder side, producer boundary).** The exact command, run in
   `C:\Users\Pawel\rpg-recorder\outputs\transcript-viz\audio\<slug>\`:

   ```
   ffmpeg -i ch00.opus -i ch01.opus -i ch02.opus -i ch03.opus -i ch04.opus -i ch05.opus \
     -filter_complex "amix=inputs=6:duration=longest:normalize=0,dynaudnorm=f=250:g=15" \
     -ac 1 -c:a libopus -b:a 32k -application voip <slug>-mix.opus
   ```

   With notes: adjust `inputs=N` + `-i` list to the session's channel count; `normalize=0`
   keeps relative levels and `dynaudnorm` evens loudness for speech; **validity precondition:**
   the channels must be equal-length aligned concat streams (true for symmetric-burst sessions;
   verified for UG2 — max 0.1 s drift). Sanity check: output duration ≈ `overlay.duration`
   (`ffprobe -show_entries format=duration`). Mention this step should eventually become an
   rpg-recorder export script (their backlog, note it in their coordination doc when it lands).
3. **Step 2 — build the package** (this repo):

   ```
   npm run build-package -- ug2 --audio "C:\Users\Pawel\rpg-recorder\outputs\transcript-viz\audio\ug2\ug2-mix.opus"
   ```
4. **Step 3 — zip** (printed by the generator too):

   ```
   powershell -Command "Compress-Archive -Path packages\ug2\* -DestinationPath packages\ug2.zip -Force"
   ```
5. **Step 4 — upload to Google Drive**, share as "anyone with the link, viewer".
6. **Step 5 — hub link**: paste into the vault hub
   (`PUBLIC/SPRAWY/02 URODZAJ GROZY/00 HUB.md`) **and** mirror in the hub `body` in
   `src/generated/content.ts` (both — the tree body is the committed mirror; lesson from the
   iter-1 review):

   ```
   - [⬇ Pakiet sesji (transkrypt + audio, ~40 MB)](<DRIVE-URL>) - otwórz index.html z rozpakowanego ZIP-a
   ```
7. **Caveats**: `.opus` `<audio>` fine in Chrome/Edge/Firefox, may fail in macOS Safari;
   package must be **unzipped** before opening (browsers won't play sibling audio from inside a
   zip); re-running the builder overwrites `packages/<slug>/`.

**Acceptance criteria**
- A person with no context can go mix → build → zip → Drive → hub link using only this file.
- Command paths match reality (channel files verified to exist at the documented location).

---

## Batch B

### T3 — `scripts/build-package.ts` CLI (+ npm script + gitignore) · depends on T1, T2

**Files:** create `scripts/build-package.ts`; modify `package.json` (add
`"build-package": "tsx scripts/build-package.ts"`), `.gitignore` (add `packages/` with a
comment `# Generated session packages (scripts/build-package.ts) — audio + zip, never commit`).

**CLI contract** (usage comment at top of file, style of `push-vault.ts`/`fetch-comments.ts`):

```
npx tsx scripts/build-package.ts <slug> [--audio <path-to-mix.opus>] [--out <dir>=packages]
npm run build-package -- <slug> --audio "<path>"
```

**Behavior:**
1. Resolve inputs (all read-only, local, no env needed):
   - `public/transcripts/data/variants.json` → `sessions[slug]` → `default_variant` → overlay
     file → parse as `Overlay`. Missing slug → exit 1 listing available slugs.
   - `public/transcripts/scene-index/<slug>.json` → `SceneIndexFile`. Missing → exit 1 with
     `create it with the session-digest skill (see .claude/skills/session-digest)`.
   - `--audio` path: must exist if given, else exit 1. Warn (not fail) if the extension isn't
     `.opus`.
2. `buildPackagePayload(overlay, sceneIndex, { variantId, audioSrc, … })` (T1) — `audioSrc` is
   `audio/<slug>-mix.opus` when `--audio` given, else `null`.
3. Read `scripts/package-template/template.html`; replace `__PKG_TITLE__` (→
   `` `${overlay.session_name} — pakiet sesji` ``) and `/*__PKG_JSON__*/null` (→
   `inlineJson(payload)`; assert the token occurred exactly once, else exit 1 — template drift
   guard).
4. Write `packages/<slug>/index.html` (`mkdirSync recursive`); copy audio to
   `packages/<slug>/audio/<slug>-mix.opus` when given (`copyFileSync`).
5. Print a summary + next steps:
   - files written with sizes (MB, one decimal);
   - the exact `Compress-Archive` command (T4 §3);
   - the hub-link reminder: the ready-to-paste Polish bullet (T4 §6) + both paste targets
     (vault `00 HUB.md` path and `src/generated/content.ts`);
   - when built without audio: `UWAGA: pakiet bez audio — seek wyłączony.`

**Acceptance criteria**
- `npx tsx scripts/build-package.ts ug2 --audio <real mix>` produces
  `packages/ug2/{index.html, audio/ug2-mix.opus}`; `index.html` contains `window.__PKG__ =` with
  no literal `</script>` inside the JSON; opening it works (full check in T5).
- `npx tsx scripts/build-package.ts ug2` (no audio) also succeeds; payload has
  `"audioSrc":null`.
- Bad slug / missing scene-index / missing audio path → exit 1 with the specified messages.
- `git status` shows no `packages/` entries (gitignore effective).
- `tsc -b` clean; script performs **zero network/Supabase access**.

*(No unit tests — orchestration only; all data logic is in T1. T5 is its test.)*

---

## Batch C

### T5 — UG2 end-to-end dry run · depends on T3 (use T4 as the checklist)

**No new repo files** (all outputs gitignored or in rpg-recorder's tree). Follow the T4 runbook
literally, as its first real execution:

- [ ] **Mix:** run the T4 ffmpeg command in
  `C:\Users\Pawel\rpg-recorder\outputs\transcript-viz\audio\ug2\` → `ug2-mix.opus`.
  Verify: `ffprobe` duration within ±2 s of `9514.4`; size roughly 35–42 MB; spot-listen
  (open the file, hear multiple voices at sane loudness).
- [ ] **Build:** `npm run build-package -- ug2 --audio "<that file>"`. Verify printed summary,
  sizes, zip command, hub reminder.
- [ ] **Browser verification over `file://`** (Chrome; repeat quick pass in Firefox):
  open `packages/ug2/index.html` **via the `file://` URL, not a dev server**. Check:
  - all 11 scenes listed; transcript renders 4693 rows; scrolling smooth;
  - click scene `bitwa-farma` (`tApprox 109:48`) → transcript jumps to the farm-battle rows
    AND `audio.currentTime` lands at ≈ 6588 s; press play → audio matches the on-screen text
    (this is the decisive end-to-end assertion: **the mix offsets line up with the transcript**);
  - repeat for an early scene (`prolog-mcbride`, ≈ 59 s) and the last (`epilog-kasandra`,
    ≈ 9375 s — also proves seeking near EOF);
  - row click seeks; follow-mode highlights and auto-scrolls; toggling it off stops scrolling;
  - DevTools Network shows only `index.html` + the audio file;
  - no-audio build (`npm run build-package -- ug2`) opens fine with the no-audio note.
- [ ] **Zip:** run the printed `Compress-Archive` command → `packages/ug2.zip`; confirm size
  ~35–45 MB; unzip to a **different** temp dir and re-verify open-from-unzipped works (this is
  the exact GM/player flow).
- [ ] Record actual sizes + any timing/UX issues for T6's journal entry.
- [ ] **Not in scope here:** uploading to Drive and pasting the hub link — that's the GM's
  manual action; leave the reminder visible in the final report.

**Acceptance criteria** — every checkbox above observed, with the scene-seek/audio-content match
confirmed by listening at three points (start / middle / end).

---

## Batch D

### T7 — *(optional, stretch)* transcript text filter · depends on T5

Only if T5 lands clean and time permits. In `template.html`: an input `Szukaj w transkrypcie…`
above the rows; on input (debounced 300 ms), toggle a `hidden` class on non-matching rows
(case- and diacritic-insensitive: compare on `text.toLowerCase()` — skip full diacritic folding
if it grows beyond ~15 lines); show `N trafień`; clearing restores all rows. Must not break
follow-mode (skip auto-scroll while a filter is active). Re-verify perf with a 1-character
query (worst case: all rows visible). If any of this threatens the T5-verified behavior, drop
the task — it's explicitly non-blocking.

### T6 — Docs · after shipped tasks

**Files:** modify `docs/AktaKasandry_obsidian/TASK_LIST.md` (Stage M: check the iter-2 items,
keep iter 3 spec-only), `DOCS_CHANGES_JOURNAL.md` (new entry: decisions table above in short
form, dry-run measurements, the producer-boundary note about the ffmpeg step belonging to
rpg-recorder's backlog), `work/2026-07-14-session-companion.md` (append an "Iteration 2 —
shipped" section; flip its iter-2 wording from "spec only" to shipped; keep the Drive-upload +
hub-paste GM action as an open item), and `memories/project.md` (short note under the
rpg-recorder section: package pipeline exists, mix command documented in
`docs/RUNBOOKS/session-package.md`).

**Acceptance criteria** — docs reflect reality including what T5 measured; GM's two remaining
manual actions (Drive upload, hub-link paste in both places) are tracked as open checkboxes.

---

## Verification (whole iteration)

- `npx tsc -b` clean; `npm run test:run` green (new: `package-data.test.ts`; all prior pass).
- `npm run build-package -- ug2 --audio <mix>` then the full T5 browser checklist over
  `file://`, including the three-point audio/transcript alignment listen.
- `git status` clean of `packages/**`; no audio, no zip, no mix committed anywhere.
- Site behavior unchanged: `/sesje/ug2` untouched (no site source files are modified by T1–T5
  at all — only `scripts/`, `docs/`, `package.json`, `.gitignore`).
- **No commit** — hand the working tree + the printed hub-link reminder to the user.
