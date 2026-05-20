import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { TreeNav } from './TreeNav'
import { Breadcrumbs } from './Breadcrumbs'
import { useAuthStore } from '@/stores/auth'

export function AppShell() {
  const location = useLocation()
  const onDraft = location.pathname.startsWith('/draft')

  const init = useAuthStore((s) => s.init)
  const enabled = useAuthStore((s) => s.enabled)
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const displayName = useAuthStore((s) => s.displayName)
  const signOut = useAuthStore((s) => s.signOut)

  useEffect(() => {
    init()
  }, [init])

  return (
    <div className="min-h-screen bg-teal-deep text-parchment">
      <header className="border-b-2 border-gold bg-teal-dark">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="font-display text-2xl uppercase tracking-widest text-parchment hover:text-gold"
          >
            Akta Kasandry
          </Link>
          <nav className="font-display flex items-center gap-6 text-sm uppercase tracking-wider">
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
              to="/draft"
              className={({ isActive }) =>
                isActive ? 'text-gold' : 'text-parchment hover:text-gold'
              }
            >
              Draft
            </NavLink>

            {/* MG-only admin link. */}
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

            {/* Auth affordances — only when Supabase is configured. */}
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
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
        <aside className="w-72 shrink-0">
          <TreeNav />
        </aside>

        <main className="min-w-0 flex-1">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>

      <footer className="border-t border-gold-muted bg-teal-dark py-4">
        <div className="font-mono mx-auto max-w-7xl px-6 text-center text-xs text-parchment/60">
          Rozdarte Sumienie — Boston, A.D. 1924
        </div>
      </footer>
    </div>
  )
}
