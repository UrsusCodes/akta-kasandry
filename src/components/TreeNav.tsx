import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import type { ContentNode } from '@/types'
import { contentTree } from '@/mocks/content'

/**
 * Recursive Obsidian-style sidebar. Folders are collapsible; pages are links.
 * A folder that *contains* the currently-open page auto-expands on mount and
 * on route change.
 */
export function TreeNav() {
  return (
    <nav aria-label="content tree" className="space-y-0.5">
      {contentTree.map((node) => (
        <TreeItem key={node.path} node={node} depth={0} />
      ))}
    </nav>
  )
}

function TreeItem({ node, depth }: { node: ContentNode; depth: number }) {
  const location = useLocation()
  const activePath = decodeURIComponent(location.pathname.replace(/^\/p\//, ''))
  const isOnPath = activePath === node.path || activePath.startsWith(node.path + '/')

  const [open, setOpen] = useState<boolean>(isOnPath || depth === 0)

  useEffect(() => {
    if (isOnPath) setOpen(true)
  }, [isOnPath])

  const indent = { paddingLeft: `${depth * 14}px` }

  if (node.kind === 'page') {
    return (
      <NavLink
        to={`/p/${node.path}`}
        style={indent}
        className={({ isActive }) =>
          `font-body block truncate border-l-2 py-1 pr-2 pl-3 text-sm transition-colors ${
            isActive
              ? 'border-gold bg-teal-dark/60 text-gold'
              : 'border-transparent text-parchment hover:border-gold-muted hover:text-gold'
          }`
        }
        title={node.name}
      >
        {node.name}
      </NavLink>
    )
  }

  // folder
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={indent}
        className={`font-display flex w-full items-center gap-1 py-1 pr-2 pl-1 text-left text-sm uppercase tracking-wider transition-colors ${
          isOnPath ? 'text-gold' : 'text-parchment hover:text-gold'
        }`}
        title={node.name}
      >
        <span className="inline-block w-3 text-gold-muted">{open ? '▾' : '▸'}</span>
        <span className="truncate">{node.name}</span>
      </button>
      {open && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeItem key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
