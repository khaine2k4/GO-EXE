import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Camera, Menu, X, LogOut, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/AppStore'

const NAV: Record<string, { label: string; to: string }[]> = {
  USER: [
    { label: 'Trang chủ', to: '/' },
    { label: 'Khám phá', to: '/gallery' },
    { label: 'Bộ sưu tập', to: '/photosets' },
    { label: 'Bookings', to: '/customer/bookings' },
    { label: 'FAQ', to: '/faq' },
    { label: 'Premier', to: '/premier' },
  ],
  PHOTOGRAPHER: [
    { label: 'Dashboard', to: '/photographer/dashboard' },
    { label: 'Portfolio', to: '/photographer/portfolio' },
    { label: 'Ví tiền', to: '/photographer/wallet' },
    { label: 'FAQ', to: '/faq' },
    { label: 'Premier', to: '/premier' },
  ],
  ADMIN: [
    { label: 'Người dùng', to: '/admin/users' },
    { label: 'Đơn hàng', to: '/admin/orders' },
    { label: 'Hỗ trợ/Risks', to: '/admin/support' },
  ],
}

const ROLE_LABEL: Record<string, string> = {
  USER: 'Khách hàng',
  PHOTOGRAPHER: 'Photographer',
  ADMIN: 'Admin',
}

export default function Layout() {
  const { state, actions } = useAppStore()
  const nav = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const user = state.currentUser
  const role = user?.role ?? 'USER'
  const links = NAV[role] ?? NAV.USER

  function handleLogout() {
    actions.logout()
    nav('/login')
    setProfileOpen(false)
  }

  // Pending photographer warning
  const myPhotographer = role === 'PHOTOGRAPHER'
    ? state.photographers.find((p) => p.id === user?.id)
    : null
  const isPending = myPhotographer?.status === 'PENDING'

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Premium Glass Navbar */}
      <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 rounded-[28px] border border-white/40 bg-white/70 px-6 shadow-xl shadow-slate-200/40 backdrop-blur-2xl ring-1 ring-slate-200/50">
          {/* Logo with modern accent */}
          <Link to={role === 'PHOTOGRAPHER' ? '/photographer/dashboard' : role === 'ADMIN' ? '/admin/users' : '/'} className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-slate-900 text-white shadow-lg transition-all group-hover:bg-indigo-600 group-hover:scale-105">
              <Camera className="z-10 h-5 w-5" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900">
              Photo<span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">Market</span>
            </span>
          </Link>

          {/* Nav Links - Modern Pill Style */}
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="relative rounded-xl px-5 py-2 text-[13px] font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-1 pr-3 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-95"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-9 w-9 rounded-xl object-cover ring-2 ring-slate-50" />
                  ) : (
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-[11px] font-black text-indigo-600 ring-2 ring-indigo-100">
                      {user.name[0]}
                    </div>
                  )}
                  <div className="flex flex-col items-start hidden sm:flex">
                    <span className="text-[11px] font-black text-slate-900 leading-tight">{user.name}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 leading-tight">{ROLE_LABEL[role]}</span>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                      className="absolute right-0 top-full mt-3 w-72 overflow-hidden rounded-[32px] border border-white/60 bg-white/95 shadow-2xl shadow-slate-200/60 backdrop-blur-xl ring-1 ring-slate-200/50"
                    >
                      <div className="bg-slate-50/50 px-6 py-6 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="h-12 w-12 rounded-2xl object-cover shadow-md" />
                          ) : (
                            <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-sm font-black text-white">
                              {user.name[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-[15px] font-black text-slate-900 truncate">{user.name}</div>
                            <div className="text-[11px] font-bold text-slate-500 truncate mt-0.5">{user.email}</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 space-y-1">
                        <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Điều hướng nhanh</div>
                        {links.map((l) => (
                          <Link key={l.to} to={l.to} onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-98">
                            {l.label}
                          </Link>
                        ))}

                        <div className="my-3 h-px bg-slate-100 mx-4" />

                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[13px] font-bold text-rose-600 hover:bg-rose-50 transition-all active:scale-98"
                        >
                          <LogOut className="h-4 w-4" />
                          Đăng xuất hệ thống
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="rounded-2xl bg-slate-900 px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/10 transition-all hover:bg-indigo-600 active:scale-95">
                Đăng nhập
              </Link>
            )}

            {/* Mobile Switcher */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm border border-slate-100 md:hidden active:scale-90 transition-all">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 overflow-hidden rounded-[28px] border border-slate-100 bg-white/95 shadow-xl backdrop-blur-xl md:hidden"
            >
              <div className="flex flex-col gap-1 p-3">
                {links.map((l) => (
                  <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                    className="rounded-2xl px-5 py-4 text-[13px] font-bold text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-all">
                    {l.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Pending warning */}
      {isPending && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-700 font-medium">
          ⏳ Hồ sơ của bạn đang chờ Admin duyệt. Bạn chưa thể nhận booking.
        </div>
      )}

      {/* Page content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-slate-400 sm:flex-row">
          <div className="flex items-center gap-2">
            <Camera className="h-3.5 w-3.5" />
            <span className="font-semibold text-slate-600">PhotoMarket</span>
            <span>© 2026</span>
          </div>
          <span>Built with React · Vite · Tailwind CSS · Framer Motion</span>
        </div>
      </footer>

      {/* Click outside to close profile dropdown */}
      {profileOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
      )}
    </div>
  )
}
