import { describe, it, expect } from 'vitest'
import { stackComments } from './stack'

describe('stackComments', () => {
  it('keeps items at their desired top when they do not overlap', () => {
    const placed = stackComments([
      { key: 'a', desiredTop: 0, height: 50 },
      { key: 'c', desiredTop: 200, height: 50 },
    ], 10)
    expect(placed).toEqual([{ key: 'a', top: 0 }, { key: 'c', top: 200 }])
  })

  it('pushes a colliding item down by gap below the previous card', () => {
    const placed = stackComments([
      { key: 'a', desiredTop: 0, height: 50 },
      { key: 'b', desiredTop: 30, height: 40 },
    ], 10)
    // a at 0 (h50) → bottom 50; b desired 30 collides → max(30, 50+10)=60
    expect(placed).toEqual([{ key: 'a', top: 0 }, { key: 'b', top: 60 }])
  })

  it('never moves an item above its desired top', () => {
    const placed = stackComments([
      { key: 'a', desiredTop: 0, height: 10 },
      { key: 'b', desiredTop: 500, height: 10 },
    ], 8)
    expect(placed[1].top).toBe(500)
  })
})
