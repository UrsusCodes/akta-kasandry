import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join, basename, extname, relative } from 'node:path'

const EXCLUDE_DIRS = new Set(['memory', '.obsidian', 'node_modules', '.trash', '.git', 'attachments'])
const EXCLUDE_SUFFIXES = ['.excalidraw.md']

/**
 * Flat page record discovered in the vault. The path-from-vault preserves the
 * full nested folder chain — Obsidian-style, arbitrary depth. The natural key
 * for upsert is `pathFromVault` (stable across renames, breaks on moves —
 * acceptable trade-off).
 *
 * Path semantics:
 *   <vault>/<folder>/.../<page>.md           — any depth
 */
export type VaultPage = {
  pathFromVault: string   // e.g. "Tło historyczne/Miasto/Beacon Hill.md"
  folderPath: string      // e.g. "Tło historyczne/Miasto"  (empty for root-level .md)
  name: string            // basename without .md
  content: string
}

function shouldInclude(name: string): boolean {
  if (name.startsWith('_') || name.startsWith('.')) return false
  for (const s of EXCLUDE_SUFFIXES) {
    if (name.endsWith(s)) return false
  }
  return true
}

function readDirSafe(p: string): string[] {
  try {
    return readdirSync(p)
  } catch {
    return []
  }
}

function isDir(p: string): boolean {
  try {
    return statSync(p).isDirectory()
  } catch {
    return false
  }
}

/**
 * Recursive vault walker. Yields every `.md` file at any depth, skipping the
 * excluded directories (memory/, .obsidian/, attachments/, …) and the dot/
 * underscore conventions. No fixed-depth assumption — mirrors Obsidian.
 */
export function walkVault(vaultRoot: string): VaultPage[] {
  const pages: VaultPage[] = []
  recurse(vaultRoot, vaultRoot, pages)
  return pages
}

function recurse(currentDir: string, vaultRoot: string, out: VaultPage[]) {
  for (const entry of readDirSafe(currentDir)) {
    if (!shouldInclude(entry) || EXCLUDE_DIRS.has(entry)) continue
    const abs = join(currentDir, entry)
    if (isDir(abs)) {
      recurse(abs, vaultRoot, out)
    } else if (extname(entry) === '.md') {
      const rel = relative(vaultRoot, abs).replace(/\\/g, '/')
      const folderRel = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : ''
      out.push({
        pathFromVault: rel,
        folderPath: folderRel,
        name: basename(abs, '.md'),
        content: readFileSync(abs, 'utf-8'),
      })
    }
  }
}
