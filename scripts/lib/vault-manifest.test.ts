import { describe, it, expect } from 'vitest'
import { planVaultFiles, type VaultFile } from './vault-manifest'

const TOOL_ROOTS = ['Narzędzia/transkrypt', 'Narzędzia/prezentacja']

describe('planVaultFiles', () => {
  it('returns the pinned set of static + derived paths', () => {
    const files = planVaultFiles('rozdarte-sumienie')
    const paths = files.map((f) => f.path)

    expect(paths).toEqual(
      expect.arrayContaining([
        'START TUTAJ.md',
        'Streszczenie — rozdarte-sumienie.md',
        'Komentarz do AI.md',
        'Narzędzia/Otwórz narzędzia.md',
        'Media/_Wrzuć tu media.md',
        '.obsidian/app.json',
        '.obsidian/appearance.json',
        'Media/portrety',
        'Media/sceny',
        'Media/muzyka',
        'Media/zdjecia-z-gry',
        'Media/materialy',
      ]),
    )
    expect(paths).toHaveLength(12)
  })

  it('every path is vault-relative: no leading slash, no drive letter, no ".."', () => {
    const files = planVaultFiles('rozdarte-sumienie')
    for (const f of files) {
      expect(f.path.startsWith('/')).toBe(false)
      expect(f.path.startsWith('\\')).toBe(false)
      expect(/^[a-zA-Z]:/.test(f.path)).toBe(false)
      expect(f.path.split(/[\\/]/)).not.toContain('..')
    }
  })

  it('the summary entry is present exactly once, kind "summary", and carries the slug', () => {
    const files = planVaultFiles('rozdarte-sumienie')
    const summaries = files.filter((f) => f.kind === 'summary')
    expect(summaries).toHaveLength(1)
    expect(summaries[0].path).toBe('Streszczenie — rozdarte-sumienie.md')
  })

  it('.obsidian/workspace.json is never included', () => {
    const files = planVaultFiles('rozdarte-sumienie')
    expect(files.some((f) => f.path === '.obsidian/workspace.json')).toBe(false)
  })

  it('the two tool subtrees are absent — they are owned by the two builders', () => {
    const files = planVaultFiles('rozdarte-sumienie')
    for (const f of files) {
      for (const root of TOOL_ROOTS) {
        expect(f.path === root || f.path.startsWith(`${root}/`)).toBe(false)
      }
    }
    expect(files.some((f) => f.kind === 'tool')).toBe(false)
  })

  it('every entry has a valid kind from the pinned union', () => {
    const files = planVaultFiles('rozdarte-sumienie')
    const validKinds: VaultFile['kind'][] = ['summary', 'template', 'derived', 'tool']
    for (const f of files) {
      expect(validKinds).toContain(f.kind)
    }
  })

  it('is a plain, deterministic data function — same slug -> equal plan', () => {
    expect(planVaultFiles('rozdarte-sumienie')).toEqual(planVaultFiles('rozdarte-sumienie'))
  })

  it('interpolates a different slug into the summary path only', () => {
    const a = planVaultFiles('rozdarte-sumienie')
    const b = planVaultFiles('ug2')
    const summaryA = a.find((f) => f.kind === 'summary')!
    const summaryB = b.find((f) => f.kind === 'summary')!
    expect(summaryA.path).toBe('Streszczenie — rozdarte-sumienie.md')
    expect(summaryB.path).toBe('Streszczenie — ug2.md')

    // every other path is slug-independent
    const restA = a.filter((f) => f.kind !== 'summary').map((f) => f.path)
    const restB = b.filter((f) => f.kind !== 'summary').map((f) => f.path)
    expect(restA).toEqual(restB)
  })
})
