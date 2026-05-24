import { useCallback, useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { AlertCircle, BarChart3, Building2, CalendarCheck, RefreshCw, Star, Users } from 'lucide-react'
import { getAdminDashboardStats, type AdminDashboardStats } from '../services/adminDashboardApi'

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

function formatVnd(value?: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value ?? 0)} VND`
}

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('vi-VN', { dateStyle: 'short' })
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardStats>(emptyDashboard)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setDashboard(await getAdminDashboardStats())
    } catch {
      setError('Không tải được dashboard admin.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const maxCommission = useMemo(
    () => Math.max(...dashboard.monthlyRevenue.map((item) => item.platformCommission), 1),
    [dashboard.monthlyRevenue]
  )

  return (
    <div className="space-y-5 pb-12">
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Dashboard tổng quan</h2>
          <p className="mt-1 text-sm text-slate-500">Số liệu tổng hợp từ view v3 và booking mới nhất.</p>
        </div>
        <button type="button" onClick={fetchData} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </section>

      {error && <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

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
