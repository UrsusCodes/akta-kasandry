---
name: session-feedback
description: Use after players have commented on a session summary page (margin-comments on UG2Summary.tsx or similar), to fold their reactions/answers back into the summary as a reviewable diff. Never auto-applies and never commits — the GM reviews and merges by hand.
---

# Session feedback

Turns player margin-comments left on a case's `*Summary.tsx` page into a **proposed, reviewable
diff** against that page's `SUMMARY` template string. It never edits the file for you and never
commits — it only produces a diff the GM reads and applies (or not).

This is the read-back half of the authoring pipeline; `session-digest` is the write-forward half
(transcript → summary draft). Run this one *after* a summary has been live long enough to collect
comments.

## What you produce

A single **unified diff** (or, if the user prefers, a side-by-side before/after) against the
`SUMMARY` string in the target `src/routes/<Case>Summary.tsx`, plus a short prose note per hunk
explaining *why* — which comment(s) it responds to and whether it's an in-character (IC) reaction
or an out-of-character (OOC) correction. Nothing is written to disk by this skill; the diff is
presented in chat for the GM to apply.

## Inputs

- `page_key` for the summary page (e.g. `streszczenie/ug2`) — the same key
  `AnnotatableArticle`/`useCommentsStore` use to scope comments to that page.
- The current summary source file, e.g. `src/routes/UG2Summary.tsx`.

## Workflow

1. **Fetch the grouped comments.** Run:

   ```
   npx tsx --env-file=.env.local scripts/fetch-comments.ts <page_key>
   ```

   (`scripts/fetch-comments.ts` is a read-only Node script — see M2 of
   `docs/superpowers/plans/2026-07-14-session-companion-iter1.md` — that queries `wiki.comments`
   with the **anon** key from `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, loaded via Node 24's
   `--env-file`. It exits 1 with a clear message if those env vars are missing.) It prints a
   human summary to stdout (group count, thread count) and writes the full grouped JSON to
   `scratch/feedback-<page_key-slug>.json`, shaped:

   ```ts
   type RawComment = {
     id: string; pageKey: string; blockId: string; quote: string
     authorName: string; speakerName: string | null
     body: string; parentId: string | null; createdAt: string; edited: boolean
   }
   type FeedbackThread = { root: RawComment; replies: RawComment[] }
   type FeedbackGroup = { blockId: string; quote: string; threads: FeedbackThread[] }
   // fetch-comments.ts writes FeedbackGroup[]
   ```

   Read that JSON file. Each `FeedbackGroup` is one commented fragment (`quote`) inside one block
   (`blockId`); `threads` holds the root comment plus any replies nested under it.

2. **Load the current summary source.** Read the target `*Summary.tsx` and locate the `SUMMARY`
   template string. Match each `FeedbackGroup.blockId`/`quote` back to the paragraph or sentence
   it anchors to (the quote is a literal substring of the rendered block; find it in the markdown
   source by content, not by counting paragraphs — markdown block ids are computed from rendered
   text via `remarkBlockIds`, not stored in the source).

3. **Classify each thread before proposing anything:**
   - **IC flavour** — a player comment written in-character (a reaction, a joke, a character's
     opinion). These are *not* factual corrections; do not fold them into the summary prose as if
     they were established fact. At most, they can inform a future "Śmieszne i epickie momenty"
     quote reel entry (propose that separately, don't silently merge it into narrative text).
   - **OOC correction / answer** — a player stating an out-of-character fact ("actually my
     character did X", "the GM told us Y off-mic", an answer to a "Pytania i wątpliwości"
     comprehension-gap question). These are candidates for a real diff hunk.
   - When a thread is ambiguous, say so in the note rather than guessing.
   - **`[PEWNE]`/`[SPEKULACJA]` marker convention.** For "Pytania i wątpliwości" threads,
     `session-digest`'s intro blockquote asks players to prefix their comment with one of these
     plain-text markers (anywhere in the comment body — no DB field). Treat the marker as a
     strong signal, not the sole basis for classification:
     - `[PEWNE]` — a high-confidence candidate OOC correction (the player states they're certain
       this happened or was said at the table). Still read the body to confirm it's actually a
       factual claim before proposing a diff hunk.
     - `[SPEKULACJA]` — a theory, never an OOC correction, regardless of how confidently it
       reads. Never fold a `[SPEKULACJA]`-marked comment into summary prose as fact. If you
       propose a "Teorie graczy" subsection under the relevant question, you may quote it there —
       clearly attributed and labeled as a theory — but that is a separate, clearly-flagged
       addition, not a narrative-text merge.
     - Unmarked comments — classify by content exactly as above (IC vs OOC); the convention is a
       hint, not a requirement, and older/unmarked comments predate it.
   - **Comprehension gaps vs open mysteries.** `session-digest` now generates two kinds of
     "Pytania i wątpliwości" question (see its SKILL.md): **luki w rozumieniu** (things the
     transcript leaves genuinely unclear — an answer is a real correction) and **otwarte
     zagadki** (in-fiction unknowns the GM has deliberately left unanswered — no table-fact
     exists to correct). Identify which kind a question is by content — a gap asks what actually
     happened at the table; a mystery asks about an in-fiction unknown. **A thread answering a
     mystery question never produces a summary-fact diff hunk, regardless of marker** — not even
     a `[PEWNE]`-marked one, since there is nothing at the table to confirm. At most propose
     adding it to a "Teorie graczy" subsection, clearly labeled as a theory, and say so in the
     note.

4. **Propose edits as a diff, never invent content.** For each OOC-correction thread, propose a
   minimal, surgical change to the nearby prose (or, for a "Pytania i wątpliwości" answer, a new
   sentence/paragraph that reports the answer — see the append-only rule below). Quote the
   player's own words or paraphrase tightly; do not add narrative detail the comment didn't state.
   If a comment doesn't warrant a summary change (pure banter, already covered, unclear), skip it
   and say why in the accompanying note — don't force a hunk.

5. **Respect the append-only rule for "Pytania i wątpliwości".** The block-id of each question
   paragraph is a stable hash of its *normalized text* (`shortHash` in
   `src/lib/comments/anchor.ts`, FNV-1a over whitespace-collapsed text). **Never edit the wording
   of an existing question paragraph once it has comments** — that changes its hash, and every
   comment anchored to it becomes an orphan (silently unresolvable; `resolveAnchor` falls back to
   fuzzy quote-matching across blocks and may still fail). Instead:
   - Append the player's answer as new prose **after** the question (its own paragraph, or folded
     into a new "Odpowiedzi graczy" sub-block below the questions) — never inside the question's
     existing paragraph.
   - If a question is fully resolved, you may propose marking it resolved via new surrounding
     text, but the original question paragraph's own text stays untouched.

6. **Present the diff for GM review.** Output one unified diff hunk (or clearly labeled
   before/after pair) per proposed change, each preceded by: which `FeedbackGroup`/thread it
   responds to, the classification (IC vs OOC), and a one-line rationale. End with a short list of
   comments you deliberately did not act on and why. **Do not write the file. Do not commit.** The
   GM applies (edits `*Summary.tsx` themselves, or asks you to apply this specific hunk) and
   commits when ready.

## Rules (hard)

- **No auto-apply.** This skill only ever proposes a diff in chat. It does not call `Edit`/`Write`
  on the summary file and does not run `git commit`. If the GM says "apply hunk 3", that's a new,
  explicit instruction — treat it as any other edit request, not as part of this skill's default
  behavior.
- **Append-only block-ids.** Never modify the text of an existing "Pytania i wątpliwości" question
  paragraph (or any other already-commented block) — see step 5. New content goes in new
  paragraphs.
- **Mysteries never produce fact diffs.** A thread answering an "otwarte zagadki" (open
  mystery) question never becomes a summary-fact diff hunk, no matter how confidently
  worded or `[PEWNE]`-marked — see step 3. Comprehension-gap questions are the only
  "Pytania i wątpliwości" questions eligible for a real correction.
- **Never invent player statements.** Every factual claim added to the summary must trace back to
  an actual comment body in the fetched JSON. Paraphrase, don't embellish.
- **Anon key, no secret.** `fetch-comments.ts` reads `wiki.comments` (publicly readable via the
  `comments_anon_read` RLS policy) using only the **anon** Supabase key from `.env.local`
  (`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`). It is read-only — it never writes to Supabase.
  Never hardcode a key in this skill or in the diff it proposes; `.env.local` stays uncommitted.
- **Polish content, English rationale.** Any prose proposed for the summary is Polish (matching
  house style); the classification notes and rationale you write for the GM are plain prose in
  whatever language the conversation is in.

## Example invocation

```
npx tsx --env-file=.env.local scripts/fetch-comments.ts streszczenie/ug2
```

reads `scratch/feedback-streszczenie-ug2.json`, then propose a diff against
`src/routes/UG2Summary.tsx`'s `SUMMARY` string following the workflow above.
