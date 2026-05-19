import MDEditor from '@uiw/react-md-editor'
import remarkGfm from 'remark-gfm'
import { Link } from 'react-router-dom'
import { remarkWikilinks } from '@/lib/remarkWikilinks'
import { useDraftStore } from '@/stores/draft'

/**
 * /draft — in-memory editor with live preview.
 *
 * The preview pane is wired with the same `remarkGfm` + `remarkWikilinks` plugins
 * as the read-mode renderer in `src/components/Markdown.tsx`, plus the same
 * react-router-aware `<a>` component override. What you see while typing matches
 * what readers will see — except wikilinks resolve against the *current* mock
 * content tree (broken targets render as italic, per the renderer's broken-link
 * convention).
 *
 * Stage D proper: save → wiki.revisions, gate by Supabase Auth, attach to a
 * page by slug.
 */
export function DraftView() {
  const body = useDraftStore((s) => s.body)
  const setBody = useDraftStore((s) => s.setBody)
  const reset = useDraftStore((s) => s.reset)

  return (
    <article>
      <header className="flex items-baseline justify-between">
        <h1 className="font-display text-4xl uppercase tracking-widest text-parchment">
          Draft
        </h1>
        <button
          type="button"
          onClick={reset}
          className="font-mono border border-gold-muted px-3 py-1 text-xs text-parchment hover:border-gold hover:text-gold"
        >
          przywróć próbkę
        </button>
      </header>
      <p className="font-body mt-2 italic text-parchment/80">
        Edytor in-memory. Wikilinki w podglądzie rozwiązują się względem mock-contentu (klikaj
        np. <code className="font-mono">[[Beacon Hill]]</code>).
      </p>

      <div className="mt-6 bg-parchment" data-color-mode="light">
        <MDEditor
          value={body}
          onChange={(v) => setBody(v ?? '')}
          height={600}
          preview="live"
          previewOptions={{
            remarkPlugins: [remarkGfm, remarkWikilinks],
            components: {
              a({ href, children, ...rest }) {
                if (href && href.startsWith('/')) {
                  return (
                    <Link to={href} {...(rest as React.HTMLAttributes<HTMLAnchorElement>)}>
                      {children}
                    </Link>
                  )
                }
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
                    {children}
                  </a>
                )
              },
            },
          }}
        />
      </div>
    </article>
  )
}
