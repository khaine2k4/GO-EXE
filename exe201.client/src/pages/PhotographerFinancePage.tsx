import { useCallback, useEffect, useMemo, useState } from 'react'
import { CircleDollarSign, RefreshCw } from 'lucide-react'
import { useToast } from '../components/Toast'
import { getStudioSettlements, type SettlementItem, type SettlementStatus } from '../services/settlementApi'

const statusOptions: SettlementStatus[] = ['ALL', 'READY', 'PENDING', 'PAID', 'FAILED', 'CANCELLED']

function formatVnd(value?: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value ?? 0)} VND`
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString('vi-VN') : '-'
}

export default function PhotographerFinancePage() {
  const toast = useToast()
  const [items, setItems] = useState<SettlementItem[]>([])
  const [status, setStatus] = useState<SettlementStatus>('ALL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems(await getStudioSettlements({ status }))
    } catch {
      setError('Khong tai duoc settlement cua studio.')
      toast.push({ type: 'error', title: 'Tai settlement that bai' })
    } finally {
      setLoading(false)
    }
  }, [status, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totals = useMemo(() => ({
    ready: items.filter((item) => item.status === 'READY').reduce((sum, item) => sum + item.studioAmount, 0),
    paid: items.filter((item) => item.status === 'PAID').reduce((sum, item) => sum + item.studioAmount, 0),
    pendingCount: items.filter((item) => item.status === 'READY' || item.status === 'PENDING').length,
    gross: items.reduce((sum, item) => sum + item.grossAmount, 0),
  }), [items])

  return (
    <div className="space-y-6 pb-20">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Studio finance</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950">Settlements</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Tien studio duoc tao khi booking COMPLETED. Admin se chuyen khoan thu cong va danh dau PAID.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={status} onChange={(event) => setStatus(event.target.value as SettlementStatus)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none">
              {statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button type="button" onClick={fetchData} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        {error && <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Ready to payout" value={formatVnd(totals.ready)} tone="indigo" />
        <Metric label="Paid" value={formatVnd(totals.paid)} tone="emerald" />
        <Metric label="Pending records" value={totals.pendingCount} />
        <Metric label="Gross tracked" value={formatVnd(totals.gross)} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 p-4">
          <h2 className="text-base font-semibold text-slate-900">Settlement history</h2>
        </div>
        {loading ? <TableSkeleton /> : items.length === 0 ? <EmptyState text="Khong co settlement phu hop." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-5 py-3 text-right">Gross</th>
                  <th className="px-5 py-3 text-right">Platform fee</th>
                  <th className="px-5 py-3 text-right">Studio amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Dates</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.settlementId} className="border-b border-slate-100 hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="font-mono text-xs font-semibold text-slate-600">#{item.bookingCode}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.customerName} · {item.bookingStatus}</div>
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-medium">{formatVnd(item.grossAmount)}</td>
                    <td className="px-5 py-4 text-right text-sm text-rose-700">{item.platformFeePercent}% · {formatVnd(item.platformFeeAmount)}</td>
                    <td className="px-5 py-4 text-right text-sm font-bold text-emerald-700">{formatVnd(item.studioAmount)}</td>
                    <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      <div>Completed: {formatDate(item.completedAt)}</div>
                      <div className="mt-1">Paid: {formatDate(item.paidAt)}</div>
                    </td>
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

function Metric({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'slate' | 'emerald' | 'rose' | 'indigo' }) {
  const color = { slate: 'text-slate-950', emerald: 'text-emerald-700', rose: 'text-rose-700', indigo: 'text-indigo-700' }[tone]
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p><p className={`mt-2 truncate text-xl font-black ${color}`}>{value}</p></div>
}

function StatusBadge({ status }: { status: string }) {
  const style = status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : status === 'READY' ? 'bg-indigo-50 text-indigo-700' : status === 'FAILED' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${style}`}><CircleDollarSign className="h-3.5 w-3.5" />{status}</span>
}

function TableSkeleton() {
  return <div className="p-5">{Array.from({ length: 5 }).map((_, row) => <div key={row} className="grid grid-cols-6 gap-4 border-b border-slate-100 py-4">{Array.from({ length: 6 }).map((__, col) => <div key={col} className="h-4 rounded-full bg-slate-100" />)}</div>)}</div>
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-6 py-16 text-center text-sm text-slate-500">{text}</div>
}
