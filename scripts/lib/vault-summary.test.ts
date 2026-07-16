import { describe, it, expect } from 'vitest'
import {
  formatClock,
  sceneForIndex,
  rewriteDeepLinks,
  rewriteSesjeLinks,
  rewriteImageEmbeds,
  collectMediaBasenames,
  questionsToCallouts,
  rewriteSummaryToObsidian,
  type SceneRef,
  type UttResolve,
} from './vault-summary'

describe('formatClock', () => {
  it('formats sub-hour seconds as M:SS', () => {
    expect(formatClock(649.36)).toBe('10:49')
  })

  it('formats hour-plus seconds as H:MM:SS', () => {
    expect(formatClock(26739.59)).toBe('7:25:39')
  })

  it('returns --:-- for null', () => {
    expect(formatClock(null)).toBe('--:--')
  })
})

describe('sceneForIndex', () => {
  const scenes: SceneRef[] = [
    { ordinal: 1, aIdx: 36, bIdx: 51 },
    { ordinal: 2, aIdx: 56, bIdx: 98 },
    { ordinal: 3, aIdx: 126, bIdx: 203 },
  ]

  it('inside a scene range → exact', () => {
    expect(sceneForIndex(40, scenes)).toEqual({ ordinal: 1, exact: true })
  })

  it('between scene ranges → the preceding scene, not exact', () => {
    expect(sceneForIndex(108, scenes)).toEqual({ ordinal: 2, exact: false })
  })

  it('before the first scene → scene 1, not exact', () => {
    expect(sceneForIndex(10, scenes)).toEqual({ ordinal: 1, exact: false })
  })

  it('empty scenes → ordinal 0, not exact', () => {
    expect(sceneForIndex(10, [])).toEqual({ ordinal: 0, exact: false })
  })
})

describe('rewriteDeepLinks', () => {
  const slug = 'rozdarte-sumienie'
  const scenes: SceneRef[] = [
    { ordinal: 1, aIdx: 36, bIdx: 51 },
    { ordinal: 2, aIdx: 56, bIdx: 98 },
    { ordinal: 3, aIdx: 126, bIdx: 203 },
  ]
  const utterances: Record<string, { idx: number; sec: number | null }> = {
    '6149a41a4ba3': { idx: 36, sec: 649.36 },
    '9b3441808b29': { idx: 108, sec: 7421.0 }, // out of range (between scene 2 and 3)
    aaa000: { idx: 40, sec: 100 },
    bbb111: { idx: 45, sec: 130 },
  }
  const resolve: UttResolve = (id) => utterances[id] ?? null

  it('single token → visible scena label + restore comment (exact scene)', () => {
    const out = rewriteDeepLinks('before {sesja:rozdarte-sumienie#6149a41a4ba3} after', slug, resolve, scenes)
    expect(out).toBe('before (scena 1 · ~10:49)<!--rs:6149a41a4ba3--> after')
  })

  it('out-of-range id → preceding scene rendered with a tilde', () => {
    const out = rewriteDeepLinks('{sesja:rozdarte-sumienie#9b3441808b29}', slug, resolve, scenes)
    expect(out).toBe('(scena ~2 · ~2:03:41)<!--rs:9b3441808b29-->')
  })

  it('range token → both clocks and a range restore comment', () => {
    const out = rewriteDeepLinks('{sesja:rozdarte-sumienie#aaa000..bbb111}', slug, resolve, scenes)
    expect(out).toBe('(scena 1 · ~01:40–02:10)<!--rs:aaa000..bbb111-->')
  })

  it('unknown id throws, naming the id', () => {
    expect(() => rewriteDeepLinks('{sesja:rozdarte-sumienie#deadbeef}', slug, resolve, scenes)).toThrow(/deadbeef/)
  })

  it('leaves text outside tokens untouched', () => {
    const out = rewriteDeepLinks('Prose before. {sesja:rozdarte-sumienie#6149a41a4ba3} Prose after.', slug, resolve, scenes)
    expect(out.startsWith('Prose before. ')).toBe(true)
    expect(out.endsWith(' Prose after.')).toBe(true)
  })

  it('leaves a token inside an inline code span literal', () => {
    const md = 'See `{sesja:rozdarte-sumienie#6149a41a4ba3}` in code.'
    const out = rewriteDeepLinks(md, slug, resolve, scenes)
    expect(out).toBe(md)
  })
})

describe('rewriteSesjeLinks', () => {
  const slug = 'rozdarte-sumienie'

  it('rewrites a /sesje/<slug> link to the local transcript tool, with a hint', () => {
    const md = '→ **[Transkrypt sesji (z cytatami)](/sesje/rozdarte-sumienie)**'
    const out = rewriteSesjeLinks(md, slug)
    expect(out).toBe(
      '→ **[Transkrypt sesji (z cytatami)](Narzędzia/transkrypt/index.html) ' +
        '(otwórz w folderze Narzędzia → transkrypt)**',
    )
  })

  it('rewrites the query-string form too', () => {
    const md = '[Transkrypt](/sesje/rozdarte-sumienie?scena=3)'
    const out = rewriteSesjeLinks(md, slug)
    expect(out).toBe('[Transkrypt](Narzędzia/transkrypt/index.html) (otwórz w folderze Narzędzia → transkrypt)')
  })

  it('leaves a link to a foreign session slug untouched', () => {
    const md = '[Inna sesja](/sesje/other)'
    expect(rewriteSesjeLinks(md, slug)).toBe(md)
  })

  it('leaves prose without a /sesje/ link untouched', () => {
    const md = 'Zwykły akapit bez linków.'
    expect(rewriteSesjeLinks(md, slug)).toBe(md)
  })
})

describe('rewriteImageEmbeds', () => {
  const slug = 'rs'

  it('converts an <img> tag to an Obsidian embed', () => {
    const out = rewriteImageEmbeds('<img src="/img/rs/fisk.jpg" alt="Fisk" width="200" />', slug)
    expect(out).toBe('![[fisk.jpg]]')
  })

  it('converts a markdown image to an Obsidian embed', () => {
    const out = rewriteImageEmbeds('![Tablica śledztwa](/img/rs/tablica.jpg)', slug)
    expect(out).toBe('![[tablica.jpg]]')
  })

  it('preserves a following caption line', () => {
    const md = '![Tablica](/img/rs/tablica.jpg)\n*Rozpisany łańcuch.*'
    const out = rewriteImageEmbeds(md, slug)
    expect(out).toBe('![[tablica.jpg]]\n*Rozpisany łańcuch.*')
  })

  it('leaves an image from a foreign slug untouched', () => {
    const md = '<img src="/img/other/fisk.jpg" alt="x" />'
    expect(rewriteImageEmbeds(md, slug)).toBe(md)
  })
})

describe('collectMediaBasenames', () => {
  it('dedupes and preserves first-seen order', () => {
    const md = [
      '<img src="/img/rs/fisk.jpg" alt="a" />',
      '<img src="/img/rs/ksiegarnia.jpg" alt="b" />',
      '![Tablica](/img/rs/tablica.jpg)',
      '<img src="/img/rs/fisk.jpg" alt="a again" />',
      '![Tom](/img/rs/tom.jpg)',
    ].join('\n')
    expect(collectMediaBasenames(md, 'rs')).toEqual(['fisk.jpg', 'ksiegarnia.jpg', 'tablica.jpg', 'tom.jpg'])
  })
})

describe('questionsToCallouts', () => {
  it('wraps two question paragraphs as [!question] callouts and preserves the intro blockquote', () => {
    const md = [
      '## Pytania i wątpliwości',
      '',
      '> Poniższe pytania zostają otwarte.',
      '',
      'Jak nazywa się postać Kamila?',
      '',
      'Kto pojechał do Nowego Jorku?',
      '',
      '---',
      '',
      '_Stopka dokumentu._',
    ].join('\n')

    const out = questionsToCallouts(md)
    expect((out.match(/> \[!question\]/g) ?? []).length).toBe(2)
    expect(out).toContain('> Poniższe pytania zostają otwarte.')
    expect(out).toContain('> [!question]\n> Jak nazywa się postać Kamila?')
    expect(out).toContain('> [!question]\n> Kto pojechał do Nowego Jorku?')
    expect(out).toContain('_Stopka dokumentu._') // outside the section, untouched
  })

  it('strips a trailing {q-after:...} marker from the question text', () => {
    const md = [
      '## Pytania i wątpliwości',
      '',
      'Co się stało u Woodwortha? {q-after:Nieznany nagłówek}',
    ].join('\n')

    const out = questionsToCallouts(md)
    expect(out).not.toContain('{q-after:')
    expect(out).toContain('> [!question]\n> Co się stało u Woodwortha?')
  })

  it('relocates a marked question to just after its matching ### heading', () => {
    const md = [
      '## Akt I',
      '',
      '### Włamanie',
      '',
      'Treść sceny.',
      '',
      '## Pytania i wątpliwości',
      '',
      'Co zginęło podczas włamania? {q-after:Włamanie}',
    ].join('\n')

    const out = questionsToCallouts(md)
    const headingIdx = out.indexOf('### Włamanie')
    const calloutIdx = out.indexOf('> [!question]\n> Co zginęło podczas włamania?')
    expect(calloutIdx).toBeGreaterThan(headingIdx)
    // no longer duplicated in the Pytania section
    expect(out.indexOf('Co zginęło podczas włamania?')).toBe(out.lastIndexOf('Co zginęło podczas włamania?'))
  })

  it('is a no-op when there is no Pytania section', () => {
    const md = '## Akt I\n\nTreść.'
    expect(questionsToCallouts(md)).toBe(md)
  })
})

describe('rewriteSummaryToObsidian', () => {
  const slug = 'rs'
  const scenes: SceneRef[] = [{ ordinal: 1, aIdx: 0, bIdx: 10 }]
  const resolve: UttResolve = (id) => (id === 'abc123' || id === 'def456' ? { idx: 2, sec: 42 } : null)

  const md = [
    '# Sesja — streszczenie',
    '',
    '> **WERSJA ROBOCZA.** Nie publikować, dopóki MG nie potwierdzi imion i faktów.',
    '',
    '<img src="/img/rs/fisk.jpg" alt="Fisk" />Coś się wydarzyło. {sesja:rs#abc123}',
    '',
    '![Tom](/img/rs/tom.jpg)',
    '*Podpis.*',
    '',
    '## Pytania i wątpliwości',
    '',
    '> Pytania otwarte.',
    '',
    'Czy to prawda? {sesja:rs#def456}',
  ].join('\n')

  it('produces frontmatter, no leftover site tokens, and one restore comment per original token', () => {
    const { markdown, mediaBasenames } = rewriteSummaryToObsidian(md, { slug, sessionName: 'Sesja Testowa', resolve, scenes })

    expect(markdown.startsWith('---\n')).toBe(true)
    expect(markdown).toContain('session: "Sesja Testowa"')
    expect(markdown).toContain('slug: rs')
    expect(markdown).not.toContain('{sesja:')
    expect(markdown).not.toContain('/img/rs/')
    expect(markdown).toContain('<!--rs:abc123-->')
    expect(markdown).toContain('<!--rs:def456-->')
    expect(markdown).not.toContain('WERSJA ROBOCZA')
    expect(markdown).toContain('[!note] Wersja do waszej korekty')
    expect(markdown).toContain('[!question]')
    expect(mediaBasenames).toEqual(['fisk.jpg', 'tom.jpg'])
  })
})
