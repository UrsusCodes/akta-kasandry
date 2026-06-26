import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { remarkBlockIds } from './remarkBlockIds'
import { shortHash, normalizeText } from './comments/anchor'

function process(md: string) {
  const tree = unified().use(remarkParse).parse(md)
  remarkBlockIds()(tree)
  return tree
}

describe('remarkBlockIds', () => {
  it('attaches a stable data-block-id to paragraphs based on normalized text', () => {
    const tree: any = process('Pierwsza   strzelanina na farmie.')
    const para = tree.children[0]
    const expected = shortHash(normalizeText('Pierwsza strzelanina na farmie.'))
    expect(para.data.hProperties['data-block-id']).toBe(expected)
  })
})
