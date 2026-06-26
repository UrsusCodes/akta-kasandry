import { describe, it, expect } from 'vitest'
import { speakerOptionsFor } from './speakerOptions'

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
