import { useEffect, useState, useMemo } from 'react'
import { Eye, MousePointerClick, TrendingUp, Package, RefreshCw, Calendar } from 'lucide-react'
import { getStudioAnalytics, type StudioAnalyticsSummary } from '../../../services/analyticsApi'

export default function StudioAnalyticsManager() {
  const [days, setDays] = useState(7)
  const [stats, setStats] = useState<StudioAnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadStats() {
    setLoading(true)
    setError('')
    try {
      const data = await getStudioAnalytics(days)
      setStats(data)
    } catch (err) {
      console.error(err)
      setError('Không tải được số liệu thống kê. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [days])

  const maxDailyCount = useMemo(() => {
    if (!stats) return 1
    const viewMax = stats.dailyViews.length > 0 ? Math.max(...stats.dailyViews.map(d => d.count)) : 0
    const bookingMax = stats.dailyBookings.length > 0 ? Math.max(...stats.dailyBookings.map(d => d.count)) : 0
    return Math.max(viewMax, bookingMax, 5) // default min max value is 5 for scaling
  }, [stats])

  function formatDateLabel(dateStr: string) {
    // input yyyy-MM-dd -> Output dd/MM
    try {
      const parts = dateStr.split('-')
      if (parts.length === 3) return `${parts[2]}/${parts[1]}`
    } catch { }
    return dateStr
  }

  const shouldShowLabel = (idx: number) => {
    if (days <= 7) return true
    if (days <= 14) return idx % 2 === 0
    if (days <= 30) return idx % 5 === 0
    return idx % 10 === 0
  }

  const barWidthClass = useMemo(() => {
    if (days <= 7) return 'w-3 sm:w-4'
    if (days <= 14) return 'w-2 sm:w-3'
    if (days <= 30) return 'w-1 sm:w-2'
    return 'w-px sm:w-1'
  }, [days])

  const barGapClass = useMemo(() => {
    if (days <= 7) return 'gap-1'
    if (days <= 14) return 'gap-0.5'
    return 'gap-[1px]'
  }, [days])

  return (
    <div className="space-y-6">
      {/* Title & Filter Header */}
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">Thống kê tương tác Studio</h2>
          <p className="text-sm font-medium text-slate-500">Xem lượt truy cập, lượt nhấn đặt lịch và hiệu suất chuyển đổi của Studio.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1 bg-slate-50">
            <Calendar className="h-4 w-4 text-slate-500" />
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-transparent text-xs font-black uppercase text-slate-700 outline-none cursor-pointer"
            >
              <option value={7}>7 ngày qua</option>
              <option value={14}>14 ngày qua</option>
              <option value={30}>30 ngày qua</option>
              <option value={90}>90 ngày qua</option>
            </select>
          </div>
          <button
            type="button"
            onClick={loadStats}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black uppercase text-slate-700 hover:bg-slate-50 active:scale-95 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Tải lại
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>
      )}

      {loading && !stats ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-20 text-center text-sm font-bold text-slate-500">
          Đang tải dữ liệu tương tác...
        </div>
      ) : stats ? (
        <>
          {/* Key Metrics Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lượt xem Studio</span>
                <p className="text-3xl font-black text-indigo-700">{stats.totalViews.toLocaleString()}</p>
                <p className="text-xs text-slate-500 font-medium">Lượng mở xem trang cá nhân</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Eye className="h-6 w-6" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clicks Đặt Lịch</span>
                <p className="text-3xl font-black text-emerald-700">{stats.totalBookingClicks.toLocaleString()}</p>
                <p className="text-xs text-slate-500 font-medium">Lượt click vào nút đặt lịch</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <MousePointerClick className="h-6 w-6" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tỷ lệ chuyển đổi</span>
                <p className="text-3xl font-black text-amber-600">{stats.bookingConversionRate}%</p>
                <p className="text-xs text-slate-500 font-medium">Xem trang → Nhấp đặt lịch</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            {/* SVG Interactive Trend Chart */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-950">Xu hướng tương tác hàng ngày</h3>
                  <p className="text-xs font-semibold text-slate-500">So sánh lượt xem và lượt nhấn đặt lịch.</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-black uppercase">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-indigo-500 inline-block" />
                    <span className="text-slate-600">Lượt xem</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-slate-600">Click đặt lịch</span>
                  </div>
                </div>
              </div>

              {/* Chart Grid */}
              <div className="relative pt-6">
                <div className="flex h-64 items-end justify-between gap-1 border-b border-l border-slate-100 pb-2 pl-2">
                  {stats.dailyViews.map((item, idx) => {
                    const viewHeight = Math.max(4, Math.round((item.count * 100) / maxDailyCount))
                    const bookingItem = stats.dailyBookings[idx]
                    const bookingHeight = bookingItem ? Math.max(4, Math.round((bookingItem.count * 100) / maxDailyCount)) : 4

                    return (
                      <div key={item.date} className="group relative flex flex-1 flex-col items-center gap-1 min-w-0">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden flex-col items-center rounded-lg bg-slate-900 p-2 text-[10px] font-black text-white shadow-md group-hover:flex z-10 w-24">
                          <p className="text-indigo-400">Xem: {item.count}</p>
                          <p className="text-emerald-400">Đặt: {bookingItem?.count ?? 0}</p>
                          <span className="text-slate-400 text-[8px] font-normal">{formatDateLabel(item.date)}</span>
                        </div>

                        {/* Double Bar columns */}
                        <div className={`flex w-full items-end justify-center ${barGapClass} h-48`}>
                          {/* Views bar */}
                          <div
                            className={`${barWidthClass} rounded-t bg-indigo-500 group-hover:bg-indigo-600 transition-all duration-300`}
                            style={{ height: `${viewHeight}%` }}
                          />
                          {/* Bookings bar */}
                          <div
                            className={`${barWidthClass} rounded-t bg-emerald-500 group-hover:bg-emerald-600 transition-all duration-300`}
                            style={{ height: `${bookingHeight}%` }}
                          />
                        </div>

                        {/* Date label */}
                        <span className="text-[10px] font-bold text-slate-400 truncate w-full text-center mt-2 h-4">
                          {shouldShowLabel(idx) ? formatDateLabel(item.date) : ''}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Popular Packages Rank */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-black text-slate-950">Gói dịch vụ quan tâm nhất</h3>
                <p className="text-xs font-semibold text-slate-500">Xếp hạng theo lượt nhấp chuột lựa chọn gói.</p>
              </div>

              <div className="space-y-3">
                {stats.popularPackages.map((pack, idx) => (
                  <div key={pack.packageId} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 shadow-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-xs font-black text-indigo-700 shadow-sm border border-slate-100">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-black text-slate-900">{pack.packageName}</div>
                      <div className="text-[10px] font-semibold text-slate-500">Mã gói: #{pack.packageId}</div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-black text-indigo-700">
                      <Package className="h-3.5 w-3.5" />
                      {pack.clickCount} click
                    </div>
                  </div>
                ))}

                {stats.popularPackages.length === 0 && (
                  <div className="py-14 text-center">
                    <Package className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-3 text-xs font-bold text-slate-400">Chưa ghi nhận lượt lựa chọn gói chụp nào.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  )
}
