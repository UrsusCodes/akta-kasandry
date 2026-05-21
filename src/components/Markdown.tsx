import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Link } from 'react-router-dom'
import { remarkWikilinks } from '@/lib/remarkWikilinks'
import { withBase } from '@/lib/withBase'

type Props = {
  children: string
}

/**
 * Markdown renderer with Cthulhu skin. Wraps react-markdown with:
 * - remark-gfm (tables, strikethrough, autolinks, task lists)
 * - remarkWikilinks (transforms [[Page]] into link nodes pointing to internal URLs)
 * - rehype-raw (renders raw HTML embedded in markdown — needed for the GM's
 *   `<img width="220" align="right">` thumbnail pattern). Content source is
 *   the trusted vault; player-edited pages (stage D) will need a sanitizer.
 * - custom `a` component that uses react-router `<Link>` for internal URLs,
 *   plain `<a target="_blank">` for external ones
 */
export function Markdown({ children }: Props) {
  return (
    <div className="prose-cthulhu bg-parchment p-4 sm:p-8">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkWikilinks]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a({ href, children: linkChildren, ...rest }) {
            if (href && href.startsWith('/')) {
              return (
                <Link to={href} {...(rest as React.HTMLAttributes<HTMLAnchorElement>)}>
                  {linkChildren}
                </Link>
              )
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
                {linkChildren}
              </a>
            )
          },
          // Root-absolute image paths (e.g. /vault-attachments/…) must carry the
          // Vite base in production (/akta-kasandry/…). Covers both markdown
          // ![](…) and rehype-raw <img> nodes. External (http) srcs untouched.
          img({ src, ...rest }) {
            return <img src={withBase(src)} {...rest} />
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
