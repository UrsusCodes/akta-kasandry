import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from 'react-router-dom'
import { remarkWikilinks } from '@/lib/remarkWikilinks'

type Props = {
  children: string
}

/**
 * Markdown renderer with Cthulhu skin. Wraps react-markdown with:
 * - remark-gfm (tables, strikethrough, autolinks, task lists)
 * - remarkWikilinks (transforms [[Page]] into link nodes pointing to internal URLs)
 * - custom `a` component that uses react-router `<Link>` for internal URLs,
 *   plain `<a target="_blank">` for external ones
 */
export function Markdown({ children }: Props) {
  return (
    <div className="prose-cthulhu bg-parchment p-8">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkWikilinks]}
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
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
