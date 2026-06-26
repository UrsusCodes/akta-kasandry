import { describe, it, expect } from 'vitest'
import { DEFAULT_PLAYER_COLOR } from '@/lib/playerColors'

// The store reads color from the profile row; assert the default fallback const
// exists and is wired (full store behaviour is covered by integration/preview).
describe('auth color default', () => {
  it('exposes a default player colour', () => {
    expect(DEFAULT_PLAYER_COLOR).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
