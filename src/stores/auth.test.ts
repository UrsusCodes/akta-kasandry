import { describe, it, expect } from 'vitest'
import { DEFAULT_PLAYER_COLOR } from '@/lib/playerColors'
import { loginToEmail } from './auth'

// The store reads color from the profile row; assert the default fallback const
// exists and is wired (full store behaviour is covered by integration/preview).
describe('auth color default', () => {
  it('exposes a default player colour', () => {
    expect(DEFAULT_PLAYER_COLOR).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

describe('loginToEmail', () => {
  it('maps a bare username to the synthetic Supabase email (lowercased)', () => {
    expect(loginToEmail('Nika')).toBe('nika@kasandra.local')
    expect(loginToEmail('PiotrS')).toBe('piotrs@kasandra.local')
    expect(loginToEmail('  RafalG  ')).toBe('rafalg@kasandra.local')
  })
  it('passes through a value that already looks like an email (lowercased)', () => {
    expect(loginToEmail('admin@kasandra.local')).toBe('admin@kasandra.local')
  })
})
