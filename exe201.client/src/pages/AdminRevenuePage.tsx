import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, RefreshCw } from 'lucide-react'
import { useToast } from '../components/Toast'
import { getAdminRevenueMonthly, getAdminRevenueSummary, type AdminMonthlyRevenue, type AdminRevenueSummary } from '../services/adminRevenueApi'

const emptySummary: AdminRevenueSummary = {
  grossRevenue: 0,
  platformCommission: 0,
  studioPayout: 0,
  completedBookings: 0,
  paidPayments: 0,
  refundedAmount: 0,
  averageCommissionRate: 0,
}

function formatVnd(value?: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value ?? 0)} VND`
}

function formatMonth(year: number, month: number) {
  return `${String(month).padStart(2, '0')}/${year}`
}

export default function AdminRevenuePage() {
  const toast = useToast()
  const [summary, setSummary] = useState<AdminRevenueSummary>(emptySummary)
  const [monthly, setMonthly] = useState<AdminMonthlyRevenue[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const params = useMemo(() => {
    const query: { from?: string; to?: string } = {}
    if (from) query.from = from
    if (to) query.to = to
    return query
  }, [from, to])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [summaryData, monthlyData] = await Promise.all([
        getAdminRevenueSummary(params),
        getAdminRevenueMonthly(params),
      ])
      setSummary(summaryData)
      setMonthly(monthlyData)
    } catch {
      setError('Không tải được dữ liệu doanh thu nền tảng.')
      toast.push({ type: 'error', title: 'Tải doanh thu thất bại' })
    } finally {
      setLoading(false)
    }
  }, [params, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function clearDates() {
    setFrom('')
    setTo('')
  }

  return (
    <div className="space-y-5 pb-12">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Doanh thu nền tảng</h2>
            <p className="mt-1 text-sm text-slate-500">Số liệu tính từ booking COMPLETED có payment PAID.</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <DateInput label="Từ ngày" value={from} onChange={setFrom} />
            <DateInput label="Đến ngày" value={to} onChange={setTo} />
            <button type="button" onClick={fetchData} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            {(from || to) && <button type="button" onClick={clearDates} className="h-10 rounded-lg px-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50">Xóa lọc</button>}
          </div>
        </div>
        {error && <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Tổng giao dịch" value={formatVnd(summary.grossRevenue)} tone="slate" />
        <Metric label="Platform Commission" value={formatVnd(summary.platformCommission)} tone="indigo" />
        <Metric label="Tiền trả studio" value={formatVnd(summary.studioPayout)} tone="emerald" />
        <Metric label="Booking hoàn thành" value={summary.completedBookings} tone="slate" />
        <Metric label="Payment đã trả" value={summary.paidPayments} tone="emerald" />
        <Metric label="Số tiền hoàn" value={formatVnd(summary.refundedAmount)} tone="rose" />
        <Metric label="Commission trung bình" value={`${summary.averageCommissionRate}%`} tone="amber" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 p-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Doanh thu hàng tháng</h2>
            <p className="text-sm text-slate-500">Nhóm theo ngày hoàn thành booking.</p>
          </div>
          <CalendarDays className="h-5 w-5 text-slate-400" />
        </div>

        {loading ? <TableSkeleton columns={5} /> : monthly.length === 0 ? <EmptyState text="Không có dữ liệu doanh thu hàng tháng." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3">Tháng</th>
                  <th className="px-5 py-3 text-right">Tổng giao dịch</th>
                  <th className="px-5 py-3 text-right">Platform Commission</th>
                  <th className="px-5 py-3 text-right">Tiền trả studio</th>
                  <th className="px-5 py-3 text-center">Hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((item) => (
                  <tr key={`${item.year}-${item.month}`} className="border-b border-slate-100 hover:bg-slate-50/70">
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{formatMonth(item.year, item.month)}</td>
                    <td className="px-5 py-4 text-right text-sm font-medium text-slate-900">{formatVnd(item.grossRevenue)}</td>
                    <td className="px-5 py-4 text-right text-sm font-medium text-indigo-700">{formatVnd(item.platformCommission)}</td>
                    <td className="px-5 py-4 text-right text-sm font-medium text-emerald-700">{formatVnd(item.studioPayout)}</td>
                    <td className="px-5 py-4 text-center text-sm text-slate-600">{item.completedBookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" />
    </label>
  )
}

function Metric({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'slate' | 'amber' | 'emerald' | 'indigo' | 'rose' }) {
  const toneClass = {
    slate: 'text-slate-950',
    amber: 'text-amber-700',
    emerald: 'text-emerald-700',
    indigo: 'text-indigo-700',
    rose: 'text-rose-700',
  }[tone]
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-2 truncate text-xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  )
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="p-5">
      {Array.from({ length: 5 }).map((_, row) => (
        <div key={row} className="grid gap-4 border-b border-slate-100 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, col) => <div key={col} className="h-4 rounded-full bg-slate-100" />)}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-6 py-16 text-center text-sm text-slate-500">{text}</div>
}
