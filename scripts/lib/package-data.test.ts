import { describe, it, expect } from 'vitest'
import { seekSecondsFor, buildPackagePayload, inlineJson, type SceneIndexFile } from './package-data'
import type { Overlay, Utterance } from '../../src/lib/transcripts/overlay'

const mkUtterance = (over: Partial<Utterance>): Utterance => ({
  id: 'u1',
  start: 10,
  end: 12,
  text: 'hello',
  speaker_id: 'sp1',
  speaker_name: 'Jakub M',
  channel_idx: 0,
  assigned: true,
  play: { audio_file: 'audio/ug2/ch00.opus', start: 5, end: 7 },
  chunks: [],
  ...over,
})

const mkOverlay = (over: Partial<Overlay>): Overlay => ({
  session_id: 'ug2',
  session_name: 'Urodzaj grozy',
  slug: 'ug2',
  timeline: 'concat',
  duration: 9514.406,
  speakers: [{ id: 'sp1', name: 'Jakub M', channel_idx: 0, color: '#4a9eff' }],
  channels: {},
  utterances: [],
  ...over,
})

describe('seekSecondsFor', () => {
  it('prefers play.start when present', () => {
    const u = mkUtterance({ start: 100, play: { audio_file: 'a', start: 42, end: 44 } })
    expect(seekSecondsFor(u, 'concat')).toBe(42)
    expect(seekSecondsFor(u, 'epoch')).toBe(42)
  })

  it('falls back to start only when timeline is concat', () => {
    const u = mkUtterance({ start: 100, play: { audio_file: 'a', start: null, end: null } })
    expect(seekSecondsFor(u, 'concat')).toBe(100)
  })

  it('returns null on epoch timeline with null play.start', () => {
    const u = mkUtterance({ start: 100, play: { audio_file: 'a', start: null, end: null } })
    expect(seekSecondsFor(u, 'epoch')).toBeNull()
  })
})

describe('buildPackagePayload', () => {
  const utterances: Utterance[] = [
    mkUtterance({ id: 'a', text: 'one', play: { audio_file: 'a', start: 0, end: 1 } }),
    mkUtterance({ id: 'b', text: 'two', play: { audio_file: 'a', start: 5, end: 6 } }),
    mkUtterance({ id: 'c', text: 'three', play: { audio_file: 'a', start: 10, end: 11 } }),
    mkUtterance({ id: 'd', text: 'four', play: { audio_file: 'a', start: 15, end: 16 } }),
    mkUtterance({ id: 'e', text: 'five', assigned: false, play: { audio_file: 'a', start: 20, end: 21 } }),
    mkUtterance({ id: 'f', text: 'six', play: { audio_file: 'a', start: 25, end: 26 } }),
  ]
  const overlay = mkOverlay({ utterances })

  it('resolves startIdx/endIdx correctly for a multi-utterance scene', () => {
    const sceneIndex: SceneIndexFile = {
      slug: 'ug2',
      scenes: [{ id: 'scene-1', title: 'Scene One', uStart: 'b', uEnd: 'd', tApprox: '01:00' }],
    }
    const payload = buildPackagePayload(overlay, sceneIndex, { variantId: 'v1', audioSrc: null })
    expect(payload.scenes).toHaveLength(1)
    expect(payload.scenes[0]).toMatchObject({
      id: 'scene-1',
      title: 'Scene One',
      startIdx: 1,
      endIdx: 3,
      seekSec: 5,
      tApprox: '01:00',
    })
  })

  it('accepts a single-utterance scene (uStart === uEnd)', () => {
    const sceneIndex: SceneIndexFile = {
      slug: 'ug2',
      scenes: [{ id: 'noc-strzelanina', title: 'Solo', uStart: 'c', uEnd: 'c', tApprox: '02:00' }],
    }
    const payload = buildPackagePayload(overlay, sceneIndex, { variantId: 'v1', audioSrc: null })
    expect(payload.scenes[0].startIdx).toBe(2)
    expect(payload.scenes[0].endIdx).toBe(2)
    expect(payload.scenes[0].seekSec).toBe(10)
  })

  it('throws with the scene id and the missing utterance id when uStart is absent', () => {
    const sceneIndex: SceneIndexFile = {
      slug: 'ug2',
      scenes: [{ id: 'ghost-scene', title: 'Ghost', uStart: 'does-not-exist', uEnd: 'c', tApprox: '00:00' }],
    }
    expect(() => buildPackagePayload(overlay, sceneIndex, { variantId: 'v1', audioSrc: null })).toThrow(
      /ghost-scene/,
    )
    expect(() => buildPackagePayload(overlay, sceneIndex, { variantId: 'v1', audioSrc: null })).toThrow(
      /does-not-exist/,
    )
  })

  it('throws with the scene id and the missing utterance id when uEnd is absent', () => {
    const sceneIndex: SceneIndexFile = {
      slug: 'ug2',
      scenes: [{ id: 'ghost-scene-2', title: 'Ghost', uStart: 'a', uEnd: 'nope', tApprox: '00:00' }],
    }
    expect(() => buildPackagePayload(overlay, sceneIndex, { variantId: 'v1', audioSrc: null })).toThrow(
      /ghost-scene-2/,
    )
    expect(() => buildPackagePayload(overlay, sceneIndex, { variantId: 'v1', audioSrc: null })).toThrow(/nope/)
  })

  it('passes audioSrc through to meta', () => {
    const sceneIndex: SceneIndexFile = { slug: 'ug2', scenes: [] }
    const withAudio = buildPackagePayload(overlay, sceneIndex, {
      variantId: 'v1',
      audioSrc: 'audio/ug2-mix.opus',
    })
    expect(withAudio.meta.audioSrc).toBe('audio/ug2-mix.opus')

    const withoutAudio = buildPackagePayload(overlay, sceneIndex, { variantId: 'v1', audioSrc: null })
    expect(withoutAudio.meta.audioSrc).toBeNull()
  })

  it('trims utterances to the Pkg shape — no chunks/methods/play keys survive', () => {
    const sceneIndex: SceneIndexFile = { slug: 'ug2', scenes: [] }
    const payload = buildPackagePayload(overlay, sceneIndex, { variantId: 'v1', audioSrc: null })
    expect(payload.utterances).toHaveLength(utterances.length)
    for (const u of payload.utterances) {
      expect(Object.keys(u).sort()).toEqual(['id', 'neutral', 'sec', 'spk', 'text'].sort())
    }
    expect(payload.utterances.find((u) => u.id === 'e')?.neutral).toBe(1)
    expect(payload.utterances.find((u) => u.id === 'a')?.neutral).toBe(0)
  })

  it('carries meta and speakers through', () => {
    const sceneIndex: SceneIndexFile = { slug: 'ug2', scenes: [] }
    const payload = buildPackagePayload(overlay, sceneIndex, {
      variantId: 'v2',
      audioSrc: null,
      builtAt: '2026-07-15T00:00:00.000Z',
    })
    expect(payload.meta).toEqual({
      slug: 'ug2',
      sessionName: 'Urodzaj grozy',
      variantId: 'v2',
      builtAt: '2026-07-15T00:00:00.000Z',
      duration: 9514.406,
      audioSrc: null,
    })
    expect(payload.speakers).toEqual([{ id: 'sp1', name: 'Jakub M', color: '#4a9eff' }])
  })

  it('falls back to a neutral grey when a speaker color is not a valid #rrggbb hex string', () => {
    const badOverlay = mkOverlay({
      utterances,
      speakers: [
        { id: 'sp1', name: 'Jakub M', channel_idx: 0, color: '#4a9eff' },
        { id: 'sp2', name: 'Bad Actor', channel_idx: 1, color: 'red' },
        { id: 'sp3', name: 'Injector', channel_idx: 2, color: '#fff;background:url(javascript:alert(1))' },
      ],
    })
    const sceneIndex: SceneIndexFile = { slug: 'ug2', scenes: [] }
    const payload = buildPackagePayload(badOverlay, sceneIndex, { variantId: 'v1', audioSrc: null })
    expect(payload.speakers).toEqual([
      { id: 'sp1', name: 'Jakub M', color: '#4a9eff' },
      { id: 'sp2', name: 'Bad Actor', color: '#8b949e' },
      { id: 'sp3', name: 'Injector', color: '#8b949e' },
    ])
  })
})

describe('inlineJson', () => {
  it('escapes < so no literal </script> survives', () => {
    const out = inlineJson('</script>')
    expect(out).not.toContain('</script>')
    expect(out).not.toContain('<')
    expect(out).toContain('\\u003c')
  })

  it('round-trips through JSON.parse after un-escaping', () => {
    const value = { text: 'a <b> c', n: 1 }
    const out = inlineJson(value)
    expect(JSON.parse(out.replace(/\\u003c/g, '<'))).toEqual(value)
  })
})
