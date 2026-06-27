import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsDesktop } from './useIsDesktop'

describe('useIsDesktop', () => {
  it('returns false when matchMedia is unavailable (jsdom)', () => {
    const original = (window as any).matchMedia
    delete (window as Partial<Window & typeof globalThis>).matchMedia
    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(false)
    if (original) (window as any).matchMedia = original
  })
})
