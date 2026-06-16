import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import logoImg from '../assets/GO - EXE logo.png'
import { ChevronDown, LogOut, Menu, X, MessageCircle, Mail, Phone, MapPin } from 'lucide-react'
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
  const [showHeader, setShowHeader] = useState(true)

  // Scroll to top on every route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // Smart Header Scroll Handling (Hide on scroll down, show on scroll up)
  useEffect(() => {
    let lastScrollY = window.scrollY
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowHeader(false)
      } else {
        setShowHeader(true)
      }
      lastScrollY = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  function handleLogoClick(event: React.MouseEvent) {
    if (location.pathname === homePath) {
      event.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className={`app-shell ${showHeader ? '' : 'header-hidden'}`}>
      <header className={`sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/86 backdrop-blur-xl transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="page-shell relative flex h-16 items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
          <Link to={homePath} onClick={handleLogoClick} className="flex shrink-0 items-center">
            <img
              src={logoImg}
              alt="GO! Logo"
              className="h-10 w-auto object-contain transition-all hover:scale-105 sm:h-12"
            />
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
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
                  <ChevronDown className={`hidden h-4 w-4 text-slate-400 transition sm:block ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-full z-50 mt-3 w-[calc(100vw-2rem)] max-w-72 overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white shadow-xl"
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
              <Link to="/login" className="primary-pill px-3 py-2 text-xs font-medium sm:px-5 sm:py-2.5 sm:text-sm">
                Đăng nhập
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white lg:hidden"
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
              className="overflow-hidden border-t border-[var(--color-border)] bg-white lg:hidden"
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
        <Outlet context={{ showHeader }} />
      </main>

      <footer className="border-t border-[var(--color-border)] bg-white pt-12 pb-8">
        <div className="page-shell px-4 sm:px-6">
          <div className="grid gap-8 pb-8 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
            {/* Column 1: Brand Info */}
            <div className="space-y-4">
              <Link to={homePath} onClick={handleLogoClick} className="inline-block">
                <img
                  src={logoImg}
                  alt="GO! Logo"
                  className="h-10 w-auto object-contain transition-all hover:scale-105"
                />
              </Link>
              <p className="max-w-xs text-sm leading-6 text-[var(--color-graphite)]">
                Nền tảng đặt lịch chụp ảnh & studio hàng đầu tại Đà Nẵng. Kết nối khách hàng và các studio chuyên nghiệp một cách nhanh chóng, minh bạch và an toàn.
              </p>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-wider text-[var(--color-ink)]">Khám phá</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/" className="text-[var(--color-graphite)] hover:text-[var(--color-azure)] transition-colors">Trang chủ</Link>
                </li>
                <li>
                  <Link to="/photosets" className="text-[var(--color-graphite)] hover:text-[var(--color-azure)] transition-colors">Dịch vụ chụp ảnh</Link>
                </li>
                <li>
                  <Link to="/gallery" className="text-[var(--color-graphite)] hover:text-[var(--color-azure)] transition-colors">Danh sách Studio</Link>
                </li>
                <li>
                  <Link to="/faq" className="text-[var(--color-graphite)] hover:text-[var(--color-azure)] transition-colors">Câu hỏi thường gặp</Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Booking Workflow */}
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-wider text-[var(--color-ink)]">Quy trình</h4>
              <ul className="space-y-2.5 text-sm text-[var(--color-graphite)]">
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-[var(--color-azure)]">1</span>
                  <span>Tìm kiếm & So sánh</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-[var(--color-azure)]">2</span>
                  <span>Đặt lịch & Đặt cọc</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-[var(--color-azure)]">3</span>
                  <span>Studio xác nhận</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-[var(--color-azure)]">4</span>
                  <span>Nhận ảnh & Đánh giá</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact info */}
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-wider text-[var(--color-ink)]">Liên hệ & Hỗ trợ</h4>
              <ul className="space-y-3.5 text-sm text-[var(--color-graphite)]">
                <li className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 shrink-0 text-[var(--color-azure)] mt-0.5" />
                  <span>Khu đô thị FPT City, Ngũ Hành Sơn, TP. Đà Nẵng, Việt Nam</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-[var(--color-azure)]" />
                  <span>(0236) 730 0999 (08:00 - 21:00)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-[var(--color-azure)]" />
                  <span>support@goexe.vn</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom copyright and legal links */}
          <div className="mt-8 border-t border-[var(--color-border)] pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-400">
            <div>
              © 2026 GO! Studio Marketplace. Tất cả quyền được bảo lưu.
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <a href="#" className="hover:text-[var(--color-azure)] transition-colors">Điều khoản dịch vụ</a>
              <a href="#" className="hover:text-[var(--color-azure)] transition-colors">Chính sách bảo mật</a>
              <a href="#" className="hover:text-[var(--color-azure)] transition-colors">Giải quyết khiếu nại</a>
            </div>
          </div>
        </div>
      </footer>

      {profileOpen && <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />}
      <AIChatbot />
    </div>
  )
}
