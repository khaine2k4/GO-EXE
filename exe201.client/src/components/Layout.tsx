import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import logoImg from '../assets/GO - EXE logo.png'
import { ChevronDown, LogOut, Menu, X, MessageCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '../store/AppStore'
import AIChatbot from './AIChatbot'
import NotificationBell from './NotificationBell'
import api from '../api/axios'

const NAV: Record<string, { label: string; to: string }[]> = {
  USER: [
    { label: 'Trang chủ', to: '/' },
    { label: 'Dịch vụ', to: '/photosets' },
    { label: 'Studio', to: '/gallery' },
    { label: 'Booking của tôi', to: '/customer/bookings' },
  ],
  CUSTOMER: [
    { label: 'Trang chủ', to: '/' },
    { label: 'Dịch vụ', to: '/photosets' },
    { label: 'Studio', to: '/gallery' },
    { label: 'Booking của tôi', to: '/customer/bookings' },
  ],
  PHOTOGRAPHER: [
    { label: 'Tổng quan', to: '/photographer/dashboard' },
    { label: 'Quản lý', to: '/photographer/dashboard?tab=manage' },
    { label: 'Booking', to: '/photographer/dashboard?tab=bookings' },
    { label: 'Tài chính', to: '/photographer/dashboard?tab=finance' },
    { label: 'Nội dung', to: '/photographer/dashboard?tab=content' },
  ],
  STUDIO_OWNER: [
    { label: 'Tổng quan', to: '/photographer/dashboard' },
    { label: 'Quản lý', to: '/photographer/dashboard?tab=manage' },
    { label: 'Booking', to: '/photographer/dashboard?tab=bookings' },
    { label: 'Tài chính', to: '/photographer/dashboard?tab=finance' },
    { label: 'Nội dung', to: '/photographer/dashboard?tab=content' },
  ],
  ADMIN: [
    { label: 'Người dùng', to: '/admin/users' },
    { label: 'Booking', to: '/admin/orders' },
    { label: 'Báo cáo', to: '/admin/support' },
  ],
}

const GUEST_NAV = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Dịch vụ', to: '/photosets' },
  { label: 'Studio', to: '/gallery' },
]

const ROLE_LABEL: Record<string, string> = {
  USER: 'Khách hàng',
  CUSTOMER: 'Khách hàng',
  PHOTOGRAPHER: 'Studio',
  STUDIO_OWNER: 'Studio',
  ADMIN: 'Admin',
}

export default function Layout() {
  const { state, actions } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [unreadChatCount, setUnreadChatCount] = useState(0)

  const user = state.currentUser
  const role = String(user?.role ?? 'USER')
  const links = user ? NAV[role] ?? NAV.USER : GUEST_NAV
  const isPhotographer = role === 'PHOTOGRAPHER' || role === 'STUDIO_OWNER'
  const homePath = user && isPhotographer ? '/photographer/dashboard' : user && role === 'ADMIN' ? '/admin/users' : '/'
  const myPhotographer = isPhotographer ? state.photographers.find((p) => p.id === user?.id) : null

  // Fetch unread chat messages count
  useEffect(() => {
    if (!user || role === 'ADMIN') return

    const fetchUnreadChat = async () => {
      try {
        const res = await api.get('/chat/unread-count')
        setUnreadChatCount(res.data.count)
      } catch (error) {
        console.error('Error fetching unread chat count:', error)
      }
    }

    fetchUnreadChat()
    const interval = setInterval(fetchUnreadChat, 8000) // Poll every 8 seconds
    return () => clearInterval(interval)
  }, [user, role])

  function handleLogout() {
    actions.logout()
    setProfileOpen(false)
    navigate('/login')
  }

  function isActiveLink(to: string) {
    const [path, query] = to.split('?')
    if (query) return location.pathname === path && location.search === `?${query}`
    if (to === '/') return location.pathname === '/'
    if (to === '/photographer/dashboard') return location.pathname === to && !location.search
    return location.pathname === to
  }

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/86 backdrop-blur-xl">
        <div className="page-shell relative flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <Link to={homePath} className="flex shrink-0 items-center">
            <img
              src={logoImg}
              alt="GO! Logo"
              className="h-12 w-auto object-contain transition-all hover:scale-105"
            />
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActiveLink(item.to) ? 'bg-[var(--color-fog)] text-[var(--color-ink)]' : 'text-[var(--color-graphite)] hover:text-[var(--color-ink)]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {user && (
              <NotificationBell />
            )}
            {user && role !== 'ADMIN' && (
              <Link
                to="/chat"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[var(--color-graphite)] shadow-sm transition hover:border-[var(--color-azure)] hover:text-[var(--color-azure)]"
                title="Hộp thư"
                aria-label="Hộp thư"
              >
                <MessageCircle className="h-5 w-5" />
                {unreadChatCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white ring-2 ring-white shadow-sm animate-pulse">
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </span>
                )}
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
                        {role !== 'ADMIN' && (
                          <Link
                            to={isPhotographer ? "/photographer/dashboard?tab=finance" : "/profile?tab=wallet"}
                            onClick={() => setProfileOpen(false)}
                            className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
                          >
                            💳 Ví tiền của tôi
                          </Link>
                        )}
                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--color-azure)] hover:bg-blue-50"
                        >
                          Hồ sơ & bảo mật
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
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
              <Link to="/login" className="primary-pill px-5 py-2.5 text-sm font-medium">
                Đăng nhập
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
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-full px-4 py-3 text-sm font-medium ${
                      isActiveLink(item.to) ? 'bg-[var(--color-ink)] text-white' : 'text-slate-600 hover:bg-[var(--color-fog)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {myPhotographer?.status === 'BANNED' && (
        <div className="border-b border-red-300 bg-red-100 px-4 py-2 text-center text-sm font-semibold text-red-800">
          Studio của bạn đang bị tạm khóa. Vui lòng mở Dashboard để xem chi tiết.
        </div>
      )}

      {myPhotographer?.status === 'PENDING' && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-800">
          Hồ sơ studio đang chờ admin duyệt. Bạn chưa thể nhận booking.
        </div>
      )}

      <main className="page-shell min-h-[calc(100vh-8rem)] px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--color-border)] bg-white">
        <div className="page-shell grid gap-6 px-4 py-8 text-sm text-[var(--color-graphite)] sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <div className="text-xl font-black text-[var(--color-ink)]">GO<span className="text-[var(--color-orange)]">!</span></div>
            <p className="mt-2 max-w-md leading-6">Marketplace đặt lịch studio tại Đà Nẵng: tìm kiếm, so sánh, gửi yêu cầu booking, chờ studio xác nhận và đánh giá sau khi hoàn thành.</p>
          </div>
          <div>
            <div className="font-bold text-[var(--color-ink)]">Quy trình</div>
            <p className="mt-2 leading-6">Tìm kiếm {'->'} So sánh {'->'} Đặt lịch {'->'} Studio xác nhận {'->'} Đánh giá</p>
          </div>
          <div>
            <div className="font-bold text-[var(--color-ink)]">Hỗ trợ</div>
            <p className="mt-2 leading-6">Booking, báo cáo ảnh, ví tiền và quản lý studio trong một hệ thống.</p>
          </div>
        </div>
      </footer>

      {profileOpen && <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />}
      <AIChatbot />
    </div>
  )
}
