import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ChevronDown, LogOut, Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
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
    { label: 'Revenue', to: '/photographer/revenue' },
    { label: 'Commissions', to: '/photographer/commissions' },
    { label: 'Booking Stats', to: '/photographer/booking-stats' },
    { label: 'Commission Setting', to: '/photographer/commission-setting' },
    { label: 'Services', to: '/photographer/services' },
    { label: 'Packages', to: '/photographer/packages' },
    { label: 'Portfolio', to: '/photographer/portfolio' },
    { label: 'Ví tiền', to: '/photographer/wallet' },
    { label: 'FAQ', to: '/faq' },
    { label: 'Premier', to: '/premier' },
  ],
  ADMIN: [
    { label: 'Người dùng', to: '/admin/users' },
    { label: 'Đơn hàng', to: '/admin/orders' },
    { label: 'Hỗ trợ', to: '/admin/support' },
  ],
}

const ROLE_LABEL: Record<string, string> = {
  USER: 'Khách hàng',
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
    <div className="min-h-screen bg-[var(--color-bg)] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to={homePath} className="flex items-center gap-3">
            <img
              src="https://t4.ftcdn.net/jpg/04/96/47/13/360_F_496471319_DbtjoUvKqyy2e9OfgBnK5mm2AXhKpa9m.jpg"
              alt="PhotoMarket Logo"
              className="h-10 w-10 rounded-xl object-cover shadow-sm"
            />
            <span className="text-lg font-black tracking-tight">
              Photo<span className="text-indigo-600">Market</span>
            </span>
          </Link>

          <nav className="hidden items-center rounded-2xl bg-slate-100/80 p-1 md:flex">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-2 text-[12px] font-bold transition-colors ${
                    isActive ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-950'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 pr-3 shadow-sm transition hover:border-slate-300"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-xl object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-xs font-black text-indigo-600">
                      {user.name[0]}
                    </span>
                  )}
                  <span className="hidden max-w-32 truncate text-sm font-bold text-slate-800 sm:block">{user.name}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                    >
                      <div className="border-b border-slate-100 p-4">
                        <div className="font-bold text-slate-950">{user.name}</div>
                        <div className="mt-1 text-sm text-slate-500">{user.email}</div>
                        <div className="mt-3 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase text-indigo-700">
                          {ROLE_LABEL[role]}
                        </div>
                      </div>
                      <div className="p-2">
                        {links.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setProfileOpen(false)}
                            className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                          >
                            {item.label}
                          </Link>
                        ))}
                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="block rounded-xl px-3 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50"
                        >
                          ⚙️ Hồ sơ & Bảo mật
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Đăng xuất
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-600">
                Đăng nhập
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white md:hidden"
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
              className="overflow-hidden border-t border-slate-100 bg-white md:hidden"
            >
              <div className="space-y-1 p-3">
                {links.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-xl px-4 py-3 text-sm font-bold ${
                        isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'
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
          ⛔ Studio của bạn đã bị Ban và tạm ngưng toàn bộ hoạt động. Vui lòng vào Dashboard để xem lý do chi tiết.
        </div>
      )}

      {myPhotographer?.status === 'PENDING' && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-800">
          Hồ sơ của bạn đang chờ Admin duyệt. Bạn chưa thể nhận booking.
        </div>
      )}


      <main className="mx-auto min-h-[calc(100vh-8rem)] w-full max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="font-semibold text-slate-800">PhotoMarket</span>
          <span>React + Vite + Tailwind CSS</span>
        </div>
      </footer>

      {profileOpen && <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />}
    </div>
  )
}
