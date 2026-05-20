/**
 * Per-page custom rendering hooks. Some pages need behaviour the markdown
 * renderer can't provide (interactive map, embedded tools, charts). When a
 * page's slug-path matches one of these constants, `NodeView` renders the
 * custom component instead of (or alongside) the markdown body.
 *
 * Keep the registry tiny — anything reusable should be expressible in
 * markdown + an existing plugin instead.
 */

export const MAP_PAGE_PATH = 'swiat-npc/boston/mapa-bostonu-1924'

/**
 * The map article in PUBLIC has a hardcoded `<a><img src="http://localhost:8081/..." …></a>`
 * block from the BookStack PoC. We strip it so the interactive map renders
 * cleanly above the rest of the article (the legend below stays).
 */
export function stripLegacyMapEmbed(body: string): string {
  return body.replace(/<a[^>]*>\s*<img[^>]*>\s*<\/a>/gi, '').trim()
}
