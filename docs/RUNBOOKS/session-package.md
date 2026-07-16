---
date: 2026-07-15
status: active
tags:
  - runbook
  - area/sessions
  - area/packages
  - dep/rpg-recorder
---

# Runbook: building a session package (transcript + audio, for players)

Step-by-step for turning one finished session into a downloadable, self-contained
verification package — a single `index.html` (transcript inlined, no build step, no
internet needed) plus a sibling concat-mix Opus audio file, zipped and uploaded to Google
Drive, linked from the case hub. Opening the package locally lets a player click any scene
in the sidebar and have the transcript **and the audio** jump to that moment together.

Estimated time: **15–20 minutes**, most of it the ffmpeg mix (real-time-ish for a ~2.5 h
session) and the Drive upload.

Re-runnable per session, any time after that session's scene-index exists.

---

## Prerequisites

- [ ] The session has a **scene index**: `public/transcripts/scene-index/<slug>.json` exists
      (built by the `session-digest` skill — see `.claude/skills/session-digest`). Without it
      `build-package` refuses to run.
- [ ] The session's overlay is registered in `public/transcripts/data/variants.json` with a
      `default_variant` pointing at a **concat-timeline** overlay (`timeline: "concat"`).
      Package seeking only works on concat timelines — see
      `docs/superpowers/specs/2026-07-14-session-companion-design.md` §4.
- [ ] The per-channel Opus files for the session exist in rpg-recorder's tree, e.g. for UG2:
      `C:\Users\Pawel\rpg-recorder\outputs\transcript-viz\audio\ug2\ch00.opus … ch05.opus`.
- [ ] `ffmpeg` and `ffprobe` on `PATH` (already verified on this machine).
- [ ] `npm install` already run in this repo (you have `node_modules`).

> [!info] Producer boundary
> The concat mix is an **rpg-recorder output**. This repo never touches rpg-recorder's
> pipeline or its raw audio — it only documents the exact ffmpeg command (Step 1, below) and
> consumes the resulting single file via `--audio <path>`. No audio is ever committed to
> this repo (`packages/` is gitignored).

---

## Step 1 — concat mix (rpg-recorder side)

Run **in rpg-recorder's tree**, in the session's channel-audio folder, e.g.
`C:\Users\Pawel\rpg-recorder\outputs\transcript-viz\audio\ug2\`:

```
ffmpeg -i ch00.opus -i ch01.opus -i ch02.opus -i ch03.opus -i ch04.opus -i ch05.opus \
  -filter_complex "amix=inputs=6:duration=longest:normalize=0,dynaudnorm=f=250:g=15" \
  -ac 1 -c:a libopus -b:a 32k -application voip <slug>-mix.opus
```

Notes:

- Adjust `inputs=N` and the `-i` list to the session's actual channel count (UG2 = 6,
  `ch00`–`ch05`).
- `normalize=0` keeps each channel's relative level (so louder/quieter speakers stay
  distinguishable); `dynaudnorm=f=250:g=15` evens out overall loudness for speech
  intelligibility.
- **Validity precondition:** the input channels must be equal-length, time-aligned concat
  streams (true for symmetric-burst sessions like UG2 — verified max 0.1 s drift between
  channels). If a session's channels weren't recorded/exported that way, the mix will drift
  from the transcript's `play.start` offsets — don't ship it without spot-checking (see
  Step 1 sanity check below and the alignment check in Step 4 of the browser walkthrough).
- Output: `libopus`, mono, 32 kbps, `-application voip` (optimized for speech, not music).

**Sanity check** — output duration should be close to the overlay's `duration` field:

```
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 <slug>-mix.opus
```

Compare against `duration` in the session's overlay JSON
(`public/transcripts/data/<overlay-file>.json` in this repo). A few seconds of drift is
fine; anything off by tens of seconds or more means the wrong channel files were mixed, or
a channel isn't aligned — stop and investigate before building the package.

Also do a quick spot-listen (open the `.opus` file in any player) — you should hear
multiple voices at sane, roughly even loudness.

> [!info] Backlog item, not blocking
> This mix step should eventually become a proper rpg-recorder **export script** (one
> command, not a hand-typed ffmpeg one-liner) — that's rpg-recorder's backlog, not this
> repo's. Note it in their coordination doc when it lands so this runbook can be trimmed
> down to "run the export script."

---

## Step 2 — build the package

Back **in this repo** (`akta-kasandry`):

```
npm run build-package -- <slug> --audio "C:\Users\Pawel\rpg-recorder\outputs\transcript-viz\audio\<slug>\<slug>-mix.opus"
```

Example for UG2:

```
npm run build-package -- ug2 --audio "C:\Users\Pawel\rpg-recorder\outputs\transcript-viz\audio\ug2\ug2-mix.opus"
```

This reads the session's overlay + scene index (both already in this repo, read-only, no
Supabase/network access), builds the trimmed transcript payload, injects it into the vanilla
viewer template, and writes:

- `packages/<slug>/index.html`
- `packages/<slug>/audio/<slug>-mix.opus` (copied from the `--audio` path)

The command prints a summary (file sizes), the exact zip command (Step 3), and a reminder
of the hub-link paste targets (Step 5).

You can also build **without audio** (`npm run build-package -- <slug>`, no `--audio` flag)
— the package still works, but the player is hidden and seeking is disabled. Useful for a
quick check of the transcript rendering before the mix is ready.

---

## Step 3 — zip

The builder prints this command; run it as-is (PowerShell, from the repo root):

```
powershell -Command "Compress-Archive -Path packages\<slug>\* -DestinationPath packages\<slug>.zip -Force"
```

Example for UG2:

```
powershell -Command "Compress-Archive -Path packages\ug2\* -DestinationPath packages\ug2.zip -Force"
```

`-Force` overwrites an existing zip from a previous build. No Node zip library is used —
this is a deliberate stack-locked decision (see the plan's key-decisions table); it also
gives you a natural "inspect before shipping" checkpoint if you want to peek inside the zip
first.

Expect roughly **35–45 MB** for a full session with audio (UG2-sized: ~2.5 h at 32 kbps
mono ≈ 38 MB mix + ~0.6 MB `index.html`).

---

## Step 4 — upload to Google Drive

- Upload `packages/<slug>.zip` to Google Drive (any folder you use for campaign materials).
- Share it: **"Anyone with the link" → Viewer**.
- Copy the shareable link — you'll paste it in Step 5.

> [!warning] Unzip before opening
> Browsers won't play the sibling audio file from *inside* a zip — tell players to **fully
> extract** the zip first, then open `index.html` from the extracted folder. Mention this
> wherever you share the link (the ready-to-paste line below already says so).

---

## Step 5 — hub link (paste in BOTH places)

> [!warning] Dual-edit — do not paste in only one place
> The site's tree/hub content is generated from the vault but committed as a static mirror
> in `src/generated/content.ts`. Pasting the link **only** in the vault means it won't show
> up on the live site until the next full content regeneration; pasting it **only** in
> `content.ts` means the vault (source of truth) drifts from what's published. Always edit
> **both**. (This is the same lesson from the iteration-1 review — don't repeat that miss.)

1. **Vault hub page** — e.g. for UG2:
   `PUBLIC/SPRAWY/02 URODZAJ GROZY/00 HUB.md`
2. **Site mirror** — the same hub page's `body` field in `src/generated/content.ts` (search
   for the hub's `path`, e.g. `"sprawy/02-urodzaj-grozy/00-hub"`, and edit the matching
   `body` string).

Paste this line (Polish, matches the player-facing UI) into both, adjusting the slug and
size to what you actually built:

```
- [⬇ Pakiet sesji (transkrypt + audio, ~40 MB)](<DRIVE-URL>) - otwórz index.html z rozpakowanego ZIP-a
```

Replace `<DRIVE-URL>` with the link copied in Step 4.

---

## Caveats

- **Safari / Ogg-Opus:** the package's `<audio>` element plays fine in Chrome, Edge, and
  Firefox. macOS Safari may refuse to play `.opus` — it's not a universally supported
  container/codec there. Not worth an extra mp3 double-encode for now (players are expected
  on Windows/desktop browsers); if it becomes a real problem, revisit with an mp3 fallback.
- **Must be unzipped:** see the warning in Step 4 — a zipped `index.html` cannot reach its
  sibling audio file over `file://`.
- **Re-running overwrites:** running `build-package` again for the same slug overwrites
  `packages/<slug>/` in place (and therefore the next zip you make from it). If you need to
  keep an old package version around, rename or move the folder/zip before re-running.
- **`packages/` is never committed** — it's gitignored. The zip and its Drive link are the
  only durable artifact; if you lose the Drive upload, just re-run Steps 1–4.

---

## What this unlocks

After this runbook completes:

- ✅ A self-contained, offline-playable transcript + audio package exists for the session
- ✅ It's reachable from the case hub on the live site (once both edits from Step 5 are
  published)
- ✅ Players can independently verify "who said / did what" without the GM re-listening to
  raw recordings on their behalf

The site's `/sesje` viewer is untouched by any of this — it remains the always-on,
no-audio deep-link fallback; the package is the opt-in, audio-carrying companion for
verification.
