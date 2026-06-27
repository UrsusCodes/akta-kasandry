# Guided Comment-Composer Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the undiscoverable "select text → bubble" comment trigger with an explicit three-step composer (Add → mark fragment → write) that only logged-in players see.

**Architecture:** A new prop-driven `CommentComposer` renders three states (idle button / "mark fragment" bar / compose box, reusing `ComposeBubble`). `AnnotatableArticle` owns a `mode` state machine, gates text-selection capture on `mode === 'selecting'`, and places the composer in the right rail (sticky, desktop) or a fixed bottom bar (mobile). The store, anchor lib, rail positioning, and highlights are unchanged.

**Tech Stack:** React 19 + TS + Vite, TailwindCSS v4, Vitest + Testing Library. Spec: `docs/superpowers/specs/2026-06-26-comment-composer-flow-design.md`.

---

## File Structure

**New**
- `src/components/comments/CommentComposer.tsx` — the morphing composer control (idle/selecting/composing). Prop-driven; reuses `ComposeBubble` in the composing state.
- `src/components/comments/CommentComposer.test.tsx` — unit tests for the three states.
- `src/components/comments/useIsDesktop.ts` — `(min-width: 1024px)` matchMedia hook (jsdom-safe; returns false without matchMedia).

**Modified**
- `src/components/comments/ComposeBubble.tsx` — hide the `SpeakerPicker` when `speakerOptions` is empty (clean OOC box).
- `src/components/comments/ComposeBubble.test.tsx` — add the empty-options case.
- `src/components/comments/AnnotatableArticle.tsx` — add the `mode` state machine, gate `onMouseUp`, render `CommentComposer`, remove the old auto-opening sticky bubble.

---

## Task 1: Hide the speaker picker when there are no characters

**Files:**
- Modify: `src/components/comments/ComposeBubble.tsx`
- Modify: `src/components/comments/ComposeBubble.test.tsx`

- [ ] **Step 1: Add the failing test** (append to `ComposeBubble.test.tsx`)

```tsx
it('omits the speaker picker and submits as OOC when there are no character options', async () => {
  const onSubmit = vi.fn().mockResolvedValue({})
  render(
    <ComposeBubble
      quote="pierwsza strzelanina"
      speakerOptions={[]}
      selfName="Nika" color="#b5472d"
      onSubmit={onSubmit} onCancel={() => {}}
    />,
  )
  // No speaker picker at all when there are no character options.
  expect(screen.queryByText(/Ja \(Nika\)/)).not.toBeInTheDocument()
  await userEvent.type(screen.getByRole('textbox'), 'Notka.')
  await userEvent.click(screen.getByRole('button', { name: /dodaj/i }))
  expect(onSubmit).toHaveBeenCalledWith({ speakerCharacterId: null, body: 'Notka.' })
})
```

- [ ] **Step 2: Run it — verify it fails**

Run: `npm run test:run src/components/comments/ComposeBubble.test.tsx`
Expected: FAIL — `Ja (Nika)` is currently rendered (the SpeakerPicker always shows the self button), so `queryByText` finds it.

- [ ] **Step 3: Hide the picker when empty** — in `ComposeBubble.tsx`, replace the unconditional `<SpeakerPicker … />` line:

```tsx
      {speakerOptions.length > 0 && (
        <SpeakerPicker options={speakerOptions} selfName={selfName} color={color} value={speaker} onPick={setSpeaker} />
      )}
```

(When the picker is hidden, `speaker` stays `null` → the comment is OOC, which is correct.)

- [ ] **Step 4: Run it — verify it passes**

Run: `npm run test:run src/components/comments/ComposeBubble.test.tsx`
Expected: PASS (the existing "submits body + selected speaker" test still passes — it passes a non-empty `speakerOptions`, so the picker still renders there).

- [ ] **Step 5: Commit**

```bash
git add src/components/comments/ComposeBubble.tsx src/components/comments/ComposeBubble.test.tsx
git commit -m "feat: ComposeBubble hides speaker picker when no characters (clean OOC)"
```

---

## Task 2: `useIsDesktop` hook

**Files:**
- Create: `src/components/comments/useIsDesktop.ts`
- Create: `src/components/comments/useIsDesktop.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsDesktop } from './useIsDesktop'

describe('useIsDesktop', () => {
  it('returns false when matchMedia is unavailable (jsdom)', () => {
    // jsdom has no window.matchMedia by default → hook must not throw and default to false.
    const original = (window as any).matchMedia
    // @ts-expect-error force-remove for the test
    delete (window as any).matchMedia
    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(false)
    if (original) (window as any).matchMedia = original
  })
})
```

- [ ] **Step 2: Run it — verify it fails**

Run: `npm run test:run src/components/comments/useIsDesktop.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `useIsDesktop.ts`**

```ts
import { useEffect, useState } from 'react'

const QUERY = '(min-width: 1024px)' // Tailwind lg — the two-column breakpoint

/** True on the desktop two-column layout. Safe in jsdom (no matchMedia → false). */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches,
  )
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(QUERY)
    const handler = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', handler)
    setIsDesktop(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}
```

- [ ] **Step 4: Run it — verify it passes**

Run: `npm run test:run src/components/comments/useIsDesktop.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/comments/useIsDesktop.ts src/components/comments/useIsDesktop.test.ts
git commit -m "feat: useIsDesktop breakpoint hook"
```

---

## Task 3: `CommentComposer` — the three-state control

**Files:**
- Create: `src/components/comments/CommentComposer.tsx`
- Create: `src/components/comments/CommentComposer.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentComposer } from './CommentComposer'

const base = {
  quote: null as string | null,
  hasFragment: false,
  speakerOptions: [] as { characterId: string; name: string; portraitUrl: string | null }[],
  selfName: 'Nika',
  color: '#b5472d',
  onStart: vi.fn(),
  onConfirmFragment: vi.fn(),
  onCancel: vi.fn(),
  onSubmit: vi.fn().mockResolvedValue({}),
}

describe('CommentComposer', () => {
  it('idle: shows the add button and reports start', async () => {
    const onStart = vi.fn()
    render(<CommentComposer {...base} mode="idle" onStart={onStart} />)
    await userEvent.click(screen.getByRole('button', { name: /dodaj komentarz/i }))
    expect(onStart).toHaveBeenCalled()
  })

  it('selecting: Potwierdź is disabled until a fragment is captured', async () => {
    const onConfirmFragment = vi.fn()
    const { rerender } = render(<CommentComposer {...base} mode="selecting" hasFragment={false} onConfirmFragment={onConfirmFragment} />)
    expect(screen.getByText(/zaznacz fragment/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /potwierdź/i })).toBeDisabled()
    rerender(<CommentComposer {...base} mode="selecting" hasFragment quote="pierwsza strzelanina" onConfirmFragment={onConfirmFragment} />)
    expect(screen.getByText(/pierwsza strzelanina/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /potwierdź/i }))
    expect(onConfirmFragment).toHaveBeenCalled()
  })

  it('selecting: Anuluj cancels', async () => {
    const onCancel = vi.fn()
    render(<CommentComposer {...base} mode="selecting" onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: /anuluj/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('composing: renders the compose box and submits', async () => {
    const onSubmit = vi.fn().mockResolvedValue({})
    render(<CommentComposer {...base} mode="composing" quote="pierwsza strzelanina" onSubmit={onSubmit} />)
    await userEvent.type(screen.getByRole('textbox'), 'Notka.')
    await userEvent.click(screen.getByRole('button', { name: /dodaj/i }))
    expect(onSubmit).toHaveBeenCalledWith({ speakerCharacterId: null, body: 'Notka.' })
  })
})
```

> Note: in the composing test, `speakerOptions` is empty, so (per Task 1) `ComposeBubble` shows no picker and the submit is OOC (`speakerCharacterId: null`). The button name `/dodaj/i` matches `ComposeBubble`'s "Dodaj" button.

- [ ] **Step 2: Run them — verify they fail**

Run: `npm run test:run src/components/comments/CommentComposer.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `CommentComposer.tsx`**

```tsx
import type { SpeakerOption } from './SpeakerPicker'
import { ComposeBubble } from './ComposeBubble'

export type ComposerMode = 'idle' | 'selecting' | 'composing'

type Props = {
  mode: ComposerMode
  quote: string | null
  hasFragment: boolean
  speakerOptions: SpeakerOption[]
  selfName: string
  color: string
  /** 'rail' = sticky inside the desktop rail; 'bottom' = fixed bar at the viewport bottom (mobile). */
  variant?: 'rail' | 'bottom'
  onStart: () => void
  onConfirmFragment: () => void
  onCancel: () => void
  onSubmit: (input: { speakerCharacterId: string | null; body: string }) => Promise<{ error?: string }>
}

function wrapClass(variant: 'rail' | 'bottom'): string {
  return variant === 'bottom'
    ? 'fixed inset-x-0 bottom-0 z-30 border-t border-gold bg-teal-deep p-3 shadow-xl'
    : 'sticky top-2 z-20 mb-3'
}

/**
 * Guided comment composer. Three states: an "Add comment" button (idle), a
 * "mark the fragment" bar (selecting), and the compose box (composing, reusing
 * ComposeBubble). Pure/prop-driven — AnnotatableArticle owns the state machine
 * and the selection capture.
 */
export function CommentComposer({
  mode, quote, hasFragment, speakerOptions, selfName, color, variant = 'rail',
  onStart, onConfirmFragment, onCancel, onSubmit,
}: Props) {
  if (mode === 'idle') {
    return (
      <div className={wrapClass(variant)}>
        <button
          type="button"
          onClick={onStart}
          className="font-display w-full rounded border border-gold bg-teal-dark px-3 py-2 text-[0.7rem] uppercase tracking-widest text-gold transition hover:bg-gold hover:text-teal-deep"
        >
          + Dodaj komentarz
        </button>
      </div>
    )
  }

  if (mode === 'selecting') {
    return (
      <div className={wrapClass(variant)}>
        <div className="rounded-lg border border-gold bg-teal-dark p-3 shadow-xl">
          <p className="font-display mb-2 text-[0.66rem] uppercase tracking-wide text-gold">
            Zaznacz fragment w treści…
          </p>
          {quote && (
            <p className="mb-2 border-l-2 border-gold-muted pl-2 font-body text-[0.82rem] italic text-gold/80">
              „{quote}"
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="font-display text-[0.62rem] uppercase tracking-wide text-parchment/70 hover:text-parchment">
              Anuluj
            </button>
            <button
              type="button"
              disabled={!hasFragment}
              onClick={onConfirmFragment}
              className="font-display rounded border border-gold bg-teal-deep px-3 py-1 text-[0.62rem] uppercase tracking-wide text-gold hover:bg-gold hover:text-teal-deep disabled:opacity-50"
            >
              Potwierdź
            </button>
          </div>
        </div>
      </div>
    )
  }

  // composing
  return (
    <div className={wrapClass(variant)}>
      <ComposeBubble
        quote={quote ?? ''}
        speakerOptions={speakerOptions}
        selfName={selfName}
        color={color}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run them — verify they pass**

Run: `npm run test:run src/components/comments/CommentComposer.test.tsx`
Expected: PASS (4 tests). Run `npx tsc -b` → exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/comments/CommentComposer.tsx src/components/comments/CommentComposer.test.tsx
git commit -m "feat: CommentComposer — guided idle/selecting/composing control"
```

---

## Task 4: Wire the state machine into `AnnotatableArticle` + preview-verify + deploy

**Files:**
- Modify: `src/components/comments/AnnotatableArticle.tsx`

- [ ] **Step 1: Rewrite the interaction layer of `AnnotatableArticle.tsx`**

Keep all existing imports/store hooks. Add the imports:
```tsx
import { CommentComposer, type ComposerMode } from './CommentComposer'
import { useIsDesktop } from './useIsDesktop'
```

Add state next to the existing `pending`/`activeBlockId`/`activeThreadId`:
```tsx
  const [mode, setMode] = useState<ComposerMode>('idle')
  const isDesktop = useIsDesktop()
```

Change `onMouseUp` so it ONLY captures while in selecting mode (this removes the implicit auto-open):
```tsx
  const onMouseUp = () => {
    if (!user || mode !== 'selecting') return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !containerRef.current) return
    const range = sel.getRangeAt(0)
    const start = range.startContainer
    const from = start instanceof Element ? start : start.parentElement
    const block = from?.closest('[data-block-id]') as HTMLElement | null
    if (!block || !containerRef.current.contains(block)) return
    const anchor = createAnchor(range, block)
    if (anchor && anchor.quote.trim()) setPending({ anchor, quote: anchor.quote })
  }
```

Add the transition helpers (near `focusAnchor`):
```tsx
  const resetComposer = () => {
    setMode('idle')
    setPending(null)
    window.getSelection()?.removeAllRanges()
  }
```

DELETE the old auto-opening compose block inside the article column (the `{pending && ( <div className="sticky bottom-4 …"><ComposeBubble …/></div> )}` JSX). The compose box now lives in `CommentComposer`'s composing state.

In the `<aside>`, render the composer (only when logged in) ABOVE the rail:
```tsx
      <aside className="w-full shrink-0 lg:w-[330px]">
        {user && (
          <CommentComposer
            mode={mode}
            quote={pending?.quote ?? null}
            hasFragment={!!pending}
            speakerOptions={speakerOptions}
            selfName={displayName ?? 'Ja'}
            color={color}
            variant={isDesktop ? 'rail' : 'bottom'}
            onStart={() => setMode('selecting')}
            onConfirmFragment={() => setMode('composing')}
            onCancel={resetComposer}
            onSubmit={async ({ speakerCharacterId, body }) => {
              const res = await add({ pageKey, anchor: pending!.anchor, speakerCharacterId, body, parentId: null })
              if (!res.error) resetComposer()
              return res
            }}
          />
        )}
        <CommentRail
          comments={comments}
          activeThreadId={activeThreadId}
          canModerate={role === 'mg'}
          onFocusAnchor={(blockId, rootId) => focusAnchor(blockId, rootId)}
          containerEl={containerRef.current}
        />
      </aside>
```

Leave the article column as just `<div ref={containerRef} onMouseUp={onMouseUp} className="min-w-0 flex-1"><Markdown>{children}</Markdown></div>` (no compose block inside it anymore).

- [ ] **Step 2: Run the full suite + typecheck**

Run: `npm run test:run`
Expected: ALL green. The existing `AnnotatableArticle.test.tsx` renders with no signed-in user (auth default `user: null`), so `CommentComposer` is not rendered and the test's assertions (markdown heading + "Komentarze") still hold.
Run: `npx tsc -b` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/comments/AnnotatableArticle.tsx
git commit -m "feat: guided comment-composer flow replaces implicit selection"
```

- [ ] **Step 4: Preview-verify (geometry + real selection — controller does this)**

Start the dev server, open `/streszczenie-ug2`, and (logged in) verify:
1. Desktop: a sticky **"+ Dodaj komentarz"** sits at the top of the rail and follows scroll.
2. Click it → the bar shows **"Zaznacz fragment w treści…"** + a disabled **Potwierdź** + **Anuluj**.
3. Select a text fragment → the quote preview appears, **Potwierdź** enables.
4. Click **Potwierdź** → the compose box appears (speaker picker only if the player has cast characters) → type → **Dodaj** → the comment lands positioned at its fragment; the bar returns to idle.
5. **Anuluj** at each step returns to idle and clears the selection.
6. Selecting text WITHOUT first clicking "Dodaj komentarz" does nothing (implicit flow is gone).
7. Resize to mobile: the composer is a fixed bar at the bottom of the viewport.
8. Logged out: no composer control; rail is read-only.

- [ ] **Step 5: Deploy**

Run the production build locally first (`npm run build`, expect exit 0), then push to deploy:
```bash
git push origin main
```
Watch the GitHub Pages deploy go green, then smoke-test the live page.

---

## Self-Review

**Spec coverage:** replace implicit flow → Task 4 (onMouseUp gated on `mode==='selecting'`, old bubble removed). Three-state machine → Tasks 3 (component) + 4 (wiring). Speaker picker hidden when only "Ja" → Task 1. Desktop sticky-in-rail / mobile fixed-bottom → Task 3 (`variant`) + Task 4 (`useIsDesktop`). Login-gated → Task 4 (`{user && …}`). Reuse ComposeBubble → Task 3. Store/anchor/rail/highlights unchanged → confirmed (only ComposeBubble's picker visibility changes). Edge cases (cancel resets, re-select updates, submit-error stays, outside-article ignored, collapsed selection ignored) → Task 4 `onMouseUp` guards + `resetComposer` + ComposeBubble's existing error handling.

**Placeholder scan:** none — every code step has full code.

**Type consistency:** `ComposerMode` defined in Task 3, imported in Task 4. `CommentComposer` prop names (`mode`, `quote`, `hasFragment`, `speakerOptions`, `selfName`, `color`, `variant`, `onStart`, `onConfirmFragment`, `onCancel`, `onSubmit`) match between Task 3's definition and Task 4's usage. `useIsDesktop` (Task 2) used in Task 4. `add(...)` signature matches the store's `NewComment`. `pending` shape (`{ anchor, quote }`) unchanged from the current file.
