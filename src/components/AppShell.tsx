import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { TreeNav } from './TreeNav'
import { Breadcrumbs } from './Breadcrumbs'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'

export function AppShell() {
  const location = useLocation()
  const onDraft = location.pathname.startsWith('/draft')
  // The transcript viewer wants the full viewport (3-pane console), so it opts
  // out of the centered max-w-7xl content column and the wiki tree sidebar.
  const onSessions = location.pathname.startsWith('/sesje')

  const init = useAuthStore((s) => s.init)
  const enabled = useAuthStore((s) => s.enabled)
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const displayName = useAuthStore((s) => s.displayName)
  const signOut = useAuthStore((s) => s.signOut)
  const loadContent = useContentStore((s) => s.load)

  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    init()
    void loadContent()
  }, [init, loadContent])

  // Close drawer on every navigation
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Lock body scroll while drawer is open (only matters on mobile, harmless on desktop)
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-teal-deep text-parchment">
      <header className="border-b-2 border-gold bg-teal-dark">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <Link
            to="/"
            className="font-display text-xl uppercase tracking-widest text-parchment hover:text-gold md:text-2xl"
          >
            Akta Kasandry
          </Link>

          {/* Desktop nav — hidden on mobile */}
          <nav className="font-display hidden items-center gap-6 text-sm uppercase tracking-wider md:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive && !onDraft ? 'text-gold' : 'text-parchment hover:text-gold'
              }
            >
              Wiki
            </NavLink>
            <NavLink
              to="/sesje"
              className={({ isActive }) =>
                isActive ? 'text-gold' : 'text-parchment hover:text-gold'
              }
            >
              Sesje
            </NavLink>
            <NavLink
              to="/draft"
              className={({ isActive }) =>
                isActive ? 'text-gold' : 'text-parchment hover:text-gold'
              }
            >
              Draft
            </NavLink>

            {enabled && role === 'mg' && (
              <NavLink
                to="/admin/import-characters"
                className={({ isActive }) =>
                  isActive ? 'text-gold' : 'text-parchment hover:text-gold'
                }
              >
                Import
              </NavLink>
            )}

            {enabled &&
              (user ? (
                <span className="flex items-center gap-3 normal-case">
                  <span className="font-mono text-xs text-parchment/70">
                    {displayName}
                    {role === 'mg' && <span className="ml-1 text-gold">(MG)</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="font-display text-sm uppercase tracking-wider text-parchment hover:text-gold"
                  >
                    Wyloguj
                  </button>
                </span>
              ) : (
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    isActive ? 'text-gold' : 'text-parchment hover:text-gold'
                  }
                >
                  Zaloguj
                </NavLink>
              ))}
          </nav>

          {/* Mobile hamburger — hidden on desktop */}
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-2 text-parchment transition-colors hover:text-gold md:hidden"
            aria-label={sidebarOpen ? 'Zamknij nawigację' : 'Otwórz nawigację'}
          >
            {sidebarOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile overlay — tap to close */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-teal-deep/80 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile slide-in drawer */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-gold-muted bg-teal-dark',
          'transition-transform duration-300 md:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex-1 overflow-y-auto p-3 pt-5">
          <TreeNav />
        </div>
        {/* Auth footer — replaces the hidden desktop nav links on mobile */}
        {enabled && (
          <div className="border-t border-gold-muted/40 p-3">
            {user ? (
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono truncate text-xs text-parchment/70">
                  {displayName}
                  {role === 'mg' && <span className="ml-1 text-gold">(MG)</span>}
                </span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="font-display shrink-0 text-xs uppercase tracking-wider text-parchment hover:text-gold"
                >
                  Wyloguj
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="font-display text-xs uppercase tracking-wider text-parchment hover:text-gold"
              >
                Zaloguj się
              </Link>
            )}
          </div>
        )}
      </aside>

      {onSessions ? (
        // Full-bleed: the transcript console manages its own layout/width.
        <main className="min-h-[60vh]">
          <Outlet />
        </main>
      ) : (
        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-4 md:px-6 md:py-6">
          {/* Desktop sidebar — hidden on mobile (drawer takes over) */}
          <aside className="hidden w-72 shrink-0 md:block">
            <TreeNav />
          </aside>

          <main className="min-w-0 flex-1">
            <Breadcrumbs />
            <Outlet />
          </main>
        </div>
      )}

      <footer className="border-t border-gold-muted bg-teal-dark py-4">
        <div className="font-mono mx-auto max-w-7xl px-6 text-center text-xs text-parchment/60">
          Rozdarte Sumienie — Boston, A.D. 1924
        </div>
      </footer>
    </div>
  )
}
