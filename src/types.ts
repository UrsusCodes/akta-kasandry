/**
 * Recursive content tree. Mirrors how Obsidian organises a vault: folders
 * nested arbitrarily deep, leaf `.md` files are pages. No fixed hierarchy
 * (no Shelf/Book/Chapter levels — those were a BookStack artifact).
 *
 * A node is either a folder (has `children`, no `body`) or a page (has
 * `body`, no `children`). A folder *can* additionally carry an "index"
 * page-body when the vault has a `Folder/Folder.md` companion file — the
 * UI treats clicking the folder as opening that body.
 */
export type ContentNode = {
  name: string            // display name (file/folder basename, with diacritics + spaces)
  slug: string            // URL-safe segment (lowercase, dash, no diacritics)
  path: string            // slash-joined slug path from root, used as URL key
  kind: 'folder' | 'page'
  children?: ContentNode[]
  body?: string           // page content, or folder index-page body
}

export type Crumb = {
  label: string
  to?: string
}

export type Pin = {
  id: string
  lat: number
  lng: number
  title: string
  description: string
  label: string
}
