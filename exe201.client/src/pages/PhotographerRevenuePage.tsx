import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useToast } from '../components/Toast'
import { getStudioRevenue, type StudioRevenue } from '../services/studioRevenueApi'

const emptyRevenue: StudioRevenue = {
  studioId: 0,
  studioName: '',
  grossRevenue: 0,
  commissionDeducted: 0,
  netRevenue: 0,
  completedBookings: 0,
  paidPayments: 0,
  refundedAmount: 0,
  averageBookingValue: 0,
  monthlyRevenue: [],
}

function formatVnd(value?: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value ?? 0)} VND`
}

function formatMonth(year: number, month: number) {
  return `${String(month).padStart(2, '0')}/${year}`
}

export default function PhotographerRevenuePage() {
  const toast = useToast()
  const [revenue, setRevenue] = useState<StudioRevenue>(emptyRevenue)
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
      setRevenue(await getStudioRevenue(params))
    } catch {
      setError('Không tải được revenue studio.')
      toast.push({ type: 'error', title: 'Tải revenue thất bại' })
    } finally {
      setLoading(false)
    }
  }, [params, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-6 pb-20">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Studio revenue</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950">{revenue.studioName || 'Doanh thu'}</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Tính từ booking COMPLETED có payment PAID.</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <DateInput label="Từ ngày" value={from} onChange={setFrom} />
            <DateInput label="Đến ngày" value={to} onChange={setTo} />
            <button type="button" onClick={fetchData} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>
        {error && <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Tổng giao dịch" value={formatVnd(revenue.grossRevenue)} />
        <Metric label="Commission đã trừ" value={formatVnd(revenue.commissionDeducted)} tone="rose" />
        <Metric label="Doanh thu thực nhận" value={formatVnd(revenue.netRevenue)} tone="emerald" />
        <Metric label="Booking hoàn thành" value={revenue.completedBookings} />
        <Metric label="Giá trị booking TB" value={formatVnd(revenue.averageBookingValue)} tone="indigo" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 p-4">
          <h2 className="text-base font-semibold text-slate-900">Doanh thu hàng tháng</h2>
        </div>
        {loading ? <TableSkeleton columns={5} /> : revenue.monthlyRevenue.length === 0 ? <EmptyState text="Không có dữ liệu doanh thu hàng tháng." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3">Tháng</th>
                  <th className="px-5 py-3 text-right">Tổng tiền</th>
                  <th className="px-5 py-3 text-right">Commission</th>
                  <th className="px-5 py-3 text-right">Thực nhận</th>
                  <th className="px-5 py-3 text-center">Hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {revenue.monthlyRevenue.map((item) => (
                  <tr key={`${item.year}-${item.month}`} className="border-b border-slate-100 hover:bg-slate-50/70">
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{formatMonth(item.year, item.month)}</td>
                    <td className="px-5 py-4 text-right text-sm font-medium">{formatVnd(item.grossRevenue)}</td>
                    <td className="px-5 py-4 text-right text-sm font-medium text-rose-700">{formatVnd(item.commissionDeducted)}</td>
                    <td className="px-5 py-4 text-right text-sm font-medium text-emerald-700">{formatVnd(item.netRevenue)}</td>
                    <td className="px-5 py-4 text-center text-sm">{item.completedBookings}</td>
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
      <span className="mb-1 block text-xs font-bold text-slate-500">{label}</span>
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" />
    </label>
  )
}

function Metric({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'slate' | 'emerald' | 'rose' | 'indigo' }) {
  const color = { slate: 'text-slate-950', emerald: 'text-emerald-700', rose: 'text-rose-700', indigo: 'text-indigo-700' }[tone]
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p><p className={`mt-2 truncate text-xl font-black ${color}`}>{value}</p></div>
}

function TableSkeleton({ columns }: { columns: number }) {
  return <div className="p-5">{Array.from({ length: 5 }).map((_, row) => <div key={row} className="grid gap-4 border-b border-slate-100 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{Array.from({ length: columns }).map((_, col) => <div key={col} className="h-4 rounded-full bg-slate-100" />)}</div>)}</div>
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-6 py-16 text-center text-sm text-slate-500">{text}</div>
}
