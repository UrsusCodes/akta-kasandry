# Player Margin-Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let logged-in players leave in-character / out-of-character comments anchored to text fragments of session-summary pages, shown in a right rail, without ever modifying the main content.

**Architecture:** A homegrown text anchorer pins each comment to a block-id + quoted fragment (resolved at render with fuzzy fallback). Comments live in a new `wiki.comments` table (public read, author/MG write). An opt-in `AnnotatableArticle` wrapper around the existing `Markdown` renderer adds selection → compose → rail, only on summary routes. Player identity = a colour from a 16-option palette (rings the portrait, tints the fragment); the speaker is one of the player's investigation characters (IC) or themselves (OOC).

**Tech Stack:** React 19 + TS + Vite, TailwindCSS v4, Supabase (shared `wiki.*` schema), zustand, react-markdown (mdast `hProperties`), **new dev-only:** Vitest + Testing Library (approved 2026-06-26). Anchoring is dependency-free.

**Spec:** `docs/AktaKasandry_obsidian/work/2026-06-26-player-comments-design.md`
**Target visual:** `.superpowers/brainstorm/v3.html`

---

## File Structure

**New source files**
- `src/lib/playerColors.ts` — 16-colour palette + helpers (mirrors `pinColors.ts`).
- `src/lib/comments/anchor.ts` — `createAnchor` / `resolveAnchor` / `shortHash` / `normalizeText` (pure, DOM-text-based, no geometry).
- `src/lib/remarkBlockIds.ts` — remark plugin attaching `data-block-id` to block nodes.
- `src/lib/comments/group.ts` — group comments into anchor-threads + replies (pure).
- `src/types.ts` — extend with `CommentAnchor`, `Comment`, `CommentMode`.
- `src/stores/comments.ts` — zustand store (load/add/edit/delete/reply, mock fallback).
- `src/components/comments/AnnotatableArticle.tsx` — opt-in wrapper (selection, highlights, rail, compose).
- `src/components/comments/CommentRail.tsx` — grouped collapsible threads.
- `src/components/comments/CommentCard.tsx` — single comment (IC/OOC styling).
- `src/components/comments/SpeakerPicker.tsx` — character / "Ja" selector.
- `src/components/comments/ComposeBubble.tsx` — compose popover.
- `src/components/comments/Portrait.tsx` — rect character photo / round self tile.
- `src/components/comments/useHighlights.ts` — CSS Custom Highlight API binding.

**Modified source files**
- `src/lib/supabase.ts` — no change (reuse `getSupabase`/`hasSupabaseCredentials`).
- `src/components/Markdown.tsx` — add `remarkBlockIds` to the plugin list.
- `src/stores/auth.ts` — load `color` onto the profile shape.
- `src/routes/UG2Summary.tsx` — render via `AnnotatableArticle` (first commentable page).
- `src/routes/AdminImport.tsx` — assign `owner_profile_id` + investigation cast.

**New migrations**
- `supabase/migrations/009_profiles_color.sql`
- `supabase/migrations/010_imported_characters_owner.sql`
- `supabase/migrations/011_comments.sql`
- `supabase/migrations/012_investigation_cast.sql`

**New test infra**
- `vitest.config.ts`, `src/test/setup.ts`, plus `*.test.ts(x)` beside each unit.

---

## Phase 0 — Test harness

### Task 0: Install and configure Vitest + Testing Library

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Install dev dependencies**

Run:
```bash
npm install -D vitest@^2 jsdom@^25 @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14
```
Expected: packages added to `devDependencies`, no peer-dep errors on React 19 (`@testing-library/react@16` supports React 19).

- [ ] **Step 2: Add test scripts to `package.json`**

In the `"scripts"` block add:
```json
    "test": "vitest",
    "test:run": "vitest run"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
```

- [ ] **Step 4: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 5: Sanity test**

Create `src/test/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('vitest harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6: Run and verify**

Run: `npm run test:run`
Expected: PASS, 1 test. Then delete `src/test/smoke.test.ts`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts
git commit -m "test: add vitest + testing-library harness"
```

---

## Phase 1 — Pure logic (anchoring, colours, grouping)

This is the highest-risk, most-testable core. No UI, no DB. Built fully TDD.

### Task 1: Player colour palette

**Files:**
- Create: `src/lib/playerColors.ts`
- Test: `src/lib/playerColors.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { PLAYER_COLORS, DEFAULT_PLAYER_COLOR, playerColorName } from './playerColors'

describe('playerColors', () => {
  it('offers exactly 16 colours with unique hex values', () => {
    expect(PLAYER_COLORS).toHaveLength(16)
    const hexes = PLAYER_COLORS.map((c) => c.hex.toLowerCase())
    expect(new Set(hexes).size).toBe(16)
  })

  it('default colour is one of the palette', () => {
    expect(PLAYER_COLORS.some((c) => c.hex === DEFAULT_PLAYER_COLOR)).toBe(true)
  })

  it('names a known hex and falls back to the hex itself', () => {
    expect(playerColorName(PLAYER_COLORS[0].hex)).toBe(PLAYER_COLORS[0].name)
    expect(playerColorName('#000000')).toBe('#000000')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:run src/lib/playerColors.test.ts`
Expected: FAIL — cannot find module `./playerColors`.

- [ ] **Step 3: Implement `src/lib/playerColors.ts`**

```ts
/**
 * Player identity palette — 16 muted, period-appropriate colours for the
 * Cthulhu skin. A player picks one; it rings their portrait and tints the
 * fragments they comment on. Distinct from the 10-colour pin palette.
 * Seeded from the brainstorm mockup v3.
 */
export const PLAYER_COLORS = [
  { name: 'Terakota', hex: '#b5472d' },
  { name: 'Miedź', hex: '#c97f2e' },
  { name: 'Złoto', hex: '#c8a23c' },
  { name: 'Oliwka', hex: '#7d8c3a' },
  { name: 'Szmaragd', hex: '#3f8c6e' },
  { name: 'Patyna', hex: '#2f7d8a' },
  { name: 'Atrament', hex: '#3a6ea5' },
  { name: 'Fiolet', hex: '#5a5aa5' },
  { name: 'Ametyst', hex: '#8a4fa5' },
  { name: 'Magenta', hex: '#a5417e' },
  { name: 'Sjena', hex: '#9c5a3c' },
  { name: 'Grafit', hex: '#6b6b6b' },
  { name: 'Mosiądz', hex: '#a08947' },
  { name: 'Mech', hex: '#4f7a4f' },
  { name: 'Stal', hex: '#3a5566' },
  { name: 'Burgund', hex: '#7a3a3a' },
] as const

export const DEFAULT_PLAYER_COLOR = '#3a6ea5'

export function playerColorName(hex: string): string {
  return PLAYER_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.name ?? hex
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:run src/lib/playerColors.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/playerColors.ts src/lib/playerColors.test.ts
git commit -m "feat: 16-colour player identity palette"
```

### Task 2: Text utilities — `normalizeText` + `shortHash`

**Files:**
- Create: `src/lib/comments/anchor.ts` (first slice)
- Test: `src/lib/comments/anchor.test.ts` (first slice)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { normalizeText, shortHash } from './anchor'

describe('normalizeText', () => {
  it('collapses whitespace and trims', () => {
    expect(normalizeText('  a\n  b\t c ')).toBe('a b c')
  })
})

describe('shortHash', () => {
  it('is deterministic and stable for the same input', () => {
    expect(shortHash('pierwsza strzelanina')).toBe(shortHash('pierwsza strzelanina'))
  })
  it('differs for different inputs and is short/base36', () => {
    expect(shortHash('a')).not.toBe(shortHash('b'))
    expect(shortHash('a')).toMatch(/^[0-9a-z]{1,8}$/)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:run src/lib/comments/anchor.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the first slice of `src/lib/comments/anchor.ts`**

```ts
/**
 * Homegrown text anchorer. Pins a comment to a block (by stable id) and a
 * quoted fragment with surrounding context, then re-locates it at render time
 * with progressively looser matching. No geometry — pure DOM text + offsets —
 * so it is unit-testable under jsdom. No external dependency.
 */

/** Collapse all whitespace runs to single spaces and trim. */
export function normalizeText(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

/** Small deterministic FNV-1a hash → base36, max 8 chars. Used for block ids. */
export function shortHash(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36).slice(0, 8)
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:run src/lib/comments/anchor.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/comments/anchor.ts src/lib/comments/anchor.test.ts
git commit -m "feat: anchor text utils (normalize + hash)"
```

### Task 3: `CommentAnchor` type + `createAnchor`

**Files:**
- Modify: `src/types.ts`
- Modify: `src/lib/comments/anchor.ts`
- Modify: `src/lib/comments/anchor.test.ts`

- [ ] **Step 1: Add the type to `src/types.ts`** (append)

```ts
/** A comment's pin into the rendered article text. */
export type CommentAnchor = {
  blockId: string
  quote: string
  prefix: string
  suffix: string
  startOffset: number
  endOffset: number
}
```

- [ ] **Step 2: Write the failing test** (append to `anchor.test.ts`)

```ts
import { createAnchor } from './anchor'

function blockWith(html: string, id = 'blk1'): HTMLElement {
  const el = document.createElement('p')
  el.setAttribute('data-block-id', id)
  el.innerHTML = html
  document.body.appendChild(el)
  return el
}

function rangeOverText(block: HTMLElement, start: number, end: number): Range {
  // Walk text nodes to map char offsets → (node, offset) for the test.
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT)
  let acc = 0
  let startNode: Text | null = null
  let startOff = 0
  let endNode: Text | null = null
  let endOff = 0
  let n = walker.nextNode() as Text | null
  while (n) {
    const len = n.data.length
    if (!startNode && start <= acc + len) {
      startNode = n
      startOff = start - acc
    }
    if (!endNode && end <= acc + len) {
      endNode = n
      endOff = end - acc
    }
    acc += len
    n = walker.nextNode() as Text | null
  }
  const r = document.createRange()
  r.setStart(startNode!, startOff)
  r.setEnd(endNode!, endOff)
  return r
}

describe('createAnchor', () => {
  it('captures quote, offsets, prefix and suffix across inline markup', () => {
    const block = blockWith('O świcie <strong>wywiązała się</strong> pierwsza strzelanina.')
    // textContent = "O świcie wywiązała się pierwsza strzelanina."
    const text = block.textContent!
    const start = text.indexOf('pierwsza strzelanina')
    const end = start + 'pierwsza strzelanina'.length
    const anchor = createAnchor(rangeOverText(block, start, end), block)!
    expect(anchor.blockId).toBe('blk1')
    expect(anchor.quote).toBe('pierwsza strzelanina')
    expect(anchor.startOffset).toBe(start)
    expect(anchor.endOffset).toBe(end)
    expect(anchor.prefix.endsWith('się ')).toBe(true)
    expect(anchor.suffix).toBe('.')
  })
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm run test:run src/lib/comments/anchor.test.ts`
Expected: FAIL — `createAnchor` is not a function.

- [ ] **Step 4: Implement `createAnchor` + offset helper** (append to `anchor.ts`)

```ts
import type { CommentAnchor } from '@/types'

const CONTEXT = 32

/** Character offset of a (node, offset) point within el.textContent. */
function pointToOffset(el: HTMLElement, node: Node, nodeOffset: number): number {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let acc = 0
  let n = walker.nextNode() as Text | null
  while (n) {
    if (n === node) return acc + nodeOffset
    acc += n.data.length
    n = walker.nextNode() as Text | null
  }
  return acc
}

/**
 * Build an anchor from a DOM selection Range and the enclosing block element
 * (the nearest ancestor carrying `data-block-id`). Returns null if the block
 * has no id or the range is collapsed.
 */
export function createAnchor(range: Range, blockEl: HTMLElement): CommentAnchor | null {
  const blockId = blockEl.getAttribute('data-block-id')
  if (!blockId || range.collapsed) return null
  const text = blockEl.textContent ?? ''
  const startOffset = pointToOffset(blockEl, range.startContainer, range.startOffset)
  const endOffset = pointToOffset(blockEl, range.endContainer, range.endOffset)
  const lo = Math.min(startOffset, endOffset)
  const hi = Math.max(startOffset, endOffset)
  return {
    blockId,
    quote: text.slice(lo, hi),
    prefix: text.slice(Math.max(0, lo - CONTEXT), lo),
    suffix: text.slice(hi, hi + CONTEXT),
    startOffset: lo,
    endOffset: hi,
  }
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm run test:run src/lib/comments/anchor.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/lib/comments/anchor.ts src/lib/comments/anchor.test.ts
git commit -m "feat: createAnchor — capture fragment + context from a Range"
```

### Task 4: `resolveAnchor` with offset → indexOf → fuzzy fallback + orphan

**Files:**
- Modify: `src/lib/comments/anchor.ts`
- Modify: `src/lib/comments/anchor.test.ts`

- [ ] **Step 1: Write the failing tests** (append)

```ts
import { resolveAnchor } from './anchor'
import type { CommentAnchor } from '@/types'

function container(...blocks: Array<[string, string]>): HTMLElement {
  const root = document.createElement('div')
  for (const [id, html] of blocks) {
    const p = document.createElement('p')
    p.setAttribute('data-block-id', id)
    p.innerHTML = html
    root.appendChild(p)
  }
  document.body.appendChild(root)
  return root
}

const base: CommentAnchor = {
  blockId: 'b1',
  quote: 'pierwsza strzelanina',
  prefix: 'się ',
  suffix: '.',
  startOffset: 9,
  endOffset: 29,
}

describe('resolveAnchor', () => {
  it('resolves by exact offset when the block is unchanged', () => {
    const root = container(['b1', 'O świcie wywiązała się pierwsza strzelanina.'])
    const range = resolveAnchor(base, root)!
    expect(range).not.toBeNull()
    expect(range.toString()).toBe('pierwsza strzelanina')
  })

  it('falls back to indexOf when offsets shifted', () => {
    const root = container(['b1', 'Tej nocy wreszcie wywiązała się pierwsza strzelanina na farmie.'])
    const range = resolveAnchor(base, root)!
    expect(range.toString()).toBe('pierwsza strzelanina')
  })

  it('finds the quote in another block when the block id changed (fuzzy)', () => {
    const root = container(['CHANGED', 'O świcie wywiązała się pierwsza strzelanina.'])
    const range = resolveAnchor(base, root)!
    expect(range.toString()).toBe('pierwsza strzelanina')
  })

  it('returns null (orphan) when the quote is gone entirely', () => {
    const root = container(['b1', 'Zupełnie inny tekst bez tej frazy.'])
    expect(resolveAnchor(base, root)).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:run src/lib/comments/anchor.test.ts`
Expected: FAIL — `resolveAnchor` not a function.

- [ ] **Step 3: Implement `resolveAnchor` + offset→point + range builder** (append to `anchor.ts`)

```ts
/** Inverse of pointToOffset: map a char offset back to a (node, offset). */
function offsetToPoint(el: HTMLElement, offset: number): { node: Text; offset: number } | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let acc = 0
  let n = walker.nextNode() as Text | null
  let last: Text | null = null
  while (n) {
    const len = n.data.length
    if (offset <= acc + len) return { node: n, offset: offset - acc }
    acc += len
    last = n
    n = walker.nextNode() as Text | null
  }
  return last ? { node: last, offset: last.data.length } : null
}

function rangeFor(el: HTMLElement, start: number, end: number): Range | null {
  const a = offsetToPoint(el, start)
  const b = offsetToPoint(el, end)
  if (!a || !b) return null
  const r = document.createRange()
  r.setStart(a.node, a.offset)
  r.setEnd(b.node, b.offset)
  return r
}

/**
 * Re-locate an anchor inside `container`. Resolution order:
 *   1. block by id, exact offset slice === quote
 *   2. block by id, indexOf(quote)
 *   3. any block whose normalized text contains the quote (fuzzy block move)
 * Returns null when the quote is gone — caller treats that as an orphan.
 */
export function resolveAnchor(anchor: CommentAnchor, container: HTMLElement): Range | null {
  const byId = container.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(anchor.blockId)}"]`)
  const tryBlock = (el: HTMLElement): Range | null => {
    const text = el.textContent ?? ''
    if (text.slice(anchor.startOffset, anchor.endOffset) === anchor.quote) {
      return rangeFor(el, anchor.startOffset, anchor.endOffset)
    }
    const idx = text.indexOf(anchor.quote)
    if (idx >= 0) return rangeFor(el, idx, idx + anchor.quote.length)
    return null
  }

  if (byId) {
    const r = tryBlock(byId)
    if (r) return r
  }
  // Fuzzy: scan every block for the quote (block id may have changed).
  const wantedNorm = normalizeText(anchor.quote)
  for (const el of Array.from(container.querySelectorAll<HTMLElement>('[data-block-id]'))) {
    if (el === byId) continue
    if (normalizeText(el.textContent ?? '').includes(wantedNorm)) {
      const r = tryBlock(el)
      if (r) return r
    }
  }
  return null
}
```

> Note: `CSS.escape` exists in jsdom ≥ 22. If a test environment lacks it, the executor should add a tiny polyfill in `src/test/setup.ts`; do not add a dependency.

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:run src/lib/comments/anchor.test.ts`
Expected: PASS (all anchor tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/comments/anchor.ts src/lib/comments/anchor.test.ts
git commit -m "feat: resolveAnchor with offset/indexOf/fuzzy fallback + orphan"
```

### Task 5: `Comment` type + comment grouping (threads + replies)

**Files:**
- Modify: `src/types.ts`
- Create: `src/lib/comments/group.ts`
- Test: `src/lib/comments/group.test.ts`

- [ ] **Step 1: Add types to `src/types.ts`** (append)

```ts
export type CommentMode = 'ic' | 'ooc'

export type Comment = {
  id: string
  pageKey: string
  anchor: CommentAnchor
  authorProfileId: string
  authorName: string
  authorColor: string
  speakerCharacterId: string | null
  speakerName: string | null
  speakerPortraitUrl: string | null
  body: string
  parentId: string | null
  createdAt: string
  edited: boolean
}

/** A top-level comment plus its replies, all sharing one anchor. */
export type CommentThread = {
  anchor: CommentAnchor
  root: Comment
  replies: Comment[]
}

export function commentMode(c: Comment): CommentMode {
  return c.speakerCharacterId ? 'ic' : 'ooc'
}
```

- [ ] **Step 2: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { groupThreads } from './group'
import type { Comment } from '@/types'

const mk = (over: Partial<Comment>): Comment => ({
  id: 'x', pageKey: 'k', anchor: { blockId: 'b', quote: 'q', prefix: '', suffix: '', startOffset: 0, endOffset: 1 },
  authorProfileId: 'p', authorName: 'A', authorColor: '#fff',
  speakerCharacterId: null, speakerName: null, speakerPortraitUrl: null,
  body: '', parentId: null, createdAt: '2026-01-01T00:00:00Z', edited: false, ...over,
})

describe('groupThreads', () => {
  it('nests replies under their root and keeps roots in createdAt order', () => {
    const comments = [
      mk({ id: 'r1', createdAt: '2026-01-02T00:00:00Z' }),
      mk({ id: 'r0', createdAt: '2026-01-01T00:00:00Z' }),
      mk({ id: 'a', parentId: 'r0', createdAt: '2026-01-03T00:00:00Z' }),
    ]
    const threads = groupThreads(comments)
    expect(threads.map((t) => t.root.id)).toEqual(['r0', 'r1'])
    expect(threads[0].replies.map((r) => r.id)).toEqual(['a'])
  })

  it('promotes a reply whose parent is missing to its own thread', () => {
    const threads = groupThreads([mk({ id: 'orphanReply', parentId: 'gone' })])
    expect(threads).toHaveLength(1)
    expect(threads[0].root.id).toBe('orphanReply')
  })
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm run test:run src/lib/comments/group.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `src/lib/comments/group.ts`**

```ts
import type { Comment, CommentThread } from '@/types'

/**
 * Build threads: top-level comments (parentId === null, or whose parent is
 * absent) become roots, ordered by createdAt; their replies hang underneath,
 * also createdAt-ordered. Density in the UI is handled by collapsing a thread.
 */
export function groupThreads(comments: Comment[]): CommentThread[] {
  const byId = new Map(comments.map((c) => [c.id, c]))
  const byTime = (a: Comment, b: Comment) => a.createdAt.localeCompare(b.createdAt)

  const roots = comments
    .filter((c) => !c.parentId || !byId.has(c.parentId))
    .sort(byTime)

  return roots.map((root) => ({
    anchor: root.anchor,
    root,
    replies: comments.filter((c) => c.parentId === root.id).sort(byTime),
  }))
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm run test:run src/lib/comments/group.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/lib/comments/group.ts src/lib/comments/group.test.ts
git commit -m "feat: Comment types + thread/reply grouping"
```

### Task 6: `remarkBlockIds` plugin

**Files:**
- Create: `src/lib/remarkBlockIds.ts`
- Test: `src/lib/remarkBlockIds.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { remark } from 'remark'
// remark is a transitive dep of react-markdown's ecosystem; if not resolvable,
// test via unified+remark-parse already present. See Step 3 note.
import { remarkBlockIds } from './remarkBlockIds'
import { shortHash, normalizeText } from './comments/anchor'

function process(md: string) {
  const tree = remark().parse(md)
  remarkBlockIds()(tree)
  return tree
}

describe('remarkBlockIds', () => {
  it('attaches a stable data-block-id to paragraphs based on normalized text', () => {
    const tree: any = process('Pierwsza   strzelanina na farmie.')
    const para = tree.children[0]
    const expected = shortHash(normalizeText('Pierwsza strzelanina na farmie.'))
    expect(para.data.hProperties['data-block-id']).toBe(expected)
  })
})
```

> Step 3 note: if `remark` is not installed, replace the test harness with
> `unified().use(remarkParse)` — `remark-parse` ships with `react-markdown`.
> Do **not** add `remark` as a new dependency; use whatever the lockfile already
> provides. Verify with `npm ls remark-parse`.

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:run src/lib/remarkBlockIds.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/remarkBlockIds.ts`**

```ts
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import { shortHash, normalizeText } from './comments/anchor'

const BLOCK_TYPES = new Set(['paragraph', 'heading', 'listItem', 'blockquote', 'tableRow'])

/**
 * Attach `data-block-id` (a hash of the block's normalized text) to each block
 * node so comments can anchor to it. Inert unless the annotation layer reads
 * it. Added to the shared Markdown pipeline. `unist-util-visit` and
 * `mdast-util-to-string` are transitive deps of react-markdown (verify with
 * `npm ls`); no new top-level dependency.
 */
export function remarkBlockIds() {
  return (tree: unknown) => {
    visit(tree as never, (node: any) => {
      if (!BLOCK_TYPES.has(node.type)) return
      const text = normalizeText(toString(node))
      if (!text) return
      node.data = node.data || {}
      node.data.hProperties = node.data.hProperties || {}
      node.data.hProperties['data-block-id'] = shortHash(text)
    })
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:run src/lib/remarkBlockIds.test.ts`
Expected: PASS. (If `unist-util-visit`/`mdast-util-to-string` are missing, run `npm ls` to confirm — they are pulled in by `react-markdown`; if truly absent, the executor adds them as they are part of the same ecosystem, noting it in the journal.)

- [ ] **Step 5: Wire into the shared renderer — modify `src/components/Markdown.tsx`**

Add the import and extend the plugin list:
```ts
import { remarkBlockIds } from '@/lib/remarkBlockIds'
// …
        remarkPlugins={[remarkGfm, remarkWikilinks, remarkTranscriptAnchors, remarkBlockIds]}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/remarkBlockIds.ts src/lib/remarkBlockIds.test.ts src/components/Markdown.tsx
git commit -m "feat: remarkBlockIds — stable block ids in rendered markdown"
```

---

## Phase 2 — Database (coordinated, shared Supabase)

> [!warning] Coordination gate — do BEFORE writing/running any SQL
> The Supabase project is shared with coc-creator.

### Task 7: Coordination check (no code)

- [ ] **Step 1:** Read `docs/AktaKasandry_obsidian/INTEGRATIONS.md` for current coordination state and the `auth.users` trigger naming rule.
- [ ] **Step 2:** Check coc-creator's notes for conflicts:
  Run: `gh repo view UrsusCodes/coc-creator` then fetch their tech doc, e.g.
  `gh api repos/UrsusCodes/coc-creator/contents/docs/CoCCreator_obsidian/TECHNOLOGY_MASTERMIND.md --jq '.content' | base64 -d` and scan for `wiki.` / `comments` / `auth.users` references.
- [ ] **Step 3:** Confirm we stay strictly within `wiki.*`. No `public.*` writes. New tables: `wiki.comments`, `wiki.investigation_cast`; new columns on `wiki.profiles`, `wiki.imported_characters`.
- [ ] **Step 4:** Note the outcome in `DOCS_CHANGES_JOURNAL.md` (a sentence: "Checked coc-creator before comments migration — no conflicts").

### Task 8: Migration 009 — `profiles.color`

**Files:**
- Create: `supabase/migrations/009_profiles_color.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 009 — player identity colour on wiki.profiles.
-- One of the 16 hex values in src/lib/playerColors.ts. MG sets it in /admin.
alter table wiki.profiles add column if not exists color text;
```

- [ ] **Step 2: Extend the self-update RLS so a player may set their own colour**

The existing `profiles_self_update` policy (migration 002) already allows a user
to update their own row while pinning `role`. `color` is covered automatically
(it's not `role`). No policy change needed. Add a comment to the migration:
```sql
-- RLS: profiles_self_update (migration 002) already lets a user update their
-- own row except role; colour is therefore self-settable. MG can also set it
-- via the admin UI (MG updates are allowed by the same own-row rule when acting
-- on their own row; cross-profile colour assignment by MG uses a service path —
-- for v1 the player picks their own colour, MG seeds it at account creation).
```

- [ ] **Step 3:** Do NOT auto-run. Mark for the migration runbook. Verify the file parses by eye against `docs/RUNBOOKS/supabase-migration.md`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/009_profiles_color.sql
git commit -m "db: migration 009 — profiles.color"
```

### Task 9: Migration 010 — `imported_characters.owner_profile_id`

**Files:**
- Create: `supabase/migrations/010_imported_characters_owner.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 010 — link an imported character to the player account that "owns" it.
-- Set by MG in /admin/import-characters. Drives the speaker picker
-- ("my characters"). Nullable: unassigned characters simply aren't pickable.
alter table wiki.imported_characters
  add column if not exists owner_profile_id uuid references wiki.profiles(id);

create index if not exists imported_characters_owner_idx
  on wiki.imported_characters (owner_profile_id);

-- RLS unchanged: imported_anon_read (select true) exposes the new column;
-- imported_mg_write already covers updates to it.
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/010_imported_characters_owner.sql
git commit -m "db: migration 010 — imported_characters.owner_profile_id"
```

### Task 10: Migration 011 — `wiki.comments`

**Files:**
- Create: `supabase/migrations/011_comments.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 011 — player margin-comments on summary pages.
-- See docs/AktaKasandry_obsidian/work/2026-06-26-player-comments-design.md
create table wiki.comments (
  id                   uuid primary key default gen_random_uuid(),
  page_key             text not null,
  anchor               jsonb not null,
  author_profile_id    uuid not null references wiki.profiles(id) on delete cascade,
  speaker_character_id uuid references wiki.imported_characters(id) on delete set null,
  body                 text not null check (length(btrim(body)) > 0),
  parent_id            uuid references wiki.comments(id) on delete cascade,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  edited               boolean not null default false
);
create index comments_page_key_idx on wiki.comments (page_key);
create index comments_parent_idx on wiki.comments (parent_id);

grant select on wiki.comments to anon, authenticated;
grant insert, update, delete on wiki.comments to authenticated;

alter table wiki.comments enable row level security;

-- Public read (decision 2026-06-26: all comments public).
create policy comments_public_read on wiki.comments
  for select using (true);

-- A signed-in user may insert only as themselves.
create policy comments_author_insert on wiki.comments
  for insert to authenticated
  with check (author_profile_id = auth.uid());

-- Author may edit/delete their own; MG may edit/delete any.
create policy comments_author_update on wiki.comments
  for update to authenticated
  using (
    author_profile_id = auth.uid()
    or exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg')
  )
  with check (
    author_profile_id = auth.uid()
    or exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg')
  );

create policy comments_author_delete on wiki.comments
  for delete to authenticated
  using (
    author_profile_id = auth.uid()
    or exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg')
  );
```

> Note on public read of author identity: `profiles` (migration 002) currently
> exposes SELECT only `to authenticated`. Anon read of comments needs the
> author's `display_name` + `color`. Task 11 adds a safe anon read for those
> columns.

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/011_comments.sql
git commit -m "db: migration 011 — wiki.comments + RLS (public read)"
```

### Task 11: Migration 012 — investigation cast + safe anon profile read

**Files:**
- Create: `supabase/migrations/012_investigation_cast.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 012 — which characters belong to an investigation (summary page_key), plus
-- a safe anon read of profile identity columns for rendering public comments.

create table wiki.investigation_cast (
  page_key     text not null,
  character_id uuid not null references wiki.imported_characters(id) on delete cascade,
  primary key (page_key, character_id)
);
grant select on wiki.investigation_cast to anon, authenticated;
grant insert, delete on wiki.investigation_cast to authenticated;

alter table wiki.investigation_cast enable row level security;
create policy cast_public_read on wiki.investigation_cast for select using (true);
create policy cast_mg_write on wiki.investigation_cast for all to authenticated
  using (exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg'))
  with check (exists (select 1 from wiki.profiles p where p.id = auth.uid() and p.role = 'mg'));

-- Anon must read author display_name + colour to render public comments.
-- Migration 002 only granted SELECT to authenticated AND the RLS policy is
-- authenticated-only. Open SELECT to anon at the RLS layer; the table holds no
-- secrets (email lives in auth.users, not here). Also grant to anon.
grant select on wiki.profiles to anon;
create policy profiles_anon_read on wiki.profiles
  for select to anon using (true);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/012_investigation_cast.sql
git commit -m "db: migration 012 — investigation_cast + anon profile read"
```

- [ ] **Step 3: Run all four migrations** via the dashboard SQL editor following
  `docs/RUNBOOKS/supabase-migration.md`. This is a **user/MG action** (needs
  dashboard access). Record completion in the journal. Until run, the store's
  mock fallback (Task 13) keeps the UI working without a backend.

### Task 11b: Migration 013 — close the email-leak in `wiki.profiles`

Security fix flagged by coc-creator review (2026-06-26). Migration 002's trigger
sets `display_name = coalesce(meta.display_name, email)`, and migration 012 opens
anon SELECT on `wiki.profiles`. So any profile whose `display_name` defaulted to
the email would leak that email to anonymous readers via public comments. Harden
the trigger (no email fallback) and sanitize existing rows. The store/UI already
fall back to "Gracz" when `display_name` is null.

> Accounts note: players use **separate Supabase Auth accounts** (MG-provisioned;
> coc-creator is not on Supabase Auth — see the spec's accounts decision). No
> backfill from coc-creator is possible or needed.

**Files:**
- Create: `supabase/migrations/013_profiles_email_hardening.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 013 — never expose emails through the anon-readable wiki.profiles.
-- (a) Recreate the first-login trigger WITHOUT the email fallback: leave
--     display_name NULL when no metadata is supplied. MG sets a real name in
--     /admin (or passes display_name in user metadata at account creation).
create or replace function wiki.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = wiki, public, pg_temp
as $$
begin
  insert into wiki.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

-- (b) Sanitize any existing rows where display_name looks like an email.
update wiki.profiles set display_name = null
where display_name like '%@%.%';
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/013_profiles_email_hardening.sql
git commit -m "db: migration 013 — stop email leaking via anon-read profiles"
```

- [ ] **Step 3:** Run together with 009–012 in the dashboard (MG action). Confirm
  no `display_name` contains an email, then verify anon comment rendering shows
  real names (or "Gracz"), never an address.

---

## Phase 3 — Data layer (store + auth colour)

### Task 12: Load `color` onto the auth profile

**Files:**
- Modify: `src/stores/auth.ts`
- Test: `src/stores/auth.test.ts`

- [ ] **Step 1: Write the failing test** (focused on the pure shape change)

```ts
import { describe, it, expect } from 'vitest'
import { DEFAULT_PLAYER_COLOR } from '@/lib/playerColors'

// The store reads color from the profile row; assert the default fallback const
// exists and is wired (full store behaviour is covered by integration/preview).
describe('auth color default', () => {
  it('exposes a default player colour', () => {
    expect(DEFAULT_PLAYER_COLOR).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
```

- [ ] **Step 2: Extend `AuthState` and `loadProfile` in `src/stores/auth.ts`**

Add `color` to the state type:
```ts
  displayName: string | null
  color: string | null
```
Initialise `color: null` in the store defaults. In `loadProfile`, extend the select and set:
```ts
      const { data } = await supabase
        .from('profiles')
        .select('role, display_name, color')
        .eq('id', user.id)
        .single()
      set({
        user,
        role: (data?.role as Role) ?? 'gracz',
        displayName: (data?.display_name as string | null) ?? user.email ?? null,
        color: (data?.color as string | null) ?? null,
      })
```
And in the signed-out branch set `color: null`.

- [ ] **Step 3: Run the test**

Run: `npm run test:run src/stores/auth.test.ts`
Expected: PASS. Run `npx tsc -b` to confirm no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/stores/auth.ts src/stores/auth.test.ts
git commit -m "feat: load player colour onto auth profile"
```

### Task 13: `comments` store (load/add/edit/delete/reply, mock fallback)

**Files:**
- Create: `src/stores/comments.ts`
- Create: `src/mocks/comments.ts`
- Test: `src/stores/comments.test.ts`

- [ ] **Step 1: Create mock data `src/mocks/comments.ts`**

```ts
import type { Comment } from '@/types'

/** Mock comments for the UG2 page when Supabase credentials are absent. */
export const mockComments: Comment[] = [
  {
    id: 'm1', pageKey: 'streszczenie/ug2',
    anchor: { blockId: '', quote: 'pierwsza strzelanina', prefix: '', suffix: '', startOffset: 0, endOffset: 0 },
    authorProfileId: 'p-nika', authorName: 'Nika', authorColor: '#b5472d',
    speakerCharacterId: 'c-james', speakerName: 'James Kelly', speakerPortraitUrl: null,
    body: 'Nareszcie uczciwa walka. Czekałem na to od Bostonu.',
    parentId: null, createdAt: '2026-06-24T20:00:00Z', edited: false,
  },
  {
    id: 'm2', pageKey: 'streszczenie/ug2',
    anchor: { blockId: '', quote: 'pierwsza strzelanina', prefix: '', suffix: '', startOffset: 0, endOffset: 0 },
    authorProfileId: 'p-piotr', authorName: 'Piotr', authorColor: '#3a6ea5',
    speakerCharacterId: null, speakerName: null, speakerPortraitUrl: null,
    body: 'Kto strzelił pierwszy? Ważne dla tego jak McMiller panikuje.',
    parentId: null, createdAt: '2026-06-24T21:00:00Z', edited: false,
  },
]
```

- [ ] **Step 2: Write the failing test** (mock-mode behaviour, no network)

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCommentsStore } from './comments'

// With no Supabase creds, the store serves/optimistically mutates mock data.
describe('comments store (mock mode)', () => {
  beforeEach(() => useCommentsStore.setState({ comments: [], source: 'mock' }))

  it('loads mock comments for a page key', async () => {
    await useCommentsStore.getState().load('streszczenie/ug2')
    expect(useCommentsStore.getState().comments.length).toBeGreaterThan(0)
    expect(useCommentsStore.getState().source).toBe('mock')
  })

  it('optimistically appends a new comment in mock mode', async () => {
    await useCommentsStore.getState().load('streszczenie/ug2')
    const before = useCommentsStore.getState().comments.length
    await useCommentsStore.getState().add({
      pageKey: 'streszczenie/ug2',
      anchor: { blockId: 'b', quote: 'q', prefix: '', suffix: '', startOffset: 0, endOffset: 1 },
      speakerCharacterId: null, body: 'test', parentId: null,
    })
    expect(useCommentsStore.getState().comments.length).toBe(before + 1)
  })
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm run test:run src/stores/comments.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `src/stores/comments.ts`**

```ts
import { create } from 'zustand'
import type { Comment, CommentAnchor } from '@/types'
import { getSupabase, hasSupabaseCredentials } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { mockComments } from '@/mocks/comments'

export type NewComment = {
  pageKey: string
  anchor: CommentAnchor
  speakerCharacterId: string | null
  body: string
  parentId: string | null
}

type CommentsState = {
  comments: Comment[]
  loading: boolean
  source: 'supabase' | 'mock'
  error: string | null
  load: (pageKey: string) => Promise<void>
  add: (input: NewComment) => Promise<{ error?: string }>
  edit: (id: string, body: string) => Promise<{ error?: string }>
  remove: (id: string) => Promise<{ error?: string }>
}

// Shape returned by the join select below.
const SELECT =
  'id, page_key, anchor, author_profile_id, speaker_character_id, body, parent_id, created_at, edited,' +
  ' author:profiles!comments_author_profile_id_fkey(display_name, color),' +
  ' speaker:imported_characters!comments_speaker_character_id_fkey(name, portrait_url)'

function rowToComment(r: any): Comment {
  return {
    id: String(r.id),
    pageKey: r.page_key,
    anchor: r.anchor as CommentAnchor,
    authorProfileId: r.author_profile_id,
    authorName: r.author?.display_name ?? 'Gracz',
    authorColor: r.author?.color ?? '#3a6ea5',
    speakerCharacterId: r.speaker_character_id ?? null,
    speakerName: r.speaker?.name ?? null,
    speakerPortraitUrl: r.speaker?.portrait_url ?? null,
    body: r.body,
    parentId: r.parent_id ?? null,
    createdAt: r.created_at,
    edited: r.edited,
  }
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  comments: [],
  loading: false,
  source: hasSupabaseCredentials() ? 'supabase' : 'mock',
  error: null,

  load: async (pageKey) => {
    if (!hasSupabaseCredentials()) {
      set({ comments: mockComments.filter((c) => c.pageKey === pageKey), source: 'mock', loading: false })
      return
    }
    set({ loading: true, error: null })
    const { data, error } = await getSupabase()
      .from('comments').select(SELECT).eq('page_key', pageKey)
    if (error) {
      set({ comments: [], source: 'supabase', loading: false, error: error.message })
      return
    }
    set({ comments: (data ?? []).map(rowToComment), source: 'supabase', loading: false })
  },

  add: async (input) => {
    if (!hasSupabaseCredentials()) {
      // Optimistic local append for credential-less dev.
      const c: Comment = {
        id: `local-${get().comments.length + 1}`,
        pageKey: input.pageKey, anchor: input.anchor,
        authorProfileId: 'local', authorName: 'Ty', authorColor: '#3a6ea5',
        speakerCharacterId: input.speakerCharacterId, speakerName: null, speakerPortraitUrl: null,
        body: input.body, parentId: input.parentId,
        createdAt: new Date().toISOString(), edited: false,
      }
      set({ comments: [...get().comments, c] })
      return {}
    }
    const uid = useAuthStore.getState().user?.id
    if (!uid) return { error: 'Musisz być zalogowany.' }
    const { error } = await getSupabase().from('comments').insert({
      page_key: input.pageKey,
      anchor: input.anchor,
      author_profile_id: uid,
      speaker_character_id: input.speakerCharacterId,
      body: input.body,
      parent_id: input.parentId,
    })
    if (error) return { error: error.message }
    await get().load(input.pageKey)
    return {}
  },

  edit: async (id, body) => {
    if (!hasSupabaseCredentials()) {
      set({ comments: get().comments.map((c) => (c.id === id ? { ...c, body, edited: true } : c)) })
      return {}
    }
    const target = get().comments.find((c) => c.id === id)
    const { error } = await getSupabase()
      .from('comments').update({ body, edited: true, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return { error: error.message }
    if (target) await get().load(target.pageKey)
    return {}
  },

  remove: async (id) => {
    if (!hasSupabaseCredentials()) {
      set({ comments: get().comments.filter((c) => c.id !== id) })
      return {}
    }
    const target = get().comments.find((c) => c.id === id)
    const { error } = await getSupabase().from('comments').delete().eq('id', id)
    if (error) return { error: error.message }
    if (target) await get().load(target.pageKey)
    return {}
  },
}))
```

> Note: the `!comments_author_profile_id_fkey` / `!comments_speaker_character_id_fkey`
> hints name the FK constraints PostgREST uses for the embed. Confirm the
> generated constraint names after migration 011 (`\d wiki.comments` in SQL
> editor); adjust the hint strings if Postgres named them differently.

- [ ] **Step 5: Run to verify it passes**

Run: `npm run test:run src/stores/comments.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/stores/comments.ts src/mocks/comments.ts src/stores/comments.test.ts
git commit -m "feat: comments store with mock fallback + optimistic mutations"
```

---

## Phase 4 — UI components

Visual reference: `.superpowers/brainstorm/v3.html`. Skin tokens from `DESIGN_SYSTEM.md`
(teal/parchment/gold; fonts Cinzel/Cormorant/Special Elite via the `font-display`,
`font-body`, `font-mono` Tailwind utilities already used across the app).

### Task 14: `Portrait` component (rect character photo / round self tile)

**Files:**
- Create: `src/components/comments/Portrait.tsx`
- Test: `src/components/comments/Portrait.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Portrait } from './Portrait'

describe('Portrait', () => {
  it('renders a rectangular character photo when a portrait url is given', () => {
    render(<Portrait color="#b5472d" name="James Kelly" portraitUrl="/p.jpg" kind="character" />)
    const img = screen.getByRole('img', { name: /james kelly/i })
    expect(img).toHaveAttribute('src', '/p.jpg')
  })

  it('renders a round initial tile for self (no portrait)', () => {
    render(<Portrait color="#3a6ea5" name="Nika" portraitUrl={null} kind="self" />)
    expect(screen.getByText('NI')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:run src/components/comments/Portrait.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/components/comments/Portrait.tsx`**

```tsx
import { withBase } from '@/lib/withBase'

type Props = {
  color: string
  name: string
  portraitUrl: string | null
  kind: 'character' | 'self'
  size?: number
}

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase()
}

/**
 * Identity portrait. Character = rectangular photo (or monogram fallback) with
 * the player's colour as border. Self = round tile, player-colour border, name
 * initials. Colour always carries player identity; shape says character vs self.
 */
export function Portrait({ color, name, portraitUrl, kind, size = 34 }: Props) {
  const ring = { borderColor: color }
  if (kind === 'character' && portraitUrl) {
    return (
      <img
        src={withBase(portraitUrl)}
        alt={name}
        width={size * 0.82}
        height={size}
        style={ring}
        className="shrink-0 rounded-[3px] border-2 object-cover"
      />
    )
  }
  if (kind === 'character') {
    return (
      <div
        style={ring}
        className="font-display flex shrink-0 items-end justify-center rounded-[3px] border-2 bg-gradient-to-b from-parchment-warm to-teal-dark text-[0.72rem] text-ink"
        css-width={size}
      >
        {initials(name)}
      </div>
    )
  }
  return (
    <div
      style={{ ...ring, width: size, height: size, color }}
      className="font-mono flex shrink-0 items-center justify-center rounded-full border-2 bg-teal-deep text-[0.56rem] uppercase"
      title={name}
    >
      {initials(name)}
    </div>
  )
}
```

> Visual polish (exact sizing, gradient) is iterated against v3 in the preview;
> keep the DOM contract (img with alt for character, initials text for self).

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:run src/components/comments/Portrait.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/comments/Portrait.tsx src/components/comments/Portrait.test.tsx
git commit -m "feat: Portrait — rect character photo / round self tile"
```

### Task 15: `SpeakerPicker` (cast-filtered characters + "Ja")

**Files:**
- Create: `src/components/comments/SpeakerPicker.tsx`
- Test: `src/components/comments/SpeakerPicker.test.tsx`

Pulls the current player's owned characters from `useCharactersStore` (imported
list already loaded) filtered by `investigation_cast` for the page; appends "Ja".

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpeakerPicker } from './SpeakerPicker'

const options = [
  { characterId: 'c1', name: 'James Kelly', portraitUrl: null },
  { characterId: 'c2', name: 'Eleine Howard', portraitUrl: null },
]

describe('SpeakerPicker', () => {
  it('lists characters plus a self option and reports the choice', async () => {
    const onPick = vi.fn()
    render(<SpeakerPicker options={options} selfName="Nika" color="#b5472d" value={null} onPick={onPick} />)
    expect(screen.getByText('James Kelly')).toBeInTheDocument()
    expect(screen.getByText(/Ja/)).toBeInTheDocument()
    await userEvent.click(screen.getByText('James Kelly'))
    expect(onPick).toHaveBeenCalledWith('c1')
  })

  it('reports null when self is chosen', async () => {
    const onPick = vi.fn()
    render(<SpeakerPicker options={options} selfName="Nika" color="#b5472d" value="c1" onPick={onPick} />)
    await userEvent.click(screen.getByText(/Ja/))
    expect(onPick).toHaveBeenCalledWith(null)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:run src/components/comments/SpeakerPicker.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/components/comments/SpeakerPicker.tsx`**

```tsx
import { Portrait } from './Portrait'

export type SpeakerOption = { characterId: string; name: string; portraitUrl: string | null }

type Props = {
  options: SpeakerOption[]
  selfName: string
  color: string
  value: string | null // characterId or null (self)
  onPick: (characterId: string | null) => void
}

/** Pick who speaks: one of the player's investigation characters (IC) or self (OOC). */
export function SpeakerPicker({ options, selfName, color, value, onPick }: Props) {
  const cell = (active: boolean) =>
    [
      'flex flex-col items-center gap-1 rounded-md border p-1.5 cursor-pointer',
      active ? 'border-gold bg-gold/10' : 'border-transparent hover:border-gold-muted',
    ].join(' ')
  return (
    <div className="flex flex-wrap items-end gap-2">
      {options.map((o) => (
        <button key={o.characterId} type="button" className={cell(value === o.characterId)} onClick={() => onPick(o.characterId)}>
          <Portrait color={color} name={o.name} portraitUrl={o.portraitUrl} kind="character" />
          <span className="font-display text-[0.64rem] text-parchment">{o.name}</span>
        </button>
      ))}
      <button type="button" className={cell(value === null)} onClick={() => onPick(null)}>
        <Portrait color={color} name={selfName} portraitUrl={null} kind="self" />
        <span className="font-display text-[0.64rem] text-parchment">Ja ({selfName})</span>
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:run src/components/comments/SpeakerPicker.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/comments/SpeakerPicker.tsx src/components/comments/SpeakerPicker.test.tsx
git commit -m "feat: SpeakerPicker — character/self chooser"
```

### Task 16: `CommentCard` (IC/OOC styling, edit/delete affordances)

**Files:**
- Create: `src/components/comments/CommentCard.tsx`
- Test: `src/components/comments/CommentCard.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CommentCard } from './CommentCard'
import type { Comment } from '@/types'

const ic: Comment = {
  id: '1', pageKey: 'k', anchor: { blockId: 'b', quote: 'q', prefix: '', suffix: '', startOffset: 0, endOffset: 1 },
  authorProfileId: 'p', authorName: 'Nika', authorColor: '#b5472d',
  speakerCharacterId: 'c', speakerName: 'James Kelly', speakerPortraitUrl: null,
  body: 'Nareszcie uczciwa walka.', parentId: null, createdAt: '2026-06-24T20:00:00Z', edited: false,
}

describe('CommentCard', () => {
  it('shows the speaker name and an in-character badge for IC comments', () => {
    render(<CommentCard comment={ic} canModerate={false} />)
    expect(screen.getByText('James Kelly')).toBeInTheDocument()
    expect(screen.getByText(/w roli/i)).toBeInTheDocument()
  })

  it('shows the player name and an out-of-character badge for OOC comments', () => {
    render(<CommentCard comment={{ ...ic, speakerCharacterId: null, speakerName: null }} canModerate={false} />)
    expect(screen.getByText('Nika')).toBeInTheDocument()
    expect(screen.getByText(/poza rol/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:run src/components/comments/CommentCard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/components/comments/CommentCard.tsx`**

```tsx
import type { Comment } from '@/types'
import { commentMode } from '@/types'
import { Portrait } from './Portrait'

type Props = {
  comment: Comment
  canModerate: boolean
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

/** One comment. IC = character portrait + italic parchment body; OOC = self tile + monospace body. */
export function CommentCard({ comment: c, canModerate, onEdit, onDelete }: Props) {
  const ic = commentMode(c) === 'ic'
  const who = ic ? c.speakerName ?? 'Postać' : c.authorName
  return (
    <div className="rounded-md border border-gold-muted bg-teal-deep p-2.5">
      <div className="mb-1.5 flex items-center gap-2">
        <Portrait
          color={c.authorColor}
          name={who}
          portraitUrl={ic ? c.speakerPortraitUrl : null}
          kind={ic ? 'character' : 'self'}
          size={28}
        />
        <span className="font-display text-[0.78rem] leading-tight text-parchment">
          {who}
          <span className="block text-[0.56rem] uppercase tracking-wide text-patina">
            {ic ? `${c.authorName} · w roli` : 'poza rolą'}
          </span>
        </span>
        {canModerate && (
          <span className="ml-auto flex gap-2">
            <button type="button" className="font-display text-[0.6rem] uppercase text-patina hover:text-gold" onClick={() => onEdit?.(c.id)}>Edytuj</button>
            <button type="button" className="font-display text-[0.6rem] uppercase text-patina hover:text-gold-dark" onClick={() => onDelete?.(c.id)}>Usuń</button>
          </span>
        )}
      </div>
      <p className={ic ? 'font-body italic text-parchment text-[0.98rem] leading-snug' : 'font-mono text-[0.8rem] leading-relaxed text-parchment/90'}>
        {c.body}{c.edited && <span className="ml-1 text-[0.6rem] text-patina">(edyt.)</span>}
      </p>
    </div>
  )
}
```

> If `text-patina` isn't a defined token, use `text-parchment/60`. Verify against
> `DESIGN_SYSTEM.md` during implementation and align class names.

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:run src/components/comments/CommentCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/comments/CommentCard.tsx src/components/comments/CommentCard.test.tsx
git commit -m "feat: CommentCard — IC/OOC comment rendering"
```

### Task 17: `CommentRail` (grouped collapsible threads)

**Files:**
- Create: `src/components/comments/CommentRail.tsx`
- Test: `src/components/comments/CommentRail.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CommentRail } from './CommentRail'
import type { Comment } from '@/types'

const base = (over: Partial<Comment>): Comment => ({
  id: 'x', pageKey: 'k', anchor: { blockId: 'b1', quote: 'pierwsza strzelanina', prefix: '', suffix: '', startOffset: 0, endOffset: 1 },
  authorProfileId: 'p', authorName: 'A', authorColor: '#b5472d',
  speakerCharacterId: 'c', speakerName: 'James', speakerPortraitUrl: null,
  body: 'b', parentId: null, createdAt: '2026-01-01T00:00:00Z', edited: false, ...over,
})

describe('CommentRail', () => {
  it('groups two comments on the same anchor into one thread card', () => {
    const comments = [
      base({ id: '1', createdAt: '2026-01-01T00:00:00Z' }),
      base({ id: '2', createdAt: '2026-01-02T00:00:00Z' }),
    ]
    render(<CommentRail comments={comments} activeThreadId={null} canModerate={false} onFocusAnchor={() => {}} />)
    // Quote shown once as the thread header.
    expect(screen.getAllByText(/pierwsza strzelanina/).length).toBe(1)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:run src/components/comments/CommentRail.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/components/comments/CommentRail.tsx`**

```tsx
import { useState } from 'react'
import type { Comment } from '@/types'
import { groupThreads } from '@/lib/comments/group'
import { CommentCard } from './CommentCard'

type Props = {
  comments: Comment[]
  activeThreadId: string | null
  canModerate: boolean
  onFocusAnchor: (anchorBlockId: string, rootId: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

/** Right rail: one collapsible card per anchor-thread (root + replies). */
export function CommentRail({ comments, activeThreadId, canModerate, onFocusAnchor, onEdit, onDelete }: Props) {
  const threads = groupThreads(comments)
  return (
    <div className="rail space-y-3">
      <div className="font-display flex justify-between text-[0.68rem] uppercase tracking-widest text-gold">
        <span>Komentarze</span><span className="text-parchment/60">{comments.length}</span>
      </div>
      {threads.map((t) => (
        <ThreadCard
          key={t.root.id}
          thread={t}
          active={activeThreadId === t.root.id}
          canModerate={canModerate}
          onFocus={() => onFocusAnchor(t.anchor.blockId, t.root.id)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

function ThreadCard({ thread, active, canModerate, onFocus, onEdit, onDelete }: {
  thread: ReturnType<typeof groupThreads>[number]
  active: boolean
  canModerate: boolean
  onFocus: () => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const replies = thread.replies
  return (
    <div className={['rounded-md border p-2', active ? 'border-gold shadow' : 'border-gold-muted'].join(' ')}>
      <button type="button" onClick={onFocus} className="mb-2 block w-full text-left font-body italic text-[0.86rem] text-gold/90 border-l-2 border-gold-muted pl-2">
        „{thread.anchor.quote}"
      </button>
      <CommentCard comment={thread.root} canModerate={canModerate} onEdit={onEdit} onDelete={onDelete} />
      {replies.length > 0 && !open && (
        <button type="button" className="mt-2 w-full text-center font-display text-[0.6rem] uppercase tracking-wide text-parchment/60" onClick={() => setOpen(true)}>
          ↓ pokaż {replies.length} {replies.length === 1 ? 'odpowiedź' : 'odpowiedzi'}
        </button>
      )}
      {open && (
        <div className="mt-2 space-y-2 border-t border-dashed border-gold-muted/40 pt-2">
          {replies.map((r) => <CommentCard key={r.id} comment={r} canModerate={canModerate} onEdit={onEdit} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:run src/components/comments/CommentRail.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/comments/CommentRail.tsx src/components/comments/CommentRail.test.tsx
git commit -m "feat: CommentRail — grouped collapsible threads"
```

### Task 18: `ComposeBubble` (selection → speaker + body → save)

**Files:**
- Create: `src/components/comments/ComposeBubble.tsx`
- Test: `src/components/comments/ComposeBubble.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComposeBubble } from './ComposeBubble'

describe('ComposeBubble', () => {
  it('submits body + selected speaker', async () => {
    const onSubmit = vi.fn().mockResolvedValue({})
    render(
      <ComposeBubble
        quote="pierwsza strzelanina"
        speakerOptions={[{ characterId: 'c1', name: 'James', portraitUrl: null }]}
        selfName="Nika" color="#b5472d"
        onSubmit={onSubmit} onCancel={() => {}}
      />,
    )
    await userEvent.click(screen.getByText('James'))
    await userEvent.type(screen.getByRole('textbox'), 'Nareszcie.')
    await userEvent.click(screen.getByRole('button', { name: /dodaj/i }))
    expect(onSubmit).toHaveBeenCalledWith({ speakerCharacterId: 'c1', body: 'Nareszcie.' })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:run src/components/comments/ComposeBubble.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/components/comments/ComposeBubble.tsx`**

```tsx
import { useState } from 'react'
import { SpeakerPicker, type SpeakerOption } from './SpeakerPicker'

type Props = {
  quote: string
  speakerOptions: SpeakerOption[]
  selfName: string
  color: string
  onSubmit: (input: { speakerCharacterId: string | null; body: string }) => Promise<{ error?: string }>
  onCancel: () => void
}

/** Compose popover shown after a text selection. */
export function ComposeBubble({ quote, speakerOptions, selfName, color, onSubmit, onCancel }: Props) {
  const [speaker, setSpeaker] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    if (!body.trim()) return
    setBusy(true); setErr(null)
    const { error } = await onSubmit({ speakerCharacterId: speaker, body: body.trim() })
    setBusy(false)
    if (error) setErr(error)
  }

  return (
    <div className="rounded-lg border border-gold bg-teal-dark p-3 shadow-xl">
      <p className="mb-2 font-body italic text-[0.85rem] text-gold/80 border-l-2 border-gold-muted pl-2">„{quote}"</p>
      <SpeakerPicker options={speakerOptions} selfName={selfName} color={color} value={speaker} onPick={setSpeaker} />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder={speaker ? 'Napisz w roli postaci…' : 'Notka od Ciebie…'}
        className="font-body mt-2 w-full rounded border border-gold-muted bg-parchment px-2 py-1.5 text-ink outline-none focus:border-gold"
      />
      {err && <p className="mt-1 font-mono text-xs text-gold-dark">{err}</p>}
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="font-display text-[0.62rem] uppercase tracking-wide text-parchment/70 hover:text-parchment">Anuluj</button>
        <button type="button" disabled={busy || !body.trim()} onClick={submit} className="font-display rounded border border-gold bg-teal-deep px-3 py-1 text-[0.62rem] uppercase tracking-wide text-gold hover:bg-gold hover:text-teal-deep disabled:opacity-50">
          {busy ? 'Zapis…' : 'Dodaj'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:run src/components/comments/ComposeBubble.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/comments/ComposeBubble.tsx src/components/comments/ComposeBubble.test.tsx
git commit -m "feat: ComposeBubble — selection compose popover"
```

### Task 19: `useHighlights` — CSS Custom Highlight API binding

**Files:**
- Create: `src/components/comments/useHighlights.ts`
- Test: `src/components/comments/useHighlights.test.ts`

Highlights are painted via the CSS Custom Highlight API (no DOM mutation, React-safe).
One registered highlight per author colour + one "active" highlight. The hook
resolves anchors to ranges and registers them; it no-ops where the API is absent
(jsdom, old browsers) so the page still works (rail-only interaction).

- [ ] **Step 1: Write the failing test** (guards the graceful no-op + colour grouping)

```ts
import { describe, it, expect } from 'vitest'
import { buildHighlightGroups } from './useHighlights'
import type { Comment } from '@/types'

const c = (id: string, color: string): Comment => ({
  id, pageKey: 'k', anchor: { blockId: 'b', quote: 'q', prefix: '', suffix: '', startOffset: 0, endOffset: 1 },
  authorProfileId: 'p', authorName: 'A', authorColor: color,
  speakerCharacterId: null, speakerName: null, speakerPortraitUrl: null,
  body: '', parentId: null, createdAt: '2026-01-01T00:00:00Z', edited: false,
})

describe('buildHighlightGroups', () => {
  it('groups root comments by author colour, dropping replies', () => {
    const groups = buildHighlightGroups([
      c('1', '#b5472d'),
      { ...c('2', '#3a6ea5'), parentId: '1' },
      c('3', '#b5472d'),
    ])
    expect(groups.get('#b5472d')?.length).toBe(2)
    expect(groups.has('#3a6ea5')).toBe(false) // reply excluded
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:run src/components/comments/useHighlights.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/components/comments/useHighlights.ts`**

```ts
import { useEffect } from 'react'
import type { Comment } from '@/types'
import { resolveAnchor } from '@/lib/comments/anchor'

/** Group top-level comments by author colour (for one highlight registry each). */
export function buildHighlightGroups(comments: Comment[]): Map<string, Comment[]> {
  const groups = new Map<string, Comment[]>()
  for (const c of comments) {
    if (c.parentId) continue
    const arr = groups.get(c.authorColor) ?? []
    arr.push(c)
    groups.set(c.authorColor, arr)
  }
  return groups
}

const supported = () => typeof CSS !== 'undefined' && 'highlights' in CSS

/**
 * Paint fragment highlights via the CSS Custom Highlight API. Registers one
 * Highlight per author colour ("ak-comment-<hex>") plus "ak-comment-active".
 * The matching ::highlight() rules live in index.css (Task 20). No-ops where
 * the API is unavailable; the rail still works.
 */
export function useHighlights(
  container: HTMLElement | null,
  comments: Comment[],
  activeBlockId: string | null,
) {
  useEffect(() => {
    if (!container || !supported()) return
    const highlights = (CSS as unknown as { highlights: Map<string, unknown> }).highlights
    const registered: string[] = []

    const groups = buildHighlightGroups(comments)
    for (const [color, list] of groups) {
      const ranges: Range[] = []
      for (const c of list) {
        const r = resolveAnchor(c.anchor, container)
        if (r) ranges.push(r)
      }
      if (ranges.length) {
        const name = `ak-comment-${color.replace('#', '')}`
        // @ts-expect-error Highlight is a browser global not in TS lib yet
        highlights.set(name, new Highlight(...ranges))
        registered.push(name)
        document.documentElement.style.setProperty(`--hl-${color.replace('#', '')}`, color)
      }
    }
    // Active fragment overlay.
    if (activeBlockId) {
      const active = comments.find((c) => !c.parentId && c.anchor.blockId === activeBlockId)
      const r = active && resolveAnchor(active.anchor, container)
      if (r) {
        // @ts-expect-error Highlight global
        highlights.set('ak-comment-active', new Highlight(r))
        registered.push('ak-comment-active')
      }
    }
    return () => {
      for (const name of registered) highlights.delete(name)
    }
  }, [container, comments, activeBlockId])
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:run src/components/comments/useHighlights.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/comments/useHighlights.ts src/components/comments/useHighlights.test.ts
git commit -m "feat: useHighlights — CSS Custom Highlight API binding"
```

### Task 20: Highlight CSS

**Files:**
- Modify: `src/index.css` (or the global stylesheet where `@theme` lives — confirm path)

- [ ] **Step 1:** Locate the global CSS that defines the Tailwind v4 `@theme`
  (search: `grep -rl "@theme" src`). Append:

```css
/* Player margin-comment fragment highlights (CSS Custom Highlight API). */
::highlight(ak-comment-active) {
  background-color: color-mix(in srgb, var(--color-gold) 30%, transparent);
  text-decoration: underline 2px var(--color-gold);
}
/* Per-author tints fall back to a generic gold underline; a small set of
   common player colours get explicit rules. Author colour is also exposed via
   --hl-<hex> for any future per-colour pseudo. */
[class] ::highlight(ak-comment-default) {
  background-color: color-mix(in srgb, var(--color-gold) 14%, transparent);
}
```

> Per-author-colour `::highlight()` pseudos cannot read a CSS variable for their
> own name, so v1 paints all author highlights with one subtle tint and reserves
> the strong tint for the active fragment. The author's colour still shows on the
> rail card and portrait. Per-colour fragment tint is a polish follow-up (would
> register a fixed pseudo per palette colour). Document this in the journal.

- [ ] **Step 2:** Manual verify in preview (Task 22). Commit:

```bash
git add src/index.css
git commit -m "style: ::highlight rules for comment fragments"
```

### Task 21: `AnnotatableArticle` — the wrapper that ties it together

**Files:**
- Create: `src/components/comments/AnnotatableArticle.tsx`
- Test: `src/components/comments/AnnotatableArticle.test.tsx`

Responsibilities: render `Markdown` in a ref'd container; load comments for
`pageKey`; on `mouseup` capture the selection → nearest `[data-block-id]` →
`createAnchor` → show `ComposeBubble`; render `CommentRail`; bind `useHighlights`;
gate compose behind login (`useAuthStore`). Speaker options come from
`useCharactersStore` filtered by cast (passed in for testability).

- [ ] **Step 1: Write the failing test** (render + rail, no selection geometry)

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnnotatableArticle } from './AnnotatableArticle'
import { useCommentsStore } from '@/stores/comments'

describe('AnnotatableArticle', () => {
  beforeEach(() => useCommentsStore.setState({ comments: [], source: 'mock' }))

  it('renders the markdown content and the comment rail', async () => {
    render(<AnnotatableArticle pageKey="streszczenie/ug2">{'# Tytuł\n\nAkapit z treścią.'}</AnnotatableArticle>)
    expect(await screen.findByRole('heading', { name: 'Tytuł' })).toBeInTheDocument()
    expect(screen.getByText(/Komentarze/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:run src/components/comments/AnnotatableArticle.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/components/comments/AnnotatableArticle.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { Markdown } from '@/components/Markdown'
import { CommentRail } from './CommentRail'
import { ComposeBubble } from './ComposeBubble'
import { useHighlights } from './useHighlights'
import { createAnchor } from '@/lib/comments/anchor'
import type { CommentAnchor } from '@/types'
import { useCommentsStore } from '@/stores/comments'
import { useAuthStore } from '@/stores/auth'
import { DEFAULT_PLAYER_COLOR } from '@/lib/playerColors'
import type { SpeakerOption } from './SpeakerPicker'

type Props = {
  pageKey: string
  children: string
  /** Speaker options for the current player on this investigation (cast-filtered). */
  speakerOptions?: SpeakerOption[]
}

export function AnnotatableArticle({ pageKey, children, speakerOptions = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pending, setPending] = useState<{ anchor: CommentAnchor; quote: string } | null>(null)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)

  const comments = useCommentsStore((s) => s.comments)
  const load = useCommentsStore((s) => s.load)
  const add = useCommentsStore((s) => s.add)
  const user = useAuthStore((s) => s.user)
  const displayName = useAuthStore((s) => s.displayName)
  const color = useAuthStore((s) => s.color) ?? DEFAULT_PLAYER_COLOR
  const role = useAuthStore((s) => s.role)

  useEffect(() => { void load(pageKey) }, [pageKey, load])
  useHighlights(containerRef.current, comments, activeBlockId)

  const onMouseUp = () => {
    if (!user) return // only logged-in players can comment
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !containerRef.current) return
    const range = sel.getRangeAt(0)
    let block = range.startContainer.parentElement?.closest('[data-block-id]') as HTMLElement | null
    if (!block || !containerRef.current.contains(block)) return
    const anchor = createAnchor(range, block)
    if (anchor && anchor.quote.trim()) setPending({ anchor, quote: anchor.quote })
  }

  const focusAnchor = (blockId: string) => {
    setActiveBlockId(blockId)
    const el = containerRef.current?.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(blockId)}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div ref={containerRef} onMouseUp={onMouseUp} className="min-w-0 flex-1">
        <Markdown>{children}</Markdown>
        {pending && (
          <div className="sticky bottom-4 z-20 mx-auto max-w-xl">
            <ComposeBubble
              quote={pending.quote}
              speakerOptions={speakerOptions}
              selfName={displayName ?? 'Ja'}
              color={color}
              onSubmit={async ({ speakerCharacterId, body }) => {
                const res = await add({ pageKey, anchor: pending.anchor, speakerCharacterId, body, parentId: null })
                if (!res.error) { setPending(null); window.getSelection()?.removeAllRanges() }
                return res
              }}
              onCancel={() => setPending(null)}
            />
          </div>
        )}
      </div>
      <aside className="w-full shrink-0 lg:w-[330px]">
        <CommentRail
          comments={comments}
          activeThreadId={null}
          canModerate={role === 'mg'}
          onFocusAnchor={(blockId) => focusAnchor(blockId)}
        />
      </aside>
    </div>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:run src/components/comments/AnnotatableArticle.test.tsx`
Expected: PASS. Run `npx tsc -b` to confirm types across the new modules.

- [ ] **Step 5: Commit**

```bash
git add src/components/comments/AnnotatableArticle.tsx src/components/comments/AnnotatableArticle.test.tsx
git commit -m "feat: AnnotatableArticle — selection→compose + rail + highlights"
```

---

## Phase 5 — Wire-in (page + admin)

### Task 22: Mount on the UG2 summary page + preview-verify

**Files:**
- Modify: `src/routes/UG2Summary.tsx`

- [ ] **Step 1:** Replace the bare `<Markdown>` render with the wrapper, using a
  deliberate stable `pageKey`. For v1 pass `speakerOptions` derived from
  `useCharactersStore` filtered by the current player + cast (see Task 23); until
  cast/owner data exists, pass `[]` (compose still works, only "Ja" available).

```tsx
import { AnnotatableArticle } from '@/components/comments/AnnotatableArticle'

export function UG2Summary() {
  return (
    <article>
      <AnnotatableArticle pageKey="streszczenie/ug2">{SUMMARY}</AnnotatableArticle>
    </article>
  )
}
```

- [ ] **Step 2: Preview-verify the full flow** (this is where geometry/DOM is real)

Use the project preview workflow:
1. Start dev server, open `/streszczenie-ug2`.
2. With no `.env` creds, the mock comments render in the rail; confirm grouping
   (two mock comments → one thread on the same quote), IC vs OOC styling, the
   collapsible "pokaż odpowiedzi".
3. Confirm `data-block-id` attributes exist on paragraphs (inspect DOM).
4. (If logged in against a real Supabase) select text → compose bubble appears →
   pick speaker → type → Dodaj → comment lands in the rail; reload persists it.
5. Confirm highlights paint on supporting browsers; confirm the page still works
   where the Highlight API is absent (rail-only).

Capture a screenshot for the user.

- [ ] **Step 3: Commit**

```bash
git add src/routes/UG2Summary.tsx
git commit -m "feat: enable margin-comments on the UG2 summary page"
```

### Task 23: Admin — assign character owner + investigation cast

**Files:**
- Modify: `src/routes/AdminImport.tsx`
- Create: `src/stores/cast.ts` (cast + owner mutations) — optional split if AdminImport grows large
- Test: `src/stores/cast.test.ts`

- [ ] **Step 1: Write the failing test** for the cast/owner helpers (mock mode)

```ts
import { describe, it, expect } from 'vitest'
import { speakerOptionsFor } from '@/lib/comments/speakerOptions'

describe('speakerOptionsFor', () => {
  it('returns owned characters in the cast, else all owned when no cast defined', () => {
    const owned = [
      { id: 'c1', name: 'James', portrait_url: null },
      { id: 'c2', name: 'Eleine', portrait_url: null },
    ]
    expect(speakerOptionsFor(owned, ['c1']).map((o) => o.characterId)).toEqual(['c1'])
    expect(speakerOptionsFor(owned, []).map((o) => o.characterId)).toEqual(['c1', 'c2'])
  })
})
```

- [ ] **Step 2: Implement `src/lib/comments/speakerOptions.ts`**

```ts
import type { SpeakerOption } from '@/components/comments/SpeakerPicker'

type OwnedCharacter = { id: string; name: string; portrait_url: string | null }

/**
 * Speaker options for a player on a page: owned characters that are in the
 * investigation cast; if the page has no cast rows, fall back to all owned.
 */
export function speakerOptionsFor(owned: OwnedCharacter[], castIds: string[]): SpeakerOption[] {
  const inCast = castIds.length ? owned.filter((c) => castIds.includes(c.id)) : owned
  return inCast.map((c) => ({ characterId: c.id, name: c.name, portraitUrl: c.portrait_url }))
}
```

- [ ] **Step 3: Run the test**

Run: `npm run test:run src/stores/cast.test.ts`
Expected: PASS.

- [ ] **Step 4: Extend `AdminImport.tsx`** — for each imported character add:
  - an **owner** select (dropdown of `wiki.profiles` players) writing `owner_profile_id`
    via `getSupabase().from('imported_characters').update({ owner_profile_id }).eq('id', id)`;
  - a **cast** multi-select per page_key (text input of known page keys, start with
    `streszczenie/ug2`) writing/deleting `wiki.investigation_cast` rows.
  Follow the existing AdminImport patterns (player-name inputs, select/import/remove).
  Gate the whole panel behind `role === 'mg'` (already the case for `/admin/*`).

- [ ] **Step 5:** Wire `UG2Summary` to compute `speakerOptions` from the logged-in
  player's owned characters (via `useCharactersStore`) and the page cast, using
  `speakerOptionsFor`. Pass into `AnnotatableArticle`.

- [ ] **Step 6: Preview-verify** owner assignment + that a player sees only their
  cast characters + "Ja" in the compose picker.

- [ ] **Step 7: Commit**

```bash
git add src/routes/AdminImport.tsx src/lib/comments/speakerOptions.ts src/stores/cast.test.ts
git commit -m "feat: admin owner/cast assignment + cast-filtered speaker options"
```

---

## Phase 6 — Docs

### Task 24: Update project docs + reverse the exclusion

**Files:**
- Modify: `docs/AktaKasandry_obsidian/DOCS_CHANGES_JOURNAL.md`
- Modify: `docs/AktaKasandry_obsidian/TASK_LIST.md`
- Modify: `docs/AktaKasandry_obsidian/memories/project.md`
- Modify: `docs/AktaKasandry_obsidian/SUPABASE_AND_SYNC.md`

- [ ] **Step 1:** Journal entry: feature shipped, migrations 009–012, coordination check outcome, the two documented v1 simplifications (per-author fragment tint deferred; inline dot markers deferred).
- [ ] **Step 2:** `TASK_LIST.md`: add a "Stage L — Player comments" block with what's DONE and the deferred polish items; remove "Per-page comments" from the page's Out-of-scope list (now scoped-in for summaries).
- [ ] **Step 3:** `memories/project.md`: update the "Out of scope" list (qualify the per-page-comments exclusion), and add `wiki.comments` + `investigation_cast` to the schema list.
- [ ] **Step 4:** `SUPABASE_AND_SYNC.md`: document the new tables, columns, and RLS.
- [ ] **Step 5: Commit**

```bash
git add docs/AktaKasandry_obsidian
git commit -m "docs: record player-comments feature + schema + reversed exclusion"
```

---

## Self-Review (completed during planning)

**Spec coverage:** Data model → Tasks 8–11; anchoring → Tasks 2–4; block ids → Task 6;
colours → Task 1; store → Task 13; auth colour → Task 12; components (Portrait/picker/
card/rail/compose/wrapper) → Tasks 14–21; highlights → Tasks 19–20; page wire-in → Task 22;
admin owner/cast → Task 23; RLS public read → Tasks 10–11; MG-provisioned accounts → no
signup UI (Task 23 assigns role/owner; account creation stays in dashboard); docs/exclusion
reversal → Task 24. Deferred-and-documented: realtime, per-author fragment tint, inline
dot markers, multi-level replies.

**Placeholder scan:** No "TBD/TODO/handle edge cases" left; every code step has full code.
Three explicit "verify against the codebase" notes (PostgREST FK hint names, `text-patina`
token, `remark`/`unist` resolution) are real verification steps, not placeholders.

**Type consistency:** `CommentAnchor`, `Comment`, `CommentThread`, `CommentMode`,
`commentMode()`, `SpeakerOption`, `NewComment` are defined once and reused; store `add`
signature matches `AnnotatableArticle`'s call; `createAnchor`/`resolveAnchor`/`shortHash`/
`normalizeText` names are consistent across anchor, remark plugin, and highlights.

## Open items to confirm during execution (from the spec)

- Final 16-colour hex set (seeded; tune contrast on teal + parchment in preview).
- PostgREST embedded-resource FK hint names after migration 011.
- Global CSS file path for `::highlight` rules and exact skin tokens (`text-patina`).
- Touch / overlapping-selection UX (desktop-priority; rail remains the fallback).
