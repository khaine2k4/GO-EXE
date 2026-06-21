import { useCallback, useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { AlertCircle, BarChart3, Building2, CalendarCheck, Eye, Globe, RefreshCw, Star, TrendingUp, Users } from 'lucide-react'
import { getAdminDashboardStats, type AdminDashboardStats } from '../services/adminDashboardApi'
import { getAnalyticsStats, type AnalyticsStats } from '../services/analyticsApi'

const emptyDashboard: AdminDashboardStats = {
  systemStats: {
    activeUsers: 0,
    approvedStudios: 0,
    pendingStudios: 0,
    totalBookings: 0,
    totalCommission: 0,
    pendingReports: 0,
    disputedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    completionRate: 0,
  },
  topStudios: [],
  monthlyRevenue: [],
  recentBookings: [],
}

const emptyAnalytics: AnalyticsStats = {
  todayViews: 0,
  weekViews: 0,
  monthViews: 0,
  allTimeViews: 0,
  todayUniqueVisitors: 0,
  weekUniqueVisitors: 0,
  monthUniqueVisitors: 0,
  allTimeUniqueVisitors: 0,
  monthPotentialCustomerVisitors: 0,
  totalRegisteredUsers: 0,
  dailyViews: [],
  topPages: [],
  visitorSegments: [],
  userGrowth: [],
}

function formatVnd(value?: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value ?? 0)} VND`
}

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('vi-VN', { dateStyle: 'short' })
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return toDateInputValue(date)
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

const PAGE_LABELS: Record<string, string> = {
  '/': 'Trang chủ',
  '/home': 'Trang chủ',
  '/gallery': 'Trang Studio',      // Khớp với menu "Studio"
  '/photosets': 'Trang Dịch vụ',   // Khớp với menu "Dịch vụ"
  '/login': 'Đăng nhập',
  '/register': 'Đăng ký',
  '/faq': 'FAQ',
  '/premier': 'Premier',
  '/chat': 'Chat',
  '/profile': 'Hồ sơ',
  '/customer/bookings': 'Booking KH',
}

function getPageLabel(path: string): string {
  const [pathname, search] = path.split('?');

  if (PAGE_LABELS[pathname] && !search) return PAGE_LABELS[pathname];
  if (pathname === '/photographers/{id}') return 'Chi tiết Studio';
  if (pathname === '/photosets/{id}') return 'Chi tiết Bộ ảnh';
  if (pathname === '/albums/{id}') return 'Chi tiết Album';
  if (pathname === '/customer/bookings/{id}') return 'Chi tiết Booking (KH)';
  if (pathname === '/photographer/bookings/{id}') return 'Chi tiết Booking (Photo)';

  if (pathname.startsWith('/photographers/')) return `Studio #${pathname.split('/')[2]}`;
  if (pathname.startsWith('/photosets/')) return `Bộ ảnh #${pathname.split('/')[2]}`;
  if (pathname.startsWith('/albums/')) return `Album #${pathname.split('/')[2]}`;
  if (pathname.startsWith('/customer/bookings/')) return `Booking #${pathname.split('/')[3]}`;

  if (pathname.startsWith('/photographer/')) {
    const subPath = pathname.split('/')[2];
    const detailId = pathname.split('/')[3];

    if (subPath === 'bookings' && detailId) {
      return `Photo - Booking #${detailId}`;
    }

    if (subPath === 'dashboard' && search) {
      const params = new URLSearchParams(search);
      const tab = params.get('tab');
      const section = params.get('section');

      if (tab === 'manage' && section === 'services') return 'Photo - Dịch vụ';
      if (tab === 'manage' && section === 'packages') return 'Photo - Gói chụp';
      if (tab === 'manage' && section === 'schedule') return 'Photo - Lịch trình';
      if (tab === 'manage') return 'Photo - Quản lý';
      
      if (tab === 'bookings') return 'Photo - Bookings';
      if (tab === 'finance') return 'Photo - Tài chính';
      
      if (tab === 'content' && section === 'portfolio') return 'Photo - Portfolio';
      if (tab === 'content') return 'Photo - Nội dung';

      return `Photo - Dashboard (${tab})`;
    }

    switch (subPath) {
      case 'dashboard': return 'Photo - Dashboard'
      case 'portfolio': return 'Photo - Portfolio'
      case 'services': return 'Photo - Dịch vụ'
      case 'packages': return 'Photo - Gói chụp'
      case 'bookings': return 'Photo - Bookings'
      case 'finance': return 'Photo - Tài chính'
      case 'wallet': return 'Photo - Ví'
      case 'schedule': return 'Photo - Lịch trình'
      case 'revenue': return 'Photo - Doanh thu'
      case 'commissions': return 'Photo - Hoa hồng'
      case 'commission-setting': return 'Photo - Cài đặt HH'
      case 'booking-stats': return 'Photo - Thống kê booking'
      default: return `Photo - ${subPath || 'Home'}`
    }
  }
  return pathname;
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardStats>(emptyDashboard)
  const [analytics, setAnalytics] = useState<AnalyticsStats>(emptyAnalytics)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview')
  const [analyticsStartDate, setAnalyticsStartDate] = useState(() => daysAgo(29))
  const [analyticsEndDate, setAnalyticsEndDate] = useState(() => toDateInputValue(new Date()))

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [dashData, analyticsData] = await Promise.allSettled([
        getAdminDashboardStats(),
        getAnalyticsStats({ startDate: analyticsStartDate, endDate: analyticsEndDate }),
      ])
      if (dashData.status === 'fulfilled') setDashboard(dashData.value)
      if (analyticsData.status === 'fulfilled') setAnalytics(analyticsData.value)
      if (dashData.status === 'rejected' && analyticsData.status === 'rejected')
        setError('Không tải được dữ liệu dashboard.')
    } catch {
      setError('Không tải được dashboard admin.')
    } finally {
      setLoading(false)
    }
  }, [analyticsStartDate, analyticsEndDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (activeTab !== 'analytics') return

    fetchData()
    const refreshTimer = window.setInterval(fetchData, 30000)
    return () => window.clearInterval(refreshTimer)
  }, [activeTab, fetchData])

  const maxCommission = useMemo(
    () => Math.max(...dashboard.monthlyRevenue.map((item) => item.platformCommission), 1),
    [dashboard.monthlyRevenue]
  )

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Dashboard tổng quan</h2>
          <p className="mt-1 text-sm text-slate-500">Số liệu tổng hợp từ hệ thống và thống kê truy cập web.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Tổng quan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Thống kê Web
            </button>
          </div>
          <button type="button" onClick={fetchData} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </section>

      {error && <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

      {activeTab === 'overview' ? (
        <OverviewTab dashboard={dashboard} maxCommission={maxCommission} />
      ) : (
        <AnalyticsTab
          analytics={analytics}
          startDate={analyticsStartDate}
          endDate={analyticsEndDate}
          onStartDateChange={setAnalyticsStartDate}
          onEndDateChange={setAnalyticsEndDate}
          onQuickRange={(days) => {
            setAnalyticsStartDate(daysAgo(days - 1))
            setAnalyticsEndDate(toDateInputValue(new Date()))
          }}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// Tab 1: Overview (existing dashboard)
// ══════════════════════════════════════════════════════════════════════
function OverviewTab({ dashboard, maxCommission }: { dashboard: AdminDashboardStats; maxCommission: number }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<BarChart3 className="h-5 w-5" />} label="Hoa hồng nền tảng" value={formatVnd(dashboard.systemStats.totalCommission)} tone="indigo" />
        <Metric icon={<CalendarCheck className="h-5 w-5" />} label="Tổng booking" value={dashboard.systemStats.totalBookings} />
        <Metric icon={<Building2 className="h-5 w-5" />} label="Studio đã duyệt" value={dashboard.systemStats.approvedStudios} tone="emerald" />
        <Metric icon={<AlertCircle className="h-5 w-5" />} label="Khiếu nại đang mở" value={dashboard.systemStats.disputedBookings} tone="rose" />
        <Metric icon={<Users className="h-5 w-5" />} label="Người dùng hoạt động" value={dashboard.systemStats.activeUsers} />
        <Metric icon={<Building2 className="h-5 w-5" />} label="Studio chờ duyệt" value={dashboard.systemStats.pendingStudios} tone="amber" />
        <Metric icon={<CalendarCheck className="h-5 w-5" />} label="Đã hoàn thành" value={dashboard.systemStats.completedBookings} tone="emerald" />
        <Metric icon={<BarChart3 className="h-5 w-5" />} label="Tỷ lệ hoàn thành" value={`${dashboard.systemStats.completionRate}%`} tone="indigo" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-950">Doanh thu hàng tháng</h3>
              <p className="text-sm text-slate-500">Platform commission theo booking COMPLETED.</p>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
          <div className="flex h-72 items-end gap-3">
            {dashboard.monthlyRevenue.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">Chưa có dữ liệu doanh thu.</div>
            ) : dashboard.monthlyRevenue.map((item) => {
              const height = Math.max(8, Math.round(item.platformCommission * 100 / maxCommission))
              return (
                <div key={item.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-lg bg-indigo-500 transition-all" style={{ height: `${height}%` }} title={formatVnd(item.platformCommission)} />
                  <div className="w-full truncate text-center text-[11px] font-medium text-slate-500">{item.month}</div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-950">Top studios</h3>
            <p className="text-sm text-slate-500">Xếp theo booking và rating.</p>
          </div>
          <div className="space-y-3">
            {dashboard.topStudios.slice(0, 6).map((studio, index) => (
              <div key={studio.studioId} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-semibold text-slate-700">{index + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900">{studio.studioName}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{studio.city || 'Chưa có khu vực'} · {studio.totalBookings} booking</div>
                </div>
                <div className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
                  <Star className="h-4 w-4 fill-current" />
                  {studio.avgRating.toFixed(1)}
                </div>
              </div>
            ))}
            {dashboard.topStudios.length === 0 && <div className="py-10 text-center text-sm text-slate-500">Chưa có studio top.</div>}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 p-4">
          <h3 className="text-base font-semibold text-slate-950">Booking gần đây</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                <th className="px-5 py-3">Booking</th>
                <th className="px-5 py-3">Khách / Studio</th>
                <th className="px-5 py-3">Gói chụp</th>
                <th className="px-5 py-3 text-right">Commission</th>
                <th className="px-5 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recentBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-slate-100">
                  <td className="px-5 py-4">
                    <div className="font-mono text-xs font-semibold text-slate-600">#{booking.bookingCode}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatDate(booking.shootingDate)}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-slate-900">{booking.customerName}</div>
                    <div className="mt-1 text-xs text-slate-500">{booking.studioName}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">{booking.packageName}</td>
                  <td className="px-5 py-4 text-right text-sm font-semibold text-indigo-700">{formatVnd(booking.commissionAmount)}</td>
                  <td className="px-5 py-4"><StatusBadge status={booking.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {dashboard.recentBookings.length === 0 && <div className="px-6 py-14 text-center text-sm text-slate-500">Chưa có booking.</div>}
        </div>
      </section>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════
// Tab 2: Web Analytics
// ══════════════════════════════════════════════════════════════════════
function AnalyticsTab({
  analytics,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onQuickRange,
}: {
  analytics: AnalyticsStats
  startDate: string
  endDate: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onQuickRange: (days: number) => void
}) {
  const rangeLabel = `${shortDateLabel(startDate)} - ${shortDateLabel(endDate)}`
  const visitorRate = analytics.monthViews > 0
    ? Math.round((analytics.monthUniqueVisitors / analytics.monthViews) * 100)
    : 0
  const activeDays = analytics.dailyViews.filter((day) => day.views > 0).length
  const avgViewsPerDay = activeDays > 0 ? Math.round(analytics.monthViews / activeDays) : 0
  const peakDay = [...analytics.dailyViews].sort((a, b) => b.views - a.views)[0]
  const peakPage = analytics.topPages[0]

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Thống kê truy cập Web</h3>
            <p className="mt-1 text-sm text-slate-500">Báo cáo lượt xem, lượt khách và các trang được quan tâm.</p>
            <div className="mt-3 inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{rangeLabel}</div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Từ ngày
              <input type="date" value={startDate} max={endDate} onChange={(event) => onStartDateChange(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400" />
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Đến ngày
              <input type="date" value={endDate} min={startDate} onChange={(event) => onEndDateChange(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400" />
            </label>
            <button type="button" onClick={() => onQuickRange(7)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">7 ngày</button>
            <button type="button" onClick={() => onQuickRange(30)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">30 ngày</button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetric icon={<Eye className="h-5 w-5" />} label="Lượt xem" value={formatNumber(analytics.monthViews)} detail={`Hôm nay ${formatNumber(analytics.todayViews)} · 7 ngày ${formatNumber(analytics.weekViews)}`} tone="indigo" />
        <AnalyticsMetric icon={<Users className="h-5 w-5" />} label="Lượt khách" value={formatNumber(analytics.monthUniqueVisitors)} detail={`Tỷ lệ khách/lượt xem: ${visitorRate}%`} tone="emerald" />
        <AnalyticsMetric icon={<Globe className="h-5 w-5" />} label="Khách tiềm năng" value={formatNumber(analytics.monthPotentialCustomerVisitors)} detail="Chưa đăng nhập + Khách hàng" tone="amber" />
        <AnalyticsMetric icon={<TrendingUp className="h-5 w-5" />} label="Tài khoản hoạt động" value={formatNumber(analytics.totalRegisteredUsers)} detail="Khách hàng + Nhiếp ảnh gia" tone="slate" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          icon={<CalendarCheck className="h-4 w-4" />}
          title="Ngày có truy cập"
          value={formatNumber(activeDays)}
          detail={peakDay ? `Cao nhất: ${shortDateLabel(peakDay.date)} với ${formatNumber(peakDay.views)} lượt xem` : 'Chưa có ngày nào có dữ liệu'}
        />
        <InsightCard
          icon={<BarChart3 className="h-4 w-4" />}
          title="Trung bình / ngày"
          value={formatNumber(avgViewsPerDay)}
          detail="Tính trên các ngày có lượt xem"
        />
        <InsightCard
          icon={<Globe className="h-4 w-4" />}
          title="Trang nổi bật"
          value={peakPage ? getPageLabel(peakPage.pagePath) : '-'}
          detail={peakPage ? `${formatNumber(peakPage.views)} lượt xem` : 'Chưa có dữ liệu'}
          truncateValue
        />
        <InsightCard
          icon={<TrendingUp className="h-4 w-4" />}
          title="Tổng trang xem"
          value={formatNumber(analytics.topPages.length)}
          detail="Số trang xuất hiện trong bảng top"
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionTitle title="Lượt xem theo ngày" subtitle="Biểu đồ cột: lượt xem và lượt khách theo từng ngày." icon={<BarChart3 className="h-5 w-5" />} />
        <DailyViewsChart data={analytics.dailyViews} />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle title="Top trang Khách hàng" subtitle="Lượt truy cập vào các trang dành cho khách hàng." icon={<Globe className="h-5 w-5" />} />
          <TopPagesChart pages={analytics.topPages.filter(p => !p.pagePath.startsWith('/photographer/'))} />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle title="Top trang Thợ chụp" subtitle="Lượt truy cập vào các chức năng quản lý nội bộ." icon={<Users className="h-5 w-5" />} />
          <TopPagesChart pages={analytics.topPages.filter(p => p.pagePath.startsWith('/photographer/'))} />
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionTitle title="Tăng trưởng user" subtitle="Biểu đồ cột user mới từng tháng, kèm tổng tích lũy." icon={<TrendingUp className="h-5 w-5" />} />
        <UserGrowthChart data={analytics.userGrowth} />
      </section>
    </div>
  )
}
// ══════════════════════════════════════════════════════════════════════
// Shared components
// ══════════════════════════════════════════════════════════════════════
type DailyViewPoint = AnalyticsStats['dailyViews'][number]
type UserGrowthPoint = AnalyticsStats['userGrowth'][number]

function shortDateLabel(value: string) {
  const parts = value.split('-')
  if (parts.length !== 3) return value
  return `${parts[2]}/${parts[1]}`
}


function DailyViewsChart({ data }: { data: DailyViewPoint[] }) {
  const activeData = data.filter((day) => day.views > 0).slice(-14)
  const maxValue = Math.max(...activeData.flatMap((d) => [d.views, d.uniqueVisitors]), 1)
  const width = 980
  const height = 340
  const padding = { top: 28, right: 24, bottom: 48, left: 46 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const step = activeData.length > 0 ? plotWidth / activeData.length : plotWidth
  const barWidth = Math.max(8, Math.min(22, step * 0.26))
  const gridLines = [1, 0.75, 0.5, 0.25, 0]

  if (activeData.length === 0) {
    return <EmptyState label="Chưa có dữ liệu lượt xem." />
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100 bg-slate-50 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-80 min-w-[760px] w-full" role="img" aria-label="Biểu đồ lượt xem theo ngày">
        <rect x={padding.left} y={padding.top} width={plotWidth} height={plotHeight} rx="12" fill="#ffffff" />
        {gridLines.map((ratio) => {
          const y = padding.top + (1 - ratio) * plotHeight
          const value = Math.round(maxValue * ratio)
          return (
            <g key={ratio}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 6" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" className="fill-slate-400 text-[11px]">{value}</text>
            </g>
          )
        })}
        {activeData.map((day, index) => {
          const centerX = padding.left + index * step + step / 2
          const viewHeight = Math.max(4, (day.views / maxValue) * plotHeight)
          const uniqueHeight = Math.max(4, (day.uniqueVisitors / maxValue) * plotHeight)
          const viewX = centerX - barWidth - 2
          const uniqueX = centerX + 2
          const viewY = padding.top + plotHeight - viewHeight
          const uniqueY = padding.top + plotHeight - uniqueHeight
          const showLabel = activeData.length <= 8 || index % 2 === 0 || index === activeData.length - 1
          return (
            <g key={day.date}>
              <rect x={viewX} y={viewY} width={barWidth} height={viewHeight} rx="5" fill="#4f46e5">
                <title>{`${shortDateLabel(day.date)}: ${day.views} lượt xem`}</title>
              </rect>
              <rect x={uniqueX} y={uniqueY} width={barWidth} height={uniqueHeight} rx="5" fill="#10b981">
                <title>{`${shortDateLabel(day.date)}: ${day.uniqueVisitors} khách`}</title>
              </rect>
              <text x={centerX} y={Math.min(viewY, uniqueY) - 8} textAnchor="middle" className="fill-slate-700 text-[11px] font-semibold">{formatNumber(day.views)}</text>
              {showLabel && <text x={centerX} y={height - 16} textAnchor="middle" className="fill-slate-500 text-[11px]">{shortDateLabel(day.date)}</text>}
            </g>
          )
        })}
      </svg>
      <div className="mt-3 flex justify-center gap-5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-indigo-600" /> Lượt xem</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Lượt khách</span>
      </div>
    </div>
  )
}
function UserGrowthChart({ data }: { data: UserGrowthPoint[] }) {
  const visibleData = data.slice(-12)
  const maxNewUsers = Math.max(...visibleData.map((d) => d.newUsers), 1)
  const width = 980
  const height = 320
  const padding = { top: 28, right: 24, bottom: 50, left: 46 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const step = visibleData.length > 0 ? plotWidth / visibleData.length : plotWidth
  const barWidth = Math.max(16, Math.min(42, step * 0.44))
  const monthNames = ['', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
  const gridLines = [1, 0.75, 0.5, 0.25, 0]

  if (visibleData.length === 0) {
    return <EmptyState label="Chưa có dữ liệu user." />
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100 bg-slate-50 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-76 min-w-[760px] w-full" role="img" aria-label="Biểu đồ tăng trưởng user">
        <rect x={padding.left} y={padding.top} width={plotWidth} height={plotHeight} rx="12" fill="#ffffff" />
        {gridLines.map((ratio) => {
          const y = padding.top + (1 - ratio) * plotHeight
          const value = Math.round(maxNewUsers * ratio)
          return (
            <g key={ratio}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 6" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" className="fill-slate-400 text-[11px]">{value}</text>
            </g>
          )
        })}
        {visibleData.map((item, index) => {
          const centerX = padding.left + index * step + step / 2
          const barHeight = item.newUsers === 0 ? 0 : Math.max(5, (item.newUsers / maxNewUsers) * plotHeight)
          const x = centerX - barWidth / 2
          const y = padding.top + plotHeight - barHeight
          return (
            <g key={`${item.year}-${item.month}`}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="7" fill="#0891b2">
                <title>{`${monthNames[item.month]}/${item.year}: +${item.newUsers} user mới, tổng ${item.cumulativeUsers}`}</title>
              </rect>
              {item.newUsers > 0 && <text x={centerX} y={y - 8} textAnchor="middle" className="fill-slate-700 text-[11px] font-semibold">+{formatNumber(item.newUsers)}</text>}
              <text x={centerX} y={height - 22} textAnchor="middle" className="fill-slate-500 text-[11px]">{monthNames[item.month]}</text>
              <text x={centerX} y={height - 8} textAnchor="middle" className="fill-slate-400 text-[10px]">Tổng {formatNumber(item.cumulativeUsers)}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
function TopPagesChart({ pages }: { pages: AnalyticsStats['topPages'] }) {
  if (pages.length === 0) {
    return <EmptyState label="Chưa có dữ liệu." />
  }

  const visiblePages = pages.slice(0, 10)
  const maxViews = visiblePages[0]?.views || 1

  return (
    <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
      {visiblePages.map((page, index) => {
        const width = Math.max(4, Math.round(page.views * 100 / maxViews))
        return (
          <div key={page.pagePath} className="grid grid-cols-[44px_minmax(0,1fr)_96px] items-center gap-3 rounded-lg bg-white px-3 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">{index + 1}</div>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="truncate text-sm font-semibold text-slate-900" title={page.pagePath}>{getPageLabel(page.pagePath)}</div>
                <div className="shrink-0 text-xs text-slate-400">{formatNumber(page.uniqueVisitors)} khách</div>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${width}%` }} />
              </div>
            </div>
            <div className="text-right text-sm font-semibold text-slate-950">{formatNumber(page.views)}</div>
          </div>
        )
      })}
    </div>
  )
}
function SectionTitle({ title, subtitle, icon }: { title: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="text-slate-400">{icon}</div>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">{label}</div>
}

function InsightCard({
  icon,
  title,
  value,
  detail,
  truncateValue = false,
}: {
  icon: React.ReactNode
  title: string
  value: string | number
  detail: string
  truncateValue?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-medium text-slate-500">{title}</div>
        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">{icon}</div>
      </div>
      <div className={`mt-2 text-xl font-semibold tracking-tight text-slate-950 ${truncateValue ? 'truncate' : ''}`}>{value}</div>
      <div className="mt-2 text-xs text-slate-500">{detail}</div>
    </div>
  )
}
function AnalyticsMetric({ icon, label, value, detail, tone = 'slate' }: { icon: React.ReactNode; label: string; value: string | number; detail: string; tone?: 'slate' | 'amber' | 'emerald' | 'indigo' | 'rose' }) {
  const toneClass = {
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    rose: 'bg-rose-50 text-rose-700',
  }[tone]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
        </div>
        <div className={`rounded-lg p-2 ${toneClass}`}>{icon}</div>
      </div>
      <div className="mt-3 truncate text-xs text-slate-500">{detail}</div>
    </div>
  )
}
function Metric({ icon, label, value, tone = 'slate' }: { icon: React.ReactNode; label: string; value: string | number; tone?: 'slate' | 'amber' | 'emerald' | 'indigo' | 'rose' }) {
  const toneClass = {
    slate: 'text-slate-950',
    amber: 'text-amber-700',
    emerald: 'text-emerald-700',
    indigo: 'text-indigo-700',
    rose: 'text-rose-700',
  }[tone]
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {icon}
      </div>
      <div className={`mt-2 truncate text-xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    PENDING_PAYMENT: 'border-amber-200 bg-amber-50 text-amber-700',
    PENDING_CONFIRMATION: 'border-blue-200 bg-blue-50 text-blue-700',
    CONFIRMED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    IN_PROGRESS: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    DISPUTED: 'border-rose-200 bg-rose-50 text-rose-700',
    CANCELLED: 'border-slate-200 bg-slate-50 text-slate-500',
    REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  }
  const label: Record<string, string> = {
    PENDING_PAYMENT: 'Chờ thanh toán',
    PENDING_CONFIRMATION: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    IN_PROGRESS: 'Đang chụp',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    REJECTED: 'Từ chối',
    DISPUTED: 'Khiếu nại',
  }
  return <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${config[status] ?? config.PENDING_PAYMENT}`}>{label[status] ?? status}</span>
}
