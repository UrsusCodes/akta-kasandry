---
date: 2026-06-22
status: decided
tags: [decision, area/transcripts, dep/rpg-recorder]
related: ["[[work/2026-06-19-transcript-viewer-port]]", "[[TASK_LIST]]"]
---

# Transcript data — reading lessons & lost-content map

Hard-won lessons from authoring the Sól w Ranach and UG 2 summaries off the rpg-recorder overlays. Read this before doing any more transcript reading/analysis.

## Epoch clock ≠ real audio time (the big trap)

`overlay.timeline` is `"epoch"` or `"concat"` (see rpg-recorder `data/SCHEMA.md`, "Timeline").

- **epoch** (`utterance.start`): a stretched WALL-CLOCK that spreads the recorded audio across the whole real evening, **including break gaps** — so `start` jumps, and a histogram by `start` shows huge empty "gaps" that are NOT missing audio.
- **concat** (`utterance.start` ≈ `play.start`): gap-free per-channel concatenation = the actual recorded-sample timeline.
- `play.start` (present on BOTH variants): the real audio-playback coordinate.

**Rule:** to reason about "what's on the tape" / coverage / continuity, histogram by **`play.start`** (or use the concat variant). NEVER by epoch `start`. I wrongly concluded content was "missing" from epoch-`start` gaps; it wasn't — the same utterances sit (compressed) inside the populated epoch windows.

## Reading the plot cleanly (multi-channel gotcha)

Sorting ALL speakers by concat `start` **interleaves per-channel concat clocks** and scrambles scenes line-by-line (different mics have independent concat offsets). To get a clean chronological spine, **dump a single channel** — usually the GM (`Paweł MG`) — sorted by `play.start`. One mic is linear, so the GM's narration reads in true story order. Then cross-reference other channels for quotes.

Helper (run from repo root, writes to OS temp):
```
node -e "const os=require('os'),path=require('path'),fs=require('fs');const d=require('./public/transcripts/data/<file>.json');const fmt=s=>{s=Math.floor(s);const h=(s/3600|0),m=(s%3600/60|0),x=s%60;return (h?h+':':'')+String(m).padStart(2,'0')+':'+String(x).padStart(2,'0')};const gm=d.utterances.filter(u=>u.speaker_name==='Paweł MG'&&u.play).sort((a,b)=>a.play.start-b.play.start).map(u=>'['+fmt(u.play.start)+'] '+(u.text||'').trim()).filter(t=>t.length>3);fs.writeFileSync(path.join(os.tmpdir(),'gm.txt'),gm.join('\n'));console.log(gm.length)"
```
ASR is noisy: names mangled (Karmody=Carmody, McBraid=McBride…), heavy OOC (dice, rules, "podładujmy mikrofony"). Always feed an authoritative roster/spine to any agent reading it.

## Lost content map (NOT in the tape — needs GM memory)

- **Sól w Ranach** — entire climax (fort → ceremony → killing Boston → flooded tunnels, ~beats 6–11) lost to a **recorder SOFTWARE ERROR** (confirmed via rpg-recorder side). Recorded part ends at "dawn of day 3, heading to the crater". Reconstructed in the summary from GM memory, flagged "⚠ nagranie urwane", no anchors.
- **UG 2** — the **night recon + first human shootout** (between the Carmody negotiations and the academics entering) fell into a **deliberate recording pause** ([1:21:07] GM "Wyłączę teraz recording" for food + off-mic price-haggling; resumes [1:23] already at the academics/sick-man). **Still to be written from GM memory** → first task next session.

## Recording length

Recorded audio = on-mic time only; the GM pauses recording for breaks (food, off-mic negotiation, mic recharges, dead mics). So concat duration (e.g. UG 2 ≈ 2h38) is shorter than the real evening. The epoch variant's wall-clock span (UG 2 ≈ 8h45) and gap sizes are the same unreliable derivation — treat as "long evening with several breaks", not exact. No absolute time-of-day in `build_meta`; reliable clock needs raw `data/sessions/<id>/` chunk timestamps in rpg-recorder.

## Summary authoring model

Transcript gives quotes + deep-link anchors; the GM's memory gives the clean spine and fills off-tape gaps. Format = "Znak Życia" house style. Anchor syntax `{sesja:<slug>#<utteranceId>}` (ids are variant-specific → use the deployed variant's ids). Both sessions end seeding the **Klub / Akta Kasandry**.
