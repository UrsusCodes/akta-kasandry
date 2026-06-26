export type StackItem = { key: string; desiredTop: number; height: number }
export type Placed = { key: string; top: number }

/**
 * Place comment cards along the Y axis. Each card wants to sit at its anchor's
 * `desiredTop`; if it would overlap the previous card it is pushed down to
 * `prevBottom + gap`. Input MUST be ordered by desiredTop (document order);
 * output preserves that order. Pure — geometry is read by the caller.
 */
export function stackComments(items: StackItem[], gap = 12): Placed[] {
  const out: Placed[] = []
  let prevBottom = -Infinity
  for (const it of items) {
    const top = Math.max(it.desiredTop, prevBottom + gap)
    out.push({ key: it.key, top })
    prevBottom = top + it.height
  }
  return out
}
