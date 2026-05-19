import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { shelves } from '@/mocks/content'
import { Breadcrumbs } from './Breadcrumbs'

export function AppShell() {
  const location = useLocation()
  const onMap = location.pathname.startsWith('/map')
  const onDraft = location.pathname.startsWith('/draft')

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
          <nav className="font-display flex gap-6 text-sm uppercase tracking-wider">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive && !onMap && !onDraft ? 'text-gold' : 'text-parchment hover:text-gold'
              }
            >
              Półki
            </NavLink>
            <NavLink
              to="/map"
              className={({ isActive }) =>
                isActive ? 'text-gold' : 'text-parchment hover:text-gold'
              }
            >
              Mapa
            </NavLink>
            <NavLink
              to="/draft"
              className={({ isActive }) =>
                isActive ? 'text-gold' : 'text-parchment hover:text-gold'
              }
            >
              Draft
            </NavLink>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
        <aside className="w-72 shrink-0">
          <h2 className="font-display mb-3 text-xs uppercase tracking-widest text-gold-muted">
            Półki
          </h2>
          <ul className="space-y-2">
            {shelves.map((shelf) => (
              <li key={shelf.slug}>
                <NavLink
                  to={`/s/${shelf.slug}`}
                  className={({ isActive }) =>
                    `font-display block border-l-2 px-3 py-2 text-lg uppercase tracking-wider transition-colors ${
                      isActive
                        ? 'border-gold bg-teal-dark/60 text-gold'
                        : 'border-transparent text-parchment hover:border-gold-muted hover:text-gold'
                    }`
                  }
                >
                  {shelf.title}
                </NavLink>
              </li>
            ))}
          </ul>
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
