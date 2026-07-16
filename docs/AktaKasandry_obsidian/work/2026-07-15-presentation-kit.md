---
date: 2026-07-15
status: decided
tags: [decision, area/presentations, area/packages, dep/rpg-recorder]
related: ["docs/superpowers/specs/2026-07-15-presentation-kit-design.md", "docs/superpowers/plans/2026-07-15-presentation-kit.md", "docs/RUNBOOKS/presentation-kit.md", "[[TASK_LIST]]", "[[work/2026-06-26-player-comments-design]]", "[[work/2026-07-14-session-companion]]"]
---

# Presentation kit — player self-service slide editor

## Problem

`cinematic-slideshow` (2026-06-26) gave the GM a themeable, music-driven deck engine, but only
the GM could author decks — players who wanted to cut their own recap of a session had no tool.
The engine, art library, and act/track model already existed; what was missing was a safe way to
hand *authoring* to players without handing them a way to inject arbitrary HTML into the live
site.

## Design

Full design: `docs/superpowers/specs/2026-07-15-presentation-kit-design.md`. Implementation plan:
`docs/superpowers/plans/2026-07-15-presentation-kit.md` (tasks K1–K6). Runbook:
`docs/RUNBOOKS/presentation-kit.md`.

Shape: a **kit** is a generated, self-contained folder — `edytor.html` (the 3-panel Cthulhu-skinned
editor) + `assets/audio/*.mp3` — built once per session from that session's gallery manifest
(`public/gallery/<slug>.json`) and the existing `public/prezentacja/ug2/{engine.js,base.css,themes/cthulhu.css}`
engine sources (read-only; the kit never edits them). Zipped, hosted on the GM's Google Drive,
same distribution pattern as the Iteration-2 session package.

## Trust boundary (the design's central decision)

**The round-trip artifact between player and GM is `szkic.json`, never `prezentacja.html`.**

The `cinematic-slideshow` engine interpolates slide text into the DOM without HTML-escaping it
(a deliberate simplicity trade-off from the original design, unreviewed against player input at
the time). A player-exported `prezentacja.html` is therefore an arbitrary HTML file that would
run same-origin with the live site if published verbatim — never acceptable, regardless of how
harmless it looks when opened locally.

**Never publish a player-sent `prezentacja.html` verbatim.**

Instead: `KitCore.escapeHtml` (in `scripts/kit-template/kit-core.js`) entity-escapes every
player-typed text field (`&`, `<`, `>`, `"`, `'`) at the point where a draft (`szkic.json`) is
converted into engine data (`draftToEngineData`) — both in the editor's live preview and in its
own export path. The GM never trusts a player's HTML; the GM trusts only the player's *data*
(`szkic.json`), imports it into their own kit copy, reviews every slide's text, and re-exports.
The re-export is what gets published — so the escaping that protects the site always happens in
the GM's own regeneration step, never in anything a player directly produced. This is why the
runbook (Step 5) frames "review, then export" as the actual security boundary, not a courtesy.

`serializeSlidesJs` additionally escapes every literal `<` in its JSON-serialized output — closing
a second-order risk: even after `escapeHtml`, a raw `</script>` sequence embedded in serialized
JSON could truncate the injected `<script>` tag early in a browser's HTML tokenizer. This exact
bug was hit for real during K5 (see below) — via a `</script>` string that lived in a **source
code comment**, not player input, which is why the plan calls it a "drift guard" (K3) as well as
a text-escaping rule (K1): it protects the pipeline from itself, not only from adversarial input.

## Build-time data-URL rationale

The editor embeds its entire scene/cast image library as base64 data-URLs **at build time**
(`build-presentation-kit.ts`, step 2), not at runtime. This isn't a style choice — it's forced by
the `file://` constraint the whole kit operates under: `fetch()` is blocked from `file://` pages,
and `file://`-loaded images taint an HTML `<canvas>`, which rules out any lazy/on-demand loading
scheme. Audio tracks are the deliberate exception — copied as plain files under `assets/audio/`
rather than inlined, because the concat-mix lesson from the Iteration-2 session package already
established that inlining multi-MB audio into an HTML document balloons a single file
unnecessarily when a relative sibling reference works identically under `file://`.

## K5 dry run — one real blocker found and fixed

The dry run (K5) was not a clean pass on the first try. Building the UG2 kit and opening
`edytor.html` produced a **dead editor** — the page loaded but none of its JavaScript ran. Root
cause: `scripts/kit-template/kit-core.js` contained a **source-code comment** with the literal
string `</script>` inside it (documenting the JSON output format). When the builder injected
`kit-core.js`'s source verbatim into `edytor.html`'s inline `<script>` block, the browser's HTML
tokenizer — which does not parse JavaScript, only looks for the literal closing tag — ended the
`<script>` element early, right there in the comment, silently truncating everything after it.

Fix: reworded the offending comment to avoid the literal sequence, and added a build-time **drift
guard** in `build-presentation-kit.ts` that asserts none of the injected payloads (kit-core
source, `__KIT_DATA__` JSON, engine.js) contain a literal `</script` before writing the file —
so this class of bug fails the build loudly instead of shipping a silently-dead editor. This is
the "new `</script`-in-source guard" referenced in the K3/K4 file map.

After the fix, the full K5 checklist ran clean:

- **Kit build:** `edytor.html` ≈ 4.8 MB (32 images inlined), `assets/audio/` ≈ 20 MB (5 tracks) —
  matches the runbook's "5–6 MB / ~21 MB" estimate.
- **Authoring:** a 6-slide deck built via real UI events, exercising all 5 templates, 2 acts on
  different tracks, both Ken Burns variants, one custom-uploaded PNG, Polish diacritics, and a
  literal `<b>xss</b>` string in a title — rendered as literal text (not bold) in both the live
  preview and the exported deck.
- **Autosave/szkic round-trip:** reload restored the autosaved draft; szkic export →
  `Zacznij od nowa` → szkic import round-tripped to a deep-equal draft.
- **Export:** `prezentacja.html` — 552 KB — opens standalone, plays start-to-finish: templates
  render, Ken Burns runs, act crossfade happens at the act boundary, music plays from
  `assets/audio/` (HTTP 206 partial-content responses observed), custom image displays, the XSS
  string stays literal text throughout.
- **Portability:** zip 23.5 MB; unzip to a fresh directory and reopen — works identically.
- **Publish simulation:** the exported deck copied under a local `_kit-test` route with
  `AUDIO_BASE` flipped to the site's audio path played correctly against the site's own
  `public/audio/` — proving format compatibility with the GM's real publish step (Step 5 of the
  runbook) — then the test folder was deleted, nothing kit-related committed.
- **Suite:** 93/93 Vitest tests green (26 new in `kit-core.test.ts`, incl. the HTML-embedding
  regression test for the `</script>`-in-comment bug); `tsc -b` clean.

**Caveat carried forward:** verification ran over a local static HTTP server, not true `file://`
— same pattern as the Iteration-2 session package's caveat — because the sandbox used for this
session rejects `file://` navigation. The template performs zero network requests either way, so
this is considered equivalent, but the GM still owes one real `file://` open from disk before
fully trusting the artifact.

## Decisions

- **Trust boundary is `szkic.json`, never `prezentacja.html`** — see above; this is the design's
  load-bearing rule and is repeated verbatim in the runbook and the journal entry.
- **Images inlined at build time, audio copied as sibling files** — forced by `file://`
  constraints (canvas tainting, blocked `fetch()`) for images; audio follows the Iteration-2
  package's "don't triple multi-MB media into HTML" precedent.
- **`</script`-in-source is a build-time drift guard, not just an escaping rule** — the K5 bug
  came from the pipeline's own source code, not adversarial player input, so the fix had to catch
  it structurally (assert-before-write) rather than rely solely on `escapeHtml`/JSON-escaping,
  which only cover *player-typed* text.
- **No new dependency, no schema change, no site source changes** — the kit builder only reads
  `public/gallery/<slug>.json` and the existing engine files; publishing a GM-reviewed deck is a
  manual step per the runbook, unchanged from how the original `cinematic-slideshow` decks are
  published.

## Open items (GM manual actions)

- [ ] Upload `packages/ug2-prezentacja.zip` to Google Drive (anyone with the link, viewer) and
      send the Step 4 player snippet.
- [ ] A true `file://` open of `packages/ug2-prezentacja/edytor.html` from disk (the one
      verification step the sandbox couldn't perform).
- [ ] First real player round-trip — a player builds a deck, sends back `szkic-ug2.json`, GM
      reviews and publishes per runbook Step 5. Nothing here is exercised until that happens.
