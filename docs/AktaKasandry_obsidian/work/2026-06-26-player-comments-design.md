---
date: 2026-06-26
status: decided
tags: [decision, area/supabase, area/ui, feature/comments]
related: ["[[work/2026-05-20-import-coc-creator-characters]]", "[[SUPABASE_AND_SYNC]]", "[[DESIGN_SYSTEM]]"]
---

# Player margin-comments (Komentarze graczy)

Design spec for a player annotation layer on session-summary pages. Players log in
(our accounts, not GitHub) and leave **margin comments** anchored to selected text
fragments, speaking either **in-character (IC)** or **as themselves (OOC)**. The main
content is never modified — comments augment it. Brainstormed + mockup-validated
2026-06-26 (mockups in `.superpowers/brainstorm/`, `v3.html` is the target look).

> [!info] Supersedes a prior exclusion
> `memories/project.md` and `TASK_LIST.md` listed "Per-page comments" as out of scope.
> This feature deliberately reopens that — scoped to summary pages, anchored to
> fragments, never editing main content. Update those exclusions when this ships.

## Goal & core UX

- A summary page (e.g. UG 2) shows the parchment content unchanged in the main column.
- A **right rail** holds comment cards anchored to highlighted fragments (Google-Docs style).
- Selecting text → compose popover → pick **who speaks**: one of the player's characters
  in this investigation (→ IC) or **"Ja"** = themselves (→ OOC).
- Each player has a **colour** (16-option palette). The colour rings the portrait and
  tints the highlighted fragment. Identity = player (colour, constant); the portrait
  says *who* — a **rectangular character photo** (IC) or a **round initial tile** (OOC).
- Dense sections collapse into **one grouped thread** (stacked portraits + count),
  solving comment crowding. Single-level replies (`parent_id`) allowed.

## Decisions (locked 2026-06-26)

| Topic | Decision |
|---|---|
| Content location | **Stable `page_key`, content stays in `.tsx` for now.** Comments anchor to a durable key (`streszczenie/ug2`) independent of route. Content may later move to the vault under the same key; quote-anchors re-match. |
| Accounts | **MG provisions accounts.** No signup UI in v1 — MG creates users in the Supabase dashboard, then assigns role/colour/characters in our `/admin` UI. |
| Visibility | **All comments public** (read = anon). Simple RLS. |
| Anchoring | **Homegrown anchorer, no new dependency** (stack is locked). ~Block-id + text-quote + offset + fuzzy fallback. |
| v1 scope | **Full**: anchor-grouped threads + single-level replies + cast-filtered speaker picker. |
| Realtime | **Deferred** (free-tier egress; refetch on page entry, like pins). |

## Data model (`wiki.*`)

### Extend existing tables

```sql
-- player identity colour (one of 16, see src/lib/playerColors.ts)
alter table wiki.profiles add column color text;

-- link an imported character to the player account that owns it
-- (set by MG in /admin/import; gives a player "their" characters)
alter table wiki.imported_characters add column owner_profile_id uuid references wiki.profiles(id);
```

### New: `wiki.comments`

```sql
create table wiki.comments (
  id                   uuid primary key default gen_random_uuid(),
  page_key             text not null,                       -- durable, e.g. 'streszczenie/ug2'
  anchor               jsonb not null,                      -- see "Anchoring" below
  author_profile_id    uuid not null references wiki.profiles(id),
  speaker_character_id uuid references wiki.imported_characters(id), -- null = OOC ("Ja")
  body                 text not null,
  parent_id            uuid references wiki.comments(id),   -- single-level replies
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  edited               boolean not null default false
);
create index on wiki.comments (page_key);
create index on wiki.comments (parent_id);
```

- **Mode is derived**, not stored: `speaker_character_id IS NULL` → OOC, else IC.
- **Author colour** comes from `profiles.color` (joined at read; denormalisation not needed
  since anon can read the safe profile columns — see RLS).

### New: `wiki.investigation_cast` (lightweight)

```sql
create table wiki.investigation_cast (
  page_key     text not null,
  character_id uuid not null references wiki.imported_characters(id),
  primary key (page_key, character_id)
);
```

- Speaker picker for player P on page K = characters where `owner_profile_id = P`
  **and** (`page_key = K` in cast **OR** the page has no cast rows at all → show all P's characters).
- MG fills this in `/admin` (tag characters to an investigation). Graceful default keeps
  it optional per page.

### RLS

- `comments`: **SELECT** to anon + authenticated (all public). **INSERT** authenticated,
  `author_profile_id = auth.uid()`. **UPDATE/DELETE** author or role `mg`.
- `profiles`: expose **only safe columns** (`id, display_name, color, role`) to anon via a
  read policy or a dedicated view — never email (email lives in `auth.users`, not here).
- `imported_characters`: SELECT already anon (Stage H). New `owner_profile_id` is safe to read.
- `investigation_cast`: SELECT anon; write mg-only.

## Anchoring (the hard part)

Goal: a comment pinned to *"wywiązała się pierwsza strzelanina"* survives re-render and
light edits to the summary text.

**`anchor` jsonb shape:**
```ts
{
  blockId: string,      // stable id of the enclosing block
  quote: string,        // exact selected text
  prefix: string,       // ~32 chars before
  suffix: string,       // ~32 chars after
  startOffset: number,  // char offset of quote within the block's text
  endOffset: number
}
```

**Block ids** — a remark plugin `remarkBlockIds` walks top-level nodes (paragraph,
heading, listItem, blockquote…) and attaches `data-block-id = shortHash(normalizedText)`.
Stable across re-render; changes only when that block's text changes. (Headings may use
the existing slug instead.)

**Locate on render** (resolver, in order):
1. Find block by `blockId`. If the block changed, fall back to scanning all blocks for
   the `quote` (+ prefix/suffix context) — a small fuzzy match (normalised, whitespace-
   collapsed, tolerant of minor diffs).
2. Within the block, find `quote` at `startOffset`; fall back to first occurrence; fall
   back to fuzzy.
3. **No match → "unanchored"**: the comment is shown in a dedicated rail group
   ("Niezakotwiczone") and never lost. MG/author can re-anchor or delete.

Implemented as a small homegrown module (`src/lib/comments/anchor.ts`, ~150 LOC):
`createAnchor(range, blockEl)` and `resolveAnchor(anchor, container) → Range | null`.
No new dependency.

## Components & flow

- `src/lib/playerColors.ts` — 16-colour palette (seed from mockup v3 swatches; muted,
  Cthulhu-compatible). Distinct from the 10-colour pin palette.
- `src/stores/comments.ts` (zustand) — load comments by `page_key`, add/edit/delete/reply,
  optimistic update, group by resolved anchor block.
- `src/lib/remarkBlockIds.ts` — attaches `data-block-id` (added to the shared `Markdown`
  pipeline, but block ids are inert unless annotation is active).
- `src/components/comments/AnnotatableArticle.tsx` — opt-in wrapper around `Markdown`,
  **only on summary routes**. Owns: selection capture, highlight overlay, rail, compose.
  Rest of the wiki keeps using plain `Markdown` unchanged.
- `CommentRail.tsx` (grouped collapsible threads), `CommentCard.tsx`, `SpeakerPicker.tsx`,
  `ComposeBubble.tsx`. Portraits/cast pulled from existing `stores/characters.ts`.
- Auth: `stores/auth.ts` already loads the profile; add `color` to the loaded shape.
- Admin: extend `routes/AdminImport.tsx` — set `owner_profile_id` per character, and tag
  investigation cast. (Account creation itself stays in the Supabase dashboard for v1.)

**Authoring flow:** select text → popover with speaker picker (player's cast for this
page + "Ja") → type → save. Picking a character ⇒ IC styling; "Ja" ⇒ OOC styling. The
highlight appears tinted in the author's colour, the card in the rail.

**Page wiring:** summary routes (`UG2Summary`, `SummaryDemo`, …) render
`<AnnotatableArticle pageKey="streszczenie/ug2">{SUMMARY}</AnnotatableArticle>` instead
of bare `<Markdown>`. `page_key` is a deliberate constant, decoupled from the route path.

## Visual spec (from mockup v3)

- Character portrait = **rectangular** sepia photo + monogram, 2px border in player colour.
- Self = **round** initial tile, player-colour border, teal fill, monospace initials.
- Highlight = author-colour underline + `color-mix` tint; active = stronger tint + ring.
- Dense fragment = multi-colour underline stripe + `•••N` marker; rail = one grouped thread
  (overlapping portrait stack + "+N · M głosów", expandable).
- IC body = italic parchment serif; OOC body = monospace, cooler tone.
- Skin tokens per `[[DESIGN_SYSTEM]]` (teal/parchment/gold, Cinzel/Cormorant/Special Elite).

## Out of scope (v1)

- Realtime live updates (refetch on entry instead).
- Signup / invite-link flows (MG provisions in dashboard).
- Multi-level reply nesting (single level only).
- Moving summary content to the vault (separate pipeline work; same `page_key` will carry over).
- Comments on arbitrary wiki pages (summary pages first; "potencjalnie inne sekcje" later —
  the `AnnotatableArticle` wrapper makes adding pages cheap).

## Open / to confirm during implementation

- Exact 16-colour hex set (seed from v3, tune for contrast on teal + parchment).
- `profiles` safe-column exposure: policy on the table vs a dedicated view.
- Selection UX on touch / overlapping highlights (desktop-priority, but define behaviour).
- Whether MG gets a "resolve/hide" action on comments (not in v1 unless trivial).
