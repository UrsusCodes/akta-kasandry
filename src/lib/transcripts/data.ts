/**
 * Runtime loaders for the transcript data layer. Everything is fetched from
 * `public/transcripts/data/` at runtime (kept out of the JS bundle so the
 * multi-MB overlays load lazily, one variant at a time). Paths go through
 * `withBase` so they resolve under the GitHub Pages subpath in production.
 */
import { withBase } from '@/lib/withBase'
import type { Manifest, Overlay } from './overlay'
import type { AudioLinks } from './audioLinks'

const DATA_DIR = '/transcripts/data'

async function fetchJson<T>(file: string): Promise<T> {
  const url = withBase(`${DATA_DIR}/${file}`)!
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load ${file}: HTTP ${res.status}`)
  return (await res.json()) as T
}

export function loadManifest(): Promise<Manifest> {
  return fetchJson<Manifest>('variants.json')
}

/** Audio-links is optional; a missing/broken file just means "no external links". */
export async function loadAudioLinks(): Promise<AudioLinks | null> {
  try {
    return await fetchJson<AudioLinks>('audio-links.json')
  } catch {
    return null
  }
}

/** Load one variant's overlay by its manifest `file` name. */
export function loadOverlay(file: string): Promise<Overlay> {
  return fetchJson<Overlay>(file)
}
