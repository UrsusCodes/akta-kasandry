export type Page = {
  slug: string
  title: string
  body: string
}

export type Chapter = {
  slug: string
  title: string
  pages: Page[]
}

export type Book = {
  slug: string
  title: string
  description?: string
  chapters?: Chapter[]
  pages?: Page[]
}

export type Shelf = {
  slug: string
  title: string
  description?: string
  books: Book[]
}

export type Crumb = {
  label: string
  to?: string
}

export type Pin = {
  id: string
  x: number
  y: number
  title: string
  description: string
  label: string
}
