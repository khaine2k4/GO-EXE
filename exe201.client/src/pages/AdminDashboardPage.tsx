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
  '/gallery': 'Thư viện ảnh',
  '/photosets': 'Bộ ảnh',
  '/login': 'Đăng nhập',
  '/register': 'Đăng ký',
  '/faq': 'FAQ',
  '/premier': 'Premier',
  '/chat': 'Chat',
  '/profile': 'Hồ sơ',
  '/customer/bookings': 'Booking KH',
}

function getPageLabel(path: string): string {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path]
  if (path.startsWith('/photographers/')) return `Studio #${path.split('/')[2]}`
  if (path.startsWith('/photosets/')) return `Bộ ảnh #${path.split('/')[2]}`
  if (path.startsWith('/albums/')) return `Album #${path.split('/')[2]}`
  if (path.startsWith('/customer/bookings/')) return `Booking #${path.split('/')[3]}`
  if (path.startsWith('/photographer/')) return `Photographer`
  return path
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
  return (
    <>
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Khoảng thời gian báo cáo</h3>
          <p className="mt-1 text-xs text-slate-500">Áp dụng cho metric, biểu đồ lượt xem, top trang và tăng trưởng user.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs font-medium text-slate-500">
            Từ ngày
            <input type="date" value={startDate} max={endDate} onChange={(event) => onStartDateChange(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-500">
            Đến ngày
            <input type="date" value={endDate} min={startDate} onChange={(event) => onEndDateChange(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" />
          </label>
          <button type="button" onClick={() => onQuickRange(7)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">7 ngày</button>
          <button type="button" onClick={() => onQuickRange(30)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">30 ngày</button>
        </div>
      </section>
      {/* ── Metric Cards ── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Eye className="h-5 w-5" />} label="Lượt xem hôm nay" value={formatNumber(analytics.todayViews)} tone="indigo" />
        <Metric icon={<Globe className="h-5 w-5" />} label="Lượt xem 30 ngày" value={formatNumber(analytics.monthViews)} />
        <Metric icon={<Users className="h-5 w-5" />} label="Visitor 30 ngày" value={formatNumber(analytics.monthUniqueVisitors)} />
        <Metric icon={<Users className="h-5 w-5" />} label="Khách tiềm năng 30 ngày" value={formatNumber(analytics.monthPotentialCustomerVisitors)} tone="amber" />
      </div>

      {/* ── Daily Views Chart (30 days) ── */}
      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-950">Lượt xem theo ngày</h3>
              <p className="text-sm text-slate-500">30 ngày gần nhất · Cột = views, Chấm = unique visitors.</p>
            </div>
            <Eye className="h-5 w-5 text-slate-400" />
          </div>
          <DailyViewsChart data={analytics.dailyViews} />
        </section>

        {/* ── Top 10 Pages ── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-950">Top trang được xem</h3>
            <p className="text-sm text-slate-500">30 ngày · Xếp theo tổng views.</p>
          </div>
          <div className="space-y-2">
            {analytics.topPages.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">Chưa có dữ liệu.</div>
            ) : analytics.topPages.map((page, idx) => {
              const maxPageViews = analytics.topPages[0]?.views || 1
              const barWidth = Math.max(8, Math.round(page.views * 100 / maxPageViews))
              return (
                <div key={page.pagePath} className="group rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/30">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[11px] font-semibold text-slate-600">{idx + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800" title={page.pagePath}>{getPageLabel(page.pagePath)}</span>
                    <span className="text-xs font-semibold text-indigo-700">{page.views}</span>
                    <span className="text-[10px] text-slate-400">({page.uniqueVisitors} unique)</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all" style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* ── User Growth Chart ── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Tăng trưởng user</h3>
            <p className="text-sm text-slate-500">12 tháng gần nhất · Cột = user mới, đường = tổng tích lũy.</p>
          </div>
          <TrendingUp className="h-5 w-5 text-slate-400" />
        </div>
        <UserGrowthChart data={analytics.userGrowth} />
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-5 rounded bg-gradient-to-r from-cyan-400 to-cyan-500" /> User mới</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> Tổng tích lũy</span>
        </div>
      </section>
    </>
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

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  return points.reduce((path, point, index, all) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const previous = all[index - 1]
    const controlDistance = (point.x - previous.x) * 0.45
    return `${path} C ${previous.x + controlDistance} ${previous.y}, ${point.x - controlDistance} ${point.y}, ${point.x} ${point.y}`
  }, '')
}

function DailyViewsChart({ data }: { data: DailyViewPoint[] }) {
  const visibleData = data.slice(-7)
  const maxViews = Math.max(...visibleData.map((d) => d.views), 1)
  const hasViews = visibleData.some((d) => d.views > 0)

  return (
    <div className="rounded-xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/80 p-4">
      {!hasViews ? (
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">Chưa có dữ liệu lượt xem.</div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-[76px_1fr_96px] items-center gap-3 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <span>Ngày</span>
            <span>Lượt xem</span>
            <span className="text-right">Số liệu</span>
          </div>
          {visibleData.map((day) => {
            const viewWidth = day.views === 0 ? 0 : Math.max(5, Math.round(day.views * 100 / maxViews))
            const uniqueWidth = day.uniqueVisitors === 0 ? 0 : Math.max(4, Math.round(day.uniqueVisitors * 100 / maxViews))
            return (
              <div key={day.date} className="grid grid-cols-[76px_1fr_96px] items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-3 shadow-sm">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{shortDateLabel(day.date)}</div>
                  <div className="text-[10px] text-slate-400">{day.date.slice(0, 4)}</div>
                </div>
                <div className="space-y-2">
                  <div className="relative h-7 overflow-hidden rounded-lg bg-slate-100">
                    <div className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-indigo-400 to-indigo-600" style={{ width: `${viewWidth}%` }} />
                    <div className="relative flex h-full items-center px-2 text-xs font-semibold text-white drop-shadow-sm">
                      {day.views > 0 ? `${formatNumber(day.views)} views` : ''}
                    </div>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-emerald-50">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${uniqueWidth}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-indigo-700">{formatNumber(day.views)}</div>
                  <div className="mt-0.5 text-xs font-medium text-emerald-700">
                    {formatNumber(day.uniqueVisitors)} unique
                  </div>
                </div>
              </div>
            )
          })}
          <div className="flex items-center gap-4 px-1 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-5 rounded bg-indigo-500" /> Views</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-5 rounded bg-emerald-500" /> Unique visitors</span>
          </div>
        </div>
      )}
    </div>
  )
}
function UserGrowthChart({ data }: { data: UserGrowthPoint[] }) {
  const width = 920
  const height = 250
  const padding = { top: 26, right: 28, bottom: 38, left: 42 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const maxNewUsers = Math.max(...data.map((d) => d.newUsers), 1)
  const maxTotalUsers = Math.max(...data.map((d) => d.cumulativeUsers), 1)
  const step = data.length > 1 ? plotWidth / (data.length - 1) : plotWidth
  const barWidth = Math.max(12, Math.min(34, step * 0.42))
  const linePoints = data.map((item, index) => {
    const x = padding.left + index * step
    const y = padding.top + plotHeight - (item.cumulativeUsers / maxTotalUsers) * plotHeight
    return { x, y, item }
  })
  const linePath = smoothPath(linePoints)
  const areaPath = linePoints.length > 0
    ? `${linePath} L ${linePoints[linePoints.length - 1].x} ${padding.top + plotHeight} L ${linePoints[0].x} ${padding.top + plotHeight} Z`
    : ''
  const monthNames = ['', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className="relative h-64 overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/80">
      {data.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">Chưa có dữ liệu user.</div>}
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label="Biểu đồ tăng trưởng user">
        <defs>
          <linearGradient id="userBarGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
          <linearGradient id="userLineArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
          <filter id="userLineShadow" x="-40%" y="-60%" width="180%" height="220%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#10b981" floodOpacity="0.24" />
          </filter>
        </defs>
        <rect x={padding.left} y={padding.top} width={plotWidth} height={plotHeight} rx="14" fill="#f8fafc" />
        {gridLines.map((ratio) => {
          const y = padding.top + ratio * plotHeight
          const value = Math.round(maxTotalUsers * (1 - ratio))
          return (
            <g key={ratio}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 6" />
              <text x={padding.left - 10} y={y + 3} textAnchor="end" className="fill-slate-400 text-[10px]">{value}</text>
            </g>
          )
        })}
        {data.map((item, index) => {
          const centerX = padding.left + index * step
          const barHeight = item.newUsers === 0 ? 0 : Math.max(6, (item.newUsers / maxNewUsers) * plotHeight)
          const barX = centerX - barWidth / 2
          const barY = padding.top + plotHeight - barHeight
          return (
            <g key={`${item.year}-${item.month}`}>
              <rect x={barX} y={padding.top} width={barWidth} height={plotHeight} rx="6" fill="#e2e8f0" opacity="0.26" />
              <rect x={barX} y={barY} width={barWidth} height={barHeight} rx="6" fill="url(#userBarGradient)">
                <title>{`${item.month}/${item.year}: +${item.newUsers} user mới`}</title>
              </rect>
              <text x={centerX} y={height - 10} textAnchor="middle" className="fill-slate-500 text-[10px]">{monthNames[item.month]}</text>
            </g>
          )
        })}
        {areaPath && <path d={areaPath} fill="url(#userLineArea)" pointerEvents="none" />}
        {linePoints.length > 0 && <path d={linePath} fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#userLineShadow)" pointerEvents="none" />}
        {linePoints.map((point) => (
          <circle key={`${point.item.year}-${point.item.month}-total`} cx={point.x} cy={point.y} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2.2">
            <title>{`${point.item.month}/${point.item.year}: tổng ${point.item.cumulativeUsers} user`}</title>
          </circle>
        ))}
      </svg>
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
