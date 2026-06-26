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
