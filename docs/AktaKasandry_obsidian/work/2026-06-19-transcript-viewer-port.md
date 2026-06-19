---
date: 2026-06-19
status: decided
tags: [decision, area/transcripts, dep/rpg-recorder]
related: ["[[TASK_LIST]]", "[[memories/project]]"]
---

# Transcript provenance viewer — port from rpg-recorder

Ported the multi-microphone transcript viewer/editor from the sister project
**rpg-recorder** (`C:\Users\Pawel\rpg-recorder`) into Akta Kasandry as the new
`/sesje` section. Lets players read full session transcripts with per-line
**competing-microphone chunks and attribution probabilities**, switch attribution
variants, and (editor mode) correct speaker/text.

## Producer / consumer boundary (the core decision)

**rpg-recorder stays the PRODUCER; Akta Kasandry is the CONSUMER.** The only
interface between the two repos is one file format: `<slug>-<variant>-overlay.json`
(spec: `rpg-recorder/outputs/transcript-viz/data/SCHEMA.md`).

- The audio pipeline (Whisper, embeddings, speaker attribution, overlay build)
  is **NOT** ported. New sessions are always produced in rpg-recorder and arrive
  here as a finished overlay JSON + a manifest entry.
- We mirror the schema as TS types in `src/lib/transcripts/overlay.ts`. **Do not
  invent fields** — if the upstream schema changes, update that file to match.

## Adding a new session (no code change)

The viewer is fully **manifest-driven** — adding a session/variant is data-only:

1. Produce the overlay in rpg-recorder (`build_overlay.py`), per SCHEMA.md.
2. Copy `<slug>-<variant>-overlay.json` → `public/transcripts/data/`.
3. Add a session/variant entry to `public/transcripts/data/variants.json`.
4. (Optional) add the channel→Drive links to `audio-links.json` (see below).

Currently shipped: **Sol w Ranach** (7 variants, default `parallel-split-epoch`)
and **UG 2** (4 variants, default `current`) — the curated "story-order" sets
from SCHEMA.md, not the full experimental variant list.

## Audio decision — NO in-app streaming

> [!warning] Audio is not hosted or streamed by this app
> Per-channel Opus is ~300 MB/session and Google Drive (the GM's store) cannot
> serve seekable media (no HTTP Range, CORS blocked, redirect/interstitial). We
> evaluated commit-to-repo, GitHub Releases, Cloudflare R2, and Drive sharding —
> all rejected in favour of **manual seek links**.

Instead, each chunk shows `chNN @ mm:ss` (the playback offset into that channel's
stream). When the GM fills `public/transcripts/data/audio-links.json` with a
shareable URL per channel, the timestamp becomes a clickable external link; the
user opens it and seeks manually. The resolver
(`src/lib/transcripts/audioLinks.ts`) also supports **sharded** channels: add
segments with `start`/`end` and it picks the right part and shows the offset
within it. Empty url ⇒ timestamp shown, no link (viewer still works).

This is the open follow-up if real playback is ever wanted: revisit GitHub
Releases (Range + CORS, no repo bloat) or R2 (zero egress).

## What was built

- **Data** (`public/transcripts/data/`, ~39 MB JSON, **no audio**): 11 overlays +
  trimmed `variants.json` + `audio-links.json` skeleton.
- **Renderer** rewritten as React/TS in the Cthulhu skin (option B, not embedded
  HTML). Virtualization via CSS `content-visibility:auto` (no new dependency) —
  5094/4693-row transcripts stay smooth.
- **Components** `src/components/transcripts/`: `TranscriptList`, `TranscriptRow`,
  `ProvenancePanel`, `Legend`, `VariantBar`. Store: `src/stores/transcript.ts`.
  Lib: `src/lib/transcripts/{overlay,format,data,audioLinks,corrections,effective}.ts`.
- **Routes** `/sesje` (index) + `/sesje/:slug?v=<variant>`. AppShell renders this
  section full-bleed (no wiki tree column). Nav link "Sesje" added.
- **Editor (corrections)**: paint speaker (trumps auto-attribution, `✎` badge),
  edit text (`edit` badge), persisted in `localStorage`
  (`rpgrec.corrections.<slug>.<variant>`), export JSON (the feedback-loop input
  back to rpg-recorder).
- **Ambiguity**: `assigned:false` lines (top-2 chunks within 0.15 prob) render
  neutral with a `?` instead of guessing a speaker.

## Verified (dev + prod build)

Both sessions load; hover shows competing chunks with % (e.g. 48/36/16, sum 1.0,
sorted winner→prob); variant switch reloads (5094↔3550); paint + text edit persist
to localStorage; export produces the documented JSON; `tsc -b` + `vite build`
green; data ships to `dist/transcripts/data/`. Screenshots of the page hang in the
headless renderer (continuous/heavy page — known, per the upstream README);
verified via a11y snapshot + DOM eval instead.

## Next topic (not yet executed)

Per-session/per-investigation **summaries** authored from the transcript + GM
conversation, where summary paragraphs/sections **deep-link to the matching
transcript section**. Needs: a stable anchor scheme into a transcript (utterance
id? id-range? time?), summary storage/format, and a deep-link target in the
viewer (scroll-to + highlight an utterance or range). To be designed.
