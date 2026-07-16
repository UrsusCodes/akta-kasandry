---
date: 2026-05-19
status: active
tags:
  - journal
---

# Docs Changes Journal

Per-session changelog. Most recent on top. See `[[LOGGING_INSTRUCTIONS]]` for the entry format.

---

## 2026-07-15 — Session vault + rozdarte-sumienie worked example + presentation-kit audio fix (V0–V7 complete)

Implementation session for the **session vault** — a per-session, self-contained Obsidian
folder that bundles the rewritten summary, a free-form notes file, the transcript tool, and
the presentation kit, for one assigned player to correct offline before anything from that
session is published. Executed from `docs/superpowers/plans/2026-07-15-session-vault.md`
(tasks V0a/V0b/V1–V7); design: `docs/superpowers/specs/2026-07-15-session-vault-design.md`.
Also: `rozdarte-sumienie` run through the **full pipeline end-to-end for the first time**
(rpg-recorder → overlay → digest → package → presentation kit → vault), and a real bug fix
to the presentation kit's exported-deck audio.

**Files touched:**
- `scripts/build-package.ts`, `scripts/build-presentation-kit.ts` — MODIFIED; behavior-preserving
  extraction of `buildSessionPackage({ slug, audioPath, outDir, dataDir? })` and
  `buildPresentationKit({ slug, outDir, galleryPath? })` out of each CLI's `main()`. Each
  `main()` is now a thin wrapper (parse argv → compute `outDir` → call the exported fn → print
  the same hints as before); both functions are import-safe (no side effects at import time),
  which is what lets the vault builder invoke both tools without reimplementing either.
- `scripts/lib/vault-summary.ts` (+ `vault-summary.test.ts`, 27 tests) — NEW; pure Obsidian-markdown
  rewrite of a digest draft: `formatClock`, `sceneForIndex` (exact containment, else *preceding*
  scene flagged `exact: false`, else scene 1), `rewriteDeepLinks` (`{sesja:<slug>#<id>}` →
  `(scena N · ~H:MM:SS)<!--rs:id-->`, ranges get both clocks, unknown ids throw naming the id,
  tokens inside code spans left literal), `rewriteImageEmbeds` (`<img src="/img/<slug>/...">` /
  markdown images → `![[basename]]`), `rewriteSesjeLinks` (`/sesje/<slug>` cross-page links →
  a pointer at the vault's own `Narzędzia/transkrypt/index.html`, foreign-slug links left
  untouched), `collectMediaBasenames`, `questionsToCallouts` (wraps "Pytania i wątpliwości"
  paragraphs as `[!question]` callouts; a trailing `{q-after:<heading>}` marker relocates the
  callout next to a matching `### <heading>`, fail-soft if the heading doesn't exist), and the
  composing `rewriteSummaryToObsidian` (replaces the draft's internal "WERSJA ROBOCZA" banner
  with a player-facing note, prepends YAML frontmatter, runs all the above in order).
- `scripts/lib/vault-manifest.ts` (+ `vault-manifest.test.ts`, 8 tests) — NEW; `planVaultFiles(slug)`,
  a pure data function returning the exact vault-relative paths the builder writes for the
  static/derived parts (excludes the two tool subtrees, owned by the reused builders).
- `scripts/vault-template/**` — NEW; ASCII-named static template tree (`START TUTAJ.md`,
  `Komentarz do AI.md`, `Narzedzia/Otworz narzedzia.md`, `Media/_Wrzuc tu media.md`,
  `dot-obsidian/{app,appearance}.json`, empty `Media/{portrety,sceny,muzyka,zdjecia-z-gry,materialy}/`
  via `.gitkeep`); the builder renames to the Polish-diacritic vault paths on write.
- `scripts/build-session-vault.ts` — NEW; CLI (`npm run build-session-vault -- <slug> [--summary]
  [--audio] [--out]`). Resolves the overlay + scene-index, discovers (or takes `--summary`) the
  digest draft, runs `rewriteSummaryToObsidian`, writes `packages/<slug>-vault/` from
  `planVaultFiles` + the templates (function-form token replacement + occurrence-count drift
  guards, same style as the other two builders), builds the transcript tool via
  `buildSessionPackage` at `Narzędzia/transkrypt/` (Sala audio from `--audio` or the
  `packages/_audio-src/<slug>-sala.opus` default, else a no-audio tool), builds the presentation
  kit via `buildPresentationKit` at `Narzędzia/prezentacja/`, and — a builder enhancement beyond
  the original plan — **copies the session's gallery scene/cast images into vault `Media/`** so
  the rewritten summary's `![[...]]` embeds resolve immediately for anything already in the
  gallery manifest, without a separate media-drop step. Prints per-area sizes, the zip command,
  and the Drive/assignment hint, same shape as the other two CLIs.
- `package.json` — MODIFIED; `"build-session-vault": "tsx scripts/build-session-vault.ts"`.
- `docs/RUNBOOKS/session-vault.md` — NEW; GM runbook mirroring `session-package.md`'s shape:
  prerequisites → (optional) Sala mix → build → (optional) enrich media + re-run → zip → Drive +
  assignment (with a ready-to-paste Polish player message) → round trip (feed the corrected
  files to Akta's AI, which restores `<!--rs:ID-->` → `{sesja:…#ID}`, never auto-applied) →
  caveats (unzip-before-open, `.opus`/Safari, clean-rebuild-on-rerun, media placeholders,
  never-committed `packages/`).
- `scripts/build-presentation-kit.ts`, `scripts/kit-template/edytor.html`,
  `scripts/kit-template/kit-core.js` (+ `kit-core.test.ts`, now 32 tests) — MODIFIED; **audio
  self-containment fix**. A player who downloaded or moved an exported `prezentacja.html` (or
  the edited `edytor.html`) away from its build-time `assets/audio/` folder found the deck's
  music silent — tracks were referenced by relative path, not embedded. Fixed by base64-encoding
  every *used* track into a sibling `assets/tracks-data.js` (`window.__KIT_TRACKS__`, basename →
  data URI), loaded by both the editor's live preview and the exported deck's own inline script
  (`KitCore.serializeSlidesJs` now accepts the track-data map as a second argument); added a
  "Posłuchaj" preview button next to each act's track picker in the editor so authors can audit
  the choice without building a full preview. `docs/RUNBOOKS/presentation-kit.md`'s old
  "edit the `AUDIO_BASE` line before publishing" step is gone — the export is already fully
  self-contained, so publishing a reviewed deck is now a straight file copy.
- `public/transcripts/data/rozdarte-sumienie-current-overlay.json` — NEW (gitignored data,
  tracked in-repo like the other overlays); concat timeline, 27023.4 s (~7 h 30 m), 4449
  utterances, 7 speakers (Nika G, Jakub M, Rafał G., Paweł MG, Piotr S., Kamil K., and a
  dedicated "Sala" room-mic channel) — rebuilt from **4 separate rpg-recorder runs** after
  working around a stitch bug in that pipeline (their software; tracked as a backlog note for
  rpg-recorder, not fixed here).
- `public/transcripts/data/variants.json` — MODIFIED; registers `rozdarte-sumienie`'s
  `default_variant: "current"`.
- `public/transcripts/scene-index/rozdarte-sumienie.json` — NEW; 16 scenes.
- `public/gallery/rozdarte-sumienie.json` — NEW; 20 scenes/handouts, 10 cast, 8 tracks,
  `caseName: "Rozdarte Sumienie"`.
- `docs/superpowers/drafts/2026-07-15-rozdarte-sumienie-summary.md` — NEW; the `session-digest`
  skill's draft output, WERSJA ROBOCZA, with 60 `{sesja:...}` deep-link tokens, several
  characters flagged *(imię niepewne)*, and a "Pytania i wątpliwości" section — this is the
  file `build-session-vault` rewrites.
- `public/img/rozdarte-sumienie/`, `public/audio/rozdarte-sumienie/` — NEW; real media
  compressed from a ~180 MB source down to ~32 MB (31 images/6.7 MB — 10 scene photos, 10 cast
  portraits incl. Fisk, Kent, Gundberg, Tommy Malone, and 11 tome-handout `.webp` pages; 8 music
  tracks/26 MB).
- `docs/AktaKasandry_obsidian/{TASK_LIST.md, DOCS_CHANGES_JOURNAL.md, work/2026-07-15-session-vault.md, work/Index.md, memories/project.md}` — this entry (V7).
- `.claude/skills/session-digest/references/outputs.md` — MODIFIED; documents that the same
  digest draft also feeds `build-session-vault`, and the optional `{q-after:<heading>}` marker.

**rozdarte-sumienie — first session through the full pipeline, end to end:** the pilot plan
recorded in the 2026-07-14 journal entry ("run the full pipeline end-to-end for the first
time") is now real. `rpg-recorder` → overlay lands in this repo → `session-digest` drafts the
summary → `build-package` / `build-presentation-kit` / `build-session-vault` all run against
real data → a 153 MB vault (zip ~103 MB) built at `packages/rozdarte-sumienie-vault/`. The one
irregularity worth recording: the session's audio arrived as **4 separate recorder runs**
instead of one continuous capture, which triggered a stitch bug in rpg-recorder's overlay
assembly; the overlay used here was rebuilt working around that bug by hand — a proper fix
belongs in rpg-recorder, not this repo, and is noted as a backlog item there.

**Decisions:**
- **The vault reuses, never reimplements, the session package and presentation kit.** Both
  gained an exported, `outDir`-parameterized function (V0a/V0b) specifically so
  `build-session-vault.ts` could call them in place — no duplicated viewer/editor logic, no
  divergence risk between the standalone tools and their vault-embedded copies.
- **The deep-link restore contract is the design's load-bearing rule, same shape as the
  presentation kit's `szkic.json` boundary.** `{sesja:<slug>#<id>}` becomes a visible
  `(scena N · ~H:MM:SS)` label plus an invisible `<!--rs:id-->` HTML comment — invisible in
  Obsidian's reading view, but exactly the string Akta's AI needs to reconstruct the original
  site token later, with zero manual re-linking. If a comment is ever lost (a player edits it
  away), the un-rewritten draft in `docs/superpowers/drafts/` remains the source of truth to
  re-derive it from.
- **Out-of-range deep-link ids resolve to the *preceding* scene, not the nearest.** The scene
  index is a sparse subset of the full utterance range (verified during planning: 20 of 55
  distinct anchors in the rozdarte-sumienie draft fall outside every scene's index range), so
  containment alone isn't sufficient; `sceneForIndex` falls back to "the last scene that had
  already started" and flags the result `~N` (not exact) rather than silently picking either
  neighbor.
- **The round trip is never auto-applied** — same posture as `session-feedback`: Akta's AI
  restores tokens and folds `Komentarz do AI.md` + inline corrections into a draft/diff; a
  human reviews and merges it by hand before it becomes the live summary.
- **Copying gallery images into vault `Media/` at build time is a deliberate builder
  enhancement beyond the original plan** — it removes the need for a manual media-drop step for
  any image the session's gallery manifest already knows about; `Media/` still exists as a
  drop-zone for anything the gallery doesn't have yet (portraits/scenes the GM hasn't gotten to,
  player-contributed photos), and re-running the builder after adding to either source picks
  up both.
- **Presentation-kit audio self-containment was a real fix, not a caveat.** A deck that isn't
  self-contained defeats the entire point of a downloadable, `file://`-openable artifact — the
  `assets/tracks-data.js` approach mirrors the same base64-inlining rationale already used for
  images (blocked `fetch()`, canvas tainting under `file://`), extended to audio because the
  earlier "copy as sibling file" choice for audio assumed the file would never be separated
  from its folder, which turned out false once decks get downloaded/moved/emailed around.

**Verification.** Full suite **134/134** Vitest tests green (new: 27 in `vault-summary.test.ts`,
8 in `vault-manifest.test.ts`; `kit-core.test.ts` grew from 26 to 32 for the audio fix); `npx
tsc -b` clean; `git status` clean of `packages/**`; no site source file modified beyond
`scripts/`, `docs/`, `package.json`, and the digest skill's `outputs.md`. **No commit made this
session** — working tree handed to the GM per the plan's hard constraint.

**Open questions / next steps (GM manual actions, tracked in [[TASK_LIST]]):**
- Open `packages/rozdarte-sumienie-vault/` in Obsidian ("Open folder as vault") to visually
  confirm reading view, deep-link labels, image embeds, and `[!question]` callouts — the one
  verification step the sandbox couldn't perform.
- Resolve the remaining uncertain character/NPC identities flagged inline in the
  rozdarte-sumienie draft's "Pytania i wątpliwości" section.
- Eventual site-publish of the corrected rozdarte-sumienie summary once the assigned player's
  round trip comes back, feeding the existing Stage K/L pipeline (case hub, comments, gallery,
  package, presentation).
- Flag the 4-run stitch bug to rpg-recorder's own backlog (their pipeline, not this repo's).

---

## 2026-07-15 — Presentation kit: player self-service slide editor (K1–K6 complete)

Implementation session for the **presentation kit** — a downloadable, self-contained slide editor
(`edytor.html` + audio) that lets players assemble their own cinematic recap deck using the
`cinematic-slideshow` engine and a session's gallery art, without ever giving them a way to
publish HTML to the live site. Executed from `docs/superpowers/plans/2026-07-15-presentation-kit.md`
(tasks K1–K6); design: `docs/superpowers/specs/2026-07-15-presentation-kit-design.md`.

**Files touched:**
- `scripts/kit-template/kit-core.js` (+ `kit-core.test.ts`, 26 tests) — NEW; dependency-free IIFE
  (`globalThis.KitCore`), loadable both as a classic inline `<script>` and via Vitest import:
  `newDraft`/`validateDraft`, `escapeHtml`, `draftToEngineData` (HTML-escapes every player-typed
  text field), `serializeSlidesJs` (escapes literal `<` in its output), `collectImageRefs`,
  `draftByteSize`. Includes a regression test for the HTML-embedding bug found in K5 (below).
- `scripts/kit-template/edytor.html` — NEW; the 3-panel Cthulhu-skinned editor (slide list / fields
  / live `<iframe srcdoc>` preview), autosave to `localStorage` (debounced, 4 MB warning), szkic
  file export/import, `prezentacja.html` export — all zero-network, Polish UI.
- `scripts/build-presentation-kit.ts` — NEW; CLI generator (`npm run build-presentation-kit --
  <slug> [--out <dir>]`), reads `public/gallery/<slug>.json` + the engine sources under
  `public/prezentacja/ug2/`, embeds every scene/cast image as a base64 data-URL at **build time**
  (images must be inlined — `fetch()` is blocked and `file://` images taint canvas), copies audio
  tracks as plain sibling files, injects tokens into `edytor.html` with occurrence-count drift
  guards — including a **new `</script`-in-source guard** added after the K5 blocker (below) that
  asserts none of the injected payloads contain a literal `</script` before writing the file.
- `package.json` — MODIFIED; `"build-presentation-kit": "tsx scripts/build-presentation-kit.ts"`.
- `docs/RUNBOOKS/presentation-kit.md` — NEW; GM runbook (build → zip → Drive → player instructions
  → **receive & publish**, with the trust-boundary callout as a `[!warning]` box). Corrected this
  session: Step 5.5 originally described a commented-out `AUDIO_BASE` alternative line to
  uncomment; the actual generated deck has only one line
  (`const AUDIO_BASE = "assets/audio/";`, no commented alternative) — reworded to "edit that one
  line to `../../audio/<slug>/`".
- `public/gallery/ug2.json` (and the manifest schema) — gained an optional `caseName` field
  (`"Urodzaj Grozy"` for `ug2`) used by the kit's editor title / player-facing labels.
- `docs/AktaKasandry_obsidian/{TASK_LIST.md, DOCS_CHANGES_JOURNAL.md, work/2026-07-15-presentation-kit.md, work/2026-07-14-session-companion.md, work/Index.md, memories/project.md}` — this entry (K6).

**K5 dry run — one real blocker found and fixed:**
Building the UG2 kit and opening `edytor.html` initially produced a dead editor (page loaded, no
JS ran). Root cause: `kit-core.js` had a **source comment** containing the literal string
`</script>` (documenting the JSON output format); when the builder inlined `kit-core.js`'s source
into `edytor.html`'s `<script>` block, the browser's HTML tokenizer — which doesn't parse
JavaScript, only scans for the literal closing tag — truncated the script right there, silently.
Fixed by rewording the comment and adding the build-time drift guard described above. After the
fix, re-ran the full checklist — **ALL PASS**: 6-slide deck built via real UI events (all 5
templates, 2 acts on different tracks, both Ken Burns variants, one custom-uploaded PNG, Polish
diacritics, a literal `<b>xss</b>` title escaped end-to-end in preview and export); autosave
survives reload; szkic export→reset→import round-trips to a deep-equal draft; exported
`prezentacja.html` (552 KB) opens and plays fully (audio serves HTTP 206 from `assets/audio/`);
zip 23.5 MB, unzip-and-reopen OK; local publish simulation (deck copied under a test route,
`AUDIO_BASE` flipped to the site's audio path, played against real site audio, then the test
folder deleted, nothing committed) PASS. Full suite 93/93, `tsc -b` clean. Caveat: verification
ran over local HTTP because the sandbox rejects `file://` navigation (template performs zero
fetches either way, so considered equivalent) — the GM still owes a true `file://` open from disk.

**Decisions:**
- **The round-trip artifact between player and GM is `szkic.json`, never `prezentacja.html`.**
  The `cinematic-slideshow` engine interpolates slide text without HTML-escaping it, and a
  published deck runs same-origin with the live site — so a player-exported HTML file is
  arbitrary, untrusted markup. **Never publish a player-sent `prezentacja.html` verbatim.** The
  GM instead imports the player's `szkic.json` into their own kit copy, reviews every slide's
  text, and re-exports — `KitCore`'s `escapeHtml`/`serializeSlidesJs` guarantee the GM's own
  re-export can never contain unescaped player-authored markup, no matter what the player sent.
- **Images inlined as data-URLs at build time** (forced by the `file://` constraint: blocked
  `fetch()`, canvas-tainting); **audio copied as plain sibling files, not inlined** (same
  don't-triple-multi-MB-media-into-HTML precedent as the Iteration-2 session package).
- **`</script`-in-source is now a build-time drift guard**, not only an escaping rule — the K5 bug
  originated in the pipeline's own source code, not player input, so text-escaping alone wouldn't
  have caught it; the builder now asserts-before-write on every injected payload.
- **No new dependency, no schema change, no site source changes** — the kit only reads existing
  gallery manifests and engine files; publishing a reviewed deck remains a manual GM step,
  identical in shape to how the original `cinematic-slideshow` decks are published.

**Open questions / next steps (GM manual actions, tracked in [[TASK_LIST]]):**
- Upload `packages/ug2-prezentacja.zip` to Google Drive (anyone with the link, viewer) and send
  the Step 4 player snippet.
- A true `file://` open of `packages/ug2-prezentacja/edytor.html` from disk.
- First real player round-trip: a player builds a deck, sends back `szkic-ug2.json`, GM reviews
  and publishes per runbook Step 5.

**Verification.** Full suite 93/93 Vitest tests green (new: 26 in `kit-core.test.ts`); `npx tsc -b`
clean; `git status` clean of `packages/**` and of `public/prezentacja/_kit-test`; no site source
changes. **No commit made this session** — working tree handed to the user per the plan's hard
constraint.

---

## 2026-07-14 — GM feedback: two question types in "Pytania i wątpliwości" ([PEWNE]/[SPEKULACJA])

GM review of the UG2 "Pytania i wątpliwości" section surfaced a scope mismatch: the section was
designed to surface the **AI's comprehension gaps** (things the transcript leaves unclear — lost
recordings, off-mic action, ambiguous outcomes — where a player's answer is a factual correction),
but the 5 UG2 questions that shipped in Iteration 1 turned out to be **open plot mysteries**
instead (in-fiction unknowns with no answer at the table; the GM won't reveal them). GM decision:
allow both, but keep them distinct in the conventions.

**Files touched:**
- `.claude/skills/session-digest/SKILL.md` — workflow step 3 now distinguishes **luki w
  rozumieniu** (comprehension gaps, primary purpose, player answers are real corrections) from
  **otwarte zagadki** (open mysteries, secondary, permanently "unanswered", player comments are
  theories only); requires the section's intro blockquote to invite `[PEWNE]`/`[SPEKULACJA]`
  prefixes (plain-text convention in the comment body, no DB change); acceptance check updated.
- `.claude/skills/session-digest/references/house-style.md` — item 13 (the "Pytania i
  wątpliwości" section) now points to the gap/mystery distinction and the marker convention.
- `.claude/skills/session-feedback/SKILL.md` — classification step (3) teaches the marker
  convention: `[PEWNE]` comments are higher-confidence candidate corrections, `[SPEKULACJA]`
  comments are theories that are never folded into summary facts (may be quoted in a "Teorie
  graczy" subsection if proposed), unmarked comments classify by content as before. New hard
  rule: mystery-question threads never produce a summary-fact diff hunk, regardless of marker.
- `src/routes/UG2Summary.tsx` — rewrote only the "Pytania i wątpliwości" intro blockquote to
  explain that these are open questions, some may never get an official answer, and to prefix
  answers/theories with `[PEWNE]`/`[SPEKULACJA]`. The 5 question paragraphs themselves are
  untouched (their block-ids stay stable); the intro blockquote's own block-id changes, which is
  fine — no player comments exist on it yet.

**Decisions:**
- UG2's 5 existing questions stay classified as **open mysteries**, including the Sól w Ranach
  teaser folded into Q5 (the "progresywny klub dżentelmenów" invitation to Dr Elaine Howard) —
  the GM explicitly accepted that cross-case teaser rather than asking for it to be reworked.
- `[PEWNE]`/`[SPEKULACJA]` is a plain-text, in-comment convention only — no schema/DB change, no
  new comment field. Read-back tooling (`session-feedback`) treats the markers as a strong
  classification signal, not a substitute for reading the comment body.
- **Pilot plan, next session:** run the **full pipeline** end-to-end for the first time —
  rpg-recorder transcription → overlay lands in this repo → `session-digest` drafts the summary
  (using the new two-type "Pytania i wątpliwości" convention from the start) → `npm run
  build-package` packages it with the central-mic audio track (per the Iteration 2 runbook,
  `docs/RUNBOOKS/session-package.md`).

**Verification.** `npx tsc -b` clean; `npx vitest run` green (66 tests). No commit made this
session per instructions.

---

## 2026-07-15 — Session companion Iteration 2: downloadable session package (Stage M — Iteration 2 complete)

Implementation session for **Iteration 2** of the session companion — the downloadable per-session package (self-contained `index.html` + concat-mix Opus audio, zipped, GM-hosted on Google Drive). Executed from `docs/superpowers/plans/2026-07-15-session-companion-iter2.md` (tasks T1–T7 incl. the T7 stretch); `/sesje` untouched, stays the always-on no-audio deep-link fallback.

**Files touched:**
- `scripts/lib/package-data.ts` (+ `package-data.test.ts`, 12 tests) — NEW; pure payload builder: **winner-only trimmed projection** (~0.5 MB inlined vs 4.3 MB raw overlay), pinned seek rule `play.start ?? (timeline === 'concat' ? start : null)`, `inlineJson()` escaping `</script>` for safe inline-`<script>` embedding.
- `scripts/package-template/template.html` — NEW; standalone vanilla HTML/CSS/JS viewer (no React/Tailwind build): scene sidebar, `content-visibility: auto` rows (the site viewer's perf trick, framework-free), sticky audio bar, follow-mode with throttled binary-search highlight, graceful no-audio fallback, zero network under `file://`, Polish UI strings, Cthulhu palette inline.
- `scripts/build-package.ts` — NEW; CLI generator (`<slug>` + optional `--audio <mix path>`), output to gitignored `packages/<slug>/`; prints the `Compress-Archive` zip command, the Drive-upload reminder, and the ready-to-paste Polish hub bullet.
- `package.json` — MODIFIED; `"build-package": "tsx scripts/build-package.ts"`.
- `.gitignore` — MODIFIED; `packages/` (generated packages — audio + zip never committed).
- `docs/RUNBOOKS/session-package.md` — NEW; GM runbook mix → build → zip → Drive → hub link: ffmpeg one-liner (`amix` → `dynaudnorm` → libopus 32k mono), `Compress-Archive`, **dual-edit hub warning** (vault `00 HUB.md` + `src/generated/content.ts` mirror), macOS-Safari `.opus` caveat.
- `docs/AktaKasandry_obsidian/{TASK_LIST.md, DOCS_CHANGES_JOURNAL.md, work/2026-07-14-session-companion.md, memories/project.md}` — this entry (T6).

**Dry run (T5) — PASS, measured:**
- Mix produced in rpg-recorder's tree (producer boundary respected): `C:\Users\Pawel\rpg-recorder\outputs\transcript-viz\audio\ug2\ug2-mix.opus` — **36.8 MB, 9514.4065 s**, matches `overlay.duration` to the millisecond.
- `packages/ug2/` built; seek verified programmatically at 3 scenes (early / middle / late — `audio.currentTime == seekSec` exactly, incl. near-EOF); zip **36.9 MB**; unzip-to-a-different-dir-and-reopen verified (the exact player flow).
- Caveat: the browser sandbox rejects `file://`, so verification ran over a local static HTTP server — equivalent, since the template performs zero fetches; the true `file://` open from disk is on the GM's checklist.

**Decisions:**
- Inline a **trimmed winner-only projection** (`window.__PKG__`), never the raw overlay — provenance/chunks stay a `/sesje` feature (design spec §4 amended 2026-07-15).
- Viewer is a **hand-written vanilla template** (`scripts/package-template/template.html`), not a second Vite build target — the read-only row UI is trivial and the `content-visibility` trick is plain CSS.
- Zip via **PowerShell `Compress-Archive`**, printed not executed — no Node zip dependency; gives the GM an inspect-before-shipping checkpoint.
- **Producer boundary:** the ffmpeg concat-mix step belongs to rpg-recorder — documented in the runbook here, flagged for **their backlog** as a future export script; this repo only consumes the resulting file via `--audio`.
- Stretch T7 shipped: diacritic-insensitive text filter (text + speaker) with debounce and Polish-pluralized match counter; follow-mode auto-scroll guarded while a filter is active; no-audio `.seekable` cursor nit fixed.

**Open questions / next steps (GM manual actions, tracked in [[TASK_LIST]]):**
- Acoustic spot-check listen of the mix + final `file://` open of `packages/ug2/index.html` from disk.
- Upload `packages/ug2.zip` to Google Drive (anyone with the link, viewer).
- Paste the hub bullet into vault `PUBLIC/SPRAWY/02 URODZAJ GROZY/00 HUB.md` **and** `src/generated/content.ts` — both places.

**Verification.** Full suite: 21 test files / 65 tests green (new: `package-data.test.ts`); `npx tsc -b` clean; `git status` clean of `packages/**`; no audio/zip committed; no site source touched. **No commit made this session** — working tree handed to the user per the plan's hard constraint.

---

## 2026-07-14 — Session companion: authoring skills, session gallery, UG2 pilot (Stage M — Iteration 1 complete)

Design + implementation session for the **session companion** feature set (spec: three iterations; this session ships iteration 1 in full via a 10-task subagent-driven plan, M1–M10).

**Design.** Spec `docs/superpowers/specs/2026-07-14-session-companion-design.md` + plan `docs/superpowers/plans/2026-07-14-session-companion-iter1.md`. Guiding principle: **no new app** — generation stays in Claude Code skills outside the app; the site only ever renders results (summaries, galleries, manifests), never calls an LLM at runtime. Reopens two prior exclusions from `memories/project.md`: in-browser whiteboard (via **tldraw**, not Excalidraw, Iteration 3 only) and audio/video embeds (narrowly — only inside a downloadable local package, Iteration 2; the site itself still hosts no audio).

**Files touched (Iteration 1, all shipped this session):**
- `.claude/skills/session-digest/SKILL.md` + `references/{house-style,outputs}.md` — NEW project skill; turns a session's overlay JSON + GM off-mic notes into a house-style summary draft, a "Pytania i wątpliwości" section, a scene-index JSON, and a gallery manifest.
- `.claude/skills/session-feedback/SKILL.md` — NEW project skill; folds player comments (via `fetch-comments.ts`) back into a summary as a reviewable unified diff — no auto-apply, GM commits.
- `scripts/fetch-comments.ts` + `scripts/lib/group-comments.ts` (+ `group-comments.test.ts`) — NEW; read-only, anon-key Supabase read of `wiki.comments` for a `page_key`, grouped by `blockId`/thread; `package.json` gained `"fetch-comments"` script entry.
- `src/lib/gallery/manifest.ts` (+ `manifest.test.ts`) — NEW; zod schema (`GalleryManifestSchema`) + `parseGalleryManifest` + `loadGalleryManifest` (uses `withBase`).
- `src/components/gallery/{SessionGallery,Lightbox}.tsx` (+ `SessionGallery.test.tsx`) — NEW; data-driven gallery component + in-house click-to-zoom lightbox (no new dependency — built on existing React state + fixed-overlay + keyboard handlers).
- `public/gallery/ug2.json` — NEW; first manifest: 22 scenes, 10 cast portraits, 5 music tracks, 4 links (Streszczenie/Narracja/Prezentacja/Transkrypt). All `src` paths verified to exist under `public/`.
- `src/routes/NodeView.tsx` (+ `src/generated/content.ts`) — MODIFIED; registered `sprawy/02-urodzaj-grozy/05-galeria` in `INLINE_PAGES`, added the matching content node; vault stub `G:\My Drive\OBSIDIAN\RPG\Zew Cthulhu\PUBLIC\SPRAWY\02 URODZAJ GROZY\05 Galeria.md` added (GM/vault-side, so a future `npm run build-content` regenerates the same node instead of dropping the hand-added one). Live at `/p/sprawy/02-urodzaj-grozy/05-galeria`.
- `src/routes/UG2Summary.tsx` — MODIFIED; appended a "Pytania i wątpliwości" section — 5 questions, each its own paragraph (blank-line-separated, not a list) so `remarkBlockIds` assigns each a distinct, individually-commentable `data-block-id`.
- `public/transcripts/scene-index/ug2.json` — NEW; 11 scenes with real utterance-id boundaries pulled from `ug2-current-overlay.json`, chronological order, Polish titles. Consumed by Iteration 2 (package generator); no app wiring in Iteration 1.
- `docs/AktaKasandry_obsidian/{TASK_LIST.md, DOCS_CHANGES_JOURNAL.md, work/Index.md, memories/project.md}` — this entry (M10).

**Decisions.**
- **No new runtime dependency in Iteration 1.** `zod` and `@supabase/supabase-js` (already deps) cover the manifest schema and the read-only comment fetch; the lightbox is hand-built.
- **Skills-outside-app boundary restated, not reversed.** `session-digest`/`session-feedback` are authoring guidance + templates, not app code — they produce `.tsx`/`.json` content a human commits.
- **Append-only block-id contract** for "Pytania i wątpliwości": editing a published question's text changes its `remarkBlockIds` hash and orphans any comments already anchored to it. The skill and this doc both flag it as a hard rule.
- **Package model (Iteration 2, spec-only) replaces hosted transcript audio.** Instead of ever hosting per-channel audio on the site or on GitHub Releases/R2, the plan is a downloadable per-session package (self-contained `index.html` + a concat-mix Opus audio sibling file, zipped, hosted on the GM's Google Drive). `/sesje` stays the always-on, no-audio deep-link fallback — unchanged.
- **tldraw approved-but-deferred** for Iteration 3 (shared whiteboard) — the one sanctioned future addition beyond the locked stack; still requires explicit go-ahead when scheduled. Backed by a new `wiki.boards` table (last-write-wins, no history), subject to the coc-creator shared-Supabase coordination guardrail.

**Open items flagged for follow-up.**
- `.gitignore` line 35 ignores all of `.claude/` — needs an exception (e.g. `!.claude/skills/`) before the two new skills can be committed.
- UG2 "Pytania i wątpliwości" is **GM-review-pending**: the GM approves the 5 questions' wording before the next deploy. Question 5 references the currently-hidden "Sól w Ranach" session — GM must decide teaser phrasing vs. rewrite.
- Iterations 2 and 3 are designed at spec level only (`docs/superpowers/specs/2026-07-14-session-companion-design.md` §4–5) — each gets its own implementation plan when scheduled.

**Verification.** Full suite: 20 test files / 53 tests green (new: `manifest.test.ts`, `group-comments.test.ts`, `SessionGallery.test.tsx`; all prior 43 unaffected). `npx tsc -b` clean. **No commit made this session** — working tree handed to the user per the plan's hard constraint.

---

## 2026-06-27 — Player margin-comments: interaction layer, production deploy, player accounts (Stage L — live)

Finishing session for Stage L. All interaction paths are now wired and tested end-to-end in production; six player accounts provisioned; migrations 009–013 verified live.

**Shipped & deployed to GitHub Pages (all builds green).**

**Migrations 009–013 confirmed live.** Authored in the previous session, run 2026-06-26 in Supabase dashboard (one transaction). Post-migration audit passed. Key schema fix: `wiki.comments.speaker_character_id` and `wiki.investigation_cast.character_id` reference `wiki.imported_characters.source_id` (uuid natural key), NOT the bigserial `id` — the plan originally said `(id)`, which would have failed.

**Comment card positioning.** Cards in the right rail are absolutely positioned at their anchored fragment's vertical offset. Collision push-down implemented as a pure, TDD-tested utility (`src/lib/comments/stack.ts`). Offsets recompute on resize and image-load. Header floor applied. Desktop-only; mobile falls back to a plain list. Desktop detection in `src/components/comments/useIsDesktop.ts`.

**Guided comment composer.** New `src/components/comments/CommentComposer.tsx` replaces the implicit "select text → bubble" flow with three explicit states: idle "Dodaj komentarz" button → "Oznacz fragment" selection bar → compose box. Login-gated. Desktop = sticky in rail; mobile = fixed bottom bar. `ComposeBubble` hides the speaker picker when the player has no cast characters (clean OOC). Spec: `docs/superpowers/specs/2026-06-26-comment-composer-flow-design.md`; plan: `docs/superpowers/plans/2026-06-26-comment-composer-flow.md` (both committed).

**Login by name.** `src/routes/Login.tsx` shows a "Login" name field. `src/stores/auth.ts` exports `loginToEmail()` which maps `username → username@kasandra.local` before calling `signInWithPassword` (synthetic-email pattern). Akta has its OWN Supabase Auth — no SSO with coc-creator, no reading `public.players`. Polish invalid-credentials error message.

**Author edit/delete.** `CommentCard` now shows Edytuj/Usuń when the viewer is the comment's author OR MG (was previously MG-only and unwired). Inline edit + delete-confirm wired to the comments store. RLS already permitted author-level edit/delete.

**UG2 full narration — comments.** `src/routes/UG2Narracja.tsx` now renders via `AnnotatableArticle` with its own page_key `streszczenie/ug2/narracja` (separate comment set) but the shared UG2 cast key `streszczenie/ug2`. Verified live: composer + shared cast (James Kelly · Eleine Howard · Ja) all work.

**Content fix.** Jakub's academic corrected from "Dr Edwin Thorne" → "Arthur Henry Corwin" in both `UG2Summary` and `UG2Narracja` (the cinematic presentation already had the correct name).

**Test infra.** 43 Vitest tests green; `tsc -b` clean.

**Player accounts (MG actions, done in Supabase dashboard / SQL).**
- 6 player accounts created with synthetic emails `<login>@kasandra.local` (Auto-Confirmed, separate Supabase Auth): nika, rafalg, piotrs, pawel, kamilk, jakubm.
- MG account stays `storage.station2023@gmail.com` (logs in via full-email pass-through in the Login screen).
- Credentials stored LOCAL-ONLY in gitignored `secrets/player-credentials.md` (repo is PUBLIC).
- `wiki.profiles.display_name` + `color` set per player via SQL (initials for four: "Rafał G", "Piotr S", "Kamil K", "Jakub M"; full names for Paweł and Nika).
- Character owner + investigation cast assigned for all 10 UG2 characters (cast key `streszczenie/ug2`).

**Files (source).** `src/components/comments/{CommentComposer,CommentCard,CommentRail,useIsDesktop}.tsx`, `src/lib/comments/stack.ts`, `src/stores/auth.ts` (`loginToEmail`), `src/routes/{Login,UG2Narracja,UG2Summary}.tsx`.

**Open / backlog.**
- ⚠️ Cast-store load burst: ~25 redundant Supabase calls on mount of either UG2 page (profiles / imported_characters / investigation_cast) — settles, not an infinite loop, but wastes free-tier egress. Suspected cause: `useEffect(..., [user, loadCast])` re-fires when `user` object reference changes during auth-session settling. Likely fix: depend on `user?.id` instead. Diagnose + fix.
- Import name mismatch: Nika's academic is imported as "Eleine Howard" but content canon says "Elaine" — unify (rename in import) when convenient.
- Comments currently only on the two UG2 pages; enabling on other pages (Znak Życia, vault pages) requires a stable `page_key` per page and NodeView opting into `AnnotatableArticle`.
- Accepted v1 trade-offs (already documented): MG can reassign comment authorship via RLS (MG is trusted); per-author fragment highlight uses 16 fixed palette `::highlight` rules; some anchor/transitive-dep notes.

---

## 2026-06-26 — UG 2 off-mic fills + illustrations + cinematic presentation (reusable skill) + case hubs

Long session. Finished Stage K for UG 2 and built a reusable cinematic-presentation system on top of it.

**UG 2 content (Stage K).** Filled the three off-mic gaps from GM memory and folded them into `/streszczenie-ug2` and `/streszczenie-ug2/narracja`: (A) gangster night recon + dawn shootout, (B) academics' town intro → Jarvey farm, (C) most of the cave fight. Per GM, dropped the "⚠ poza nagraniem" flags and wrote it as seamless narrative. **Naming canon** normalized (from the GM vault `STRAŻNIK/SESJE/URODZAJ GROZY/NPC.md`): Blackwater Creek, Damien/Brendan Carmody, Henry/Abigail Roades, Ernest McTavish, Jarveyowie, Stary Pete, Dick Sprouston, **Dr Arthur Henry Corwin** (was the wrong "Edwin Thorne"), **Elaine** (not Eleine), **Klub Kasandry** (K). Lore fixes: farm creature = transformed **Brendan** (not the Mother); the Mother = **Abigail Roades** (Shub-Niggurath avatar); Joseph shoots Roades; **Mortimer survives insane** (Dar regeneration); epilogue window figure = **Brock** (the executed informant, back via the Dar). Added a **"Śmieszne i epickie momenty"** section (deep-linked quotes) + folded narrative details into the short summary.

**Illustrations.** 21 GM-generated images optimized into `public/img/ug2/`, plus 10 player cast portraits pulled from the shared Supabase `portraits` bucket into `public/img/ug2/cast/`; woven into both pages (scenes full-width, characters framed). New GM beats surfaced: Brutus (the farm hog) fight, the gangster/academic meeting + negotiation.

**Cinematic presentation (NEW).** Self-contained, music-driven slideshow under `public/prezentacja/ug2/` — theme-agnostic `engine.js` + `base.css` + per-theme `themes/*.css` + data `slides.js`. 40 slides / 6 acts, 4 music cues with crossfade, framed captioned portraits + cast intros, Ken Burns, fx (flash/pulse/night), a "?" frame, and a **gunfight SFX mixed with ffmpeg** from 6 GM clips. Start gesture, no-autoplay-on-start, pause/scrub/fullscreen, idle-hide. Embedded on the site via React route **`/prezentacja/ug2`** (`UG2Presentation`: iframe 16:9 + fullscreen + back-to-case). Relative asset paths + `BASE_URL` iframe src → works under the prod `/akta-kasandry/` base (verified with `vite preview`). **Decision: audio committed** (`public/audio/`, ~21 MB, un-ignored) so the live deck has sound — GM confirmed rights.

**Reusable skill.** Packaged as a global skill `~/.claude/skills/cinematic-slideshow/` (SKILL.md + `template/` engine/base/4 themes/example + `references/` art-prompt & music-cue guides). Reusable for other sessions/aesthetics (cthulhu, strahd, fantasy, neon). Spec: `docs/superpowers/specs/2026-06-26-ug2-presentation-design.md`.

**Case hubs + tree.** Vault hubs `SPRAWY/02 URODZAJ GROZY/00 HUB` (Streszczenie · Narracja · Prezentacja · Transkrypt) and `SPRAWY/04 SÓL W RANACH/00 HUB` (Streszczenie · Cytaty · Transkrypt). Thin stub sub-pages per case so the sidebar lists all sub-pages; **NodeView special-cases their paths to render the rich React views inline** (URL stays in the case), transcript sub-page redirects to the full-bleed `/sesje`. TreeNav: leaf pages get extra indent vs session folders.

**Sól w Ranach hidden** (GM will release later): vault folder `_04 SÓL W RANACH` (generator skips `_`-prefixed dirs) → off the tree; `sol-w-ranach` filtered from `/sesje`. Reversible.

**Files:** `src/routes/{UG2Summary,UG2Narracja,UG2Presentation,NodeView,Sessions}.tsx`, `src/components/TreeNav.tsx`, `src/router.tsx`, `src/generated/content.ts`, `public/prezentacja/ug2/**`, `public/img/ug2/**`(+`cast/`), `public/audio/ug2/**`, `.gitignore`, vault `PUBLIC/SPRAWY/{02 URODZAJ GROZY,_04 SÓL W RANACH}/*.md`, global skill dir. Pushed across several commits to `main`.

**Open:** swap two presentation placeholders when generated (rats "Coś tu gnije", 3 m giant "Trzymetrowa postać"); un-hide Sól when ready; demo routes still exist alongside the in-case `/p/...` paths (minor dup).

---

## 2026-06-26 — Player margin-comments: full implementation (Stage L, Task 24 / 24 — COMPLETE)

Full implementation of the player margin-comments feature for session-summary pages, executed as 24 TDD tasks across 7 phases from plan `docs/superpowers/plans/2026-06-26-player-comments.md`. All source code shipped, 28 unit tests green, `tsc -b` clean, migrations 009–013 run.

**What shipped.** Logged-in players select text on a summary page → compose an in-character (IC, as one of their investigation characters) or out-of-character (OOC, "Ja") comment, anchored to a text fragment, shown in a right rail with threads + replies + cast filter. Comments are **public** (anon read). The feature is live on `/streszczenie-ug2` via `<AnnotatableArticle>`.

**New dev dependency (first test framework — approved by user):** Vitest + jsdom + @testing-library/react + @testing-library/jest-dom + @testing-library/user-event + @testing-library/dom (all devDependencies). No new runtime deps.

**New source files.**
- `src/lib/playerColors.ts` — 16-colour palette
- `src/lib/comments/anchor.ts` — homegrown text anchorer: `createAnchor` / `resolveAnchor` / `shortHash` / `normalizeText` — block-id hash + quote + offset + fuzzy fallback + orphan group
- `src/lib/remarkBlockIds.ts` — remark plugin; attaches `data-block-id` to block-level nodes
- `src/lib/comments/group.ts` — `groupThreads`
- `src/lib/comments/speakerOptions.ts` — `speakerOptionsFor` (cast-filtered speaker options helper)
- `src/stores/comments.ts` — load/add/edit/remove, mock fallback
- `src/stores/cast.ts` — owner/cast/profiles + `speakerOptionsForPlayer`
- `src/mocks/comments.ts`
- `src/components/comments/*` — Portrait, SpeakerPicker, CommentCard, CommentRail, ComposeBubble, useHighlights, AnnotatableArticle
- `src/types.ts` — extended with `CommentAnchor`, `Comment`, `CommentThread`, `CommentMode`, `commentMode()`

**Modified source.** `Markdown.tsx` (+remarkBlockIds), `stores/auth.ts` (+color on profile), `routes/UG2Summary.tsx` (renders via AnnotatableArticle + cast-filtered speakerOptions), `routes/AdminImport.tsx` (owner dropdown + investigation-cast checkbox per character), `src/index.css` (16 `::highlight` rules, one per palette hex), `tsconfig.node.json` (dropped `src/**/*.ts` from include — those are covered by tsconfig.app.json with DOM lib).

**Migrations 009–013 run 2026-06-26, one transaction, verified by post-migration audit.**
- 009 — `wiki.profiles.color text` (player identity colour)
- 010 — `wiki.imported_characters.owner_profile_id uuid references wiki.profiles(id) ON DELETE SET NULL` + index
- 011 — `wiki.comments` table (full schema — see [[SUPABASE_AND_SYNC]])
- 012 — `wiki.investigation_cast (page_key, character_id)` + `profiles_anon_read` policy (anon read on `wiki.profiles` so public comment cards can show author display_name + color)
- 013 — email hardening: recreated `wiki.handle_new_user` WITHOUT the email fallback; nulled existing email-like display_names (closes the leak migration 012's anon profiles read opened)

**KEY SCHEMA DECISION.** `comments.speaker_character_id` and `investigation_cast.character_id` reference `imported_characters.source_id` (the uuid natural key), NOT the bigserial `id`. The plan originally referenced `(id)` — that would have failed (uuid column vs bigint PK). The frontend keys characters by `source_id` (stable across re-imports).

**Coordination.** Checked coc-creator before migrations — repo unchanged since 2026-06-04; all new tables + columns strictly within `wiki.*`; one new RLS policy (`profiles_anon_read`) on `wiki.profiles` only; zero `public.*` writes — no conflicts.

**Accepted v1 limitations (recorded as known follow-ups).**
- MG's `comments_author_update` RLS branch passes regardless of new `author_profile_id` — MG is trusted; the app never sends `author_profile_id` on edit. Tighten later if needed.
- `resolveAnchor` fuzzy tier normalizes whitespace on gate but matches with raw `indexOf` — whitespace divergence could falsely orphan. Low probability with deterministic markdown; accepted.
- `unist-util-visit`, `mdast-util-to-string`, `unified`, `remark-parse` used as transitive deps of react-markdown (not added as top-level deps). Fragile if a future react-markdown major drops them.
- `::highlight()` pseudos can't be wildcarded — 16 static rules in `index.css`, one per palette colour. Non-palette author colour paints no fragment tint (rail still works).

**Deferred.** Realtime updates, inline dot markers, multi-level replies, comments on non-summary pages.

**Files (docs):** this journal entry, `TASK_LIST.md` (Stage L completion), `memories/project.md` (schema + dev-dep + accounts model), `SUPABASE_AND_SYNC.md` (migrations 009–013), `INTEGRATIONS.md` (fix stale SSO line).

**Open / pending.** Compose flow, admin owner/cast UI, and IC speaker options were preview-verified for the read path (comments embed-SELECT 200, RLS anon-read works, 84 block-ids, rail renders) but the login-gated write paths (compose, admin assignment) await the MG's logged-in browser test. Players not yet invited (owner assignment needs player profiles to exist).

---

## 2026-06-26 — Player margin-comments: brainstorm → spec → plan (Stage L, design-only)

Design session for a new feature: **player comments on summary pages**. Players log in and leave comments anchored to selected text fragments, shown in a right rail, **in-character (IC)** or **out-of-character (OOC)** — main content never modified. No code shipped; this session produced a validated mockup, a spec, and a full implementation plan. Mockups built with the Superpowers brainstorm visual companion (`v3.html` = target look).

**Validated UX (mockup v3).** Right rail of comment cards anchored to highlighted fragments. Speaker = a **rectangular character photo** (IC) or a **round initial tile** for "Ja" (OOC). Player identity = a colour from a **16-option palette** (rings the portrait, tints the fragment). Dense sections collapse into **one grouped thread** (stacked portraits + count) — the density solution. Single-level replies.

**Decisions (locked).** (1) Content stays in `.tsx`, comments anchor to a stable `page_key` (`streszczenie/ug2`) decoupled from the route — avoids identity migration when summaries later move to the vault. (2) Comments **public** (anon read). (3) **Homegrown anchorer**, no new dep — block-id (hash) + quote + offset + fuzzy fallback, with an "unanchored" safety group. (4) Full v1: threads + replies + cast-filtered speaker picker. (5) **Vitest + Testing Library** added (approved — first test framework in the project). (6) Realtime deferred.

**Auth correction + coordination.** Original assumption "shared Supabase Auth = SSO with coc-creator" was **wrong** — confirmed by a coc-creator code review: coc-creator is NOT on Supabase Auth (players in `public.players`, bcrypt + custom JWT; `auth.users` empty; no `on_auth_user_created` trigger), and SSO was declined 2026-05-21. Corrected the stale claim in `memories/project.md`. **Accounts decision:** Path 1 + credential parity — MG provisions separate Supabase Auth accounts using each player's **coc-creator email** (familiar login); player sets their own password via the dashboard "Invite" flow (passwords can't be copied — bcrypt). No coc-creator migration; we don't depend on their accounts. coc-creator review also caught a real **email-leak**: migration-002 trigger put `email` into `display_name` while we open anon read → fixed by **migration 013** (harden trigger to drop the email fallback + sanitize existing rows).

**Plan.** 24 TDD tasks, 7 phases: vitest harness → pure logic (anchor/colours/grouping) → migrations 009–013 (coordinated) → comments store → UI components (Portrait/SpeakerPicker/CommentCard/CommentRail/ComposeBubble/AnnotatableArticle + CSS Custom Highlight binding) → UG2 wire-in → admin owner/cast → docs. Execution deferred to a **fresh session** (heavy context here; coordination gate + migrations + account invites need the user/MG first).

**Files (docs only):** `docs/AktaKasandry_obsidian/work/2026-06-26-player-comments-design.md` (spec, NEW), `docs/superpowers/plans/2026-06-26-player-comments.md` (plan, NEW), `work/Index.md`, `memories/project.md` (auth correction), `.gitignore` (ignore `.superpowers/`). No `src/` changes.

**Open / next:** MG actions before execution — invite players (coc-creator emails), run migrations 009–013, assign colours + character owners + investigation cast in `/admin`. During execution confirm: PostgREST FK embed hint names, global CSS path + `text-patina` token, final 16-colour hex set. Then update `SUPABASE_AND_SYNC.md` + reverse the "per-page comments" out-of-scope exclusion (Task 24).

---

## 2026-06-22 — Transcript viewer simplified to read-only + first session summaries (Sól w Ranach, UG 2)

Long session continuing the `/sesje` work. Outcome: read-only viewer on the production variant, plus two full session summaries with transcript deep-links.

**Viewer simplified (Stage I).** Dropped variant switching — always loads the session's default (latest production) variant; removed the variant pill bar. Trimmed shipped data to just the two production overlays (`sol-w-ranach-parallel-split-epoch`, `ug2-current`) — deleted 9 non-default overlays (~31 MB), `variants.json` now one variant per session. Removed in-view editing (paint speaker, text edit, export corrections, copy-anchor, chunk "przypisz"); read components no longer apply localStorage corrections. `VariantBar` → `SessionHeader`. Editor capabilities stay in the store for a future separate edit screen. Kept: transcript, speaker toggles, competing chunks with %, audio seek links, 5-method votes, summary deep-links.

**Session summaries (Stage K — NEW).** Built `remarkTranscriptAnchors` plugin: `{sesja:<slug>#<utteranceId>}` (and `..` ranges) in markdown → "↪ transkrypt" pills → `/sesje/<slug>?u=<id>`; SessionView reads `?u=`, scrolls/flashes/pins the line; ProvenancePanel "⎘ Kotwica" copies the token (later removed in the read-only pass). Pages (all demo routes, to be moved into the vault later):
- `/streszczenie-demo` — **Sól w Ranach** summary (Western CoC; Salt Hills, New Mexico), + `/streszczenie-demo/cytaty`.
- `/streszczenie-ug2` — **Urodzaj Grozy (UG 2)** summary (Prohibition Boston gangster + academics dual-group), + `/streszczenie-ug2/narracja` (long-form continuous narrative produced by a sub-agent).

**Two campaign sessions reconstructed** (rosters + plots) — both end by seeding the **Klub / Akta Kasandry** (the project namesake). Sól: Kate = Cassandra Hollister. UG 2: Dr Eleine Howard recruited to the Cassandra Club. Recurring motifs across sessions: a Pastor, a water-bound Mythos creature, the Howard family, the Cassandra org.

**CRITICAL DATA LESSON (epoch vs concat).** The overlay `timeline: "epoch"` clock (`utterance.start`) is a stretched wall-clock, NOT real audio time — it spreads recorded audio across the real evening incl. break gaps, so `start` jumps. To reason about "what's on the tape" you MUST histogram by `play.start` (or use the `concat` variant), never by epoch `start`. I burned a lot of time concluding content was "missing" from epoch-`start` gaps when it wasn't. Best reading trick for plot: dump a **single channel** (e.g. the GM, `Paweł MG`) sorted by `play.start` — one mic is linear, giving a clean chronological narration spine (sorting ALL speakers by concat `start` interleaves per-channel clocks and scrambles scenes). Full write-up: [[work/2026-06-22-transcript-data-lessons]].

**Genuinely lost content (needs GM memory, not recoverable from tape):**
- **Sól w Ranach** — the whole climax (fort → ceremony → killing Boston → tunnels, ~beats 6–11) was lost to a **recorder software error** (confirmed by the user via the rpg-recorder side). Reconstructed in the summary from the GM's account, flagged "⚠ nagranie urwane", no anchors. Recorded part ends at "dawn of day 3, heading to the crater".
- **UG 2** — the **night recon + first human shootout** (between the Carmody negotiations and the academics entering) fell into a **deliberate recording pause** ([1:21:07] GM "Wyłączę teraz recording" for food + off-mic price-negotiation; resumes [1:23] already at the academics). NOT yet written — **first task next session** is to get these beats from the GM and insert a flagged "off-mic" section into both UG 2 pages.

**Recording length note (UG 2).** Audio is continuous ~2h38m (concat, 0 gaps) but that's *on-mic recorded* time — the GM paused recording several times (food, off-mic negotiation, mic recharges, dead mics). The epoch variant spreads it over ~8h45 wall-clock with big gaps, but those gap *sizes* are the same unreliable epoch derivation — treat as "a long evening with several substantial breaks", not exact. No absolute time-of-day in `build_meta`; reliable clock would need the raw `data/sessions/f14eae5b8f7b/` chunk timestamps in rpg-recorder.

**Audio still not hosted.** Decision unchanged: no in-app streaming; `audio-links.json` skeleton committed for manual Google-Drive seek links (GM to fill). Viewer shows `chNN @ mm:ss` + optional external link.

**Files:** `src/routes/{SummaryDemo,QuotesDemo,UG2Summary,UG2Narracja,SessionView,Sessions}.tsx`, `src/components/transcripts/{SessionHeader,Legend,TranscriptList,TranscriptRow,ProvenancePanel}.tsx` (VariantBar deleted), `src/lib/remarkTranscriptAnchors.ts`, `src/components/Markdown.tsx`, `src/router.tsx`, `src/index.css`, `public/transcripts/data/*` (trimmed). Plus a private GM-only note in the content vault: `G:\…\Zew Cthulhu\Sol w Ranach - ciete cytaty (GM only).md` (off-`PUBLIC/`, one cut edgy quote).

**Open:** UG 2 "śmieszne i epickie momenty" page not made; the missing UG 2 fragments (above); maybe switch viewer to the `concat` variant for sane timestamps (would require re-anchoring ~all markers); move summaries from demo routes into the vault; fold the narrative's extra details (Cayda/the "Drogi Ernesti" letter, the cave temptation) into the short UG 2 summary.

---

## 2026-06-19 — Feature: transcript provenance viewer (`/sesje`), ported from rpg-recorder

New section to read session transcripts with **competing-microphone chunks + attribution probabilities**, switch attribution variants, and correct speaker/text. Ported from the sister project rpg-recorder; full rationale in [[work/2026-06-19-transcript-viewer-port]].

**Architecture:** rpg-recorder = producer, Akta Kasandry = consumer. Single interface = `<slug>-<variant>-overlay.json` (spec mirrored from rpg-recorder's `SCHEMA.md` into `src/lib/transcripts/overlay.ts`). Audio pipeline NOT ported. Adding a session is data-only (overlay JSON + `variants.json` entry) — no code change.

**Audio decision — no in-app streaming.** Evaluated commit-to-repo / GitHub Releases / R2 / Drive-sharding; chose **manual seek links**. Each chunk shows `chNN @ mm:ss`; filling `audio-links.json` with a per-channel URL turns it into an external link to seek manually (supports sharded channels via segments). No audio committed (~300 MB/session avoided).

**Files added:**
- Data: `public/transcripts/data/` — 11 overlays (Sol w Ranach ×7, UG 2 ×4) + trimmed `variants.json` + `audio-links.json` skeleton (~39 MB JSON, no audio).
- `src/lib/transcripts/{overlay,format,data,audioLinks,corrections,effective}.ts`
- `src/stores/transcript.ts`
- `src/components/transcripts/{TranscriptList,TranscriptRow,ProvenancePanel,Legend,VariantBar}.tsx`
- `src/routes/{Sessions,SessionView}.tsx`

**Files changed:** `src/router.tsx` (+2 routes), `src/components/AppShell.tsx` (full-bleed `/sesje` + "Sesje" nav link), `src/index.css` (transcript console styles + `content-visibility` virtualization).

**Notable choices:** renderer rewritten as React/TS in the Cthulhu skin (not embedded HTML); 5000-row virtualization via CSS `content-visibility:auto` (no new dependency); ambiguous lines (`assigned:false`) render neutral with `?`; corrections persist per `<slug>.<variant>` in localStorage and export as JSON.

**Verified:** both sessions load; chunk % (48/36/16, sum 1.0, sorted winner→prob); variant switch (5094↔3550); paint + text edit persist; `tsc -b` + `vite build` green; data in `dist/`. Page screenshots hang in the headless renderer (known upstream caveat) — verified via a11y snapshot + DOM eval.

**Open follow-up (next session topic):** per-session summaries authored from transcript + GM conversation, with summary sections deep-linking into transcript sections (needs an anchor scheme + scroll-to/highlight target in the viewer).

---

## 2026-05-21 — Fix: portrait_url not shown in character importer

Characters whose portrait lives in `public.characters.portrait_url` (coc-creator's canonical field — a public Storage URL) had no thumbnail in the AdminImport list and no portrait in the CharacterSheet, because our column allowlist only fetched the legacy `profile_portrait_url` / `card_portrait_url` fields (both `null` for newer characters like Eleine Howard).

**Fix:**

- `src/lib/characterColumns.ts` — added `portrait_url` and `art_gallery` to the explicit allowlist (reviewed + approved per import design doc §7).
- `src/stores/characters.ts` — `SourceCharacter` now carries `portrait_url`; `importOne` derives the snapshot portrait preferring `portrait_url`, then the legacy fields as fallback.
- `src/routes/AdminImport.tsx` — thumbnail in the character list uses the same preference order (`portrait_url ?? profile_portrait_url ?? card_portrait_url`).

Characters with only legacy fields (Lillian Whitley) still work. Characters with no portrait anywhere (James Kelly) correctly show none.

Verified against live data: `portrait_url= SET` for all 3 characters in the DB; live bundle confirmed to contain `portrait_url`.

---

## 2026-05-21 — Content: reformat "Cytaty i sytuacje z sesji"

The "03 Cytaty i sytuacje z sesji" page under SPRAWY/01 ZNAK ŻYCIA rendered poorly — the original file used raw `_italics_` for scene descriptions inside blockquotes that conflicted with the player-quote style. Reformatted to use `---` separators between scenes and consistent `> **Speaker:** text` quote style.

`src/generated/content.ts` regenerated after the vault file was edited.

---

## 2026-05-21 — Fix: index pasted images from the whole vault

The new SPRAWY content showed `_(brak: Pasted image ….png|337)_` placeholders — the images weren't found. Root cause: Obsidian dumps pasted images into the **vault root** (`G:\…\Zew Cthulhu\`), outside `PUBLIC/`, but the generator's image index only scanned `PUBLIC/`.

**Fix (`scripts/lib/generate.ts`):**

- `indexImages` now scans `dirname(vault)` (the whole vault), not just PUBLIC, so vault-root pasted images are found. Only images *referenced* by a published page get staged, so scanning wider doesn't copy unreferenced vault images.
- Added `IMAGE_INDEX_SKIP` (memory/node_modules/.trash/.git) — narrower than `EXCLUDE_DIRS` because the index MUST descend into `attachments/` (tutorial screenshots live there). `.obsidian` etc. caught by the dotfile check.

**Result:** 54 → 66 attachments staged (the 12 pasted images), 0 `(brak:)` placeholders. Spaced filenames URL-encoded (`%20`) by `encodeURIComponent`; files on disk keep literal spaces — served fine.

Files: `scripts/lib/generate.ts`, regenerated `src/generated/content.ts`, +12 images in `public/vault-attachments/by-name/`.

---

## 2026-05-21 — Content refresh from PUBLIC (added SPRAWY + renames)

Re-ran `npm run build-content` after the GM added content + renamed folders in the vault.

- **Added:** `SPRAWY/` now populated — 3 cases (`01 ZNAK ŻYCIA` with sub-pages 00 HUB / 01 Wstęp / 02 Streszczenie / 03 Cytaty… / 04 Transkrypt… / 05 Fan content, `02 URODZAJ GROZY`, `03 ROZDARTE SUMIENIE`). Page count 28 → 34.
- **Renames applied:** e.g. `ZASADY/Zasady walki` index renamed to `01. HUB` (was `01. Wstęp i spis treści`).
- **Preserved:** Mapa Bostonu 1924 + all existing articles (Bijatyka, Terminy, full combat tutorial) intact — nothing deleted.
- **No code fix needed:** top-level slugs + `MAP_PAGE_PATH` (`swiat-npc/boston/mapa-bostonu-1924`) unchanged, so the interactive-map special-case still resolves.
- No new attachments (added content is text; 54 images unchanged).

Only `src/generated/content.ts` changed. Build clean. Pushed → auto-deploy.

---

## 2026-05-20 — Live deploy on GitHub Pages (Stage G)

Repo public + first production deploy. **Live: https://ursuscodes.github.io/akta-kasandry/**

**Repo:** `UrsusCodes/akta-kasandry` (public, same org as coc-creator). `.env*` gitignored; `public/vault-attachments/` (41 MB incl. Boston map) committed so CI builds have images without vault access.

**Deploy setup (commit "feat: GitHub Pages deploy"):**

- `vite.config.ts` — base `/akta-kasandry/` in build, `/` in dev (project-site subpath).
- `src/router.tsx` — basename from `import.meta.env.BASE_URL`.
- `src/lib/withBase.ts` + Markdown `img` override + BostonMap `IMG_URL` — prefix root-absolute `/vault-attachments/…` with the base so images load under the subpath.
- `.github/workflows/deploy.yml` — `npm ci` → build with `VITE_SUPABASE_*` repo secrets → `cp index.html 404.html` (SPA fallback) → `actions/deploy-pages`.
- `.npmrc` — `legacy-peer-deps=true` for CI `npm ci`.

**Go-live steps done (some by user, some via gh/api):**

- Repo flipped public (user-confirmed; safety layer required explicit go).
- Pages enabled with `build_type=workflow` via API.
- Secrets `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` set from `.env.local` (piped, not echoed).
- First push-triggered run failed only at the deploy step (Pages not yet enabled); after enabling + secrets, a dispatched run succeeded (build ✓ / deploy ✓).

**Verification (curl against live):** root 200; deep link serves the full SPA (404.html fallback — HTTP 404 status is cosmetic, app loads + routes); assets at `/akta-kasandry/assets/…`; `boston-map-1924.jpg` 200.

**Decisions / caveats:**

- GH Pages deep-link returns HTTP 404 status (body is the SPA, works in browser). Only a host with real SPA fallback (Cloudflare Pages/Vercel) eliminates it — accepted tradeoff.
- Node 20 action deprecation warnings (deadline June 2026) — bump later.
- Auto-deploy: every push to `main` rebuilds + redeploys.

**Open questions / next steps:** custom domain (optional); migrate Actions to Node 24 before June 2026.

---

## 2026-05-20 — Imported characters in the tree (H2)

Imported characters now appear as pages under `BADACZE/<player>/<character>` and render as character sheets. Required moving the reader from a static content tree to a dynamic (merged) one.

**Files touched:**

- `src/types.ts` — `ContentNode.character?` field + `ImportedCharacterData` type.
- `src/stores/content.ts` — new. Holds the merged tree (static PUBLIC snapshot + imported characters grafted under `BADACZE/`). `load()` fetches `wiki.imported_characters`, groups by player (`player_name` or `Gracz #<shortid>`), builds `BADACZE/<player-slug>/<char-slug>` subtree. Static tree is the synchronous default.
- `src/routes/CharacterPage.tsx` — new. Renders a sheet from the JSONB snapshot (portrait, occupation/era/status, player, details, characteristics grid, derived, appearance, backstory, equipment). Defensive against unknown/missing field shapes.
- `src/routes/NodeView.tsx` — reads tree from content store; renders `<CharacterPage>` when `node.character` is set.
- `src/components/TreeNav.tsx`, `src/components/Breadcrumbs.tsx`, `src/routes/Landing.tsx` — switched from importing the static tree to reading the content store.
- `src/components/AppShell.tsx` — calls content `load()` on mount.
- `src/routes/AdminImport.tsx` — reloads the content tree after import/remove so new pages appear immediately in the sidebar.

**Decisions:**

- **Player folder grouping**: `player_name` (admin-typed) if present, else `Gracz #<source_player_id[0:8]>`. Matches the requested `BADACZE / <gracz> / <postać>` structure.
- **Content store, not static import**: components subscribe to a zustand store so imported characters merge in at runtime. The static `src/generated/content.ts` remains the synchronous seed.
- **Wikilink resolver still static**: `[[Character]]` won't resolve yet (resolver reads the static tree). Acceptable v1 — characters aren't wikilink targets in existing content. Revisit if needed.

**Verification:** `npm run build` clean.

**Open questions / next steps:** test the full loop — import a character, see it appear under BADACZE/<player>/ in the sidebar + a rendered sheet. Then: tune the CharacterPage layout once we see real coc-creator JSONB shapes; consider re-import "refresh stale" bulk action.

---

## 2026-05-20 — Edit existing pins (Stage E feature-complete)

Added in-place editing of existing pins — the last CRUD gap.

**Files touched:**

- `src/components/BostonMap.tsx` — popover (edit mode) now has **Edytuj** + **Usuń** buttons. "Edytuj" opens the same overlay form pre-filled with the pin's title/label/description/color; save calls `updatePin`. The form is shared between add and edit (`pending` vs `editing` state drives header, button label "Dodaj"/"Zapisz", and which store method runs). Map clicks are ignored while editing so they don't pop a competing "new pin" form.

**Decisions:**

- One shared overlay form for both add + edit — `editing: Pin | null` and `pending: {x,y} | null` are mutually exclusive; `submitForm` branches on which is set.

**Verification:** `npm run build` clean.

Stage E is now feature-complete for v1: view + add + move + edit + delete + colors + grouped list, all MG-gated (UI `isMG && source==='supabase'` + `wiki.pins` RLS). Only realtime sync remains deferred.

---

## 2026-05-20 — Map pin polish: dbl-click fix, colors, pin list

Three user-requested improvements to pin editing.

**1. Double-click placement bug.** In edit mode a double-click panned/zoomed the map (Leaflet's `doubleClickZoom`), and the form appearing as a block above the map reflowed the layout — together they shifted where the pin landed. Fixed: `doubleClickZoom={!editMode}` + the new-pin form is now an `absolute` overlay (top-right of the map), so it no longer reflows.

**2. Pin colors.** 10-option palette in `src/lib/pinColors.ts` (muted, period-appropriate: Złoto/Miedź/Rdza/Krew/Śliwka/Atrament/Patyna/Mech/Cyna/Kość). Migration `008_pins_color.sql` adds `wiki.pins.color` (nullable, defaults gold). Color picker (swatches) in the add-pin form; markers render in their color via a cached `divIcon` factory. `Pin` type + mock pins + store all carry `color`.

**3. Pin list below the map.** New `PinList` component: all pins grouped by color (palette order) then alphabetical (Polish collation) within each group. Each group shows a swatch + color name + count. Clicking a pin flies the map to it and opens its popup — done via per-marker refs (`markerRefs`) + the map instance captured from `MapContainer ref={setMap}`.

**Files touched:**

- `supabase/migrations/008_pins_color.sql` — new (adds color column)
- `src/lib/pinColors.ts` — new (palette + `colorName`/`colorOrder` helpers)
- `src/types.ts`, `src/mocks/pins.ts`, `src/stores/pins.ts` — color field threaded through
- `src/components/BostonMap.tsx` — doubleClickZoom fix, overlay form, color picker, colored icons, marker refs, fly-to-on-list-click, `PinList`

**Decisions:**

- Marker refs + `MapContainer ref={setMap}` (react-leaflet v5 returns the Leaflet map from the ref) — clean way to drive imperative `flyTo` + `openPopup` from the list.
- divIcon cache keyed by hex — avoids rebuilding identical icons every render.

**Verification:** `npm run build` clean.

**Reminder for user:** run migration `008_pins_color.sql` in SQL Editor before the color field works against the live table (existing pins backfilled to gold).

**Open questions / next steps:** edit-existing-pin text/color still pending (delete+re-add for now). Otherwise Stage E is feature-complete for v1. Next: C+reader-swap → D (page editing), or H (character import).

---

## 2026-05-20 — Map pin editing (Stage E proper)

MG can now manage pins on the Boston map through the app. Backed by `wiki.pins`.

**Files touched:**

- `src/stores/pins.ts` — (from E1) reads `wiki.pins`, mock fallback, CRUD methods.
- `src/components/BostonMap.tsx` — edit mode:
  - **Toolbar** "Tryb edycji: WŁ/WYŁ" — only rendered for MG on the live table (`isMG && source === 'supabase'`).
  - **Add**: click empty map in edit mode → `MapClickHandler` (useMapEvents) captures coords → form panel (title required, label, description) → `addPin` → `wiki.pins` insert.
  - **Move**: markers are `draggable` in edit mode → `dragend` → `updatePin` with new x/y.
  - **Delete**: marker popup gets "Usuń pin" button in edit mode → `deletePin`.
  - Coord conversion `latlngToXY` mirrors Y (CRS.Simple measures from bottom) + clamps to image bounds.
  - Edit mode auto-disables on logout (`useEffect` on `isMG`).
- `supabase/seeds/pins.sql` — (from E1) optional 3-pin seed.

**Decisions:**

- **Edit affordances gated twice**: UI hides them unless `isMG && source==='supabase'`, and `wiki.pins` RLS rejects non-MG writes at the DB. Belt + suspenders.
- **New-pin form is a panel above the map**, not a Leaflet popup — popups re-render and lose form state mid-typing.
- **Reload after each mutation** instead of optimistic update — table is tiny, keeps store logic trivial. Realtime sub deferred (free-tier egress; single-MG doesn't need live multi-client sync yet).
- **Editing an existing pin's text** (title/label/description) not built yet — drag-move + delete + re-add covers it for now. Small follow-up: add an "Edytuj" form to the popup.

**Verification:** `npm run build` clean.

**Open questions / next steps:** test the full add/drag/delete loop against live `wiki.pins` (run the seed first if you want starter pins). Then: edit-existing-text polish, realtime sub, or move to next stage (C+reader-swap → page editing, or H import).

---

## 2026-05-20 — Auth login UI (Stage D — login half)

First use of the live Supabase backend from the frontend. MG/Admin login; player editing deferred per user.

**Files touched:**

- `src/stores/auth.ts` — new. Zustand auth store: `init()` (loads session + profile role, subscribes to `onAuthStateChange`), `signIn`, `signOut`. Degrades gracefully when credentials absent (`enabled: false` → site stays anon-readable). `useIsMG()` selector. First module to actually import `getSupabase()`.
- `src/routes/Login.tsx` — new. Email/password form (react-hook-form native validation — avoided `@hookform/resolvers` to stay within the locked dep list). Shows a clear "Supabase not configured" message when disabled. Redirects back to origin (`location.state.from`) after login.
- `src/components/AppShell.tsx` — calls `init()` on mount; header shows "DisplayName (MG)" + Wyloguj when signed in, "Zaloguj" link otherwise. Auth affordances only render when `enabled`.
- `src/router.tsx` — `/login` route.

**Decisions:**

- **No `@hookform/resolvers` / zodResolver.** Login validation is trivial (email format + required); react-hook-form's native `register` rules cover it. Keeps the dep list locked.
- **Graceful degradation.** Without `.env`, `enabled=false` — no login UI, site is pure anon read. So the build/dev works for anyone who clones without credentials.
- **MG-only scope for now.** Player signup/editing deferred (user: "edycja przez graczy jest dalej w planie"). No signup form yet — accounts created via dashboard, role promoted via SQL.

**Verification:** `npm run build` clean. Bundle now 1.84 MB (supabase-js pulled in) — code-split is a stage-G follow-up.

**Open questions / next steps:** what does MG edit first — pages (needs push-vault --execute + reader swap) or pins (isolated)? Asking the user.

---

## 2026-05-20 — Supabase migration executed — Stage A complete

Ran the full migration against the shared Supabase project (dashboard SQL Editor mode). Stage A is done — first working backend.

**What landed live:**

- Schema `wiki` + 5 tables (`profiles`, `pages`, `revisions`, `pins`, `imported_characters`) + triggers (`wiki_on_auth_user_created`, `write_revision`, `set_updated_at`) + RLS policies.
- `wiki` exposed in PostgREST; explicit table grants for anon/authenticated.
- Bucket `wiki-attachments` (public) + 4 storage policies.
- MG account `storage.station2023@gmail.com` (role `mg`).
- `src/lib/supabase.ts` ready (still dormant — no component imports it yet).

**Two gotchas hit + fixed (now in repo for next time):**

1. **db_schemas didn't propagate.** Dashboard showed "3 of 3 schemas exposed" but PostgREST returned `PGRST106 Invalid schema: wiki`. The `pgrst.db_schemas` GUC on the `authenticator` role was never written by the dashboard Save. Fixed with `alter role authenticator set pgrst.db_schemas = 'public, graphql_public, wiki'` + `notify pgrst, 'reload config'`. Documented as a known-issue in the runbook.
2. **Missing table grants.** After exposing the schema, queries returned 404 — the tables created in 002..006 lacked anon/authenticated SELECT grants (the `alter default privileges` in 001 didn't apply through SQL Editor). Added `007_grants.sql` with explicit `grant ... on all tables in schema wiki`. Confirmed: `wiki.imported_characters` and `wiki.pages` both return `[]` after.

**Files touched (this entry):**

- `supabase/migrations/007_grants.sql` — new, explicit grants (idempotent)
- `supabase/migrations/001_schema_wiki.sql` — comment flagging that 007 is the real source of truth for grants
- `docs/RUNBOOKS/supabase-migration.md` — 7-file table, two known-issue blocks, troubleshooting rows, rollback resets db_schemas GUC
- `docs/AktaKasandry_obsidian/TASK_LIST.md` — Stage A marked complete

**Decisions:**

- `alter role authenticator set pgrst.db_schemas` is a manual SQL step (project-wide, additive — coc-creator unaffected). Kept out of migration files because it's a project setting, not schema DDL. **Caveat logged:** if coc-creator clicks Save in their Data API settings, it may drop `wiki` — re-run the `alter role` line.

**Open questions / next steps:**

- Storage "broad SELECT policy" hygiene warning — drop anon SELECT on storage.objects, add mg-only (public bucket serves images via `/object/public/` regardless). Pending user go-ahead.
- Pick the next stage to build: C (push-vault --execute), E (pin editing), H (character import), or D (page editor save).

---

## 2026-05-20 — coc-creator review feedback folded in

coc-creator-Claude reviewed our plan, landed an `INTEGRATIONS.md` on their side, and surfaced 4 non-blocking flags. Captured here so they don't get lost.

**Files touched:**

- `docs/AktaKasandry_obsidian/INTEGRATIONS.md` — replaced the "coordination doc is one-sided" warning with success callout. New "Cross-project integration surfaces (load-bearing)" table listing `anon_read_characters` as the load-bearing public API contract. New "Coordination triggers" sections (us→them, them→us; 4 triggers each side ping the other). Full feedback log at the bottom.
- `docs/AktaKasandry_obsidian/work/2026-05-20-import-coc-creator-characters.md` — section 6 updated with the portrait-URL-drift mitigation as v2 follow-up. New section 7 with the column allowlist (32 explicit names; admin UI extractor must use this, never `select *`). Coordination items section now references the four resolved flags.
- `docs/RUNBOOKS/supabase-migration.md` — explicit warning never to run `supabase db push` from this repo (sequence collision in the shared `schema_migrations` table — both sides run SQL Editor by hand).
- `supabase/migrations/005_imported_characters.sql` — header comment expanded to flag the column-allowlist constraint on the future admin UI.

**Decisions:**

- DDL doesn't change — the `data jsonb` column stays, but the *extractor* feeding it must use the allowlist. Constrains the future admin UI, not the storage.
- Portrait mirroring deferred to v2 as `wiki-attachments/imported-characters/<source_id>.{ext}` at import time. v1 accepts URL drift; admin re-imports when they notice.
- Migration mode confirmed: SQL Editor only, never `supabase db push`. Both sides hold the same rule.

**Verification:** build still clean.

**Open questions / next steps:** user has Supabase access; proceeding through the runbook (Phase 1 → 6).

---

## 2026-05-20 — Supabase migration prep: SQL files + client + runbook

User asked what they need to do to actually run the migration. Prepared everything that doesn't require Supabase access — gated steps only need their decisions + dashboard time.

**Files touched:**

- `supabase/migrations/001_schema_wiki.sql` — `create schema wiki` + default privileges. Comment flags the dashboard step (Settings → API → Exposed schemas → add `wiki`).
- `supabase/migrations/002_profiles.sql` — `wiki.profiles` + first-login trigger on `auth.users` + RLS (auth-read, self-update with role-locked `with check`).
- `supabase/migrations/003_pages.sql` — `wiki.pages` + `wiki.revisions` + revision-write trigger (`SECURITY DEFINER`) + RLS (anon-read, mg-write).
- `supabase/migrations/004_pins.sql` — `wiki.pins` + `set_updated_at` trigger + RLS (anon-read, mg-write).
- `supabase/migrations/005_imported_characters.sql` — `wiki.imported_characters` + RLS (anon-read per 2026-05-20 decision, mg-write).
- `supabase/migrations/006_storage.sql` — RLS policies on `storage.objects` for `wiki-attachments` (anon read, mg insert/update/delete). Bucket itself is created via dashboard.
- `src/lib/supabase.ts` — lazy Supabase client init, reads env, default schema `wiki`, throws clear error when credentials missing.
- `docs/RUNBOOKS/supabase-migration.md` — 6-phase step-by-step: prerequisites, client wire, expose schema, run migrations, create bucket, create MG account, smoke-test. Includes verify checks and a rollback section.
- `docs/AktaKasandry_obsidian/TASK_LIST.md` — Stage A user-action items spelled out.
- `docs/AktaKasandry_obsidian/TECHNOLOGY_MASTERMIND.md` — link to runbook.

**Decisions:**

- **Migration mode: dashboard SQL Editor** (user choice 2026-05-20). Files are committed in repo for audit + repeatability, but executed manually. Supabase CLI is the natural upgrade if we add staging.
- **No `Database` codegen yet.** `src/lib/supabase.ts` types the client as the default `SupabaseClient` (with a cast to swallow the schema-typed return from `createClient`). When we want compile-time table typing, run `supabase gen types typescript` and update the cast.
- **`first-login trigger`** sets default `role='gracz'`. Promotion to `'mg'` is a manual UPDATE for now; admin UI for role management is stage D.
- **Revision trigger writes via `SECURITY DEFINER`** so it bypasses RLS on `wiki.revisions` (which is read-only for clients).

**Verification:** `npm run build` clean. No file imports `src/lib/supabase.ts` yet — it's wired but dormant until the migration lands.

**Open questions / next steps:** All gated on the user running through the runbook. When migration lands: unblock `npm run push-vault --execute`; then stage D / E proper.

---

## 2026-05-20 — Auto-refresh watcher for vault changes

User asked for an auto-update script — edit a `.md` in Obsidian, see the change in the running site without re-running the generator by hand.

**Files touched:**

- `scripts/lib/generate.ts` — new. Extracted the generator core (walk, image-stage, serialize, EXTRA_ASSETS copy) from `build-content.ts` so both the one-shot script and the watcher can call `generateContent({ vault })`.
- `scripts/build-content.ts` — slimmed to a thin entry that calls `generateContent` once.
- `scripts/watch-content.ts` — new. Initial regen on startup; then watches `dirname(VAULT)` recursively with Node's built-in `fs.watch` (`recursive: true` works fine on Windows, project's primary platform). Filters to changes inside PUBLIC or to a named EXTRA_ASSET; debounces ~500 ms; ignores `.obsidian/`, swap files, tmp.
- `package.json` — `watch-content` script wired.
- `docs/AktaKasandry_obsidian/TECHNOLOGY_MASTERMIND.md` — added a "Content pipeline" section explaining the two-terminal workflow.

**Decisions:**

- **Node built-in `fs.watch`, not chokidar.** Chokidar would be more robust on Linux/macOS but is a new top-level dep. Windows (the project's host) has solid native recursive watching. If we ever support Linux/macOS for dev, swap in chokidar then.
- **Watch `dirname(VAULT)`, not VAULT itself.** That way we also catch changes to EXTRA_ASSETS (e.g. swapping the Boston map JPG) without a second watcher.
- **Two-terminal workflow** (`npm run dev` + `npm run watch-content`) instead of bundling into a single command. Keeps each script doing one thing; user can stop the watcher independently of the dev server.
- **No new deps.** rehype-raw was the last; the watcher is built on Node built-ins.

**Verification:** smoke test — watcher starts cleanly, completes initial regen in ~300 ms (28 pages, 54 attachments), then idles waiting for events. Build clean.

**Open questions / next steps:** Test a real edit-and-save loop against the live Obsidian vault — should be transparent but worth a single end-to-end check.

---

## 2026-05-20 — Add rehype-raw to preserve GM's HTML img formatting

Follow-up to the code-block fix. User opted to add `rehype-raw` (~6 KB gzipped) so the GM's `<img width="220" align="right">` thumbnail pattern survives the render — was either that or keep the simplified markdown-only rendering that lost GM intent.

**Files touched:**

- `package.json` — `rehype-raw: ^7.0.0` added.
- `src/components/Markdown.tsx` — `rehypePlugins: [rehypeRaw]` added.
- `src/routes/DraftView.tsx` — same plugin wired into the `/draft` preview pane (matches read-mode behaviour).
- `scripts/build-content.ts` — reverted the HTML→markdown img conversion. The `<img>` HTML now passes through unchanged; only its `src` is rewritten to `/vault-attachments/by-name/…`.
- `src/index.css` — added attribute selectors `img[align="right"]` / `img[align="left"]` mapping to `float` + margin (modern HTML dropped the `align` attribute's default behaviour); plus `clear: both` on headers so floats don't bleed into the next section.

**Decisions:**

- Trusted vault → raw HTML rendered without sanitization is OK for now. **Stage D (player-edited pages) will need a sanitizer** — `rehype-sanitize` is the obvious companion. Noted as a follow-up; don't ship player editing without it.
- Floats cleared on h1/h2/h3 to avoid the classic float-overflows-next-section problem.

**Verification:** build clean; regenerated content shows GM's full `<img>` tags intact with rewritten `src`. HMR live in dev.

**Open questions / next steps:** Add `rehype-sanitize` before stage D editing is unlocked. New top-level dep — same approval path as today.

---

## 2026-05-20 — Fix: markdown rendering bugs (code-block trap + HTML imgs)

User screenshot showed all page bodies rendered as raw monospace text with wikilinks shown as literal `[[Name]]`. Two root causes:

1. **The content generator was indenting every line of body strings** when serializing them into `src/generated/content.ts` (for pretty-print). Each line in the generated string had 14+ leading spaces, which CommonMark interprets as an indented code block → react-markdown rendered the entire body as `<pre><code>…</code></pre>`, so no plugins fired (no `remark-gfm`, no `remarkWikilinks`, no `<p>` wrapping). Fix: `serializeTree` now uses `JSON.stringify(tree, null, 2)` — strings are properly escaped, no per-line whitespace damage.
2. **Raw `<img>` HTML tags rendered as literal text** because react-markdown ignores raw HTML by default and we don't have `rehype-raw`. Fix: `rewriteImages` in the generator now converts `<img src="…" alt="…" width="…" align="…">` to markdown `![alt](src)`. Side effect: GM's `width`/`align`/`style` attributes are lost — images render full-width in document flow rather than right-aligned thumbnails with text wrap.

**Files touched:**

- `scripts/build-content.ts` — `serializeTree` swapped to `JSON.stringify`; `rewriteImages` final `<img>` pass now emits markdown img form.
- `src/index.css` — added `overflow-wrap: anywhere` to `.prose-cthulhu` and `display: block; overflow-x: auto` on tables — safety nets for long URLs and wide tables.
- `src/generated/content.ts` — regenerated; bodies are now clean JSON strings.

**Decisions:**

- **No rehype-raw in this commit.** Adding it would let us keep the GM's `<img width="220" align="right">` semantics (thumbnails with text wrap) but it's a new top-level dep — gated on explicit user approval per `memories/project.md`. Convert-to-markdown was the safer default.
- If the user later wants to preserve `width`/`align`, the work would be: install `rehype-raw`, pass it as a `rehypePlugin` in `src/components/Markdown.tsx` + `src/routes/DraftView.tsx`, and skip the HTML→markdown conversion in `rewriteImages`.

**Verification:** `npm run build` clean; HMR live in dev; regenerated content has 0 leading-whitespace traps and 0 raw `<img>` tags (only one remains, in the map article — stripped at render time by `stripLegacyMapEmbed`).

**Open questions / next steps:** Ask user whether to add `rehype-raw` to preserve GM's right-aligned image formatting (separate work-note + commit).

---

## 2026-05-20 — Boston map: switch from OSM tiles back to real 1924 JPG

User flagged that I'd misread the spec — they wanted the 1924 Rand McNally graphic *as the base layer*, with Google-Maps-style UX on top (pan/zoom/pins). Earlier in the same session I'd built it as OSM tiles. Corrected.

**Files touched:**

- `scripts/build-content.ts` — added `EXTRA_ASSETS` list, copies `boston-map-1924.jpg` from one level above the vault into `public/vault-attachments/by-name/`.
- `src/components/BostonMap.tsx` — back to `ImageOverlay` + `CRS.Simple`, points at the staged 13 MB JPG. Scroll-wheel zoom, pan, popups preserved.
- `src/mocks/pins.ts` — pin coords back to image-local x/y on the 7803×11702 source. Rough positions guessed from a cold read of the JPG; GM should nudge.
- `src/types.ts` — `Pin` back to `{ x, y }`.
- `docs/AktaKasandry_obsidian/work/2026-05-20-public-snapshot-and-osm-map.md` — corrected to describe the JPG approach (kept filename for link-stability; renamed heading).
- `docs/AktaKasandry_obsidian/work/Index.md`, `TASK_LIST.md` — updated.

**Decisions:**

- The 1924 JPG lives next to PUBLIC (not inside it) — the generator's `EXTRA_ASSETS` list copies it across. Same path on every refresh; rest of the pipeline is unchanged.
- 13 MB JPG ships once per first map view. Pre-tiling via `gdal2tiles` would chunk it for faster first-paint; noted as a follow-up, not done.

**Verification:** dev server returns 200 on the map article; `GET /vault-attachments/by-name/boston-map-1924.jpg` → 200, Content-Length 13683422. Build clean.

**Open questions / next steps:** Pin positions need the GM to eyeball — Mount Auburn might be off the NW extent of the Rand McNally cut.

---

## 2026-05-20 — PUBLIC snapshot + OSM tile map

User asked for a live version backed by the real `G:\…\PUBLIC` structure and an interactive (Google-Maps-style) Boston map instead of the static SVG placeholder.

**Files touched:**

- `scripts/build-content.ts` — new generator. Walks `VAULT_PUBLIC` (default `G:\…\PUBLIC`), writes `src/generated/content.ts` with the full tree (~28 pages, ~92 KB), copies referenced images to `public/vault-attachments/by-name/`, rewrites Obsidian / markdown / HTML image refs to that flat dir.
- `package.json` — `build-content` script wired.
- `src/generated/content.ts` — autogenerated snapshot; committed for boot-on-clone.
- `src/content/index.ts` — re-exports `contentTree` from generated. The single import point for components and scripts.
- `src/mocks/content.ts` — deleted (replaced by content/).
- `src/lib/wikilinks.ts` — `parseWikilink` now strips `#anchor` from the target so wikilinks like `[[Part 0f - …#MANEWR W WALCE|Manewry]]` resolve to the page (anchor dropped for now; rehype-slug follow-up).
- `src/lib/specialPages.ts` — new tiny registry: `MAP_PAGE_PATH` constant + `stripLegacyMapEmbed` helper.
- `src/components/BostonMap.tsx` — rewritten on OpenStreetMap `TileLayer` (lat/lng pins, scroll-wheel zoom, attribution). No `ImageOverlay` any more.
- `src/mocks/pins.ts` — pin coords swapped to real lat/lng (Hale Manor / Whitlock House / Mount Auburn).
- `src/types.ts` — `Pin` now `{ lat, lng }` instead of `{ x, y }`.
- `src/routes/NodeView.tsx` — special-cases `MAP_PAGE_PATH`: renders `<BostonMap />` above the cleaned-up article body.
- `src/routes/MapView.tsx` — deleted. Map article is reached via the content tree, not a top-nav.
- `src/router.tsx` — `/map` route removed.
- `src/components/AppShell.tsx` — `Mapa` link removed from top nav.
- `src/stores/draft.ts` — sample text now references real PUBLIC pages (`[[Bijatyka]]`, `[[Mapa Bostonu 1924|mapa]]`, `[[Tutorial walki — hub]]`, `[[Duży sukces]]`).
- `public/maps/boston-placeholder.svg` — deleted.
- `.gitignore` — `public/vault-attachments/` added (the 28 MB of screenshots are regenerated on demand).
- `docs/AktaKasandry_obsidian/work/2026-05-20-public-snapshot-and-osm-map.md` — new work note.
- `docs/AktaKasandry_obsidian/work/Index.md`, `TASK_LIST.md` — updated.

**Decisions:**

- Generator is read-only against the vault — only writes inside the repo. Re-run via `npm run build-content` after PUBLIC changes.
- Attachments copied flat (`by-name/<basename>`). Filename collisions across folders would clobber; Obsidian discourages duplicates and the current vault has none.
- Image references rewritten in the generator, not at render time — keeps the rendered markdown stable and avoids re-parsing on every page render.
- OSM tiles (no API key, free tier). Period-accurate 1924 tiles deferred — separate research follow-up.
- Wikilink anchors: stripped on parse for now (`#section` part dropped). `rehype-slug` would let us route to the anchor — note it costs a new top-level dep; gated on explicit user approval.

**Verification:**

- `npm run build-content` → 28 pages, 54 attachments staged.
- `npm run build` → clean (2.8s).
- Dev server (HMR reload, port 5174 since 5173 was held by a previous instance) returns 200 on `/`, `/p/swiat-npc/boston/mapa-bostonu-1924` (with the OSM map), `/p/zasady/terminy/bijatyka`, `/p/zasady/zasady-walki/tutorial-walki/part-1-przed-walka` (with tutorial screenshots), and `/vault-attachments/by-name/01-mapa-spotkanie-na-drodze.png` (image is served).

**Open questions / next steps:**

- `rehype-slug` adoption (anchor support for wikilinks) — costs a top-level dep, ask user.
- Period-accurate Boston 1924 tile layer — separate research.

---

## 2026-05-20 — Refactor: drop Shelf/Book/Chapter, use recursive Obsidian-style tree

User flagged the fixed Shelf > Book > Chapter > Page hierarchy as a BookStack artifact. The real vault is just folders nested freely. Replaced the data model and most of the UI in a single commit.

**Files touched:**

- `src/types.ts` — `Shelf`/`Book`/`Chapter`/`Page` deleted; single `ContentNode` with `kind: 'folder' | 'page'` + arbitrary nesting.
- `src/lib/tree.ts` — new: `slugify`, `walkTree`, `findByPath`, `findByWikilinkTarget`, `buildTree`. Wikilinks support `[[Page]]` (whole-tree first-match) and `[[Folder/Sub/Page]]` (path-form by name) — Obsidian convention.
- `src/mocks/content.ts` — rewritten as `buildTree({…})` over a nested object. 12 mock pages, depth 2–3, all top-level folders shown in the screenshot's style.
- `src/lib/wikilinks.ts` — resolver swapped to `findByWikilinkTarget`; relative imports so tsx scripts can pick it up.
- `src/router.tsx` — collapsed to 4 routes: `/`, `/p/*` (catch-all), `/map`, `/draft`.
- `src/components/TreeNav.tsx` — new: recursive collapsible sidebar (▸/▾ indicator, auto-expand ancestor chain on route change).
- `src/components/AppShell.tsx` — swapped sidebar to `<TreeNav>`.
- `src/components/Breadcrumbs.tsx` — derives crumbs from URL segments + tree lookup.
- `src/routes/NodeView.tsx` — new: catch-all view, handles page bodies and folder-with-children equally.
- `src/routes/Landing.tsx` — top-level node cards.
- `src/routes/ShelfView.tsx`, `BookView.tsx`, `ChapterView.tsx`, `PageView.tsx` — deleted.
- `scripts/lib/walk.ts` — recursive walker; honours `attachments/`, `memory/` exclusions seen in the real vault.
- `scripts/push-vault.ts`, `scripts/pull-vault.ts` — adjusted to flat-path model.
- `docs/AktaKasandry_obsidian/work/2026-05-20-recursive-content-tree.md` — new work note with rationale + trade-offs.
- `docs/AktaKasandry_obsidian/work/Index.md` — decision logged.
- `docs/AktaKasandry_obsidian/TECHNOLOGY_MASTERMIND.md` — routing + component-tree sections updated.
- `docs/AktaKasandry_obsidian/SUPABASE_AND_SYNC.md` — added "schema sketch needs update" banner at top.

**Decisions:**

- Single `ContentNode { kind: 'folder' \| 'page' }`. No artificial hierarchy levels.
- URL slugs are slug-form (lowercase ASCII + dashes). Display names with diacritics resolved by walking the tree.
- Wikilinks still by **name**. Two forms supported: leaf (`[[Page]]`) and path (`[[Folder/Page]]`).
- `walkVault` now recursive; excludes `attachments/` and `memory/` siblings as seen in the screenshot.
- `wiki.pages` schema needs update (banner added to SUPABASE_AND_SYNC.md) — should become `path TEXT PRIMARY KEY` + `name` + `body` + `ready_to_sync`, no shelf/book/chapter columns.

**Verification:**

- `npm run build` → clean (3.5 s, same bundle ±1 KB).
- `npx tsx scripts/push-vault.ts` → walks 3 fixture pages at depth 3 inside `sample-vault/`.
- `npx tsx scripts/pull-vault.ts` → enumerates all 12 mock pages.
- Dev server (HMR) reloads cleanly. `curl http://localhost:5173/p/tlo-historyczne/miasto/beacon-hill` returns 200.

**Open questions / next steps:** Refresh the `wiki.pages` DDL sketch in `SUPABASE_AND_SYNC.md` so it matches the recursive model before the migration runs.

---

## 2026-05-19 — Framework session TL;DR

**What shipped today (10 commits on `main`):**

- A1+A2 — Vite + React 19 + TS + Tailwind v4 scaffold; locked stack deps; Cthulhu skin ported to `@theme` tokens (palette, Cinzel/Cormorant/Special Elite, `.prose-cthulhu` for rendered markdown). Polish diacritics verified.
- B1 — `AppShell` with always-visible Shelf sidebar, breadcrumbs, full routing tree (`/`, `/s/:shelf`, `/s/:shelf/b/:book`, `/c/:chapter`, `/p/:page`, `/map`, `/draft`).
- B2 — Mock content tree: 3 shelves × 5 books × ~10 pages, Polish text + wikilinks + GFM tables + code + blockquotes + images.
- B3 — Markdown render via `react-markdown` + `remark-gfm` + custom `remarkWikilinks` (AST-level, code-safe). Shared parser/resolver in `src/lib/wikilinks.ts`. Decision documented in `work/2026-05-19-wikilink-plugin`.
- C1 — `scripts/push-vault.ts` dry-run; cleanup ported from `import.py`; `--execute` gated in code with a clear approval-needed error.
- C2 — `scripts/pull-vault.ts` dry-run; symmetric `--execute` gating; mock content used as stand-in source until Supabase wires up.
- E1 — `BostonMap` component with `react-leaflet` `ImageOverlay` over a 1000×1500 SVG placeholder; 3 mock pins with popovers in Cthulhu skin. Real 13 MB JPG deliberately not committed.
- D1 — `@uiw/react-md-editor` integrated on `/draft` with in-memory zustand store; preview uses the same remark pipeline as read mode. Decision documented in `work/2026-05-19-editor-choice`.

**Final build:** clean — see next entry's verification.

**Where to start next session (Paweł):**

1. Open the dev server (`npm run dev`) and click through `/`, a shelf, a book, a page (verify wikilink links work), `/map`, `/draft` (type Polish, watch preview).
2. Read `memories/project.md` "Current status" + "What needs the user" — three concrete unblockers waiting.
3. Easiest next step that doesn't need Supabase: copy the real `boston-map-1924.jpg` and swap `IMG_URL` in `BostonMap.tsx`.
4. When ready for Supabase: coordinate with coc-creator (see `INTEGRATIONS.md`), then port `SUPABASE_AND_SYNC.md`'s draft DDL into a migration and run it. Once schema exists, both `--execute` paths can be unlocked one at a time.

**What is *not* done and *not* faked:**

- No Supabase migration was run.
- No `.env` was populated (only `.env.example`).
- No auth provider was configured.
- No GH Pages deploy.
- No real Boston map JPG was copied into the repo.
- Push/pull scripts run dry-run only — `--execute` exits 1 on both.

---

## 2026-05-19 — D1: Markdown editor (`/draft`)

**Files touched:**

- `docs/AktaKasandry_obsidian/work/2026-05-19-editor-choice.md` — comparison of `@uiw/react-md-editor` vs `react-markdown-editor-lite` vs `milkdown`. Decision: uiw.
- `src/stores/draft.ts` — zustand store; in-memory only (no persistence) with a polish-flavoured initial sample.
- `src/routes/DraftView.tsx` — `MDEditor` with `preview="live"`. Preview pane wired with the same `remarkGfm` + `remarkWikilinks` plugins and the same react-router-aware `<a>` override as `src/components/Markdown.tsx`.
- `docs/AktaKasandry_obsidian/work/Index.md` — editor question marked resolved.

**Decisions:**

- Editor pick: `@uiw/react-md-editor` — full rationale in the work note. Key driver: preview accepts our existing remark plugins, so no second rendering pipeline.
- In-memory only. Stage D proper will replace with auth-gated write to `wiki.pages` + `wiki.revisions`.
- Editor uses `data-color-mode="light"` on its parent — the package's dark-mode CSS would clash with the parchment background.

**Verification:** `npm run build` → 3.3 s; JS 1.53 MB (gzip 509 KB). Code-split deferred to stage G per the work note's accepted trade-off.

**Open questions / next steps:** Final — update `memories/project.md` with what shipped + what waits for user; final journal entry.

---

## 2026-05-19 — E1: BostonMap placeholder

**Files touched:**

- `public/maps/boston-placeholder.svg` — 1000×1500 inline SVG: dark teal background, ribbed grid, double gold frame, Cinzel "BOSTON / A.D. 1924" title. Deliberately *not* the 13 MB real map — the placeholder communicates "this is where the map will live".
- `src/mocks/pins.ts` — 3 mock pins (Beacon Hill, North End, Whitcomb's antique shop) with image-local coords + `title`/`label`/`description`.
- `src/components/BostonMap.tsx` — `MapContainer` w/ `CRS.Simple`, `ImageOverlay`, `Marker` x3, popover formatted with the Cthulhu skin. Custom `divIcon` (gold dot) avoids the default Leaflet PNG which Vite won't ship correctly from `node_modules`.
- `src/routes/MapView.tsx` — wraps `<BostonMap />` with a heading + explanatory blurb.

**Decisions:**

- y-axis mirroring (`IMG_HEIGHT - pin.y`) so pin coordinates use top-left origin like image software, while Leaflet's `CRS.Simple` measures from the bottom.
- No edit mode yet — that needs auth + Supabase pin storage (stage D + E proper). Popover already shows the data the editor will write back.
- Map JS bundle is ~220 KB. Dynamic import / route-level code split is a stage-G optimization, noted but not implemented here.

**Verification:** `npm run build` → 2.0 s; chunk warning on map JS (expected — leaflet is heavy).

**Open questions / next steps:** D1 — pick + integrate markdown editor for `/draft`.

---

## 2026-05-19 — C2: Pull-vault script (dry-run only)

**Files touched:**

- `scripts/pull-vault.ts` — symmetric to push: enumerates rows that would be written back to the vault, runs them through `appToVault` (app-form internal links → `[[wikilink]]`), prints `vault-path`/`title`/`hash`/`bytes`. `--execute` exits 1 with a three-pronged approval reminder (schema, `ready_to_sync` from stage F, manual confirm).
- `docs/AktaKasandry_obsidian/TASK_LIST.md` — stage F partials marked done.

**Decisions:**

- Until Supabase is wired, the pull script uses `mocks/content` as a stand-in source — gives a visible, hash-stable output without faking network calls.
- Writeback gating message names all three blockers (schema, flag, manual confirm) so the user has a checklist when they unblock.

**Verification:** dry-run prints 8 mock rows; `--execute` exits 1.

**Open questions / next steps:** E1 — Boston map placeholder + pins.

---

## 2026-05-19 — C1: Push-vault script (dry-run only)

**Files touched:**

- `scripts/push-vault.ts` — CLI entry. Reads `VAULT_PUBLIC` (falls back to `./sample-vault`), discovers pages by Shelf > Book > [Chapter] > `.md` layout, runs the cleanup pipeline and prints what would be upserted. `--execute` writes a clear "schema migration needs user approval" error and exits 1.
- `scripts/lib/walk.ts` — `walkVault()` + `VaultPage` shape; honours exclude dirs (`memory/`, `.obsidian/`, etc.) and `_`/`.`/`.excalidraw.md` filters from `import.py`.
- `scripts/lib/cleanup.ts` — `collapseAsterisks`, `stripDuplicateH1`, `slugify`, `contentHash` (FNV-1a 32-bit). Pure functions, ported from `import.py`.
- `src/lib/wikilinks.ts` — switched `@/mocks/content` and `@/types` imports to relative paths so `tsx` (script runtime) can resolve them without the Vite alias.
- `tsconfig.node.json` — added `@/*` path + included `src/**/*.ts` so the build understands transitive imports from scripts into src.
- `sample-vault/Kampania/Tlo historyczne/Miasto/Beacon Hill.md`, `…/Ludzie/Alistair Whitcomb.md`, `…/Sesje/Sesja 1 - List.md` — fixture (3 pages, exercises wikilinks + collapseAsterisks).

**Decisions:**

- `--execute` gating is enforced **in code**, not just docs — the script exits 1 before any I/O if the flag is passed (sync with coc-creator on shared Supabase first).
- Natural key is `path-from-vault` (`Kampania/Tlo historyczne/Miasto/Beacon Hill.md`), not slug — stable across title renames, breaks only on file moves (acceptable, matches Obsidian usage).
- Shared cleanup vs renderer lives in two places by design: `scripts/lib/cleanup.ts` for push-side mutation; `src/lib/remarkWikilinks.ts` for render-side AST traversal. Both call the same `parseWikilink`/`resolveWikilink`.
- Image rewriting (bucket vs repo) deferred — still open in `work/Index.md`.

**Verification:**

- `npx tsx scripts/push-vault.ts` on the 3-page fixture → all 3 listed, hashes stable, cleanup pipeline visible.
- `npx tsx scripts/push-vault.ts --execute` → exit 1 with the migration-approval error.
- `npm run build` → 1.4 s, clean.

**Open questions / next steps:** C2 — pull script (same shape, app→vault direction).

---

## 2026-05-19 — B3: Markdown render + wikilinks

**Files touched:**

- `src/lib/wikilinks.ts` — shared parser/resolver: `parseWikilink`, `findWikilinks`, `resolveWikilink`, `vaultToApp`, `appToVault`. Single source of truth for both renderer and sync.
- `src/lib/remarkWikilinks.ts` — remark plugin walking the AST, replacing `[[…]]` text matches with `link` nodes (or `emphasis` for broken targets). Skips `code`/`inlineCode` subtrees so wikilink syntax inside code stays literal.
- `src/components/Markdown.tsx` — react-markdown wrapper: `remark-gfm` + `remarkWikilinks`, custom `a` component routes internal `/…` URLs through react-router `<Link>`, external links open in new tab.
- `src/routes/PageView.tsx` — swaps the `<pre>` placeholder for `<Markdown>`.
- `docs/AktaKasandry_obsidian/work/2026-05-19-wikilink-plugin.md` — new work note explaining hybrid AST-plugin + string-preprocess approach.
- `docs/AktaKasandry_obsidian/work/Index.md` — wikilink-resolution-timing question marked resolved.

**Decisions:**

- Hybrid approach: remark plugin for render (AST-safe), string preprocess for C1/C2 sync. Detailed rationale in the work note.
- Resolver walks the tree by **page title**, not slug — matches Obsidian's convention. Cheap on mock data; precompute a title→url map if it bites at Supabase scale.
- Broken wikilinks render as italic plain text (`<em>` carrying a `data.wikilinkBroken` flag). No render crash on missing targets.

**Verification:** `npm run build` → 1.5 s; JS 462 kB (react-markdown is heavy, gzip 147 kB — fine for the planned audience).

**Open questions / next steps:** C1 — push-vault dry-run, reusing `vaultToApp`.

---

## 2026-05-19 — B1: AppShell + routing

**Files touched:**

- `src/components/AppShell.tsx` — header (logo + top nav Półki/Mapa/Draft) + left aside (Shelf list) + main `<Outlet />` + footer; sidebar always visible, active route highlighted
- `src/components/Breadcrumbs.tsx` — derives crumb chain from URL params via mock helpers
- `src/routes/Landing.tsx`, `ShelfView.tsx`, `BookView.tsx`, `ChapterView.tsx`, `PageView.tsx`, `MapView.tsx`, `DraftView.tsx` — route components
- `src/router.tsx` — full route tree per `TECHNOLOGY_MASTERMIND.md` (8 routes: `/`, `/s/:shelf`, `/s/:shelf/b/:book`, `/s/:shelf/b/:book/c/:chapter`, `/s/:shelf/b/:book/c/:chapter/p/:page`, `/s/:shelf/b/:book/p/:page`, `/map`, `/draft`)
- `src/App.tsx` — removed (replaced by AppShell)
- `docs/AktaKasandry_obsidian/TECHNOLOGY_MASTERMIND.md` — component tree section updated to reflect what landed

**Decisions:**

- `BookView` handles both branches: book-with-chapters and book-with-flat-pages. Routing covers both shapes.
- `PageView` currently renders raw markdown in `<pre>` — B3 swaps for `react-markdown` + wikilink plugin.
- Sidebar lists shelves only (per spec — "Shelf list, always visible, large titles"). Drilldown happens in main column.

**Verification:** `npm run build` → 703 ms; CSS 13.7 kB, JS 303 kB. Visual nav check pending in dev server.

**Open questions / next steps:** B3 — wire `react-markdown` + remark-gfm + wikilink plugin into `PageView`.

---

## 2026-05-19 — B2: Mock content tree

**Files touched:**

- `src/types.ts` — type defs: `Shelf > Book > Chapter > Page`, plus `Crumb`, `Pin`
- `src/mocks/content.ts` — 3 shelves (Kampania, Mechanika, Okult i mity), 5 books, mix of chapter/no-chapter books. Pages contain Polish diacritics, GFM tables, fenced code, blockquotes (incl. callout-style `> [!note]`), images (placehold.co), wikilinks `[[Page]]` and `[[Page|alias]]`. Includes typed `findShelf` / `findBook` / `findChapter` / `findPage` helpers.

**Decisions:**

- Wikilinks reference page **titles** (not slugs) — matches how Obsidian-native vault content will arrive. Resolver in B3 will walk the tree by title.
- Books may have `chapters?` *or* `pages?` directly — mirrors the spec's optional-chapter routing (`/s/:shelf/b/:book/p/:page`).
- Mock helpers live next to mock data; in stage C the same module becomes the Supabase-backed lookup layer (swap the source, keep the API).

**Verification:** TS strict-mode clean.

**Open questions / next steps:** B1 — AppShell + routing.

---

## 2026-05-19 — A2: Cthulhu skin → Tailwind v4 theme

**Files touched:**

- `src/index.css` — `@theme` block with palette (`teal-deep`, `parchment`, `gold`, `ink`, etc.) and font tokens; `.prose-cthulhu` class for markdown bodies (headers, links, code, blockquote, table, image)
- `src/App.tsx` — Polish-diacritic verification sample using Tailwind utility classes generated from theme tokens
- `docs/AktaKasandry_obsidian/DESIGN_SYSTEM.md` — token reference table + font-loading decision

**Decisions:**

- Skin port: 1:1 from `C:\temp\bookstack-test\cthulhu-skin-minimal.html` — colours, fonts, header/code/blockquote/table semantics
- Tailwind v4 theme syntax (`@theme { --color-* }`) auto-generates `bg-*` / `text-*` / `border-*` utility classes
- Fonts via Google Fonts `<link>` (already in `index.html`) — Cinzel + Cormorant Garamond + Special Elite all render Polish diacritics (verified on sample text)
- `.prose-cthulhu` class encapsulates the markdown body styles — no per-element utility classes inside rendered pages

**Verification:** `npm run build` → 655 ms, CSS 8.28 kB. Sample renders ąćęłńóśźż / ĄĆĘŁŃÓŚŹŻ correctly.

**Open questions / next steps:** B1 — layout shell with left sidebar, breadcrumbs, route outlet.

---

## 2026-05-19 — A1: Vite scaffold + deps

**Files touched:**

- `package.json` — created with locked stack deps (React 19 + TS + Vite 6 + Tailwind v4 + Supabase + zustand + react-router 7 + react-hook-form + zod + react-markdown + remark-gfm + react-leaflet 5 + leaflet + @uiw/react-md-editor)
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` — strict TS config, `@/*` path alias
- `vite.config.ts` — React + Tailwind v4 plugin (`@tailwindcss/vite`), `@` alias
- `index.html` — Google Fonts (Cinzel, Cormorant Garamond, Special Elite), `lang="pl"`
- `.env.example` — placeholders for `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VAULT_PUBLIC`
- `src/main.tsx`, `src/router.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts` — minimal bootable shell

**Decisions:**

- Manual scaffold (not `npm create vite`) — repo not empty, would clobber `CLAUDE.md` / `docs/`
- `react-leaflet` bumped 4→5 — v4 peer-deps React 18, we're on React 19
- Build script uses `npx tsc -b && npx vite build` — Bash PATH on Windows doesn't see `node_modules/.bin`
- `npm install --legacy-peer-deps` — some transitive peers still on React 18; no runtime breakage observed
- `@uiw/react-md-editor` chosen for D1 (justified in stage-D work note when written)

**Verification:** `npm run build` → 711 ms, 286 kB JS, 7 kB CSS.

**Open questions / next steps:** A2 — port Cthulhu skin tokens to Tailwind v4 `@theme`.

---

## 2026-05-19 — Vault scaffolded

**Files touched:**

- `CLAUDE.md` — created (Session Start/End workflow, Obsidian conventions, file reference table, project guardrails)
- `docs/AktaKasandry_obsidian/memories/project.md` — created (comprehensive seed memory: scope, stack, integrations, MVP, conventions)
- `docs/AktaKasandry_obsidian/work/Index.md` — created with pre-seeded open questions (editor choice, slugify, realtime granularity, image storage, wikilink resolution timing)
- `docs/AktaKasandry_obsidian/TASK_LIST.md` — created with staged backlog a-g
- `docs/AktaKasandry_obsidian/TECHNOLOGY_MASTERMIND.md` — created (stack, routing sketch, component tree placeholder, build/deploy)
- `docs/AktaKasandry_obsidian/DESIGN_SYSTEM.md` — created (palette, fonts, layout intent, skin reference)
- `docs/AktaKasandry_obsidian/SUPABASE_AND_SYNC.md` — created (content model, proposed schema, RLS sketch, push/pull script flow, wikilink conversion)
- `docs/AktaKasandry_obsidian/INTEGRATIONS.md` — created (coc-creator shared Supabase, content vault, PoC reuse, GH Pages)
- `docs/AktaKasandry_obsidian/LOGGING_INSTRUCTIONS.md` — created (where to write what, frontmatter, tags, wikilinks, journal format)

**Decisions:**

- Vault structure approved by user
- Three project-specific docs split out from the generic seed template: `DESIGN_SYSTEM`, `SUPABASE_AND_SYNC`, `INTEGRATIONS` (instead of one big TECHNOLOGY_MASTERMIND)
- `outputs/` kept light — only `mockups/` and `screenshots/`, no AI-gen subfolders
- `STRATEGY_AND_TACTICS.md` deliberately omitted — MVP scope is locked in the spec

**Open questions / next steps:**

- Implementation starts in the next session. Read `memories/project.md` + `TASK_LIST.md` first.
- Open decisions tracked in `[[work/Index]]`: editor choice, slugify strategy, realtime granularity, image storage, wikilink resolution timing.
- Stage A first action: read `coc-creator/docs/CoCCreator_obsidian/TECHNOLOGY_MASTERMIND.md` section "Shared Supabase with akta-kasandry" before designing schema.
