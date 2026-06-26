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
