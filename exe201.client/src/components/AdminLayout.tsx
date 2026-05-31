import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import logoImg from '../assets/GO - EXE logo.png'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Banknote, BarChart3, Bell, BriefcaseBusiness, ChevronLeft, CircleDollarSign, FolderTree, HandCoins, LifeBuoy, LogOut, Menu, MessageSquare, Percent, ShieldCheck, Users, X } from 'lucide-react'
import { useAppStore } from '../store/AppStore'

export default function AdminLayout() {
  const { state, actions } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  const pendingApprovalsCount = state.photographers.filter((item) => item.status === 'PENDING').length
  const openDisputesCount = state.disputes.filter((item) => item.status === 'open').length
  const totalNotifications = pendingApprovalsCount + openDisputesCount

  const navItems = useMemo(
    () => [
      { to: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
      { to: '/admin/users', label: 'Người dùng', icon: Users, badge: pendingApprovalsCount || undefined },
      { to: '/admin/orders', label: 'Booking & thanh toán', icon: ShieldCheck, badge: openDisputesCount || undefined },
      { to: '/admin/services', label: 'Services', icon: BriefcaseBusiness },
      { to: '/admin/payments', label: 'Payments', icon: CircleDollarSign },
      { to: '/admin/revenue', label: 'Revenue', icon: Banknote },
      { to: '/admin/commissions', label: 'Commissions', icon: Percent },
      { to: '/admin/settlements', label: 'Payout approvals', icon: HandCoins },
      { to: '/admin/payouts', label: 'Duyệt rút tiền (PayOS)', icon: Banknote },
      { to: '/admin/support', label: 'Reports', icon: LifeBuoy },
      { to: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
      { to: '/admin/categories', label: 'Categories', icon: FolderTree },
    ],
    [openDisputesCount, pendingApprovalsCount]
  )

  const pageTitle = useMemo(() => {
    if (location.pathname.includes('/admin/dashboard')) return 'Dashboard'
    if (location.pathname.includes('/admin/orders')) return 'Booking & thanh toán'
    if (location.pathname.includes('/admin/services')) return 'Services'
    if (location.pathname.includes('/admin/payments')) return 'Payments'
    if (location.pathname.includes('/admin/revenue')) return 'Revenue'
    if (location.pathname.includes('/admin/commissions')) return 'Commissions'
    if (location.pathname.includes('/admin/settlements')) return 'Payout approvals'
    if (location.pathname.includes('/admin/payouts')) return 'Duyệt rút tiền (PayOS)'
    if (location.pathname.includes('/admin/support')) return 'Reports'
    if (location.pathname.includes('/admin/reviews')) return 'Quản lý Reviews'
    if (location.pathname.includes('/admin/categories')) return 'Categories'
    return 'Người dùng & studio'
  }, [location.pathname])

  function handleLogout() {
    actions.logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[var(--color-fog)] text-[var(--color-ink)]">
      <button
        type="button"
        onClick={() => setMobileOpen((value) => !value)}
        className="fixed right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm md:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <motion.aside
        animate={{ width: collapsed ? 88 : 264 }}
        transition={{ duration: 0.25 }}
        className="fixed bottom-0 left-0 top-0 z-40 hidden flex-col border-r border-[var(--color-border)] bg-white text-slate-700 md:flex"
      >
        <div className="flex h-16 items-center gap-3 border-b border-[var(--color-border)] px-5">
          <img
            src={logoImg}
            alt="Logo"
            className="h-12 w-auto shrink-0 object-contain transition-all hover:scale-105"
          />
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--color-ink)]">PhotoMarket</div>
              <div className="text-xs text-[var(--color-graphite)]">Admin Console</div>
            </div>
          )}
          <button type="button" onClick={() => setCollapsed((value) => !value)} className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <ChevronLeft className={`h-4 w-4 transition ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                  isActive ? 'bg-[var(--color-fog)] text-[var(--color-ink)]' : 'text-slate-500 hover:bg-[var(--color-fog)] hover:text-[var(--color-ink)]'
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {item.badge && (
                <span className={`${collapsed ? 'absolute right-1 top-1' : 'ml-auto'} rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-semibold text-white`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[var(--color-border)] p-3">
          <Link to="/" className="mb-2 flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-500 hover:bg-[var(--color-fog)] hover:text-[var(--color-ink)]">
            <ArrowLeft className="h-5 w-5" />
            {!collapsed && <span>Về trang chính</span>}
          </Link>
          <button type="button" onClick={handleLogout} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600">
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-950/50 md:hidden" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed bottom-0 left-0 top-0 z-50 w-72 border-r border-slate-200 bg-white p-4 text-slate-700 md:hidden">
              <div className="mb-5 flex items-center gap-3">
                <img
                  src={logoImg}
                  alt="Logo"
                  className="h-12 w-auto object-contain transition-all hover:scale-105"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-950">PhotoMarket</div>
                  <div className="text-xs text-slate-400">Admin Console</div>
                </div>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium ${isActive ? 'bg-[var(--color-fog)] text-[var(--color-ink)]' : 'text-slate-500 hover:bg-[var(--color-fog)] hover:text-[var(--color-ink)]'}`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    {item.badge && <span className="ml-auto rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-semibold text-white">{item.badge}</span>}
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <motion.div animate={{ marginLeft: collapsed ? 88 : 264 }} transition={{ duration: 0.25 }} className="min-h-screen md:block" style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : undefined }}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-white/86 px-5 backdrop-blur-xl">
          <div className="min-w-0">
            <div className="text-xs font-medium text-[var(--color-graphite)]">Admin / {pageTitle}</div>
            <h1 className="mt-0.5 truncate text-xl font-semibold text-[var(--color-ink)]">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs text-slate-500 sm:block">
              <div>{now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
              <div>{now.toLocaleDateString('vi-VN')}</div>
            </div>
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm">
              <Bell className="h-4 w-4" />
              {totalNotifications > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">{totalNotifications}</span>}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <div className="dashboard-shell">
                <Outlet />
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>
    </div>
  )
}
