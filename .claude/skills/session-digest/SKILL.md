---
name: session-digest
description: Use when turning a session's transcript overlay + GM off-mic notes into a player-facing summary draft, a "Pytania i wątpliwości" section, a scene-index, and a gallery manifest for Akta Kasandry.
---

# Session digest

Turns one session's raw materials — the rpg-recorder transcript overlay plus the GM's
off-mic memory of what the tape missed — into four player-facing drafts in the
established Akta Kasandry house style. **Project skill** (not global): the house-style
rules, deep-link syntax, and file layout below are specific to this repo.

This skill is **authoring guidance only**. It produces `.tsx` content and `.json` files
that a human (the GM) reviews and commits — it never calls Supabase, never deploys, and
is not app code.

## Inputs

- **Overlay JSON** at `public/transcripts/data/<slug>-<variant>-overlay.json`. The
  binding contract is `src/lib/transcripts/overlay.ts` — read it before touching an
  overlay file and **do not invent fields** not declared there. Key shape:
  `Overlay.utterances[]`, each an `Utterance` with `id`, `start`/`end` (transcript
  clock), `text` (winner copy), `speaker_name`, `assigned`, and `play` (concat-stream
  audio offset — `play.start`/`play.end`, **not** the transcript clock; see the
  "epoch clock ≠ audio time" caveat in `overlay.ts`).
- **GM off-mic notes** — freeform text/markdown the GM hands you, covering beats the
  tape missed entirely (known "off-tape gaps" — see `memories/project.md`).

## Workflow

1. **Read the overlay for chronology.** Walk `utterances[]` in order (already sorted by
   `start`). Use each utterance's **winner `text`** — the `chunks[]` array is
   cross-microphone provenance, not additional dialogue; do not read it as a second
   channel of chatter. Build a rough beat list by scanning `speaker_name` changes and
   `play.start` jumps (a big jump often marks a scene break); treat any beat that has no
   matching utterances as an off-tape gap to fill from GM notes.
2. **Draft the summary** in house style — see `references/house-style.md`. Study the
   live exemplars (`src/routes/UG2Summary.tsx`, `src/routes/UG2Narracja.tsx`) directly
   before writing; the reference doc distills their conventions but the source files are
   the ground truth.
3. **Generate "Pytania i wątpliwości".** 4–6 questions from the session, **each its own
   standalone paragraph** — never a markdown list item. This is not stylistic:
   `remarkBlockIds` (`src/lib/remarkBlockIds.ts`) hashes each paragraph's normalized text
   into a `data-block-id` (FNV-1a, `src/lib/comments/anchor.ts#shortHash`), and list items
   share a tighter block model that does not anchor the same way. Blank line between every
   question so each gets its own block.

   Two question types are allowed here — don't conflate them:
   - **Luki w rozumieniu (comprehension gaps)** — the **primary** purpose of this section:
     things the transcript genuinely leaves unclear about what happened at the table (a
     lost recording, off-mic action, an ambiguous outcome). A player's answer to one of
     these is a factual correction — `session-feedback` folds it back into the summary
     prose as a real diff.
   - **Otwarte zagadki (open mysteries)** — allowed, clearly secondary: in-fiction
     unknowns the GM has deliberately left unanswered (no answer exists at the table, and
     the GM won't reveal one). These stay permanently "unanswered". Player comments on
     them are theories, not corrections, and must never be folded into summary facts.

   Default to comprehension gaps; reach for a mystery only when the open thread is
   genuinely in-fiction and unresolved by design, not just something the GM hasn't
   decided to fill in yet. The section's intro blockquote must invite players to prefix
   each answer/theory with **[PEWNE]** (pewne — I'm certain this happened or was said at
   the table) or **[SPEKULACJA]** (spekulacja — this is my theory) — a plain-text
   convention written into the comment body itself; it needs no DB schema support.
4. **Emit the scene-index and gallery manifest** — exact shapes, worked example, and the
   block-id stability contract are in `references/outputs.md`.

## Outputs & where they go

Restated exactly — do not improvise different locations:

| Output | Destination | Notes |
|---|---|---|
| Summary draft | Appended to the case's `*Summary.tsx` `SUMMARY` template string (e.g. `src/routes/UG2Summary.tsx`) | GM reviews before deploy |
| "Pytania i wątpliwości" | Final section of that same `SUMMARY` string, after "Śmieszne i epickie momenty" | **Append-only** once published (see below) |
| Scene index | `public/transcripts/scene-index/<slug>.json` | Shape: `{ slug, scenes: [{ id, title, uStart, uEnd, tApprox }] }` |
| Gallery manifest | `public/gallery/<case-key>.json` | Schema = `GalleryManifestSchema` in `src/lib/gallery/manifest.ts` |

## New case wiring

For a **brand-new case** (no existing `*Summary.tsx`), the drafts above also need one-time
plumbing before they render anywhere. Checklist:

- [ ] Create `src/routes/<Case>Summary.tsx` (and optionally `<Case>Narracja.tsx`) and
  register each route in `INLINE_PAGES` in `src/routes/NodeView.tsx`.
- [ ] Add the case hub + stub pages in the vault (`SPRAWY/<NN CASE>/00 HUB.md` + numbered
  stubs) — pattern: journal entry 2026-06-26 — and mirror the nodes in
  `src/generated/content.ts` (or run `npm run build-content`).
- [ ] Register the cast `page_key` in `wiki.investigation_cast` (via `/admin/import`) so
  margin-comments get a speaker cast.
- [ ] Create the gallery manifest (`public/gallery/<case-key>.json`) and scene-index
  (`public/transcripts/scene-index/<slug>.json`) files per `references/outputs.md`.

## Rules

- **Append-only "Pytania i wątpliwości" text.** Once a question paragraph has shipped
  and players may have commented on it, its `data-block-id` is derived from its
  normalized text (`normalizeText` + `shortHash`). **Editing the wording changes the
  hash and orphans any comments already anchored to it.** New questions may be appended;
  existing question text is never revised after it's live. State this to the GM
  explicitly when handing off a draft that touches a previously-published summary.
- **No invented fields.** Overlay reads must stick to the `overlay.ts` contract; if a
  field you want doesn't exist there, that's a data problem to raise, not something to
  fabricate.
- **Seamless off-mic fills, no flags.** Per the Stage K decision, beats reconstructed
  from GM memory are written straight into the prose in house style — no `⚠` markers or
  visible "GM note" asides in the player-facing text.
- **This skill only writes drafts.** It never edits Supabase, never runs `npm run
  build-content`, and never marks anything as final — the GM approves the summary
  (including "Pytania i wątpliwości" wording) before the next deploy.

## Acceptance check

Before handing off, confirm:
- The summary draft reads as a natural continuation of the target `*Summary.tsx` file's
  existing house style (structure, tone, deep-link density).
- Every "Pytania i wątpliwości" question is a standalone paragraph (blank line before
  and after), not a list item.
- Each question is clearly one of the two types (gap or mystery) — a mystery is only
  used when no answer exists at the table, not as a shortcut for an unresolved gap — and
  the section's intro blockquote invites `[PEWNE]`/`[SPEKULACJA]` prefixes.
- The scene-index JSON's `uStart`/`uEnd` ids exist in the source overlay's `utterances[]`.
- The gallery manifest validates against `GalleryManifestSchema`
  (`parseGalleryManifest` in `src/lib/gallery/manifest.ts`) — required: `caseKey`,
  `title`; `scenes`/`cast`/`tracks`/`links` may be empty arrays.

## Reference instance

A complete, real example lives in this repo: `src/routes/UG2Summary.tsx` +
`src/routes/UG2Narracja.tsx` (house style), `public/gallery/ug2.json` (manifest),
`public/transcripts/scene-index/ug2.json` (scene index), sourced from
`public/transcripts/data/ug2-current-overlay.json`. Mirror its structure and density.
