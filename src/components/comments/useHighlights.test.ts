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
