# Comment Composer Flow — Design

**Date:** 2026-06-26
**Status:** approved
**Supersedes (interaction layer of):** the implicit "select text → ComposeBubble" flow shipped with the player-comments feature.

## Problem

Player margin-comments work end-to-end, but **adding** a comment is undiscoverable: a player must select text and a compose bubble appears. Players don't expect that selecting text does anything, so they never discover commenting. We need an explicit, guided way to add a comment.

## Goal

Replace the implicit selection trigger with an explicit, button-initiated **three-step composer**: a control in the comments area that walks the player through *add → mark the fragment → write*. Discoverable, predictable, and accidental selections do nothing.

## Locked decisions

1. **Replace, not coexist.** The guided composer is the ONLY way to add a comment. Selecting text outside the composer's "selecting" mode does nothing (removes the surprise of accidental selection opening a bubble).
2. **Speaker picker lives in the compose step**, above the textarea, and is **hidden when the only option is "Ja"** (player has no investigation characters in the page cast) — then it is a clean OOC text box.
3. **Login-gated.** Only logged-in players see the composer control. Anonymous visitors get the read-only rail (unchanged).
4. **Placement:** desktop (≥1024px, two-column) = sticky control at the top of the right rail, following scroll. Mobile/narrow = bar pinned (fixed) to the bottom of the viewport.

## The flow — a three-state machine

State lives in `AnnotatableArticle` as `mode: 'idle' | 'selecting' | 'composing'`.

### IDLE
- Control renders as a single button: **`+ Dodaj komentarz`**.
- Rendered only when `user` is signed in.
- Click → `mode = 'selecting'`.

### SELECTING ("Oznacz fragment")
- Control morphs to: instruction text *"Zaznacz fragment w treści…"*, a **Potwierdź** button (disabled until a valid fragment is captured), and an **Anuluj** button.
- While in this mode, a `mouseup` (or touch selection end) inside the article container captures the selection:
  - Resolve nearest `[data-block-id]` ancestor, build the anchor via `createAnchor(range, block)` (existing helper). Store it as `pending` and show a truncated quote preview in the control so the player sees what they're about to comment on.
  - A non-empty, in-article selection enables **Potwierdź**. Re-selecting overwrites `pending`.
  - Selections outside the article (e.g. in the rail) are ignored.
- **Potwierdź** → `mode = 'composing'` (keeps `pending`).
- **Anuluj** → `mode = 'idle'`, clear `pending` + `window.getSelection().removeAllRanges()`.

### COMPOSING
- Control becomes the compose box (reuses the existing `ComposeBubble` internals):
  - the quoted fragment,
  - the **speaker picker** — shown only when `speakerOptions.length > 0` (player has cast characters); otherwise omitted (pure OOC),
  - a **textarea**,
  - **Potwierdź** (disabled while the body is empty/whitespace) and **Anuluj**.
- **Potwierdź** → `add({ pageKey, anchor: pending, speakerCharacterId, body, parentId: null })` via the comments store. On success: `mode = 'idle'`, clear `pending` + selection; the new comment appears positioned at its fragment in the rail (existing positioning). On error: show the error, stay in COMPOSING.
- **Anuluj** → `mode = 'idle'`, clear `pending` + selection.

## Placement details

- **Desktop:** the composer control sits at the top of the rail `aside`, `position: sticky` so it stays visible while scrolling. The anchor-positioned cards already start below a "floor" (the rail header height); extend that floor to also clear the sticky composer so cards never render under it. The composer sits above cards (z-index).
- **Mobile (< 1024px):** the rail is a plain list below the article; the composer is a `position: fixed` bar at the bottom of the viewport. Touch text-selection (long-press) drives the SELECTING step. (Touch selection is inherently finicky; this is accepted for v1.)
- Breakpoint detection reuses the same `matchMedia('(min-width: 1024px)')` approach already used by the rail positioning.

## Architecture & files

- **New `src/components/comments/CommentComposer.tsx`** — owns the visual rendering of the three states (idle button / selecting bar / composing box). Receives the current `mode`, the captured `quote`, `speakerOptions`, `selfName`, `color`, and callbacks (`onStart`, `onCancel`, `onConfirmFragment`, `onSubmit`). The COMPOSING state reuses `ComposeBubble` (speaker picker + textarea + submit/cancel) so the IC/OOC logic and validation are not duplicated.
- **Modify `src/components/comments/AnnotatableArticle.tsx`:**
  - Add `mode` state; replace the current always-on `onMouseUp` capture with one gated on `mode === 'selecting'` (no auto-advance to compose).
  - Render `CommentComposer` in the rail (desktop, sticky-top) or as a fixed bottom bar (mobile), only when `user` is present.
  - Thread `pending`/`quote` and the mode transitions into `CommentComposer`.
- **`ComposeBubble.tsx`:** reused verbatim as the COMPOSING body — it already renders the quote header + speaker picker + textarea + submit/cancel. To avoid a duplicated quote, `CommentComposer` shows the quote **only in the SELECTING preview**; in COMPOSING the quote comes from `ComposeBubble` (no change to `ComposeBubble` needed).
- **Unchanged:** the comments store (`add`/`load`), anchor lib, `CommentRail` + positioning, `useHighlights`. This is a new front-end for the existing write path.

## Edge cases

- Cancel at any step → idle, clear `pending` + browser selection.
- Selecting outside the article in SELECTING mode → ignored (Potwierdź stays disabled).
- Re-selecting in SELECTING mode → updates `pending` + quote preview.
- Submit error → stays in COMPOSING with the error shown.
- Not logged in → no composer control at all.
- Orphan/odd selection (collapsed, whitespace-only) → does not enable Potwierdź.

## Testing

- **`CommentComposer` in isolation (Testing Library):** the component is **prop-driven** (`mode`, `quote`, `hasFragment`, `speakerOptions`, callbacks), so each state is unit-testable by passing props — render IDLE (only the `Dodaj komentarz` button, fires `onStart`), SELECTING (Potwierdź disabled when `hasFragment` is false, enabled when true → fires `onConfirmFragment`; Anuluj fires `onCancel`), COMPOSING (renders the `ComposeBubble`, hides the speaker picker when `speakerOptions` is empty, submit fires `onSubmit`).
- **`AnnotatableArticle` wiring + real selection capture (geometry):** preview-verified on the live page (real `mouseup`/Range, mode transitions), not unit-tested (jsdom has no layout/selection geometry).
- Existing comment tests remain green (store, rail, positioning, ComposeBubble).

## Out of scope / deferred

- Realtime updates, inline dot markers, multi-level replies (already deferred for the feature).
- A polished mobile touch-selection affordance beyond the native long-press (v1 accepts native behaviour).
- Keyboard-only fragment selection.
