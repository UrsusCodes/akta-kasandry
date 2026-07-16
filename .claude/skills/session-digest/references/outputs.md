# Output shapes — scene-index and gallery manifest

Both are plain JSON files under `public/`, fetched at runtime (scene-index by the
Iteration-2 package generator, not yet in Iteration 1; the gallery manifest by
`loadGalleryManifest` in `src/lib/gallery/manifest.ts`, used today by `SessionGallery`).
Validate both before handing off.

> [!info] The digest draft itself now has a second consumer
> The summary draft this skill writes to `docs/superpowers/drafts/<date>-<slug>-summary.md`
> is no longer only a source for hand-copying into a `.tsx` route — it is also the direct
> input to `npm run build-session-vault` (`scripts/build-session-vault.ts`, see
> `docs/RUNBOOKS/session-vault.md`), which rewrites it into Obsidian-safe markdown
> (`{sesja:...}` deep-links → `(scena N · ~mm:ss)` + a hidden restore comment, images →
> `![[embed]]`, "Pytania i wątpliwości" → `[!question]` callouts) and bundles it with the
> transcript tool and presentation kit into a per-session review vault for one assigned
> player to correct. Write the draft the same way regardless of which consumer runs next —
> the scene-index and gallery manifest below feed the vault too (scene-index for the
> deep-link scene labels, gallery manifest for the vault's `Media/` auto-copy).

## Optional: `{q-after:<heading>}` placement marker

Within the "Pytania i wątpliwości" section, a question paragraph may end with
`{q-after:<exact ### heading text>}` — e.g. `Co zginęło podczas włamania? {q-after:Włamanie
do domu Mastersa}`. The session-vault rewrite (`questionsToCallouts` in
`scripts/lib/vault-summary.ts`) strips the marker from the visible text and relocates that
question's `[!question]` callout to just after the matching `### <heading>` line elsewhere
in the document, instead of leaving it in the questions section at the bottom — useful when
a question is really "did I get this specific scene right?" and reads better right next to
that scene than lumped in with unrelated open mysteries. If the named heading doesn't exist
in the document, the marker is stripped and the question stays in place in the section
(fail-soft — this is a display nicety, not something that should ever throw). Unmarked
questions are unaffected and always stay in the section in source order. This marker only
matters for the vault rewrite; the site renderer (`UG2Summary.tsx`-style `.tsx` sources)
doesn't read `{q-after:...}` at all, so leaving it out of a `.tsx` port is harmless — just
don't forget to strip it by hand if you copy a marked question into a `.tsx` file that skips
the vault step.

## Scene index — `public/transcripts/scene-index/<slug>.json`

```json
{
  "slug": "ug2",
  "scenes": [
    {
      "id": "mcbride-summons",
      "title": "Wezwanie do McBride'a",
      "uStart": "5835c7a73370",
      "uEnd": "6a4de39928af",
      "tApprox": "04:12"
    }
  ]
}
```

Field notes:
- `id` — a short kebab-case scene slug, unique within the file, stable across edits
  (used as a React key / anchor by the future package sidebar). Not the same as an
  utterance id.
- `title` — Polish, matches (or closely echoes) the `###` subheading it corresponds to
  in the summary/narracja.
- `uStart` / `uEnd` — **real utterance ids** copied from the session's overlay
  (`public/transcripts/data/<slug>-<variant>-overlay.json`, `utterances[].id`). Every id
  used here must exist in that file — this is checked by hand (grep the overlay JSON
  for the id) since there's no runtime validator for this file in Iteration 1.
  `uStart`/`uEnd` may be the same id for a single-beat scene.
- `tApprox` — total-minutes `mm:ss` (minutes are unbounded, never rolled into hours —
  e.g. `60:41`, `156:15`), derived from the `uStart`
  utterance's `play.start` (concat-stream seconds — **not** `utterance.start`, which is
  the transcript clock; see the "epoch clock ≠ audio time" caveat in
  `src/lib/transcripts/overlay.ts`).
- Order scenes chronologically by `uStart`'s position in the overlay.
- This file is **consumed by Iteration 2** (the downloadable session package), not
  rendered anywhere in Iteration 1 — it still must be valid JSON with real ids so it's
  ready when that lands.

Worked UG2 boundary picks used as anchors elsewhere in `UG2Summary.tsx` (safe reuse as
scene-index endpoints): `5835c7a73370` (McBride), `6a4de39928af` (Brock),
`66f8c76d776b` (Blackwater Creek), `3b313bfb1e3f` (Stary Pete), `2a8b3928b40e` (bitwa na
farmie), `c3a7c3ed39af` (wybuch w jaskini), `a37238c0d8c5` (Klub Kasandry epilog).

## Gallery manifest — `public/gallery/<case-key>.json`

Must validate against `GalleryManifestSchema` in `src/lib/gallery/manifest.ts`:

```ts
GalleryManifestSchema = z.object({
  caseKey: z.string().min(1),
  title: z.string().min(1),
  caseName: z.string().optional(),   // clean case name for derived artifacts (e.g. presentation kit); falls back to `title`
  scenes: z.array({ src: string (required), caption?: string, alt?: string }).default([]),
  cast: z.array({ src: string (required), character: string (required), player?: string }).default([]),
  tracks: z.array({ src: string (required), title: string (required) }).default([]),
  links: z.array({ label: string (required), to: string (required) }).default([]),
})
```

Worked (trimmed) UG2 example — see the real file at `public/gallery/ug2.json` for the
full set:

```json
{
  "caseKey": "ug2",
  "title": "Urodzaj Grozy — galeria",
  "caseName": "Urodzaj Grozy",
  "scenes": [
    { "src": "/img/ug2/speakeasy.jpg", "caption": "Rhymers Club, zaplecze McBride'a.", "alt": "Speakeasy" },
    { "src": "/img/ug2/town.jpg", "caption": "Blackwater Creek — kościół i błotnisty rozjazd.", "alt": "Miasteczko Blackwater Creek" }
  ],
  "cast": [
    { "src": "/img/ug2/cast/mort.jpg", "character": "Mortimer \"Mort\" Flannery", "player": "Jakub" },
    { "src": "/img/ug2/cast/corwin.jpg", "character": "Dr Arthur Henry Corwin", "player": "Jakub" }
  ],
  "tracks": [
    { "src": "/audio/ug2/crossfire.mp3", "title": "Crossfire" }
  ],
  "links": [
    { "label": "Streszczenie", "to": "/p/sprawy/02-urodzaj-grozy/01-streszczenie" },
    { "label": "Narracja", "to": "/p/sprawy/02-urodzaj-grozy/02-narracja" },
    { "label": "Prezentacja", "to": "/p/sprawy/02-urodzaj-grozy/03-prezentacja" },
    { "label": "Transkrypt", "to": "/sesje/ug2" }
  ]
}
```

Field notes:
- `caseName` is the clean case name (no page-heading suffix like "— galeria"); optional,
  falls back to `title` when absent. Set it so derived artifacts that need a title of
  their own — e.g. the presentation kit builder (`scripts/build-presentation-kit.ts`) —
  don't inherit the gallery page's own heading.
- `src` paths are **site-absolute** (`/img/...`, `/audio/...`), not filesystem paths —
  they run through `withBase` at render time so they resolve under the GH-Pages
  subpath. Point them at files that already exist under `public/`; the skill does not
  generate or move image/audio assets.
- `caption` on scenes is short Polish prose, usually a trimmed sentence lifted from the
  summary's own caption for that image (`*italic caption*` under the matching
  `![...]()` in the `.tsx` source) — reuse, don't reinvent.
- `cast[].character` matches the `### Obsada` table's character name exactly (including
  any nickname in quotes); `cast[].player` is the real player name from that same table.
- `tracks` only lists titles — the gallery does not embed an audio player (the site
  hosts no audio); pair each track with the case's presentation link in `links`.
- Every `caseKey` must be unique across `public/gallery/*.json` (one file per case).

## Block-id stability contract (recap for both outputs)

The "Pytania i wątpliwości" section this skill drafts is not a JSON output but shares
the same stability rule these files must respect by proxy: **once content is live and
may carry player comments, its identity (block text for questions; `id` for scenes;
`caseKey`+array position for gallery entries) should not be silently renumbered or
reworded** — additive changes are safe, retroactive edits to already-shipped identifiers
are not. For "Pytania i wątpliwości" specifically this is enforced by the `data-block-id`
hash (`src/lib/comments/anchor.ts#shortHash` over `normalizeText` of the paragraph); for
scene-index/gallery entries there's no comment system attached yet, but treat `id`
values and array order as append-only once a package/gallery has shipped, to keep future
consumers (Iteration 2 package, Iteration 3 board) stable.
