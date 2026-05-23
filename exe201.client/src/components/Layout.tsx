import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ChevronDown, LogOut, Menu, X, MessageCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '../store/AppStore'

const NAV: Record<string, { label: string; to: string }[]> = {
  USER: [
    { label: 'Home', to: '/' },
    { label: 'Services', to: '/photosets' },
    { label: 'Studios', to: '/gallery' },
    { label: 'My Bookings', to: '/customer/bookings' },
    { label: 'Become a Studio', to: '/register' },
  ],
  PHOTOGRAPHER: [
    { label: 'Dashboard', to: '/photographer/dashboard' },
    { label: 'Revenue', to: '/photographer/revenue' },
    { label: 'Commissions', to: '/photographer/commissions' },
    { label: 'Booking Stats', to: '/photographer/booking-stats' },
    { label: 'Services', to: '/photographer/services' },
    { label: 'Packages', to: '/photographer/packages' },
    { label: 'Portfolio', to: '/photographer/portfolio' },
    { label: 'Wallet', to: '/photographer/wallet' },
  ],
  ADMIN: [
    { label: 'Users', to: '/admin/users' },
    { label: 'Bookings', to: '/admin/orders' },
    { label: 'Reports', to: '/admin/support' },
  ],
}

const ROLE_LABEL: Record<string, string> = {
  USER: 'Customer',
  PHOTOGRAPHER: 'Photographer',
  ADMIN: 'Admin',
}

export default function Layout() {
  const { state, actions } = useAppStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const user = state.currentUser
  const role = user?.role ?? 'USER'
  const links = NAV[role] ?? NAV.USER
  const homePath = role === 'PHOTOGRAPHER' ? '/photographer/dashboard' : role === 'ADMIN' ? '/admin/users' : '/'
  const myPhotographer = role === 'PHOTOGRAPHER' ? state.photographers.find((p) => p.id === user?.id) : null

  function handleLogout() {
    actions.logout()
    setProfileOpen(false)
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/86 backdrop-blur-xl">
        <div className="page-shell flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <Link to={homePath} className="flex items-center gap-3">
            <img
              src="https://t4.ftcdn.net/jpg/04/96/47/13/360_F_496471319_DbtjoUvKqyy2e9OfgBnK5mm2AXhKpa9m.jpg"
              alt="PhotoMarket Logo"
              className="h-10 w-10 rounded-full object-cover shadow-sm"
            />
            <span className="text-lg font-semibold text-[var(--color-ink)]">
              Photo<span className="text-[var(--color-azure)]">Market</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-[var(--color-fog)] text-[var(--color-ink)]' : 'text-[var(--color-graphite)] hover:text-[var(--color-ink)]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user && role !== 'ADMIN' && (
              <Link
                to="/chat"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[var(--color-graphite)] shadow-sm transition hover:border-[var(--color-azure)] hover:text-[var(--color-azure)]"
                title="Hộp thư"
                aria-label="Hộp thư"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
            )}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white p-1.5 pr-3 shadow-sm transition hover:border-slate-300"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-[var(--color-azure)]">
                      {user.name[0]}
                    </span>
                  )}
                  <span className="hidden max-w-32 truncate text-sm font-medium text-[var(--color-ink)] sm:block">{user.name}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white shadow-xl"
                    >
                      <div className="border-b border-slate-100 p-4">
                        <div className="font-semibold text-[var(--color-ink)]">{user.name}</div>
                        <div className="mt-1 text-sm text-slate-500">{user.email}</div>
                        <div className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase text-[var(--color-azure)]">
                          {ROLE_LABEL[role]}
                        </div>
                      </div>
                      <div className="p-2">
                        {links.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setProfileOpen(false)}
                            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-[var(--color-fog)] hover:text-[var(--color-ink)]"
                          >
                            {item.label}
                          </Link>
                        ))}
                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--color-azure)] hover:bg-blue-50"
                        >
                          Profile & Security
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="primary-pill px-5 py-2.5 text-sm font-medium">
                Sign in
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white md:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[var(--color-border)] bg-white md:hidden"
            >
              <div className="space-y-1 p-3">
                {links.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-full px-4 py-3 text-sm font-medium ${
                        isActive ? 'bg-[var(--color-ink)] text-white' : 'text-slate-600 hover:bg-[var(--color-fog)]'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {myPhotographer?.status === 'BANNED' && (
        <div className="border-b border-red-300 bg-red-100 px-4 py-2 text-center text-sm font-semibold text-red-800">
          Your studio is banned and temporarily paused. Open Dashboard for details.
        </div>
      )}

      {myPhotographer?.status === 'PENDING' && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-800">
          Your studio profile is waiting for admin approval. You cannot receive bookings yet.
        </div>
      )}

      <main className="page-shell min-h-[calc(100vh-8rem)] px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--color-border)] bg-white">
        <div className="page-shell flex flex-col gap-2 px-4 py-6 text-sm text-[var(--color-graphite)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="font-semibold text-[var(--color-ink)]">PhotoMarket</span>
          <span>Search, compare, book, and review trusted studios.</span>
        </div>
      </footer>

      {profileOpen && <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />}
    </div>
  )
}
