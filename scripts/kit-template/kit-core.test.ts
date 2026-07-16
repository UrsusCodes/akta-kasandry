/**
 * Vitest suite for `kit-core.js` (K1). Loaded by side-effect import (the
 * file is a classic-script IIFE, not an ES module — see its header comment)
 * and exercised through `globalThis.KitCore`, exactly as `edytor.html` will
 * use it once injected by `scripts/build-presentation-kit.ts`.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import './kit-core.js'

type AssetRef = { kind: 'library'; id: string } | { kind: 'custom'; dataUrl: string }

type EditorSlide = {
  id: string
  template: 'tytulowy' | 'przerywnik' | 'obraz' | 'cytat' | 'final'
  actId: string | null
  title: string
  text: string
  image: AssetRef | null
  portrait: AssetRef | null
  portraitName: string
  kb: 'in' | 'out' | 'left' | 'right' | null
  night: boolean
  fx: null | 'flash' | 'pulse'
  dur: number
}

type Draft = {
  version: number
  slug: string
  theme: string
  acts: { id: string; name: string; track: string | null }[]
  slides: EditorSlide[]
  updatedAt: string
}

type KitCoreApi = {
  newDraft: (slug: string) => Draft
  validateDraft: (obj: unknown) => { ok: boolean; errors: string[] }
  escapeHtml: (s: unknown) => string
  draftToEngineData: (
    draft: Draft,
    resolveImage: (ref: AssetRef) => string,
  ) => { slides: Record<string, unknown>[]; tracks: Record<string, string> }
  serializeSlidesJs: (
    engineData: { slides: unknown[]; tracks: Record<string, string> },
    trackData?: Record<string, string>,
  ) => string
  collectImageRefs: (draft: Draft) => AssetRef[]
  draftByteSize: (draft: Draft) => number
}

const KitCore = (globalThis as unknown as { KitCore: KitCoreApi }).KitCore

function mkSlide(over: Partial<EditorSlide>): EditorSlide {
  return {
    id: 'sl-1',
    template: 'obraz',
    actId: null,
    title: '',
    text: '',
    image: null,
    portrait: null,
    portraitName: '',
    kb: null,
    night: false,
    fx: null,
    dur: 6500,
    ...over,
  }
}

function resolveImageStub(ref: AssetRef): string {
  if (ref.kind === 'library') return 'data:image/jpeg;base64,LIB-' + ref.id
  return ref.dataUrl
}

describe('KitCore.newDraft / validateDraft', () => {
  it('newDraft produces a valid draft', () => {
    const draft = KitCore.newDraft('ug2')
    expect(draft.slug).toBe('ug2')
    expect(draft.version).toBe(1)
    const result = KitCore.validateDraft(draft)
    expect(result.ok).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('rejects a bad version with a specific error', () => {
    const draft = { ...KitCore.newDraft('ug2'), version: 2 }
    const result = KitCore.validateDraft(draft)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('version'))).toBe(true)
  })

  it('rejects an unknown template', () => {
    const draft = KitCore.newDraft('ug2')
    draft.slides.push(mkSlide({ template: 'nope' as unknown as EditorSlide['template'] }))
    const result = KitCore.validateDraft(draft)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('template'))).toBe(true)
  })

  it('rejects a dangling actId', () => {
    const draft = KitCore.newDraft('ug2')
    draft.slides.push(mkSlide({ actId: 'missing-act' }))
    const result = KitCore.validateDraft(draft)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('actId'))).toBe(true)
  })

  it('accepts a draft with a valid actId reference', () => {
    const draft = KitCore.newDraft('ug2')
    draft.acts.push({ id: 'a1', name: 'Akt I', track: null })
    draft.slides.push(mkSlide({ actId: 'a1' }))
    const result = KitCore.validateDraft(draft)
    expect(result.ok).toBe(true)
  })

  it('never throws on garbage input', () => {
    expect(() => KitCore.validateDraft(null)).not.toThrow()
    expect(() => KitCore.validateDraft(42)).not.toThrow()
    expect(() => KitCore.validateDraft('nope')).not.toThrow()
    expect(KitCore.validateDraft(null).ok).toBe(false)
  })

  it('rejects a hostile custom-image dataUrl (not a base64 data-URL)', () => {
    const draft = KitCore.newDraft('ug2')
    draft.slides.push(
      mkSlide({
        template: 'tytulowy',
        image: { kind: 'custom', dataUrl: 'x" onerror="alert(1)' },
      }),
    )
    const result = KitCore.validateDraft(draft)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('image'))).toBe(true)
  })

  it('accepts a genuine base64 custom-image dataUrl', () => {
    const draft = KitCore.newDraft('ug2')
    draft.slides.push(
      mkSlide({
        template: 'tytulowy',
        image: { kind: 'custom', dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==' },
      }),
    )
    const result = KitCore.validateDraft(draft)
    expect(result.ok).toBe(true)
  })
})

describe('KitCore.escapeHtml', () => {
  it('escapes & < > " \' in that order (no double-escaping)', () => {
    expect(KitCore.escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;')
  })

  it('handles null/undefined as empty string', () => {
    expect(KitCore.escapeHtml(null)).toBe('')
    expect(KitCore.escapeHtml(undefined)).toBe('')
  })
})

describe('KitCore.draftToEngineData — template mapping', () => {
  it('tytulowy -> kind: title, with image + kb default', () => {
    const draft = KitCore.newDraft('ug2')
    draft.slides.push(
      mkSlide({
        template: 'tytulowy',
        title: 'Tytuł',
        text: 'Podtytuł',
        image: { kind: 'library', id: 'scene-1' },
      }),
    )
    const { slides } = KitCore.draftToEngineData(draft, resolveImageStub)
    expect(slides[0].kind).toBe('title')
    expect(slides[0].image).toBe('data:image/jpeg;base64,LIB-scene-1')
    expect(slides[0].kb).toBe('in')
    expect(slides[0].title).toBe('Tytuł')
    expect(slides[0].text).toBe('Podtytuł')
  })

  it('przerywnik -> kind: card, no image/kb, fx passed through', () => {
    const draft = KitCore.newDraft('ug2')
    draft.slides.push(
      mkSlide({ template: 'przerywnik', title: 'Akt II', text: 'Zaczyna się...', fx: 'pulse' }),
    )
    const { slides } = KitCore.draftToEngineData(draft, resolveImageStub)
    expect(slides[0].kind).toBe('card')
    expect(slides[0]).not.toHaveProperty('image')
    expect(slides[0]).not.toHaveProperty('kb')
    expect(slides[0].fx).toBe('pulse')
  })

  it('obraz -> kind: image, optional single portrait, night passed through', () => {
    const draft = KitCore.newDraft('ug2')
    draft.slides.push(
      mkSlide({
        template: 'obraz',
        title: 'Doki',
        text: 'Mgła nad wodą.',
        image: { kind: 'library', id: 'scene-2' },
        portrait: { kind: 'library', id: 'cast-jakub' },
        portraitName: 'Jakub',
        night: true,
        kb: 'left',
      }),
    )
    const { slides } = KitCore.draftToEngineData(draft, resolveImageStub)
    expect(slides[0].kind).toBe('image')
    expect(slides[0].kb).toBe('left')
    expect(slides[0].night).toBe(true)
    expect(slides[0].portraits).toEqual([
      { img: 'data:image/jpeg;base64,LIB-cast-jakub', name: 'Jakub' },
    ])
  })

  it('obraz without a portrait omits `portraits`', () => {
    const draft = KitCore.newDraft('ug2')
    draft.slides.push(mkSlide({ template: 'obraz', image: { kind: 'library', id: 'scene-3' } }))
    const { slides } = KitCore.draftToEngineData(draft, resolveImageStub)
    expect(slides[0]).not.toHaveProperty('portraits')
  })

  it('cytat -> kind: image, portraits with speaker, no title field', () => {
    const draft = KitCore.newDraft('ug2')
    draft.slides.push(
      mkSlide({
        template: 'cytat',
        title: 'ignored by this template',
        text: 'To był błąd.',
        image: { kind: 'library', id: 'scene-4' },
        portrait: { kind: 'library', id: 'cast-kasandra' },
        portraitName: 'Kasandra',
      }),
    )
    const { slides } = KitCore.draftToEngineData(draft, resolveImageStub)
    expect(slides[0].kind).toBe('image')
    expect(slides[0]).not.toHaveProperty('title')
    expect(slides[0].text).toBe('To był błąd.')
    expect(slides[0].portraits).toEqual([
      { img: 'data:image/jpeg;base64,LIB-cast-kasandra', name: 'Kasandra' },
    ])
  })

  it('final -> kind: end, title + text only', () => {
    const draft = KitCore.newDraft('ug2')
    draft.slides.push(mkSlide({ template: 'final', title: 'Koniec', text: 'Do zobaczenia.' }))
    const { slides } = KitCore.draftToEngineData(draft, resolveImageStub)
    expect(slides[0].kind).toBe('end')
    expect(slides[0]).not.toHaveProperty('image')
    expect(slides[0].title).toBe('Koniec')
    expect(slides[0].text).toBe('Do zobaczenia.')
  })
})

describe('KitCore.draftToEngineData — acts, music, escaping', () => {
  it('act with a track sets act label + track filename, and registers it in tracks', () => {
    const draft = KitCore.newDraft('ug2')
    draft.acts.push({ id: 'a1', name: 'Akt I: Doki', track: 'docks.mp3' })
    draft.slides.push(mkSlide({ actId: 'a1' }))
    const { slides, tracks } = KitCore.draftToEngineData(draft, resolveImageStub)
    expect(slides[0].act).toBe('Akt I: Doki')
    expect(slides[0].track).toBe('docks.mp3')
    expect(tracks).toHaveProperty('docks.mp3')
  })

  it('act with no music omits `track` on the slide and adds nothing to tracks', () => {
    const draft = KitCore.newDraft('ug2')
    draft.acts.push({ id: 'a1', name: 'Akt I', track: null })
    draft.slides.push(mkSlide({ actId: 'a1' }))
    const { slides, tracks } = KitCore.draftToEngineData(draft, resolveImageStub)
    expect(slides[0].act).toBe('Akt I')
    expect(slides[0]).not.toHaveProperty('track')
    expect(tracks).toEqual({})
  })

  it('a slide with no actId gets no act/track fields', () => {
    const draft = KitCore.newDraft('ug2')
    const { slides } = KitCore.draftToEngineData(draft, resolveImageStub)
    draft.slides.push(mkSlide({}))
    const result = KitCore.draftToEngineData(draft, resolveImageStub)
    expect(result.slides[0]).not.toHaveProperty('act')
    expect(result.slides[0]).not.toHaveProperty('track')
    expect(slides).toEqual([])
  })

  it('HTML in a title/text/act/portraitName comes out entity-escaped', () => {
    const draft = KitCore.newDraft('ug2')
    draft.acts.push({ id: 'a1', name: '<script>alert(2)</script>', track: null })
    draft.slides.push(
      mkSlide({
        template: 'obraz',
        actId: 'a1',
        title: '<script>alert(1)</script>',
        text: '<img src=x onerror=alert(3)>',
        image: { kind: 'library', id: 'scene-1' },
        portrait: { kind: 'library', id: 'cast-1' },
        portraitName: '<b>Jakub</b>',
      }),
    )
    const { slides } = KitCore.draftToEngineData(draft, resolveImageStub)
    const slide = slides[0] as { title: string; text: string; act: string; portraits: { name: string }[] }
    expect(slide.title).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(slide.text).toContain('&lt;img')
    expect(slide.act).toBe('&lt;script&gt;alert(2)&lt;/script&gt;')
    expect(slide.portraits[0].name).toBe('&lt;b&gt;Jakub&lt;/b&gt;')
    expect(slide.title).not.toContain('<script>')
  })

  it('defense-in-depth: escapes image/portrait img strings even if they somehow bypass validateDraft', () => {
    // draftToEngineData is not itself a validation gate — it trusts its
    // caller ran validateDraft first. This test exercises what happens if a
    // hostile value reaches it anyway (e.g. a draft mutated after
    // validation, or a future caller that skips the check): the `image`/
    // `portraits[].img` strings it writes into engine data must still come
    // out HTML-escaped, since the cinematic-slideshow engine interpolates
    // them into HTML unescaped (spec §4 trust boundary).
    const draft = KitCore.newDraft('ug2')
    draft.slides.push(
      mkSlide({
        template: 'obraz',
        image: { kind: 'custom', dataUrl: 'data:image/png;base64,ABC"><script>alert(1)</script>' },
        portrait: { kind: 'custom', dataUrl: 'data:image/png;base64,XYZ"><script>alert(2)</script>' },
        portraitName: 'Jakub',
      }),
    )
    const { slides } = KitCore.draftToEngineData(draft, resolveImageStub)
    const slide = slides[0] as { image: string; portraits: { img: string }[] }
    expect(slide.image).not.toContain('"')
    expect(slide.image).not.toContain('<')
    expect(slide.portraits[0].img).not.toContain('"')
    expect(slide.portraits[0].img).not.toContain('<')
  })

  it('calls resolveImage for library refs and passes custom dataUrl through unchanged', () => {
    const draft = KitCore.newDraft('ug2')
    draft.slides.push(
      mkSlide({
        template: 'tytulowy',
        image: { kind: 'custom', dataUrl: 'data:image/png;base64,ABC123' },
      }),
    )
    const calls: AssetRef[] = []
    const { slides } = KitCore.draftToEngineData(draft, (ref) => {
      calls.push(ref)
      return resolveImageStub(ref)
    })
    expect(slides[0].image).toBe('data:image/png;base64,ABC123')
    expect(calls).toEqual([{ kind: 'custom', dataUrl: 'data:image/png;base64,ABC123' }])
  })
})

describe('KitCore.serializeSlidesJs', () => {
  it('output declares AUDIO_BASE, TRACKS, SLIDES and parses as valid JS', () => {
    const draft = KitCore.newDraft('ug2')
    draft.acts.push({ id: 'a1', name: 'Akt I', track: 'docks.mp3' })
    draft.slides.push(mkSlide({ actId: 'a1', template: 'final', title: 'Koniec' }))
    const engineData = KitCore.draftToEngineData(draft, resolveImageStub)
    const src = KitCore.serializeSlidesJs(engineData)

    expect(src).toContain('AUDIO_BASE')
    expect(src).toContain('TRACKS')
    expect(src).toContain('SLIDES')
    expect(() => new Function(src)).not.toThrow()
  })

  it('inlines a used track as a data URI when trackData has it (no AUDIO_BASE + for that track)', () => {
    const draft = KitCore.newDraft('ug2')
    draft.acts.push({ id: 'a1', name: 'Akt I', track: 'docks.mp3' })
    draft.slides.push(mkSlide({ actId: 'a1', template: 'final', title: 'Koniec' }))
    const engineData = KitCore.draftToEngineData(draft, resolveImageStub)
    const src = KitCore.serializeSlidesJs(engineData, { 'docks.mp3': 'data:audio/mpeg;base64,ZG9ja3M=' })

    expect(src).toContain('"docks.mp3": "data:audio/mpeg;base64,ZG9ja3M="')
    expect(src).not.toContain('AUDIO_BASE + "docks.mp3"')
    expect(() => new Function(src)).not.toThrow()
  })

  it('without trackData (or missing entry) falls back to AUDIO_BASE + file — existing behavior preserved', () => {
    const draft = KitCore.newDraft('ug2')
    draft.acts.push({ id: 'a1', name: 'Akt I', track: 'docks.mp3' })
    draft.slides.push(mkSlide({ actId: 'a1', template: 'final', title: 'Koniec' }))
    const engineData = KitCore.draftToEngineData(draft, resolveImageStub)

    const srcNoArg = KitCore.serializeSlidesJs(engineData)
    expect(srcNoArg).toContain('AUDIO_BASE + "docks.mp3"')

    const srcEmptyTrackData = KitCore.serializeSlidesJs(engineData, {})
    expect(srcEmptyTrackData).toContain('AUDIO_BASE + "docks.mp3"')

    const srcOtherTrack = KitCore.serializeSlidesJs(engineData, { 'other.mp3': 'data:audio/mpeg;base64,eHl6' })
    expect(srcOtherTrack).toContain('AUDIO_BASE + "docks.mp3"')
  })

  it('a </script>-hostile data URI in trackData comes out escaped (no literal "<")', () => {
    const engineData = { slides: [{ kind: 'end', title: 'x' }], tracks: { 'evil.mp3': 'AUDIO' } }
    const src = KitCore.serializeSlidesJs(engineData, {
      'evil.mp3': 'data:audio/mpeg;base64,ABC</script><script>alert(1)</script>',
    })
    expect(src).not.toContain('<')
    expect(src).toContain('\\u003c')
  })

  it('never contains a literal "<" (script-injection guard)', () => {
    // Exercise serializeSlidesJs's own escaping directly (not routed through
    // draftToEngineData, which would already have entity-escaped any '<' —
    // this proves the belt-and-braces guarantee holds even if a raw '<'
    // somehow reached this layer, e.g. from a future field that skips
    // escapeHtml).
    const src = KitCore.serializeSlidesJs({
      slides: [{ kind: 'end', title: '</script><script>alert(1)</script>' }],
      tracks: {},
    })
    expect(src).not.toContain('<')
    expect(src).toContain('\\u003c')
  })
})

describe('KitCore.collectImageRefs', () => {
  it('dedupes identical library and custom refs across slides', () => {
    const draft = KitCore.newDraft('ug2')
    draft.slides.push(
      mkSlide({ template: 'tytulowy', image: { kind: 'library', id: 'scene-1' } }),
      mkSlide({
        template: 'obraz',
        image: { kind: 'library', id: 'scene-1' },
        portrait: { kind: 'custom', dataUrl: 'data:image/png;base64,X' },
      }),
      mkSlide({
        template: 'cytat',
        image: { kind: 'custom', dataUrl: 'data:image/png;base64,X' },
      }),
    )
    const refs = KitCore.collectImageRefs(draft)
    expect(refs).toEqual([
      { kind: 'library', id: 'scene-1' },
      { kind: 'custom', dataUrl: 'data:image/png;base64,X' },
    ])
  })

  it('empty draft -> []', () => {
    expect(KitCore.collectImageRefs(KitCore.newDraft('ug2'))).toEqual([])
  })
})

describe('KitCore.draftByteSize', () => {
  it('counts UTF-8 bytes, not UTF-16 code units (Polish diacritics)', () => {
    const draft = KitCore.newDraft('ug2')
    draft.slides.push(mkSlide({ template: 'final', title: 'Zażółć gęślą jaźń' }))
    const jsonLen = JSON.stringify(draft).length
    const byteSize = KitCore.draftByteSize(draft)
    // Polish diacritics (ż ó ł ę ś ą ź ń) are 2-byte UTF-8 sequences, so the
    // byte count must exceed the UTF-16 string length.
    expect(byteSize).toBeGreaterThan(jsonLen)
  })

  it('empty draft has a positive, small byte size', () => {
    const size = KitCore.draftByteSize(KitCore.newDraft('ug2'))
    expect(size).toBeGreaterThan(0)
    expect(size).toBeLessThan(1000)
  })
})

describe('kit-core.js source — HTML-embedding constraint', () => {
  // `scripts/build-presentation-kit.ts` injects this file's source verbatim
  // into an HTML <script> element (see edytor.html's __KIT_CORE__ token).
  // The HTML tokenizer ends a <script> element at the first `</script`
  // byte sequence it sees, regardless of JS context — inside a string, a
  // comment, anywhere. A stray `</script` in this file (e.g. in a comment
  // explaining escaping) would silently truncate KitCore mid-file when
  // embedded, leaving `window.KitCore` undefined. Guard against that
  // directly on the source text, not just on runtime behavior.
  it('never contains a literal "</script" sequence (case-insensitive)', () => {
    // Resolved from the repo root (vitest's cwd), matching the convention in
    // scripts/build-presentation-kit.ts rather than import.meta.url, which
    // is not a `file:` URL under vitest's module transform.
    const source = readFileSync(resolve('scripts/kit-template/kit-core.js'), 'utf8')
    expect(source).not.toMatch(/<\/script/i)
  })
})
