# Session Vault — Implementation Plan

```yaml
---
date: 2026-07-15
status: active
tags: [plan, area/sessions, area/packages, area/vault, dep/rpg-recorder]
related:
  - "docs/superpowers/specs/2026-07-15-session-vault-design.md"
  - "docs/superpowers/plans/2026-07-15-session-companion-iter2.md"
  - "docs/superpowers/plans/2026-07-15-presentation-kit.md"
  - "[[TASK_LIST]]"
---
```

> **For agentic workers:** run task-by-task with `superpowers:subagent-driven-development` or
> `superpowers:executing-plans`. Pure logic gets tests first (`superpowers:test-driven-development`).
> Steps use `- [ ]` checkboxes. Contracts are pinned below so Batch-A tasks parallelize.

**Goal:** ship `scripts/build-session-vault.ts` (+ `npm run build-session-vault`) that assembles a
self-contained **Obsidian vault** per session under `packages/<slug>-vault/`, **reusing** the shipped
session-package and presentation-kit builders for the two in-vault tools, and adding one new piece of
**pure, tested** logic: the Obsidian-markdown rewrite of the digest summary (deep-links + images +
question callouts). Plus static vault templates, a GM runbook, and a rozdarte-sumienie end-to-end dry
run. **No new dependency. No site source change. No commit.**

**Design:** `docs/superpowers/specs/2026-07-15-session-vault-design.md`.

---

## Hard constraints (repeat)

- **Stack locked; NO new dependency.** Builder is `tsx`; zip is printed PowerShell
  `Compress-Archive`; the vault is plain files; Obsidian is the player's own app.
- **Reuse, don't rebuild** — the transcript tool and presentation tool are the existing builders'
  output, invoked via exported functions with an explicit `outDir`. Do **not** re-implement either
  viewer/editor. Do **not** modify the engine, the package template, or the kit template.
- **`file://` rules** (inherited by the two tools): no fetch, no external requests except the deck
  theme's inherited webfont `@import`; audio via relative `<audio src>`.
- **Public repo, no secrets;** pipeline touches no Supabase/env/network. `packages/` stays gitignored
  (already covers `packages/<slug>-vault/` and `packages/_audio-src/`).
- **Polish** for everything a player sees; **English** code/comments/docs.
- **No commit** — hand the working tree to the GM.

---

## Verified facts this plan builds on (checked 2026-07-15 against real data — do not re-derive)

1. **Overlay is concat-timeline.** `public/transcripts/data/rozdarte-sumienie-current-overlay.json`:
   `timeline: "concat"`, `slug: "rozdarte-sumienie"`, `duration: 27023.4 s` (~7 h 30 m), **4449**
   utterances; `variants.json` → `sessions["rozdarte-sumienie"].default_variant = "current"`.
2. **All 60 deep-link tokens resolve.** The draft
   (`docs/superpowers/drafts/2026-07-15-rozdarte-sumienie-summary.md`) has 60 `{sesja:…}` tokens
   (**55 distinct** ids, **0 range tokens**); every id exists in the overlay. `play.start == start`
   on the spot-checked ids (concat timeline), e.g. `6149a41a4ba3` → idx 36, 649.36 s.
3. **Scene ranges are sparse.** The 16 scene-index entries cover only scattered index ranges
   (`1:36-51 2:56-98 3:126-203 4:204-334 5:877-906 …`); **20 of 55 distinct anchors fall outside
   every range** → the preceding-scene rule (spec §3.2) is required, containment-only is not enough.
4. **Images don't exist yet.** `public/img/rozdarte-sumienie/` is absent; the draft references 9
   basenames (`fisk, ksiegarnia, price, tablica, rhymers, elias, woodworth, greyholme, tom` `.jpg`).
   Embeds will render as placeholders until the GM adds media — expected.
5. **Gallery stub is empty.** `public/gallery/rozdarte-sumienie.json` has empty `scenes/cast/tracks`
   → the presentation tool builds with an empty library (custom-upload tab still works).
6. **`fmtTime` convention** (`src/lib/transcripts/format.ts`): `H:MM:SS` when ≥1 h else `M:SS` —
   import-safe under tsx (Vite-free), reuse for the visible clock.
7. **Both builders already isolate pure logic** (`package-data.ts`, kit-core) and do token injection
   with occurrence-count drift guards + function-form replace — mirror that style.
8. **`packages/` gitignored** at `.gitignore:13`.

---

## Pinned contracts (so Batch-A tasks run in parallel)

### Deep-link rewrite output (per token)

```
{sesja:rozdarte-sumienie#6149a41a4ba3}
  → (scena 4 · ~1:48:12)<!--rs:6149a41a4ba3-->        // exact scene
  → (scena ~7 · ~2:03:41)<!--rs:9b3441808b29-->       // out-of-range → preceding scene, "~N"
range {sesja:slug#A..B}
  → (scena N · ~H:MM:SS–H:MM:SS)<!--rs:A..B-->
```

### Exported builder functions (extracted from the two CLIs — behavior-preserving)

```ts
// scripts/build-package.ts
export function buildSessionPackage(opts: {
  slug: string
  audioPath?: string | null   // absolute path to the Sala/concat mix, or null → no-audio tool
  outDir: string              // FINAL dir that receives index.html (+ audio/)
  dataDir?: string            // default 'public/transcripts/data'
}): { indexPath: string; indexBytes: number; audioDestPath: string | null; audioBytes: number | null }

// scripts/build-presentation-kit.ts
export function buildPresentationKit(opts: {
  slug: string
  outDir: string              // FINAL dir that receives edytor.html (+ assets/audio/)
  galleryPath?: string        // default `public/gallery/<slug>.json`
}): { edytorPath: string; edytorBytes: number; trackCount: number; imageCount: number }
```

Each CLI's `main()` becomes a thin wrapper: parse argv → compute `outDir` (`resolve(out, slug)` /
`resolve(out, `${slug}-prezentacja`)`) → call the exported fn → print the same hints as today. **No
output/format change** to either CLI.

### `window`-free vault-summary API (`scripts/lib/vault-summary.ts`, pure)

```ts
export function formatClock(sec: number | null): string          // fmtTime convention; '--:--' on null
export type SceneRef = { ordinal: number; aIdx: number; bIdx: number }
export function sceneForIndex(idx: number, scenes: SceneRef[]): { ordinal: number; exact: boolean }
export type UttResolve = (id: string) => { idx: number; sec: number | null } | null
export function rewriteDeepLinks(md: string, slug: string, resolve: UttResolve, scenes: SceneRef[]): string
export function rewriteImageEmbeds(md: string, slug: string): string
export function collectMediaBasenames(md: string, slug: string): string[]     // dedup, source order
export function questionsToCallouts(md: string): string
export function rewriteSummaryToObsidian(md: string, opts: {
  slug: string; sessionName: string; resolve: UttResolve; scenes: SceneRef[]
}): { markdown: string; mediaBasenames: string[] }               // composes the above + frontmatter/top-matter
```

### Vault file plan (`scripts/lib/vault-manifest.ts`, pure)

```ts
export type VaultFile = { path: string; kind: 'summary'|'template'|'derived'|'tool' }
export function planVaultFiles(slug: string): VaultFile[]  // the exact relative paths the builder writes
```

### CLI

```
npx tsx scripts/build-session-vault.ts <slug> [--summary <path>] [--audio <path>] [--out <dir>=packages]
npm run build-session-vault -- rozdarte-sumienie --audio "packages/_audio-src/rozdarte-sumienie-sala.opus"
```

---

## File map

**New**
- `scripts/lib/vault-summary.ts` + `scripts/lib/vault-summary.test.ts` (V1)
- `scripts/lib/vault-manifest.ts` + `scripts/lib/vault-manifest.test.ts` (V2)
- `scripts/vault-template/START TUTAJ.md` (V3)
- `scripts/vault-template/Komentarz do AI.md` (V3)
- `scripts/vault-template/Narzedzia/Otworz narzedzia.md` (V3) *(ASCII folder/file names in the
  template tree; the builder renames to the Polish-diacritic vault paths on write — avoids repo path
  encoding surprises)*
- `scripts/vault-template/Media/_Wrzuc tu media.md` (V3)
- `scripts/vault-template/dot-obsidian/app.json`, `.../appearance.json` (V3)
- `scripts/build-session-vault.ts` (V5)
- `docs/RUNBOOKS/session-vault.md` (V4)

**Modified**
- `scripts/build-package.ts` — extract `buildSessionPackage` (V0a)
- `scripts/build-presentation-kit.ts` — extract `buildPresentationKit` (V0b)
- `package.json` — `"build-session-vault": "tsx scripts/build-session-vault.ts"` (V5)
- `docs/AktaKasandry_obsidian/{TASK_LIST,DOCS_CHANGES_JOURNAL}.md`,
  `work/2026-07-15-...` note + `work/Index.md`, `memories/project.md` (V7)
- `.claude/skills/session-digest/references/outputs.md` — document the vault reuse + optional
  `{q-after:…}` marker (V7)

**Generated (gitignored, dry run V6)**
- `packages/rozdarte-sumienie-vault/**`, `packages/rozdarte-sumienie-vault.zip`

---

## Task list & dependency graph

| ID | Title | Depends on | Batch |
|---|---|---|---|
| **V0a** | Extract `buildSessionPackage` from `build-package.ts` | — | A |
| **V0b** | Extract `buildPresentationKit` from `build-presentation-kit.ts` | — | A |
| **V1** | `vault-summary.ts` rewrite logic (+ tests) | — (contracts pinned) | A |
| **V2** | `vault-manifest.ts` file plan (+ tests) | — (contracts pinned) | A |
| **V3** | Static vault templates (`scripts/vault-template/**`) | — (tree pinned) | A |
| **V4** | GM runbook `session-vault.md` | — (CLI contract pinned) | A |
| **V5** | `build-session-vault.ts` CLI + npm script | V0a, V0b, V1, V2, V3 | B |
| **V6** | rozdarte-sumienie end-to-end dry run (+ Obsidian open) | V5 (V4 as checklist) | C |
| **V7** | Docs + digest-skill note | all shipped tasks | D |

**Parallel batches:** **A** = {V0a, V0b, V1, V2, V3, V4} (no shared files) → **B** = {V5} →
**C** = {V6} → **D** = {V7}.

---

## Batch A

### V0a — extract `buildSessionPackage` from `scripts/build-package.ts` · independent

**Files:** modify `scripts/build-package.ts`.

Move the body of `main()` (after argv parsing) into an exported
`buildSessionPackage(opts)` matching the pinned signature: it takes an explicit `outDir` (instead of
computing `resolve(out, slug)`) and an `audioPath` (instead of the `--audio`/`audioSrc` dance), does
overlay/scene-index resolution + `buildPackagePayload` + template injection + writes
`outDir/index.html` and (when `audioPath`) `outDir/audio/<slug>-mix.opus`, and **returns** the paths
+ byte sizes. `main()` keeps parsing argv, sets `outDir = resolve(out, slug)` and
`audioPath = audio ? resolve(audio) : null`, calls the fn, and prints the **identical** summary +
next-steps block it prints today.

Keep `audioSrc` in the payload as `audio/<slug>-mix.opus` when `audioPath` is set, else `null`
(unchanged). Keep the `.opus`-extension warning and all existing `usageAndExit` guards in `main()`.

> Naming note: the vault places this at `Narzędzia/transkrypt/`, so the copied audio filename stays
> `<slug>-mix.opus` inside `audio/` (the tool references it relatively — the on-disk name is
> internal). The Sala source path is passed via `--audio`; no rename needed.

**Acceptance criteria**
- `npm run build-package -- rozdarte-sumienie --audio <mix>` and the no-audio form produce
  **byte-identical** output and identical console text to before (diff the printed block).
- `tsc -b` clean; `buildSessionPackage` is importable from another script with no side effects at
  import time (the `main()` call stays guarded so importing the module doesn't run it — wrap the
  existing `main()` invocation as `if (isMainModule) main()`, or move `main()` invocation behind a
  standard `import.meta`/argv check consistent with how tsx runs it; verify importing the module in a
  throwaway script prints nothing).

*(No new unit tests — `package-data.ts` already covers the pure logic; V6 re-exercises the CLI.)*

### V0b — extract `buildPresentationKit` from `scripts/build-presentation-kit.ts` · independent

**Files:** modify `scripts/build-presentation-kit.ts`.

Same treatment: exported `buildPresentationKit({ slug, outDir, galleryPath? })` holds everything
`main()` does after argv parsing, with `outDir` explicit (today `resolve(out, `${slug}-prezentacja`)`)
and `galleryPath` defaulting to `public/gallery/<slug>.json`. Returns `edytorPath`, sizes, track and
image counts. `main()` parses argv, computes the default `outDir`, calls it, prints today's hints.
Preserve the `</script` drift guard and every `usageAndExit`.

**Acceptance criteria**
- `npm run build-presentation-kit -- ug2` output byte-identical to before; import has no side effects
  (same guard as V0a). Empty-gallery input (`rozdarte-sumienie`) builds an editor with 0 images / 0
  tracks and exits 0. `tsc -b` clean.

### V1 — `scripts/lib/vault-summary.ts` rewrite logic (+ tests) · independent

**Files:** create `scripts/lib/vault-summary.ts`, `scripts/lib/vault-summary.test.ts`.

Pure module (no I/O, no `import.meta`); may import types + `fmtTime` from
`src/lib/transcripts/format.ts` (Vite-free) or re-implement the same convention inline. Implement the
pinned API:

- `formatClock(sec)` — `H:MM:SS` (≥1 h) / `M:SS`; `'--:--'` for null/NaN (reuse fmtTime).
- `sceneForIndex(idx, scenes)` — scenes sorted ascending by `aIdx`:
  1. inside `[aIdx,bIdx]` → `{ordinal, exact:true}`;
  2. else last scene with `aIdx ≤ idx` → `{ordinal, exact:false}`;
  3. before scene 1 → `{ordinal: scenes[0].ordinal, exact:false}`;
  4. empty `scenes` → `{ordinal: 0, exact:false}` (builder guarantees ≥1 in practice).
- `rewriteDeepLinks(md, slug, resolve, scenes)` — regex the **same token** as
  `remarkTranscriptAnchors` (`\{sesja:(<slug>)#([a-f0-9]+)(?:\.\.([a-f0-9]+))?\}`, scoped to the given
  slug); for each: `resolve(fromId)` → `{idx,sec}` (throw `Error` naming the id if null),
  `sceneForIndex(idx)`, build `(scena N · ~<clock>)` (`~N` when not exact; add `–<toClock>` for
  ranges), append `<!--rs:from[..to]-->`. Leave non-matching text untouched. Skip tokens inside
  fenced/inline code (match the remark plugin's "code stays literal" behavior — simplest: don't
  transform inside ``` ` ``` runs; a light guard is fine, the draft has none).
- `rewriteImageEmbeds(md, slug)` — replace `<img ... src="/img/<slug>/<base>.<ext>" ...>` and
  `![alt](/img/<slug>/<base>.<ext>)` with `![[<base>.<ext>]]`. Preserve a following `*caption*`
  line untouched. Leave non-`/img/<slug>/` images alone.
- `collectMediaBasenames(md, slug)` — all `/img/<slug>/<base>.<ext>` basenames, deduped in first-seen
  order.
- `questionsToCallouts(md)` — within the `## Pytania i wątpliwości` section, wrap each non-blank
  paragraph as a `> [!question]\n> <text>` callout; if a paragraph ends with `{q-after:<heading>}`,
  strip that marker and (composition step in `rewriteSummaryToObsidian`) move the callout to just
  after the `### <heading>` line; unmarked questions stay in place. Preserve the section's intro
  blockquote.
- `rewriteSummaryToObsidian(md, opts)` — compose: replace the draft's internal "WERSJA ROBOCZA /
  nie publikować" top blockquote with a player-facing `> [!note] Wersja do waszej korekty …`; prepend
  YAML frontmatter (`session`, `slug`, `status: do-korekty`, `tags: [streszczenie, do-korekty]`); run
  deep-link → image → questions transforms; return `{ markdown, mediaBasenames }`.

**Acceptance criteria** — pure; `tsc -b` clean; deterministic (same input → same output).

**Tests (`vault-summary.test.ts`, Vitest)** — with small fixtures:
- `formatClock`: `649.36 → "10:49"`, `26739.59 → "7:25:39"`, `null → "--:--"`.
- `sceneForIndex`: inside range → exact; between ranges → preceding, `exact:false`; before first →
  scene 1 `exact:false`.
- `rewriteDeepLinks`: single token → `(scena N · ~clock)<!--rs:id-->`; out-of-range → `~N`; range
  token → both clocks + `<!--rs:a..b-->`; **unknown id throws** with the id in the message; text
  outside tokens preserved; a token in a code span left literal.
- `rewriteImageEmbeds`: `<img src="/img/rs/fisk.jpg" …>` → `![[fisk.jpg]]`; markdown-image form
  likewise; caption line preserved; a foreign `/img/other/…` untouched.
- `collectMediaBasenames`: dedupes, first-seen order (the 9 rozdarte basenames from a fixture).
- `questionsToCallouts`: 2 paragraphs → 2 `> [!question]` blocks; `{q-after:…}` stripped from text.
- `rewriteSummaryToObsidian`: output has frontmatter, no `{sesja:` left, no `/img/` left, contains
  `<!--rs:` for every original token; `mediaBasenames` length matches.

### V2 — `scripts/lib/vault-manifest.ts` file plan (+ tests) · independent

**Files:** create `scripts/lib/vault-manifest.ts`, `scripts/lib/vault-manifest.test.ts`.

`planVaultFiles(slug)` returns the exact relative paths (with final Polish-diacritic names) the
builder writes for the **static + derived** parts — `START TUTAJ.md`,
`Streszczenie — <slug>.md` (the builder substitutes the session name), `Komentarz do AI.md`,
`Narzędzia/Otwórz narzędzia.md`, `Media/_Wrzuć tu media.md`, `.obsidian/app.json`,
`.obsidian/appearance.json`, and the `Media/` subfolder markers — **excluding** the two tool subtrees
(owned by the builders). Kind-tagged per the pinned type. Keep it a plain data function so assembly
is asserted without disk.

**Acceptance criteria / tests** — returns the pinned set; every `path` is vault-relative (no leading
slash, no `..`); `summary` entry present exactly once; `.obsidian/workspace.json` **absent** (guard
against accidental inclusion); tool dirs absent.

### V3 — static vault templates (`scripts/vault-template/**`) · independent

**Files:** create the template tree (ASCII folder/file names; builder maps to Polish paths on write):

- `START TUTAJ.md` — Polish onboarding. Sections: *Co to jest* (a review copy of the session, yours
  to correct); *Zainstaluj Obsidian* (link; "Obsidian pyta o zaufanie tylko dla wtyczek społeczności
  — tu żadnych nie ma"); *Jak czytać* (open `Streszczenie …`); *Jak pomóc* — (a) poprawiaj tekst w
  streszczeniu, (b) pisz w `Komentarz do AI`, (c) odpowiadaj na pytania `[!question]`; *Narzędzia*
  (→ `Narzędzia/Otwórz narzędzia`); *Jak odesłać* (odeślij `Streszczenie …md` + `Komentarz do AI.md`
  albo cały folder); *Przydział* ("`__OWNER__` prowadzi korektę, reszta pomaga"). Tokens:
  `__SESSION__`, `__SLUG__`, `__OWNER__` (builder fills `__OWNER__` with a neutral default if none
  given).
- `Komentarz do AI.md` — large guided free-form note. `> [!tip]` intro; `##` sections: *Imiona i
  postacie*, *Kolejność i przebieg scen*, *Co się naprawdę wydarzyło*, *Ulubione / epickie momenty*,
  *Odpowiedzi na pytania*, *Cokolwiek jeszcze* — each with a one-line prompt and empty space.
- `Narzędzia/Otwórz narzędzia.md` — how to open the tools (spec §6): the **guaranteed** file-manager
  double-click path first, then the convenience relative links
  `[Otwórz transkrypt](transkrypt/index.html)` / `[Otwórz edytor prezentacji](prezentacja/edytor.html)`;
  the unzip + Safari/`.opus` caveats; one line on what each tool is for.
- `Media/_Wrzuć tu media.md` — explains the drop-zone; a `__MEDIA_CHECKLIST__` token the builder
  replaces with `- [ ] fisk.jpg` … from `collectMediaBasenames`; note that filenames must match and
  can live in any `Media/` subfolder.
- `dot-obsidian/app.json` — `{ "readableLineLength": true, "defaultViewMode": "preview",
  "livePreview": true, "alwaysUpdateLinks": false, "promptDelete": true }`.
- `dot-obsidian/appearance.json` — `{ "baseFontSize": 18, "theme": "obsidian", "accentColor":
  "#c89b3c" }`.

Also create empty `Media/portrety/`, `Media/sceny/`, `Media/muzyka/`, `Media/zdjecia-z-gry/`,
`Media/materialy/` (via a `.gitkeep` in the template so the tree exists; the builder recreates them
as real empty dirs — `.gitkeep` is **not** copied into the vault).

**Acceptance criteria** — all Polish player-facing copy; every token used by the builder is present;
no absolute paths; `dot-obsidian/` has exactly the two JSON files (no `workspace.json`).

### V4 — GM runbook `docs/RUNBOOKS/session-vault.md` · independent

**Files:** create `docs/RUNBOOKS/session-vault.md` (English; paste-snippets Polish). Mirror the shape
of `session-package.md`. Sections:

1. **When to use** — first full-pass review of a finished session, before site publish; prerequisites
   (scene-index exists; overlay registered concat-timeline; digest draft exists; optional Sala mix in
   `packages/_audio-src/`).
2. **Step 1 — (optional) Sala mix** — producer boundary; same ffmpeg/alignment note as
   `session-package.md`; the concat-alignment precondition (spec §9 warning); ship transcript-only if
   unaligned.
3. **Step 2 — build the vault:**
   `npm run build-session-vault -- rozdarte-sumienie --audio "packages/_audio-src/rozdarte-sumienie-sala.opus"`
   — what it writes, expected sizes.
4. **Step 3 — enrich media (optional):** drop files into `Media/…` per the vault's
   `_Wrzuć tu media.md`; optionally add them to `public/gallery/<slug>.json` and **re-run** Step 2.
5. **Step 4 — zip** (printed by the builder, out-dir-aware `Compress-Archive`).
6. **Step 5 — Drive + assignment:** upload, share "anyone with the link, viewer", hand to the
   assigned player with the ready-to-paste Polish instruction snippet (install Obsidian, unzip fully,
   open `START TUTAJ.md`).
7. **Step 6 — round trip:** receive the corrected `Streszczenie …md` + `Komentarz do AI.md`; feed to
   Akta's AI, which restores `<!--rs:ID-->` → `{sesja:…#ID}` and produces a reviewable site draft
   (never auto-applied). Cross-link the eventual feedback skill.
8. **Caveats:** unzip-before-open; `.opus`/Safari; re-running overwrites `packages/<slug>-vault/`;
   media placeholders until files are dropped; empty presentation library on the gallery stub.

**Acceptance criteria** — a no-context reader can go build → enrich → zip → Drive → hand-off →
round-trip using only this file; commands/paths match V5.

---

## Batch B

### V5 — `scripts/build-session-vault.ts` CLI (+ npm script) · depends on V0a, V0b, V1, V2, V3

**Files:** create `scripts/build-session-vault.ts`; modify `package.json`.

**Behavior:**
1. Parse argv (`<slug>`, `--summary`, `--audio`, `--out=packages`); `usageAndExit` style of the other
   builders.
2. Resolve overlay via `variants.json` (reuse `build-package.ts`'s resolution — import the exported
   helper if V0a exposes one, else duplicate the ~15 lines) and scene-index
   `public/transcripts/scene-index/<slug>.json`. Missing → exit 1 with the same guidance messages.
3. Resolve summary source: `--summary`, else discover `docs/superpowers/drafts/*-<slug>-summary.md`
   (exactly one match; 0 or >1 → exit 1 asking for `--summary`).
4. Build rewrite inputs from the overlay: `resolve = id => (indexById has id ? {idx, sec:
   seekSecondsFor(u, timeline)} : null)`; `scenes` = scene-index entries mapped to
   `{ordinal, aIdx, bIdx}` via the same `indexById` (throw on an unknown scene endpoint, matching
   `buildPackagePayload`). Run `rewriteSummaryToObsidian(md, {slug, sessionName, resolve, scenes})`.
5. `outDir = resolve(out, `${slug}-vault`)`. Write, from `planVaultFiles` + templates:
   - `Streszczenie — <sessionName>.md` (the rewritten markdown);
   - the static templates with tokens filled (`__SESSION__`, `__SLUG__`, `__OWNER__` default
     `"wyznaczony gracz"`, `__MEDIA_CHECKLIST__` from `mediaBasenames`);
   - `.obsidian/app.json`, `.obsidian/appearance.json`;
   - the empty `Media/` subfolders.
   Use **function-form** token replacement + occurrence guards (mirror the other builders).
6. `buildSessionPackage({ slug, audioPath: audio ? resolve(audio) : defaultSalaOrNull, outDir:
   resolve(outDir, 'Narzędzia/transkrypt') })`. Default Sala path =
   `packages/_audio-src/<slug>-sala.opus` **iff it exists**, else null (no-audio tool) — print which
   was used.
7. `buildPresentationKit({ slug, outDir: resolve(outDir, 'Narzędzia/prezentacja') })`.
8. Print: per-area sizes (summary, transcript tool, presentation tool, total), the out-dir-aware zip
   command, the Drive + **"next: hand to one player as the correction assignment"** hint, and the
   media-checklist reminder if any basenames are still missing under `Media/`.

**Acceptance criteria**
- `npm run build-session-vault -- rozdarte-sumienie --audio "<sala>"` produces
  `packages/rozdarte-sumienie-vault/` with: the rewritten `Streszczenie — …md` (no `{sesja:` / no
  `/img/` left; `<!--rs:` present), all static notes, `.obsidian/{app,appearance}.json`,
  `Narzędzia/transkrypt/index.html` (+ `audio/`), `Narzędzia/prezentacja/edytor.html`, empty `Media/`
  tree.
- No-audio form (omit `--audio`, no Sala file) builds a transcript-only tool and says so.
- Bad slug / missing scene-index / ambiguous summary / unknown deep-link id → exit 1 with the
  specified message.
- `git status` shows nothing under `packages/`; `tsc -b` clean; **zero** network/Supabase/env access.

*(No unit tests — orchestration; pure logic is V1/V2 + the builders' own suites. V6 is its test.)*

---

## Batch C

### V6 — rozdarte-sumienie end-to-end dry run · depends on V5 (V4 as checklist)

No new repo files (all outputs gitignored). Execute the runbook as its first real run:

- [ ] **Build:** `npm run build-session-vault -- rozdarte-sumienie --audio
      "packages/_audio-src/rozdarte-sumienie-sala.opus"` (or without `--audio` if the Sala mix isn't
      ready). Record printed sizes.
- [ ] **Summary rewrite spot-check** (open `Streszczenie — …md` in a text editor): 60 tokens gone;
      `<!--rs:` count == 60; a known exact anchor (`6149a41a4ba3`) shows `(scena 1 · ~10:49)` (idx 36
      is inside scene 1 `36–51`); an out-of-range anchor (`4e6c89099903` @108, between scene 3
      `126-203`… actually before it → check it renders `scena ~2`/`~3` sensibly with a plausible
      clock); the 9 image embeds are `![[*.jpg]]`; questions are `> [!question]` callouts.
- [ ] **Open in Obsidian** ("Open folder as vault" → `packages/rozdarte-sumienie-vault/`): confirm it
      opens into **reading view** on `START TUTAJ`, no restricted-mode/trust prompt; `Streszczenie …`
      reads cleanly (embeds show as placeholders — expected, no media yet; restore-comments invisible);
      callouts render; comfortable line width.
- [ ] **Transcript tool:** from the file manager, open `Narzędzia/transkrypt/index.html` in Chrome
      over `file://`; 16 scenes listed; 4449 rows render; **if Sala audio present**, click a scene and
      confirm the audio seeks to a matching moment at three points (start / mid / end) — this is the
      Sala-alignment check (spec §9); if it drifts, note it and rebuild without `--audio`.
- [ ] **Presentation tool:** open `Narzędzia/prezentacja/edytor.html`; empty library is expected;
      upload one custom image, build a 1-slide deck, confirm preview renders (proves the kit works in
      the vault context). No network requests in DevTools.
- [ ] **Tool-open link check:** try the in-Obsidian relative links in `Otwórz narzędzia.md`; record
      whether they open the browser or need the file manager (feeds open question #2 → runbook wording).
- [ ] **Zip:** run the printed `Compress-Archive`; unzip to a **fresh** temp dir; re-open the vault +
      one tool from the unzipped copy (the exact player flow). Record total zip size (~ transcript
      audio-dominated).
- [ ] **Not in scope here:** Drive upload + handing to a player (GM's manual step) — leave the
      reminder in the final report.

**Acceptance criteria** — every box observed; summary rewrite verified lossless-restorable (60/60
`<!--rs-->`); vault opens clean in Obsidian; both tools work from the unzipped copy; Sala-alignment
result recorded (aligned → audio kept; drift → transcript-only + producer flag).

---

## Batch D

### V7 — Docs + digest-skill note · after all shipped tasks

**Files:** modify `docs/AktaKasandry_obsidian/TASK_LIST.md` (extend **Stage M** with a "Session
Vault" checklist — sibling deliverable; keep GM manual actions open: Sala mix/alignment, media
enrichment, Drive upload + assignment, first round-trip), `DOCS_CHANGES_JOURNAL.md` (entry:
key-decisions table in short form, the 20/55-out-of-range finding, dry-run measurements, the
Sala-alignment result), `work/2026-07-15-...` new work note + `work/Index.md` line (per
`LOGGING_INSTRUCTIONS.md`), `memories/project.md` (short note under the session-companion section:
vault pipeline exists, reuses the two builders, restore-comment round-trip contract). Also update
`.claude/skills/session-digest/references/outputs.md` to document that the same draft feeds
`build-session-vault` and to describe the optional `{q-after:<heading>}` marker for question
placement.

**Acceptance criteria** — docs match reality incl. measured sizes; Index links the new note; the
`<!--rs:ID-->` ↔ `{sesja:…#ID}` restore contract and the "never auto-apply the round-trip" posture
appear in the journal.

---

## Verification (whole feature)

- `npx tsc -b` clean; `npm run test:run` green (new: `vault-summary.test.ts`, `vault-manifest.test.ts`;
  all prior suites — incl. `package-data.test.ts`, `group-comments.test.ts`, `kit-core.test.ts` —
  still pass).
- Both existing CLIs (`build-package`, `build-presentation-kit`) produce byte-identical output to
  before V0a/V0b (regression check).
- `npm run build-session-vault -- rozdarte-sumienie …` then the full V6 checklist, including the
  60/60 restore-comment count and (if Sala present) the three-point audio-alignment listen.
- `git status` clean of `packages/**`; no site source file modified (only `scripts/`, `docs/`,
  `package.json`, and the digest skill's `outputs.md`).
- **No commit** — hand the working tree + the GM's remaining manual actions (Sala mix, media, Drive +
  assignment) to the user.
```
