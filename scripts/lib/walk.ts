import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join, basename, extname, relative } from 'node:path'

const EXCLUDE_DIRS = new Set(['memory', '.obsidian', 'node_modules', '.trash', '.git'])
const EXCLUDE_SUFFIXES = ['.excalidraw.md']

/**
 * Vault row representing one page on disk. Mirrors the wiki.pages row shape
 * we'll upsert to Supabase in --execute mode (which is currently disabled).
 *
 * Path semantics:
 *   <vault>/<shelf-dir>/<book-dir>/<chapter-dir>/<page>.md
 *   <vault>/<shelf-dir>/<book-dir>/<page>.md     (chapter-less)
 *
 * `pathFromVault` is the natural key for upserts — it's stable across renames
 * of titles but changes if the file is moved. That's the right trade-off for an
 * Obsidian-published vault.
 */
export type VaultPage = {
  pathFromVault: string
  shelf: string
  book: string
  chapter?: string
  title: string
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

/**
 * Walk a vault root and yield every page that fits the Shelf > Book > [Chapter] > Page
 * shape. Quietly skips entries that don't (loose files at root, deeper than chapter).
 */
export function walkVault(vaultRoot: string): VaultPage[] {
  const pages: VaultPage[] = []
  for (const shelfName of readDirSafe(vaultRoot)) {
    if (EXCLUDE_DIRS.has(shelfName) || !shouldInclude(shelfName)) continue
    const shelfPath = join(vaultRoot, shelfName)
    if (!isDir(shelfPath)) continue

    for (const bookName of readDirSafe(shelfPath)) {
      if (EXCLUDE_DIRS.has(bookName) || !shouldInclude(bookName)) continue
      const bookPath = join(shelfPath, bookName)
      if (!isDir(bookPath)) continue

      for (const entry of readDirSafe(bookPath)) {
        if (!shouldInclude(entry)) continue
        const entryPath = join(bookPath, entry)
        if (isDir(entryPath)) {
          // Chapter
          if (EXCLUDE_DIRS.has(entry)) continue
          for (const pageName of readDirSafe(entryPath)) {
            if (!shouldInclude(pageName) || extname(pageName) !== '.md') continue
            const pagePath = join(entryPath, pageName)
            pages.push(readPage(pagePath, vaultRoot, shelfName, bookName, entry))
          }
        } else if (extname(entry) === '.md') {
          pages.push(readPage(entryPath, vaultRoot, shelfName, bookName))
        }
      }
    }
  }
  return pages
}

function isDir(p: string): boolean {
  try {
    return statSync(p).isDirectory()
  } catch {
    return false
  }
}

function readPage(
  absPath: string,
  vaultRoot: string,
  shelf: string,
  book: string,
  chapter?: string,
): VaultPage {
  const content = readFileSync(absPath, 'utf-8')
  const title = basename(absPath, '.md')
  return {
    pathFromVault: relative(vaultRoot, absPath).replace(/\\/g, '/'),
    shelf,
    book,
    chapter,
    title,
    content,
  }
}
