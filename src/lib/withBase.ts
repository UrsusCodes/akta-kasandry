/**
 * Prefix a root-absolute path with the Vite base so it resolves correctly under
 * the GitHub Pages subpath (`/akta-kasandry/…`) in production and at `/` in dev.
 *
 * - `/vault-attachments/x.png` → `/akta-kasandry/vault-attachments/x.png` (prod)
 *                              → `/vault-attachments/x.png`              (dev)
 * - external (`http…`, `data:`) and non-root paths are returned unchanged.
 */
export function withBase(src?: string): string | undefined {
  if (!src || !src.startsWith('/')) return src
  const base = import.meta.env.BASE_URL.replace(/\/$/, '') // '' in dev, '/akta-kasandry' in prod
  return base + src
}
