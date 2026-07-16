---
date: 2026-07-15
status: active
tags:
  - runbook
  - area/sessions
  - area/packages
  - area/vault
  - dep/rpg-recorder
---

# Runbook: building a session vault (Obsidian review package, for the correction pass)

Step-by-step for turning one finished session's digest draft into a self-contained
**Obsidian vault** — a folder a player opens directly in their own Obsidian install,
containing the rewritten summary (for inline correction), a free-form notes file, the
transcript tool, and the presentation kit, all in one zip on Google Drive. This is the
**first full-pass review step**, before anything from that session is worth publishing on
the site: one assigned player corrects names/scene order/"what really happened" and answers
the digest's open questions; the GM later feeds the corrected result to Akta's AI, which
restores the site's deep-links and produces a reviewable publish draft.

Design reference: `docs/superpowers/specs/2026-07-15-session-vault-design.md` (§3 is the
deep-link/restore mechanism this runbook's round trip depends on; §9 has the Sala-alignment
warning repeated in Step 1 below).

Estimated time: **10–15 minutes** for the build/zip/Drive/assignment loop (excluding the
Sala mix, which is the same ffmpeg step as the session package — see
`docs/RUNBOOKS/session-package.md` Step 1 if you need it fresh); the player's own correction
pass happens on their own time, separately.

Re-runnable per session, any time after prerequisites are met — and re-run it again whenever
you enrich `Media/` or the gallery manifest (Step 3).

---

## When to use

Run this **once per session**, right after the `session-digest` skill has produced a summary
draft, and **before** that summary is published on the site. It is the pre-publish review
pass — the site's margin-comment loop (Stage L/M) only works once a page is already live and
carries no audio; the vault gives players an offline, long-form, editable workspace to fix
the draft first.

---

## Prerequisites

- [ ] The session has a **scene index**: `public/transcripts/scene-index/<slug>.json` exists
      (built by the `session-digest` skill).
- [ ] The session's overlay is registered in `public/transcripts/data/variants.json` with a
      `default_variant` pointing at a **concat-timeline** overlay (`timeline: "concat"`) —
      same precondition as the session package (deep-link seconds and scene lookup both read
      `play.start` off this overlay).
- [ ] A **digest summary draft** exists at
      `docs/superpowers/drafts/<date>-<slug>-summary.md` (or pass `--summary <path>`
      explicitly). It must be the **only** match for `*-<slug>-summary.md` in that folder —
      the builder refuses to guess between two drafts.
- [ ] *(Optional but recommended)* the session's **Sala mix** exists at
      `packages/_audio-src/<slug>-sala.opus` (gitignored) — see Step 1. Without it the vault
      ships a transcript-only tool (no audio player), which still works fine for a first
      review pass.
- [ ] `npm install` already run in this repo (you have `node_modules`).

> [!info] Producer boundary
> Same boundary as the session package: this repo never touches rpg-recorder's pipeline or
> raw per-channel audio. It only consumes a single pre-mixed Sala file via `--audio` (or the
> `packages/_audio-src/<slug>-sala.opus` default). No audio is ever committed
> (`packages/` is gitignored).

---

## Step 1 — (optional) Sala mix

If you want the vault's transcript tool to have a synced audio player, produce (or reuse) the
session's concat mix exactly as in `docs/RUNBOOKS/session-package.md` Step 1 — same ffmpeg
command, same channel-count/alignment caveats. Drop the result at
`packages\_audio-src\<slug>-sala.opus` (gitignored) so the vault builder picks it up by
default, or point `--audio` at it explicitly.

```
ffmpeg -i ch00.opus -i ch01.opus … -i chNN.opus \
  -filter_complex "amix=inputs=N:duration=longest:normalize=0,dynaudnorm=f=250:g=15" \
  -ac 1 -c:a libopus -b:a 32k -application voip <slug>-sala.opus
```

> [!warning] Concat-alignment precondition
> The transcript tool seeks by `utterance.play.start` (concat-stream seconds). The Sala mix
> only seeks correctly if it is a **concat mix time-aligned to the same timeline** (same
> segment order/lengths) as the overlay — the exact precondition the session-package runbook
> already states, and the open question flagged in the design spec (§9, §12.1). Spot-check
> alignment at three points (start / mid / end of a scene) after building. **If it drifts,
> ship the vault without `--audio`** (the builder degrades cleanly to a transcript-only tool)
> rather than a tool that mis-seeks, and flag the misalignment to rpg-recorder. This is not a
> blocker for the rest of the vault — the summary review works either way.

---

## Step 2 — build the vault

In this repo (`akta-kasandry`):

```
npm run build-session-vault -- <slug> --audio "packages\_audio-src\<slug>-sala.opus"
```

Example for rozdarte-sumienie:

```
npm run build-session-vault -- rozdarte-sumienie --audio "packages\_audio-src\rozdarte-sumienie-sala.opus"
```

Or without audio (transcript-only tool):

```
npm run build-session-vault -- rozdarte-sumienie
```

Optional flags: `--summary <path>` (skip auto-discovery of the digest draft) and
`--out <dir>` (default `packages`).

This reads the overlay + scene-index (read-only, no Supabase/network access), rewrites the
digest draft into Obsidian-safe markdown (deep-links → `(scena N · ~H:MM:SS)` with a hidden
`<!--rs:ID-->` restore comment, images → `![[basename.jpg]]` embeds, questions → `[!question]`
callouts — see §3 of the design spec for the exact rules), and assembles:

```
packages\<slug>-vault\
  START TUTAJ.md                       onboarding — what this is, install Obsidian, how to help
  Streszczenie — <Session>.md          the rewritten summary — the correction centerpiece
  Komentarz do AI.md                   free-form notes file — the round-trip payload
  Narzędzia\
    Otwórz narzędzia.md                how to open the two tools below
    transkrypt\index.html (+ audio\)   the session-package viewer, built in-place
    prezentacja\edytor.html            the presentation kit editor, built in-place
  Media\
    portrety\ sceny\ muzyka\ zdjecia-z-gry\ materialy\   empty drop-zones
    _Wrzuć tu media.md                 checklist of exact filenames the summary expects
  .obsidian\app.json, appearance.json  minimal portable config — opens straight into reading view
```

The command prints per-area sizes (summary, transcript tool, presentation tool, total), the
exact zip command (Step 4), the Drive + assignment reminder (Step 5), and — if any image
basenames the summary references are still missing under `Media\` — a checklist reminder.
Expect the total to be dominated by the transcript tool's audio (same order of magnitude as
the session package alone, ~35–45 MB when the Sala mix is included) plus a few MB for the
presentation kit if the session's gallery manifest has images; the small markdown files and
`.obsidian` config are negligible. Rebuilding **removes and recreates**
`packages\<slug>-vault\` wholesale (not a patch over the previous build) — see Caveats.

> [!info] Unknown deep-link id fails loudly
> If a `{sesja:…#ID}` token in the draft doesn't resolve against the overlay, the build exits
> with an error naming the bad id rather than shipping a dead link. Fix the draft (or the
> overlay registration) and re-run.

---

## Step 3 — enrich media (optional)

The summary's image embeds resolve by **filename**, anywhere in `Media\` — so v1 (or any
session without images yet) ships with visible "not found" placeholders, which is expected
and self-explanatory to the assigned player via `Media\_Wrzuć tu media.md`.

To enrich:

1. Drop the expected image files into any `Media\` subfolder (`portrety\`, `sceny\`, etc.) —
   the exact basenames the summary needs are listed in the vault's own
   `Media\_Wrzuć tu media.md`, generated from the summary's image references.
2. *(Optional)* also add the same images (and any music/scene entries) to
   `public\gallery\<slug>.json` so the **presentation kit's** built-in asset library fills in
   too (otherwise players can still build decks from their own custom uploads — the "Moje"
   tab always works, even against an empty gallery stub).
3. **Re-run Step 2.** There is no separate media pipeline or patch step — the vault is
   regenerated wholesale from its sources every time, so one command re-assembles everything
   including the newly available images.

---

## Step 4 — zip

The builder prints this command (out-dir-aware); run it as-is (PowerShell, from the repo
root):

```
powershell -Command "Compress-Archive -Path packages\<slug>-vault\* -DestinationPath packages\<slug>-vault.zip -Force"
```

`-Force` overwrites an existing zip from a previous build — same no-Node-zip-library decision
as the other two builders, and it doubles as an "inspect before shipping" checkpoint.

---

## Step 5 — Drive + assignment

- Upload `packages\<slug>-vault.zip` to Google Drive (same folder you use for other campaign
  materials).
- Share it: **"Anyone with the link" → Viewer**.
- Hand the link to **one player as the assigned correction owner** for this session — the
  vault's own `START TUTAJ.md` says "`<owner>` prowadzi korektę, reszta pomaga", so tell the
  others they're welcome to open it too and comment/answer questions, but one person owns
  sending the result back.

Ready-to-paste instructions (Polish, matches what `START TUTAJ.md` tells them once they're
inside):

```
📓 Sesja „<Session>" czeka na korektę! Przygotowałem cały folder do przejrzenia w Obsidianie
(to darmowy program do notatek, jeśli go nie masz):

1. Zainstaluj Obsidian: https://obsidian.md (przy pierwszym uruchomieniu może zapytać o
   zaufanie — u nas nie ma żadnych wtyczek, więc śmiało).
2. Pobierz i **w całości rozpakuj** ZIP: <DRIVE-URL>
3. W Obsidianie: „Open folder as vault" → wybierz rozpakowany folder.
4. Zacznij od notatki **START TUTAJ** — jest tam wszystko, jak pomóc i jak odesłać wynik.

<owner>, to Ty prowadzisz korektę tej sesji — reszta, śmiało czytajcie, komentujcie i
odpowiadajcie na pytania w środku.
```

---

## Step 6 — round trip

When the assigned player sends back their work (Discord/mail, same channel as the rest of
the campaign) — either just `Streszczenie — <Session>.md` + `Komentarz do AI.md`, or the
whole vault folder/zip:

1. **Feed both files to Akta's AI.** It restores every `<!--rs:ID-->` hidden comment back to
   `{sesja:<slug>#ID}` and drops the visible `(scena …)` label — a deterministic inverse of
   the Step 2 rewrite, reconstructing exactly the site's deep-link token. It also converts the
   Obsidian embeds/callouts back to the site's summary format, and folds the `Komentarz do
   AI.md` answers plus any inline text corrections into the result.
2. **Never auto-applied.** The AI's output is a **reviewable draft/diff**, same trust posture
   as the `session-feedback` skill — you read and merge it by hand before it becomes the live
   site summary. If a `<!--rs:ID-->` comment is ever missing or damaged (a player deleted it
   while editing), the original, un-rewritten digest draft in
   `docs/superpowers/drafts/` remains the ultimate source of truth to re-derive it from.
3. Once merged, the existing Stage L/M loop takes over — margin comments, gallery, package,
   presentation — same as any other published session summary.

---

## Caveats

- **Unzip before opening.** Same as the session package: a browser can't reach the
  transcript tool's sibling audio file, and Obsidian can't reliably resolve the vault's
  relative links, from *inside* a zip. Tell the player to **fully extract** first.
- **`.opus` / Safari.** The transcript tool's `<audio>` element plays fine in Chrome, Edge,
  and Firefox; macOS Safari may refuse `.opus`. Same non-blocking caveat as the session
  package runbook.
- **Re-running is a clean rebuild.** The builder deletes `packages\<slug>-vault\` entirely
  before recreating it (and therefore the next zip built from it), so orphaned files from a
  previous build — an old summary filename after a session rename, a gallery track that was
  since removed — never linger. Rename/move the folder or zip first if you need to keep an
  older vault version around.
- **Media placeholders until Step 3.** Image embeds render as Obsidian "not found"
  placeholders until the expected files are dropped into `Media\` and the vault is rebuilt —
  expected, not a bug, and called out in the vault's own `_Wrzuć tu media.md`.
- **Empty presentation library on an empty gallery stub.** If `public\gallery\<slug>.json`
  hasn't been populated yet, the presentation kit's built-in asset picker is empty; the
  custom-upload ("Moje") tab still works, so players can build a deck immediately from their
  own photos regardless.
- **`packages\` is never committed** — gitignored, same as the other two builders. The zip
  and its Drive link/assignment message are the only durable artifacts; if you lose the Drive
  upload, just re-run Steps 2–5.

---

## What this unlocks

After this runbook completes:

- The session's digest draft gets a real, offline, long-form **correction pass** by the
  players who were actually there — names, scene order, "what really happened", open
  questions — before a single word of it is published.
- The assigned player has everything needed in one place: the summary to edit, a free-form
  notes file, the full transcript with (optionally) synced audio, and a presentation kit to
  play with — no site access, no account, no build step.
- The GM gets back a **losslessly restorable** artifact (the inline `<!--rs:ID-->` comments)
  that Akta's AI can turn into a reviewable site-publish draft without hand-reconstructing a
  single deep-link.
