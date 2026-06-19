import { create } from 'zustand'
import type { Manifest, Overlay } from '@/lib/transcripts/overlay'
import type { AudioLinks } from '@/lib/transcripts/audioLinks'
import type { Corrections } from '@/lib/transcripts/corrections'
import {
  loadCorrections,
  saveCorrections,
} from '@/lib/transcripts/corrections'
import { loadAudioLinks, loadManifest, loadOverlay } from '@/lib/transcripts/data'

/**
 * State for the transcript provenance viewer/editor. One session+variant is
 * loaded at a time. The manifest and audio-links load once and are cached.
 */

type Status = 'idle' | 'loading' | 'ready' | 'error'

type TranscriptState = {
  // manifest layer (loaded once)
  manifest: Manifest | null
  audioLinks: AudioLinks | null
  manifestStatus: Status

  // current session+variant
  status: Status
  error: string | null
  slug: string | null
  variant: string | null
  overlay: Overlay | null
  nameToColor: Record<string, string>

  // view state
  speakerOn: Record<string, boolean> // speaker id → visible (default true)
  pinnedIdx: number | null
  hoverIdx: number | null

  // editor state
  paintMode: boolean
  paintSpeakerId: string | null
  corrections: Corrections

  // actions
  initManifest: () => Promise<void>
  open: (slug: string, variant?: string) => Promise<void>
  toggleSpeaker: (id: string) => void
  setAllSpeakers: (on: boolean) => void
  setPinned: (idx: number | null) => void
  setHover: (idx: number | null) => void
  setPaintMode: (on: boolean) => void
  setPaintSpeaker: (id: string | null) => void
  paintUtterance: (idx: number, speakerId: string) => void
  editText: (idx: number, text: string) => void
  clearOverride: (idx: number) => void
}

function resolveVariant(manifest: Manifest | null, slug: string, requested?: string): string {
  const s = manifest?.sessions?.[slug]
  if (!s) return requested || 'current'
  if (requested && s.variants.some((v) => v.id === requested)) return requested
  if (s.variants.some((v) => v.id === s.default_variant)) return s.default_variant
  return s.variants[0]?.id || 'current'
}

export const useTranscriptStore = create<TranscriptState>((set, get) => ({
  manifest: null,
  audioLinks: null,
  manifestStatus: 'idle',

  status: 'idle',
  error: null,
  slug: null,
  variant: null,
  overlay: null,
  nameToColor: {},

  speakerOn: {},
  pinnedIdx: null,
  hoverIdx: null,

  paintMode: false,
  paintSpeakerId: null,
  corrections: {},

  initManifest: async () => {
    if (get().manifestStatus === 'ready' || get().manifestStatus === 'loading') return
    set({ manifestStatus: 'loading' })
    try {
      const [manifest, audioLinks] = await Promise.all([loadManifest(), loadAudioLinks()])
      set({ manifest, audioLinks, manifestStatus: 'ready' })
    } catch (e) {
      set({ manifestStatus: 'error', error: (e as Error).message })
    }
  },

  open: async (slug, requested) => {
    // ensure manifest first
    if (get().manifestStatus !== 'ready') await get().initManifest()
    const manifest = get().manifest
    const variant = resolveVariant(manifest, slug, requested)
    const entry = manifest?.sessions?.[slug]?.variants.find((v) => v.id === variant)
    if (!entry) {
      set({ status: 'error', error: `Unknown session/variant: ${slug}/${variant}`, slug, variant })
      return
    }

    set({
      status: 'loading',
      error: null,
      slug,
      variant,
      pinnedIdx: null,
      paintMode: false,
      paintSpeakerId: null,
    })

    try {
      const overlay = await loadOverlay(entry.file)
      // schema guarantees sorting, but be safe
      overlay.utterances.sort((a, b) => (a.start || 0) - (b.start || 0))

      const nameToColor: Record<string, string> = {}
      const speakerOn: Record<string, boolean> = {}
      for (const sp of overlay.speakers) {
        nameToColor[sp.name] = sp.color
        speakerOn[sp.id] = true
      }

      set({
        overlay,
        nameToColor,
        speakerOn,
        corrections: loadCorrections(slug, variant),
        status: 'ready',
      })
    } catch (e) {
      set({ status: 'error', error: (e as Error).message })
    }
  },

  toggleSpeaker: (id) =>
    set((s) => ({ speakerOn: { ...s.speakerOn, [id]: s.speakerOn[id] === false } })),

  setAllSpeakers: (on) =>
    set((s) => {
      const next: Record<string, boolean> = {}
      for (const sp of s.overlay?.speakers || []) next[sp.id] = on
      return { speakerOn: next }
    }),

  setPinned: (idx) => set({ pinnedIdx: idx }),
  setHover: (idx) => set({ hoverIdx: idx }),

  setPaintMode: (on) => set({ paintMode: on }),
  setPaintSpeaker: (id) => set({ paintSpeakerId: id, paintMode: id != null }),

  paintUtterance: (idx, speakerId) =>
    set((s) => {
      const u = s.overlay?.utterances[idx]
      if (!u) return {}
      const sp = s.overlay!.speakers.find((x) => x.id === speakerId)
      if (!sp) return {}
      const prev = s.corrections[u.id] || {}
      const next: Corrections = {
        ...s.corrections,
        [u.id]: { ...prev, speaker_id: sp.id, speaker_name: sp.name },
      }
      if (s.slug && s.variant) saveCorrections(s.slug, s.variant, next)
      return { corrections: next }
    }),

  editText: (idx, text) =>
    set((s) => {
      const u = s.overlay?.utterances[idx]
      if (!u) return {}
      const prev = s.corrections[u.id] || {}
      let next: Corrections
      if (text === u.text) {
        // back to original — drop the text field (and the entry if now empty)
        const { text: _drop, ...rest } = prev
        void _drop
        next = { ...s.corrections }
        if (Object.keys(rest).length === 0) delete next[u.id]
        else next[u.id] = rest
      } else {
        next = { ...s.corrections, [u.id]: { ...prev, text } }
      }
      if (s.slug && s.variant) saveCorrections(s.slug, s.variant, next)
      return { corrections: next }
    }),

  clearOverride: (idx) =>
    set((s) => {
      const u = s.overlay?.utterances[idx]
      if (!u) return {}
      const next = { ...s.corrections }
      delete next[u.id]
      if (s.slug && s.variant) saveCorrections(s.slug, s.variant, next)
      return { corrections: next }
    }),
}))
