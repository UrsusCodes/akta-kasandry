---
date: 2026-06-26
status: active
tags: [spec, area/presentations, dep/rpg-recorder, stage/k]
---

# UG 2 — cinematic HTML presentation (prototype)

A self-contained, music-driven slideshow that retells **Urodzaj Grozy** as an
auto-advancing "film": full-bleed art with Ken-Burns motion, staggered text,
per-act soundtrack with crossfades, and full manual control (pause + scrub both
directions). Built standalone first; designed to port to a React route later.

## Delivery (test = standalone)

- Files under `public/prezentacja/ug2/`: `index.html`, `style.css`, `engine.js`,
  `slides.js` (data). No React; served by the dev server at
  `localhost:5173/prezentacja/ug2/`. Reuses existing `/img/ug2/*` art.
- Cast portraits pulled from the shared Supabase `portraits` bucket, optimized
  into `public/img/ug2/cast/*.jpg` (444 KB).
- Audio in `public/audio/ug2/*.mp3` — **gitignored** (licensed tracks, kept local,
  not deployed). Later port: `slides.js`/`engine.js` → a React component +
  externally-hosted (or omitted) audio.

## Slide model (`slides.js`)

`TRACKS = { docks, orchard, root, moss }` → `/audio/ug2/<name>.mp3`.
Each slide: `{ kind, image?, title?, text?, attr?, cast?, dur, track, fx? }`.
- `kind`: `title` | `image` | `card` (text-only) | `cast` (portrait reveal) | `end`.
- `fx`: `flash` (gunfire), `pulse` (monster), `night` (darken) — optional accents.
- `track`: which cue should be playing; engine crossfades (~1.6 s) only when it changes.

## Engine (`engine.js`)

- Two stacked layers; advancing builds the next slide in the hidden layer and
  crossfades (opacity). Ken-Burns = CSS transform animation spanning `dur`.
- Text reveals staggered (title → text → attr). Cast portraits stagger in.
- Autoplay: rAF loop fills a progress bar over `dur`, then `next()`.
- Controls: **Space/center-click** = pause (freezes motion + music);
  **←/→**, on-screen `‹ ›`, left/right click-zones = prev/next; **M** mute,
  **F** fullscreen. Controls auto-hide on idle. Audio starts only after the
  **▶ Rozpocznij** gesture (browser autoplay rule).
- Audio: one looping `Audio` per track, volume-ramp crossfade on track change.

## Aesthetic

Cthulhu skin (parchment `#f5e6c8`, deep teal `#0d2828`, gold `#c89b3c`), Cinzel
titles + Cormorant body, vignette + light film-grain, sepia-consistent with the art.

## Storyboard — 6 acts, variable length (~47 slides, ~5 min)

| Act | Music | Beats |
|---|---|---|
| **I — Boston, gangsterka** | Rain on the Docks | title · cast: gangsterzy · McBride (dwie butelki) · Brock („kat") · Damien · zlecenie („żadnej laski dynamitu") |
| **II — Black Creek → deal** | Molasses Orchard | droga · miasteczko · Sprouston · sklep Baxtera · farma (kukurydza) · deal z Damienem |
| **III — Noc + poranna strzelanina** | Root Under Ash | szczury/kable · warta + strach na wróble · zwiad Fritza · trzymetrowa postać · świt „umowa zerwana" · szturm · McMiller o włos · cisza (Damien martwy, więzień) |
| **IV — Akademicy: śledztwo** | Molasses Orchard | cast: akademicy · zlecenie dziekana · Sprouston insynuuje · słój z dżdżownicami · farma Jarveyów · Stary Pete · list „Drogi Ernesti"→McTavish · wykopalisko/kości |
| **V — Połączenie + 2. walka** | Root Under Ash | „ta jedna farma" · Brendan · chaos walki · śmierć Jamesa · ogień · Roades błaga o jaskinię |
| **VI — Jaskinia** | Moss in the Deep | ku jaskini · wejście · wnętrze · pokusa · Joseph strzela do Roadesa · Matka/Abigail · geneza · wyznawca Mortimer · walka o dynamit · eksplozja · ucieczka/pożar · Brock w oknie · „klub Kasandry" (koniec) |

Spare track **Moonshine Crossfire** kept for a possible peak-gunfight accent.

## Out of scope (prototype)

Deploy of audio; deep-link integration; mobile polish beyond basic tap-zones;
the missing scene art (Brock, James's death, night-scarecrow, fire) — text cards
for now, generated later from prompts.
