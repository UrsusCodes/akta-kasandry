# House style — distilled from `UG2Summary.tsx` + `UG2Narracja.tsx`

Both files export one big template string (`SUMMARY` / `NARRACJA`) rendered through
`AnnotatableArticle` → the shared Markdown pipeline (`remarkBlockIds` +
`remarkTranscriptAnchors`). Everything below is Polish content over English code — the
template string itself is 100% Polish; only the surrounding `.tsx` (component name,
comments) is English.

## Two companion documents, one case

Every case gets a **short summary** (`*Summary.tsx`, route like `/streszczenie-<slug>`)
and, optionally, a **long-form continuous narrative** (`*Narracja.tsx`, route
`/streszczenie-<slug>/narracja`). Each links to the other at the top, and both link to
the cinematic presentation if one exists:

```md
→ **[Pełna narracja (ciągiem, z cytatami)](/streszczenie-ug2/narracja)**

→ **[▶ Prezentacja filmowa (slajdy + muzyka)](/prezentacja/ug2)**
```

They share the **same cast/comment `pageKey` prefix** (`streszczenie/<slug>`) but the
narracja lives under its own sub-`pageKey` (`streszczenie/<slug>/narracja`) so its
comments don't mix with the summary's — see the two components' `AnnotatableArticle
pageKey=` props.

## Summary (`*Summary.tsx`) structure, top to bottom

1. `# <Case name> (<code>) — streszczenie` (H1).
2. One metadata line: `**System:** Zew Cthulhu · **Strażnik Tajemnic:** <GM> ·
   **Miejsce:** <place>, <era>`.
3. A blockquote "pitch" — one punchy paragraph selling the session's hook.
4. The two companion links (above).
5. A short scene-setting blockquote with the session's opening meta-moment, if there
   is one, carrying its own `{sesja:...}` anchor.
6. `### Obsada` — a markdown table of players → characters (add a second column per
   character if players run more than one, as UG2 does for gangster/academic dual
   characters). Followed by a `**BN-i:**` (NPCs) paragraph, bold-naming every
   significant non-player character.
7. `---` horizontal rule, then `## Akt I — <title>` / `## Akt II — <title>` / `## Akt
   III — <title>` (3-act default; scale to the session's real shape). Under each act,
   `### <scene title>` subheadings — one per beat.
8. `## Epilog — <title>` for hooks/stingers that close the session.
9. `## Podsumowanie rezultatów` — a flat bullet list of concrete outcomes (who died, who
   survived, what was destroyed/saved), bold-facing the load-bearing nouns.
10. `## Kluczowe wątki i odkrycia` — a flat bullet list of themes/mysteries surfaced,
    for continuity across sessions.
11. `## Śmieszne i epickie momenty` — a quote reel. Intro blockquote explaining every
    quote deep-links to the transcript, then two subsections `**Epickie**` and
    `**Śmieszne**`, each a bullet list of `**Speaker** context: "quote." {sesja:...}`.
12. Closing italic blockquote flagging draft status: `> _Wersja robocza. Daj znać, co
    poprawić: ..._`.
13. **(Iteration 1 addition, refined 2026-07-14)** `## Pytania i wątpliwości` as the new
    final section, inserted between the quote reel and the closing "Wersja robocza"
    blockquote — see SKILL.md workflow step 3 for the full **luki w rozumieniu
    (comprehension gaps) vs otwarte zagadki (open mysteries)** distinction and the
    `[PEWNE]`/`[SPEKULACJA]` comment-marker convention the intro blockquote must invite.
    `outputs.md` is not relevant here: this section is not a JSON output, it stays inline
    in the `.tsx` string. Each question its own paragraph; no list.

## Narracja (`*Narracja.tsx`) structure

Continuous third-person prose in ~10-minute (or scene-scale) sections:

- `### [mm:ss–mm:ss] <beat title>` headings using approximate session-clock timestamps
  (not utterance ids) — one per beat, chronological.
- Direct speech as blockquotes: `> **Speaker Name:** "cleaned-up quote."` — multiple
  consecutive quote lines under one `>` are fine for a short exchange.
- Occasional italic parenthetical asides for GM-only meta-context the players will only
  learn later: `*(This is who/why, revealed later...)*`.
- Same image conventions as the summary (below), reused at the same beats.
- Closing italic blockquote: `> _Pełna narracja sesji. Wersja robocza — ..._`.

## Deep-link syntax — `{sesja:<slug>#<id>}`

Placed inline, usually at the end of the sentence/clause it substantiates:
`{sesja:ug2#5835c7a73370}` or a range `{sesja:ug2#<from>..<to>}`. Rendered by
`remarkTranscriptAnchors` (`src/lib/remarkTranscriptAnchors.ts`) into a `↪ transkrypt`
pill linking to `/sesje/<slug>?u=<id>`. Ids are **utterance ids from the session's
default overlay variant** — pull them straight from the overlay JSON's
`utterances[].id`, never invent one. Density: roughly one anchor per paragraph in the
main narrative, plus one on every quote in the "Śmieszne i epickie momenty" reel.

## Images — two patterns, don't mix them up

**Right-aligned portrait** (person, NPC or PC, introduced mid-paragraph) — placed with
**no blank line** before the paragraph text so it floats beside it:

```md
<img src="/img/ug2/mcbride.jpg" alt="Declan McBride" width="200" align="right" style="margin: 0.3rem 0 0.8rem 1.2rem;" />Wieczór w speakeasy...
```

**Full-width scene image** (a location or event) — its own line, followed immediately
by an italic caption line:

```md
![Miasteczko Blackwater Creek](/img/ug2/town.jpg)
*Blackwater Creek — kościół i błotnisty rozjazd.*
```

Portrait width is `200` in the summary, `220` in the narracja (cosmetic drift between
the two files — either is acceptable for new content, prefer `200` to match the
majority). Multiple small portraits side by side (e.g. a family) use `width="140"` with
no `align`, several `<img>` tags on one line.

## Tone & fidelity rules

- **Polish throughout**, in-character quotes cleaned up for readability but not
  sanitized of personality (keep swearing, keep bluntness).
- **Seamless off-mic fills.** Beats reconstructed from GM memory (not on tape) are
  written in exactly the same voice as tape-sourced beats — no `⚠`, no "(GM notes this
  wasn't recorded)" aside. This was an explicit Stage K decision; don't relitigate it in
  generated content.
- **Bold the load-bearing nouns** (character names on first mention per section, key
  items, key locations) — mirrors how both exemplar files use `**bold**` as a skimming
  aid, not decoration.
- Every case ties back to **Klub / Akta Kasandry** somewhere near the epilogue — keep
  that thread visible even in a one-shot that's nominally self-contained.
