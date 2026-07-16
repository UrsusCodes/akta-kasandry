# Session Vault — Design Spec (all-in-one Obsidian vault per session)

```yaml
---
date: 2026-07-15
status: active
tags: [spec, area/sessions, area/packages, area/vault, dep/rpg-recorder]
related:
  - "docs/superpowers/specs/2026-07-14-session-companion-design.md"
  - "docs/superpowers/specs/2026-07-15-presentation-kit-design.md"
  - "docs/superpowers/plans/2026-07-15-session-vault.md"
  - "[[TASK_LIST]]"
---
```

> Third sibling in the **session companion** family (spec `2026-07-14-session-companion-design.md`
> §5a interface table). This one does **not** add a site surface. It packages a whole session as a
> self-contained **Obsidian vault**, handed to players as a zip on Google Drive, opened in the
> player's own Obsidian. It is the **first full-pass distribution model**: the corrected result
> later flows *back* into Akta Kasandry (site publish), it does not start there.
>
> **It reuses the two shipped builders rather than rebuilding them** — the iter-2 session package
> viewer (`scripts/build-package.ts`) becomes the vault's transcript tool, and the presentation
> kit (`scripts/build-presentation-kit.ts`) becomes the vault's presentation tool. The only genuinely
> new logic is a **pure, testable Obsidian-markdown rewrite of the summary** (deep-links + images)
> and the vault-assembly glue.

---

## 1. Problem & shape

The session-digest skill produces an Opus-quality summary draft with `{sesja:<slug>#<id>}`
deep-links (60 in the worked example). Today that draft's destination is the **site** (a
`UG2Summary`-style React route). But a fresh session first needs a **review pass by the players**
— fixing character names, scene order, "who did what", and answering the digest's open questions —
*before* it is worth publishing. The site's margin-comment loop (Stage L/M) is great once a page is
live, but it requires the page to be published first, and it cannot carry audio.

**Session Vault** solves the pre-publish review pass with a package players can work in offline and
at length:

```
packages/<slug>-vault/                 (gitignored; zipped → GM's Google Drive)
  START TUTAJ.md                       onboarding: what this is, install Obsidian, how to help
  Streszczenie — <Session>.md          the digest summary, rewritten to Obsidian-safe markdown
  Komentarz do AI.md                   a large free-form note players fill (the round-trip payload)
  Narzędzia/
    Otwórz narzędzia.md                how to open the two tools + caveats
    transkrypt/                        ← built verbatim by build-package (--audio = Sala mix)
      index.html
      audio/<slug>-sala.opus
    prezentacja/                       ← built verbatim by build-presentation-kit
      edytor.html
      assets/audio/*                   (empty for v1 — gallery stub has no tracks yet)
  Media/                               GM drop-zone; empty in v1 except a "wrzuć tu" note
    portrety/  sceny/  muzyka/  zdjecia-z-gry/  materialy/
    _Wrzuć tu media.md                 checklist of the exact filenames the summary expects
  .obsidian/                           minimal, portable workspace config (app.json + appearance.json)
```

**The assignment model** (workflow, not code): the GM zips the vault, uploads it to Google Drive,
and hands it to **one player as the assigned owner** ("ty prowadzisz korektę tej sesji"); the others
assist by reading, commenting, and answering questions. The owner returns the corrected
`Streszczenie …md` + `Komentarz do AI.md` (or the whole vault). The GM feeds those to Akta's AI,
which restores the deep-links and produces a reviewable draft for the **site** publish.

No new dependency (a vault is just files; Obsidian is the player's own app). No schema change.
Nothing under `packages/` is committed. The site is untouched.

---

## 2. What is reused, verbatim

| Existing asset | Role in the vault | How it is invoked |
|---|---|---|
| `scripts/build-package.ts` + `scripts/lib/package-data.ts` + `scripts/package-template/template.html` | The **transcript tool** (`Narzędzia/transkrypt/`) — scene sidebar, continuous audio, per-utterance ▶, follow-mode, search, all under `file://` | The vault builder calls an **exported** `buildSessionPackage({ slug, audioPath, outDir })` (extracted from the CLI's `main()`, zero behavior change) with `outDir` pointing straight at `Narzędzia/transkrypt` and `audioPath` = the Sala mix |
| `scripts/build-presentation-kit.ts` + `scripts/kit-template/*` | The **presentation tool** (`Narzędzia/prezentacja/`) — the self-service slide editor | The vault builder calls exported `buildPresentationKit({ slug, outDir })` with `outDir` = `Narzędzia/prezentacja` |
| `public/gallery/<slug>.json` (gallery manifest) | Media/asset source for the presentation tool | Read by `buildPresentationKit`; **v1 rozdarte-sumienie ships the empty stub** → the kit's asset library is empty but the "Moje" (custom-upload) tab still works, so players can build decks from their own photos immediately |
| `public/transcripts/scene-index/<slug>.json` + the overlay | Scene sidebar of the transcript tool **and** the input to the summary's deep-link rewrite | Read by both `buildSessionPackage` and the new rewrite logic |

Rationale for the **exported-function** reuse (rather than shelling out to the CLIs via
`child_process`): the repo path contains a space (`AKTA KASANDRY`) and the Sala audio path is
user-supplied, so spawning `npx tsx …` invites Windows quoting/`npx`-resolution fragility;
importing a pure orchestration function is more robust, lets the vault builder place output at an
**exact** directory (the CLIs otherwise force a `<out>/<slug>` subfolder name), and is directly
unit-exercisable. The refactor is minimal — each CLI keeps its `main()` argv wrapper and its
existing dry-run coverage re-verifies it. This is the "call their exported logic" the coordinator
asked for.

---

## 3. The summary rewrite (the one genuinely new piece — pure, Vitest-tested)

The digest draft (`docs/superpowers/drafts/2026-07-15-rozdarte-sumienie-summary.md`) is authored for
the **site** renderer: `{sesja:…}` tokens (resolved by `src/lib/remarkTranscriptAnchors.ts`),
site-absolute `<img src="/img/…">` and `![](/img/…)`, and `[label](/sesje/…)` links. **None of those
render in Obsidian.** The rewrite converts the same draft into Obsidian-safe markdown that reads
close to the Kasandra experience, while staying **conversion-friendly** so Akta's AI can turn the
corrected result back into wiki-markdown later.

### 3.1 Reader-parity — Obsidian-safe syntax only

Verified against what Obsidian's reading view supports:

| Feature | Site (draft) | Vault (rewritten) | Obsidian support |
|---|---|---|---|
| Headings, bold/italic, tables, blockquotes, `---` | standard md | unchanged | ✅ native |
| Callouts | `> [!warning]` (used in vault docs) | `> [!note]`, `> [!question]`, `> [!tip]` | ✅ native (same syntax as this repo's docs) |
| Images | `<img src="/img/…" align="right">` / `![](/img/…)` | Obsidian embed `![[<basename>.jpg]]` + italic caption line | ✅ native; resolves by **filename** anywhere in the vault (so `Media/…` subfoldering is free) |
| Transcript deep-links | `{sesja:<slug>#<id>}` → `↪ transkrypt` pill | inline `(scena N · ~H:MM:SS)` + hidden restore comment | rewrite (see §3.2) — the raw token renders as literal braces in Obsidian, so it must go |
| Cross-page links (`/sesje/…`) | site route | pointer to the local `Narzędzia/transkrypt` tool | rewrite |

Deliberately **avoided**: right/left image floats (Obsidian has no `align`; portraits become plain
centered embeds — an acceptable loss), raw inline styles, and any HTML the reading view drops. The
result is plain CommonMark + Obsidian embeds + Obsidian callouts, all of which this project's own
docs already use, so parity with the "Kasandra look" is high without any custom CSS.

### 3.2 Deep-link rewrite (deterministic, restorable — the core testable logic)

Each `{sesja:<slug>#<id>}` (and range form `{sesja:<slug>#<from>..<to>}`) becomes:

```
(scena 4 · ~1:48:12)<!--rs:6149a41a4ba3-->
```

- **Visible label** — `(scena N · ~H:MM:SS)`. Both derived deterministically from the overlay +
  scene-index:
  - **Timestamp** = the utterance's `play.start` (concat-stream seconds), formatted with the exact
    `fmtTime` convention already used site-wide (`src/lib/transcripts/format.ts`: `H:MM:SS` when
    ≥1 h, else `M:SS`). This is the always-reliable half — it comes straight from the overlay and
    matches the transcript tool's own seek offsets, so a player can type the time into the audio
    tool and land on the moment. Prefixed `~` because scene-index/`tApprox` timestamps are
    approximate by convention.
  - **Scene N** = `sceneForIndex(idx)`:
    1. if the utterance's overlay index falls inside some scene's `[uStartIdx, uEndIdx]` → that
       scene's 1-based ordinal, rendered `scena N` (exact);
    2. else → the last scene whose `uStartIdx ≤ idx` (the scene we are "in or just after"),
       rendered `scena ~N` (the tilde flags "near");
    3. if before scene 1 → `scena ~1`.

    This matters: in the worked example **20 of 55 distinct anchors fall outside every scene range**
    (the scene-index is a sparse set of representative beats, not a full partition), so a
    containment-only rule would drop most links. The preceding-scene rule is monotone (scenes are
    chronological, non-overlapping) and never fails.
  - Range token → `(scena 4 · ~1:48:12–1:49:03)` (scene+start from `<from>`, end time from `<to>`).

- **Restore comment** — `<!--rs:<from>[..<to>]-->`. An HTML comment carrying the **canonical
  utterance id(s)**. Obsidian's reading view (the mode we ship, §5) hides HTML comments entirely, so
  players never see it; it travels inside the `.md` the player edits and returns, **co-located with
  its sentence** so it survives prose edits and reordering. On the way back, Akta's AI restores each
  `<!--rs:ID-->` to `{sesja:<slug>#ID}` (a trivial regex) and drops the visible `(scena …)` label —
  reconstructing exactly the site token. This is the "kept in an HTML comment" option from the brief;
  the pre-rewrite draft in the repo remains the ultimate source of truth if a comment is ever
  deleted.

  > Chosen over a **sidecar JSON map** (`ordinal → token`): a sidecar drifts if a player deletes or
  > reorders content, and it clutters the vault file tree (players would see a mystery `.json`). The
  > inline comment is position-stable and invisible. No sidecar ships inside the vault.

Unknown id (a token whose id is absent from the overlay) → the builder **fails loudly** naming the
id (same posture as `buildPackagePayload`), because it means the draft and the overlay disagree and a
silent passthrough would ship a dead link.

`rewriteDeepLinks(md, slug, resolve, scenes)` is pure — `resolve: (id) => { idx, sec } | null` and
`scenes: { ordinal, aIdx, bIdx }[]` are built by the (impure) builder from overlay + scene-index, so
the rewrite itself is unit-testable with fakes.

### 3.3 Image rewrite

`<img src="/img/<slug>/fisk.jpg" alt="…" …>` and `![alt](/img/<slug>/tablica.jpg)` →
`![[fisk.jpg]]` (embed by basename). A following `*italic caption*` line (the draft's convention) is
preserved as-is. Because Obsidian resolves embeds by filename, the GM can file images under any
`Media/` subfolder. **v1 note:** `public/img/<slug>/` does not exist yet for rozdarte-sumienie, so the
embeds render as "not found" placeholders until the GM drops files into `Media/` — expected and
documented; the `Media/_Wrzuć tu media.md` note lists the exact expected basenames (collected
deterministically from the summary → also testable).

### 3.4 "Pytania i wątpliwości" → callouts, near their sections

- **Mechanical (builder, deterministic):** each paragraph under `## Pytania i wątpliwości` becomes a
  `> [!question]` callout, so questions read as prominent, distinct blocks (and map cleanly to the
  site's per-paragraph `data-block-id` model when this content eventually lands on a commentable
  page).
- **Placement "near relevant sections" (authoring, digest skill):** true relocation of a question
  next to its section is an editorial judgment, so it stays with the **session-digest** skill, not
  the builder. The builder honors an optional marker the skill may emit — `{q-after:<heading text>}`
  at the end of a question — by moving that callout to just after the named `###` section; questions
  without a marker stay in the end section (the v1 worked example has none, so they group at the end
  as a labeled "Pytania i wątpliwości" section — honest, and the skill can add markers in a later
  authoring pass without any builder change). The dedicated **`Komentarz do AI.md`** note is where
  free-form answers live regardless of where the questions sit.

---

## 4. Vault contents (exact tree, each file's origin)

| Path | Origin | Notes |
|---|---|---|
| `START TUTAJ.md` | static template + token interpolation | Onboarding: what this vault is; install Obsidian (link, "trust prompt only for community plugins — we ship none"); how to read; **how to help** (edit the summary inline in reading→source, write in Komentarz do AI, answer questions); how to open the tools; how to send back; the assignment note. Opens by default (§5). |
| `Streszczenie — <Session>.md` | digest draft, **rewritten** (§3) | The reading centerpiece. YAML frontmatter (`session`, `slug`, `status: do-korekty`). Player-facing top matter replaces the draft's internal "WERSJA ROBOCZA / nie publikować" banner with a "to jest wersja do waszej korekty" callout. |
| `Komentarz do AI.md` | static template | A large, guided free-form note: sections for *poprawki imion*, *kolejność scen*, *co się naprawdę wydarzyło*, *ulubione momenty*, *odpowiedzi na pytania*, *cokolwiek jeszcze*. This is the primary round-trip payload alongside the edited summary. |
| `Narzędzia/Otwórz narzędzia.md` | static template | How to open `transkrypt/index.html` and `prezentacja/edytor.html` (§6), plus the unzip/Safari caveats inherited from the session-package runbook. |
| `Narzędzia/transkrypt/**` | `buildSessionPackage()` | The iter-2 viewer + Sala audio, unchanged. |
| `Narzędzia/prezentacja/**` | `buildPresentationKit()` | The kit editor, unchanged. Empty asset library for v1 (stub gallery); custom-upload tab works. |
| `Media/**` + `Media/_Wrzuć tu media.md` | static folders + derived checklist | GM drop-zone; the note lists the exact image basenames the summary embeds so the GM knows what to provide. |
| `.obsidian/app.json`, `.obsidian/appearance.json` | static | §5. No `workspace.json`. |

---

## 5. `.obsidian/` — ship a minimal config (decision: **yes, minimal**)

Ship exactly two files, no more:

- `app.json` — `readableLineLength: true`, `defaultViewMode: "preview"` + `livePreview: true`
  (opens notes in **reading view**, so HTML restore-comments and any stray syntax are hidden and the
  page looks like a finished document), `alwaysUpdateLinks: false` (no scary "update 12 links?"
  prompts when a first-time user renames nothing), `promptDelete: true`.
- `appearance.json` — dark theme + a gold accent (`#c89b3c`) and a comfortable base font size, to
  echo the Cthulhu palette without any custom CSS or community theme.

**Why ship it, and why only this much:** the players are first-time Obsidian users; a vault that
opens straight into a comfortably-typeset reading view of `START TUTAJ` removes the single biggest
source of "it looks broken / where do I start" confusion. Both files are **content-only and fully
portable** — no absolute paths, no machine state. We deliberately **omit `workspace.json`** (it pins
pane layout with absolute-ish file references and Obsidian regenerates it per machine — shipping it
causes more harm than good) and ship **no community plugins** (so Obsidian's "trust author / restricted
mode" prompt never appears; core-only config triggers no security gate). `core-plugins.json` is left
to Obsidian's defaults.

---

## 6. Opening the tools from a note (mechanism, pinned + caveated)

The vault is extracted to an arbitrary location on the player's disk, so **absolute `file://` links
are not portable** and are not used. Two mechanisms, in priority order:

1. **Guaranteed:** the `Otwórz narzędzia.md` note instructs the player to open the tool from their OS
   file manager — the vault is a real folder, so they navigate to `Narzędzia/transkrypt/` and
   double-click `index.html` (opens in the default browser), likewise `prezentacja/edytor.html`. This
   always works and is the documented primary path.
2. **Convenience:** the note also carries a standard relative markdown link,
   `[Otwórz transkrypt](transkrypt/index.html)`. Recent Obsidian opens a clicked link to a local
   non-note file with the system default app; where a given Obsidian version instead previews it
   in-pane, mechanism 1 is the fallback. Whether the click reliably reaches the browser across
   Obsidian versions is the one behavior the dry-run must confirm (§8 open questions) — but the
   feature does not depend on it.

Inherited caveats (from `docs/RUNBOOKS/session-package.md`): the zip must be **fully extracted**
before opening (a browser can't reach a sibling audio file from inside a zip), and `.opus` `<audio>`
plays in Chrome/Edge/Firefox but may fail in macOS Safari.

---

## 7. Media wiring & the gallery manifest

- The presentation tool's assets come from `public/gallery/<slug>.json` via `buildPresentationKit`
  (unchanged). **v1 ships the empty stub** (`public/gallery/rozdarte-sumienie.json` has empty
  `scenes/cast/tracks`), so the kit's built-in library is empty; players build decks from their own
  uploads until the GM populates the manifest and rebuilds.
- The summary's inline images resolve by **basename** against the `Media/` folder (§3.3). The GM's
  workflow to enrich the vault: drop portrait/scene files into `Media/portrety/`, `Media/sceny/`
  (names per `Media/_Wrzuć tu media.md`), optionally add them to `public/gallery/<slug>.json` (so the
  presentation tool library fills too), then **re-run the vault builder** — one command re-assembles
  everything. There is no separate "media pipeline"; the vault is regenerated, not patched.
- `Media/muzyka/`, `Media/zdjecia-z-gry/`, `Media/materialy/` are GM/player drop-zones for session
  music, in-game photos, and handouts; they are surfaced only as folders + the note in v1 (no note
  references them yet — additive later).

---

## 8. Round trip (documented lightly)

1. Players edit `Streszczenie — <Session>.md` inline (names, scene order, "who did what") and write
   free-form in `Komentarz do AI.md`; the owner sends both back (Discord/mail, same channel as the
   rest of the campaign) — or the whole zipped vault.
2. The GM feeds the corrected summary + the Komentarz to Akta's AI. The AI:
   - **restores** every `<!--rs:ID-->` to `{sesja:<slug>#ID}` and strips the `(scena …)` labels
     (deterministic inverse of §3.2),
   - **converts** the Obsidian embeds/callouts back to the site's `UG2Summary`-style TSX/wiki-markdown,
   - **folds** the Komentarz answers and inline corrections in as a **reviewable diff** — never
     auto-applied, mirroring the `session-feedback` skill's trust posture — for the GM to merge by hand.
3. The reviewed result becomes the site summary; from there the existing Stage L/M loop (margin
   comments, gallery, presentation, package) takes over.

This spec does not build step 2's skill; it only guarantees the vault emits a **losslessly
restorable** artifact (the inline restore comments + the untouched repo draft) so that skill is
straightforward when scheduled. Reserved interface: **`<!--rs:ID-->` restore comment** in the vault
summary ↔ `{sesja:<slug>#ID}` site token.

---

## 9. Generator

`scripts/build-session-vault.ts` (tsx), `npm run build-session-vault -- <slug> [--summary <path>]
[--audio <path>] [--out <dir>=packages]`. Mirrors the two existing builders' conventions
(function-form token replacement; template-drift occurrence guards; out-dir-aware printed hints; no
env, no network, no Supabase). Behavior:

1. Resolve overlay (via `variants.json`) + scene-index for `<slug>` (reuse the exact resolution
   `build-package.ts` already does).
2. Resolve the **summary source**: `--summary <path>`, else the digest draft
   `docs/superpowers/drafts/*-<slug>-summary.md` (single-match discovery; ambiguity → exit 1 asking
   for `--summary`).
3. Build the rewrite inputs (`resolve` id→{idx,sec}, `scenes` with ordinals) and run
   `rewriteSummaryToObsidian` (§3) → the rewritten `.md` string + the collected media basenames.
4. `buildSessionPackage({ slug, audioPath: <--audio or the Sala default>, outDir:
   <vault>/Narzędzia/transkrypt })` and `buildPresentationKit({ slug, outDir:
   <vault>/Narzędzia/prezentacja })`.
5. Materialize the static templates (interpolating session name / slug / media checklist) and write
   all vault files under `packages/<slug>-vault/` (gitignored).
6. Print: file/dir sizes, the out-dir-aware `Compress-Archive` line, the Drive hint, and the
   **"next: hand the zip to one player as the correction assignment"** reminder.

`--audio` optional and passed straight to `buildSessionPackage`, which already degrades to a
transcript-only tool when absent. For rozdarte-sumienie the default is
`packages/_audio-src/rozdarte-sumienie-sala.opus` (gitignored under `packages/`), produced on
rpg-recorder's side — **producer boundary unchanged**.

> [!warning] Audio-timeline precondition (Sala mix)
> The transcript tool seeks by `utterance.play.start` (concat-stream seconds). For the Sala
> single-room recording to seek correctly it must be a **concat mix aligned to the same timeline**
> (same segment order/lengths) as the overlay — exactly the precondition the session-package runbook
> already states. The dry-run (§/plan V6) verifies alignment at three points; if the Sala file
> isn't aligned, ship the transcript tool **without** `--audio` (fallback the builder already
> supports) rather than a mis-seeking one, and flag it to rpg-recorder. This is an open item, not a
> blocker for the vault itself.

### Pure logic to unit-test (Vitest)

In `scripts/lib/vault-summary.ts`: `formatClock` (mirror of `fmtTime`), `sceneForIndex`
(exact/preceding/before-first), `rewriteDeepLinks` (single + range + unknown-id-throws +
restore-comment shape), `rewriteImageEmbeds` (`<img>` and `![]()` → `![[basename]]`, caption
preserved), `collectMediaBasenames` (dedupe), `questionsToCallouts` (paragraphs → `> [!question]`,
optional `{q-after:…}` relocation). In `scripts/lib/vault-manifest.ts`: `planVaultFiles` (the exact
set/paths of files the builder will write, so assembly is asserted without disk I/O). The two
builder refactors (`buildSessionPackage`, `buildPresentationKit`) keep their existing dry-run
coverage; the vault orchestration itself is exercised by the §-plan V6 end-to-end dry run.

---

## 10. Cross-cutting constraints

- **Stack locked; NO new dependency.** The vault is files; Obsidian is the player's app. The builder
  is a `tsx` script like the others; zipping is the printed PowerShell `Compress-Archive`.
- **Public repo — no secrets.** The vault pipeline touches no Supabase, no env, no network.
- **`packages/` gitignored** already covers `packages/<slug>-vault/` and `packages/_audio-src/`;
  nothing here is committed. **No commit** — hand the working tree to the GM.
- **i18n split:** Polish for everything a player sees (vault notes, tool UI); English for code,
  comments, docs, and this spec.
- **Reuse patterns:** the two builders' token-injection + drift-guard style; `package-data.ts`'s
  `inlineJson`; `fmtTime`/`format.ts` for clocks; the runbook shape of
  `docs/RUNBOOKS/session-package.md`.
- **Producer boundary (rpg-recorder) unchanged:** the vault consumes overlay + Sala mix; it never
  reaches into rpg-recorder's pipeline.

---

## 11. Key decisions (summary)

| Decision | Choice | Why |
|---|---|---|
| Distribution | Obsidian **vault zip on Drive**, not a site page | First-pass review needs an offline, long-form, player-editable workspace before anything is worth publishing |
| Reuse builders | Extract exported `buildSessionPackage` / `buildPresentationKit`, call with explicit `outDir` | "Call their exported logic"; avoids `child_process`/Windows-quoting fragility; lets the tools land at exact vault paths; keeps CLIs unchanged |
| Deep-link rewrite | `(scena N · ~H:MM:SS)` visible + `<!--rs:ID-->` hidden | Human-readable + Obsidian-safe; timestamp from `play.start` (reliable); scene via monotone preceding-scene rule (20/55 anchors fall outside scene ranges); losslessly restorable inline |
| Restore channel | **Inline HTML comment**, no sidecar | Position-stable through edits/reorders; invisible in reading view; no mystery file in the tree |
| Scene for out-of-range anchor | last scene with `uStartIdx ≤ idx`, flagged `~N` | Deterministic, never fails, honest about approximation |
| Images | `![[basename.jpg]]` embeds | Native; resolves by filename so `Media/` subfoldering is free; degrades to visible placeholders until GM adds files |
| Question placement | callouts by builder; relocation-near-section by digest skill via optional marker | Mechanics are deterministic/testable; editorial placement stays with the authoring skill |
| `.obsidian/` | ship **minimal** `app.json` + `appearance.json`, no `workspace.json`, no plugins | Clean first-open reading view + Cthulhu-ish theme; fully portable; no security/trust prompt |
| Tool-open mechanism | file-manager double-click (guaranteed) + relative link (convenience) | Absolute `file://` isn't portable across player machines |
| Media/gallery | summary embeds resolve by basename in `Media/`; presentation kit reads the gallery stub | v1 empty-media honest; GM enriches by dropping files + re-running the builder |

---

## 12. Open questions for the GM

1. **Sala audio alignment** — is `rozdarte-sumienie-sala.opus` a concat mix time-aligned to the
   overlay's `play.start` (so scene/row seeks land), or a raw single-take room mic on a different
   clock? The dry-run checks three points; if it drifts, v1 ships transcript-only.
2. **Obsidian click-to-open** — on your/players' Obsidian version, does clicking
   `[Otwórz transkrypt](transkrypt/index.html)` open the browser, or must players use the file
   manager? (Feature works either way; this tunes the wording in `Otwórz narzędzia.md`.)
3. **Question relocation** — do you want the digest skill to place `{q-after:…}` markers so questions
   sit next to their sections for this session, or is a grouped end-section fine for v1?
4. **Assignment owner** — who is the assigned correction owner for rozdarte-sumienie? (Affects the
   one line in `START TUTAJ.md`, or leave it generic.)
5. **Media now or later** — provide the 9 expected images (`fisk`, `ksiegarnia`, `price`, `tablica`,
   `rhymers`, `elias`, `woodworth`, `greyholme`, `tom`) for this pass, or ship v1 with placeholders
   and enrich on the next build?
```
