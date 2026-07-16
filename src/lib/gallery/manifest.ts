/**
 * Zod schema + loader for the Session Gallery manifest (`public/gallery/<caseKey>.json`).
 * One manifest per case: scene illustrations, cast portraits, session music, and cross-links
 * back into the case's other pages. Consumed by `SessionGallery`.
 */
import { z } from 'zod'
import { withBase } from '@/lib/withBase'

export const GalleryImageSchema = z.object({
  src: z.string().min(1),
  caption: z.string().optional(),
  alt: z.string().optional(),
})
export const GalleryPortraitSchema = z.object({
  src: z.string().min(1),
  character: z.string().min(1),
  player: z.string().optional(),
})
export const GalleryTrackSchema = z.object({ src: z.string().min(1), title: z.string().min(1) })
export const GalleryLinkSchema = z.object({ label: z.string().min(1), to: z.string().min(1) })

export const GalleryManifestSchema = z.object({
  caseKey: z.string().min(1),
  title: z.string().min(1),
  // Clean case name (no page-heading suffix like "— galeria"), used by derived
  // artifacts that need a title of their own — e.g. the presentation kit builder.
  // Falls back to `title` when absent.
  caseName: z.string().optional(),
  scenes: z.array(GalleryImageSchema).default([]),
  cast: z.array(GalleryPortraitSchema).default([]),
  tracks: z.array(GalleryTrackSchema).default([]),
  links: z.array(GalleryLinkSchema).default([]),
})
export type GalleryManifest = z.infer<typeof GalleryManifestSchema>
export type GalleryImage = z.infer<typeof GalleryImageSchema>
export type GalleryPortrait = z.infer<typeof GalleryPortraitSchema>
export type GalleryTrack = z.infer<typeof GalleryTrackSchema>
export type GalleryLink = z.infer<typeof GalleryLinkSchema>

/** Pure: validate unknown JSON → typed manifest (throws ZodError on malformed). */
export function parseGalleryManifest(raw: unknown): GalleryManifest {
  return GalleryManifestSchema.parse(raw)
}

/** Runtime loader: fetch public/gallery/<caseKey>.json (http site → fetch OK), validate. */
export async function loadGalleryManifest(caseKey: string): Promise<GalleryManifest> {
  const res = await fetch(withBase(`/gallery/${caseKey}.json`)!)
  if (!res.ok) throw new Error(`gallery manifest ${caseKey}: HTTP ${res.status}`)
  return parseGalleryManifest(await res.json())
}
