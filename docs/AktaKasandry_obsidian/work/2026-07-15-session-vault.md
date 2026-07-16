---
date: 2026-07-15
status: decided
tags: [decision, area/sessions, area/packages, area/vault, dep/rpg-recorder]
related: ["docs/superpowers/specs/2026-07-15-session-vault-design.md", "docs/superpowers/plans/2026-07-15-session-vault.md", "docs/RUNBOOKS/session-vault.md", "[[TASK_LIST]]", "[[work/2026-07-14-session-companion]]", "[[work/2026-07-15-presentation-kit]]"]
---

# Session vault — per-session Obsidian review package

## Problem

The Iteration-2 session package (downloadable transcript viewer + audio) and the
presentation kit (player self-service slide editor) both gave players a way to *consume* or
*play with* a session, but neither gave anyone a structured way to *correct* the
`session-digest` skill's draft summary before it goes anywhere near the live site. The draft
is reconstructed from a transcript, off-mic gaps get filled from GM memory, and character
names/scene order are sometimes genuinely uncertain — someone who was actually at the table
needs to read it closely, in one sitting, with the transcript and audio at hand, and mark up
what's wrong. The site's margin-comment loop (Stage L/M) only works once a page is already
live and carries no audio, so it's the wrong tool for this *first* pass.

## Design

Full design: `docs/superpowers/specs/2026-07-15-session-vault-design.md`. Implementation
plan: `docs/superpowers/plans/2026-07-15-session-vault.md` (tasks V0a/V0b, V1–V7). Runbook:
`docs/RUNBOOKS/session-vault.md`.

Shape: a **vault** is a generated, self-contained Obsidian folder —
`packages/<slug>-vault/` — built once per session from the `session-digest` skill's draft
(`docs/superpowers/drafts/<date>-<slug>-summary.md`), the session's overlay + scene-index,
and its gallery manifest. It bundles:

- `START TUTAJ.md` — onboarding (what this is, install Obsidian, how to help, how to send it
  back, who owns the correction).
- `Streszczenie — <Session>.md` — the digest draft, rewritten into Obsidian-safe markdown
  (see below) — the correction centerpiece.
- `Komentarz do AI.md` — a guided free-form notes file (names/characters, scene order, "what
  really happened", favorite moments, answers to the open questions) — the round-trip
  payload alongside inline edits to the summary itself.
- `Narzędzia/transkrypt/` — the full Iteration-2 session-package transcript tool, built
  **in place** via the newly-exported `buildSessionPackage`.
- `Narzędzia/prezentacja/` — the presentation kit editor, built **in place** via the
  newly-exported `buildPresentationKit`.
- `Media/{portrety,sceny,muzyka,zdjecia-z-gry,materialy}/` — drop-zones, pre-populated with
  the session's gallery images (see the builder enhancement below) and a checklist of any
  basenames the summary still needs.
- `.obsidian/{app,appearance}.json` — minimal portable config so the vault opens straight
  into reading view with a comfortable line width, no community-plugin trust prompt (there
  are none).

Distributed the same way as the other two artifacts: zipped, hosted on the GM's Google
Drive, handed to **one assigned player** as the correction owner (others are welcome to
read/comment, but one person owns sending the result back).

## Reuse, not reimplementation (V0a/V0b)

The vault does not duplicate the transcript viewer or the presentation editor. Both existing
CLIs (`scripts/build-package.ts`, `scripts/build-presentation-kit.ts`) were refactored,
behavior-preserving, to expose an exported, `outDir`-parameterized function —
`buildSessionPackage` and `buildPresentationKit` respectively — with each CLI's own `main()`
reduced to argv-parsing plus a call to that function. This was verified byte-identical to
the pre-refactor output for both CLIs' existing invocations, and the exported functions have
no side effects at import time, which is what let `build-session-vault.ts` call both in
place to populate `Narzędzia/transkrypt/` and `Narzędzia/prezentacja/` without forking either
tool's logic. Any future fix to either tool automatically benefits every vault built
afterward.

## The deep-link restore contract (the design's central decision)

**`{sesja:<slug>#<id>}` becomes `(scena N · ~H:MM:SS)<!--rs:id-->` — a visible label plus an
invisible HTML comment carrying the original token's identity.**

Obsidian has no concept of the site's transcript deep-link token, so the raw token is
useless to a player reading in Obsidian. The rewrite (`rewriteDeepLinks` in
`scripts/lib/vault-summary.ts`) replaces it with a human-readable clock position plus a
scene number — resolved off the session's overlay and scene-index, using the same seek-time
convention (`play.start` on the concat timeline) as the transcript tool itself — **and**
appends `<!--rs:id-->`, an HTML comment invisible in Obsidian's reading view but exactly the
string needed to reconstruct `{sesja:<slug>#id}` later, losslessly, with zero manual
re-linking. Range tokens (`{sesja:slug#a..b}`) get both clocks and `<!--rs:a..b-->`. If a
restore comment is ever lost — a player deletes it while editing prose around it — the
un-rewritten draft in `docs/superpowers/drafts/` remains the ultimate source of truth to
re-derive the mapping from; nothing is silently unrecoverable.

An unknown id (draft/overlay mismatch) makes `rewriteDeepLinks` **throw**, naming the id,
rather than shipping a dead link that would silently strand a player mid-summary.

### Out-of-range ids resolve to the preceding scene, not the nearest

Verified during planning against real data: the rozdarte-sumienie scene-index (16 entries)
covers only scattered index ranges, and **20 of the draft's 55 distinct deep-link anchors
fall outside every one of those ranges**. Simple range-containment is therefore not enough.
`sceneForIndex` (in `vault-summary.ts`) instead walks scenes in ascending order and returns
the last scene whose start index is `≤` the target, flagged `exact: false` (rendered as
`scena ~N`) — "the scene that had already started when this happened" — falling back to
scene 1 only for anchors before the very first scene. This is a deliberate approximation:
scene boundaries are sparse by design (the `session-digest` skill only indexes the moments
worth a chapter break), and "roughly this scene" with a `~` is more honest and more useful
to a corrector than either a hard containment failure or silently picking whichever
neighboring scene happens to be closer.

## Images, cross-page links, and questions

- **Images:** `<img src="/img/<slug>/<base>.<ext>">` and markdown-image equivalents become
  `![[<base>.<ext>]]` Obsidian embeds — Obsidian resolves embeds by filename anywhere under
  the vault, so `Media/` subfoldering is free and the rewrite doesn't need to know which
  subfolder a given image will end up in.
- **`/sesje/<slug>` links:** the site's own cross-page link to the transcript route has
  nothing to resolve to inside Obsidian; rewritten to point at the vault's own
  `Narzędzia/transkrypt/index.html`, with a parenthetical file-manager hint appended since
  Obsidian doesn't reliably follow a clicked link to a local non-note file in every version.
  A link to a **different** session's `/sesje/...` route (this summary quoting another
  session in passing) is left untouched — there's no local tool for it in this vault.
- **Questions:** each non-blank paragraph in "Pytania i wątpliwości" becomes a `[!question]`
  callout. A paragraph may end with an optional `{q-after:<heading text>}` marker (new this
  session, documented in `.claude/skills/session-digest/references/outputs.md`) that strips
  itself and relocates the callout to just after the named `### heading` elsewhere in the
  document instead of leaving it bottom-lumped with unrelated open mysteries — fail-soft: an
  unmatched heading just leaves the question in the section, never an error.

## Builder enhancement beyond the original plan: gallery images copied into `Media/`

The plan scoped `Media/` as a pure drop-zone the GM/players fill by hand, checklist provided
by `_Wrzuć tu media.md`. In practice, most sessions already have a populated gallery manifest
(`public/gallery/<slug>.json`) by the time a vault is built — the same manifest that already
knows every scene/cast image's site path. `build-session-vault.ts` now copies those images
straight into the vault's `Media/` tree at build time, so any embed the rewritten summary
references that's already in the gallery resolves immediately, with no separate manual step.
`Media/` still exists as a genuine drop-zone for anything the gallery doesn't have yet
(GM-only handouts, player-contributed photos) — re-running the builder after adding to
either source (gallery manifest or `Media/` by hand) picks up both, since the vault is always
rebuilt wholesale, never patched.

## `rozdarte-sumienie` — first session through the full pipeline, end to end

This session was also the first real run of the **entire** pipeline in sequence:
rpg-recorder → overlay lands in this repo → `session-digest` drafts the summary → `npm run
build-package` / `build-presentation-kit` / `build-session-vault` all run against real data.

One irregularity surfaced and was worked around, not fixed here: the session's audio arrived
as **4 separate recorder runs** rather than one continuous capture, which triggered a stitch
bug in rpg-recorder's overlay-assembly step. The overlay used
(`rozdarte-sumienie-current-overlay.json`) was rebuilt working around that bug by hand;
fixing the bug itself belongs in rpg-recorder (producer side of the boundary), and is
recorded as a backlog note there, not addressed in this repo.

Resulting data, all real and committed to the working tree (not yet committed to git):

- **Overlay:** concat timeline, 27023.4 s (~7 h 30 m), 4449 utterances, 7 speakers (Nika G,
  Jakub M, Rafał G., Paweł MG, Piotr S., Kamil K., plus a dedicated "Sala" room-mic channel).
- **Sala concat mix:** `packages/_audio-src/rozdarte-sumienie-sala.opus` (102.8 MB,
  gitignored, producer-boundary input to the transcript tool's audio player).
- **Digest draft:** `docs/superpowers/drafts/2026-07-15-rozdarte-sumienie-summary.md` — 60
  deep-link tokens, several character names explicitly flagged uncertain, a "Pytania i
  wątpliwości" section.
- **Scene-index:** `public/transcripts/scene-index/rozdarte-sumienie.json`, 16 scenes.
- **Gallery manifest:** `public/gallery/rozdarte-sumienie.json` — 20 scenes/handouts, 10
  cast, 8 tracks, `caseName: "Rozdarte Sumienie"`.
- **Real media committed:** `public/img/rozdarte-sumienie/` (31 files, 6.7 MB — 10 scene
  photos, 10 cast portraits including Fisk, Kent, Gundberg, Tommy Malone, and 11
  tome-handout `.webp` pages) and `public/audio/rozdarte-sumienie/` (8 tracks, 26 MB) —
  compressed down from a ~180 MB source library to ~32 MB combined.
- **Vault built:** `packages/rozdarte-sumienie-vault/`, ~153 MB (zip ~103 MB), dominated by
  the bundled transcript tool's Sala audio (~104 MB) with the presentation kit (~43 MB) and
  the summary/templates/copied gallery media (~7 MB) making up the rest.

## Decisions

- **The vault reuses, never reimplements, the session package and presentation kit** — see
  V0a/V0b above. This is the same "don't duplicate a viewer/editor" posture the presentation
  kit itself followed with the `cinematic-slideshow` engine.
- **The round-trip artifact is `Streszczenie…md` + `Komentarz do AI.md`, restored by Akta's
  AI into a reviewable draft — never auto-applied.** Same trust posture as the
  `session-feedback` skill: a human reads and merges by hand before anything reaches the live
  site.
- **Out-of-range deep-link anchors resolve to the preceding scene, flagged inexact** — a
  verified-against-real-data necessity (20/55 anchors in the rozdarte-sumienie draft), not a
  hypothetical edge case.
- **Gallery images are copied into vault `Media/` automatically** — a builder enhancement
  beyond the original plan, reducing the manual media-drop step to only the images the
  gallery manifest doesn't already have.
- **No new dependency, no schema change, no site source change** — the vault builder only
  reads existing drafts/overlays/scene-indexes/gallery manifests and calls the two existing
  builders; publishing a corrected summary remains a manual GM step via the existing Stage
  K/L pipeline.

## Open items (GM manual actions)

- [ ] Open `packages/rozdarte-sumienie-vault/` in Obsidian ("Open folder as vault") to
      visually confirm reading view, deep-link labels, image embeds, and `[!question]`
      callouts render as expected — the one verification step the sandbox couldn't perform.
- [ ] Resolve the remaining uncertain character/NPC identities flagged inline in the
      rozdarte-sumienie draft's "Pytania i wątpliwości" section.
- [ ] Eventual site-publish of the corrected rozdarte-sumienie summary once the assigned
      player's round trip comes back — feeds the existing Stage K/L pipeline (case hub,
      margin comments, gallery, package, presentation).
- [ ] Flag the 4-run stitch bug to rpg-recorder's own backlog (their pipeline, not this
      repo's).
