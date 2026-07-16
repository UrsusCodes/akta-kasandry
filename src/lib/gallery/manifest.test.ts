import { describe, it, expect } from 'vitest'
import { parseGalleryManifest } from './manifest'

describe('parseGalleryManifest', () => {
  it('parses a valid full manifest and preserves all arrays', () => {
    const raw = {
      caseKey: 'ug2',
      title: 'Urodzaj Grozy — galeria',
      scenes: [{ src: '/img/ug2/speakeasy.jpg', caption: 'Speakeasy', alt: 'Speakeasy' }],
      cast: [{ src: '/img/ug2/cast/mort.jpg', character: 'Mortimer', player: 'Jakub' }],
      tracks: [{ src: '/audio/ug2/crossfire.mp3', title: 'Crossfire' }],
      links: [{ label: 'Streszczenie', to: '/p/sprawy/02-urodzaj-grozy/01-streszczenie' }],
    }
    const parsed = parseGalleryManifest(raw)
    expect(parsed.caseKey).toBe('ug2')
    expect(parsed.title).toBe('Urodzaj Grozy — galeria')
    expect(parsed.scenes).toHaveLength(1)
    expect(parsed.cast).toHaveLength(1)
    expect(parsed.tracks).toHaveLength(1)
    expect(parsed.links).toHaveLength(1)
  })

  it('parses a minimal manifest with defaulted empty arrays', () => {
    const parsed = parseGalleryManifest({ caseKey: 'ug2', title: 'Galeria' })
    expect(parsed.scenes).toEqual([])
    expect(parsed.cast).toEqual([])
    expect(parsed.tracks).toEqual([])
    expect(parsed.links).toEqual([])
    expect(parsed.caseName).toBeUndefined()
  })

  it('preserves caseName when present', () => {
    const parsed = parseGalleryManifest({
      caseKey: 'ug2',
      title: 'Urodzaj Grozy — galeria',
      caseName: 'Urodzaj Grozy',
    })
    expect(parsed.caseName).toBe('Urodzaj Grozy')
  })

  it('throws when title is missing', () => {
    expect(() => parseGalleryManifest({ caseKey: 'ug2' })).toThrow()
  })

  it('throws when a scene is missing src', () => {
    const raw = {
      caseKey: 'ug2',
      title: 'Galeria',
      scenes: [{ caption: 'no src here' }],
    }
    expect(() => parseGalleryManifest(raw)).toThrow()
  })
})
