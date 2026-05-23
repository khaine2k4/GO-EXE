import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, CircleDollarSign, RefreshCw, Search } from 'lucide-react'
import { useToast } from '../components/Toast'
import { getAdminSettlements, markSettlementPaid, type SettlementItem, type SettlementStatus } from '../services/settlementApi'

const statusOptions: SettlementStatus[] = ['ALL', 'READY', 'PENDING', 'PAID', 'FAILED', 'CANCELLED']

function formatVnd(value?: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value ?? 0)} VND`
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString('vi-VN') : '-'
}

export default function AdminSettlementsPage() {
  const toast = useToast()
  const [items, setItems] = useState<SettlementItem[]>([])
  const [status, setStatus] = useState<SettlementStatus>('READY')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [loading, setLoading] = useState(false)
  const [payingId, setPayingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const params = useMemo(() => ({
    status,
    search: search.trim() || undefined,
    sortBy,
  }), [search, sortBy, status])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems(await getAdminSettlements(params))
    } catch {
      setError('Khong tai duoc danh sach settlement.')
      toast.push({ type: 'error', title: 'Tai settlement that bai' })
    } finally {
      setLoading(false)
    }
  }, [params, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handlePayout(item: SettlementItem) {
    setPayingId(item.settlementId)
    try {
      const response = await markSettlementPaid(item.settlementId, item.payoutMethod || 'MANUAL')
      setItems((current) => current.map((row) => row.settlementId === item.settlementId ? response.settlement : row))
      toast.push({ type: 'success', title: 'Da xac nhan payout', message: item.bookingCode })
    } catch {
      toast.push({ type: 'error', title: 'Payout that bai' })
    } finally {
      setPayingId(null)
    }
  }

  const totals = useMemo(() => ({
    count: items.length,
    ready: items.filter((item) => item.status === 'READY').length,
    studioAmount: items.reduce((sum, item) => sum + item.studioAmount, 0),
    platformFee: items.reduce((sum, item) => sum + item.platformFeeAmount, 0),
  }), [items])

  return (
    <div className="space-y-6 pb-20">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Settlements</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950">Studio payout queue</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Theo doi dong tien tu booking da hoan thanh va xac nhan chuyen khoan thu cong.</p>
          </div>
          <button type="button" onClick={fetchData} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        {error && <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Records" value={totals.count} />
        <Metric label="Ready payout" value={totals.ready} tone="indigo" />
        <Metric label="Studio amount" value={formatVnd(totals.studioAmount)} tone="emerald" />
        <Metric label="Platform fee" value={formatVnd(totals.platformFee)} tone="rose" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tim booking, studio, customer..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" />
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={status} onChange={(event) => setStatus(event.target.value as SettlementStatus)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none">
              {statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none">
              <option value="newest">Moi nhat</option>
              <option value="oldest">Cu nhat</option>
              <option value="amount_desc">Tien studio cao</option>
              <option value="amount_asc">Tien studio thap</option>
              <option value="status">Trang thai</option>
            </select>
          </div>
        </div>

        {loading ? <TableSkeleton /> : items.length === 0 ? <EmptyState text="Khong co settlement phu hop." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-5 py-3">Studio</th>
                  <th className="px-5 py-3 text-right">Gross</th>
                  <th className="px-5 py-3 text-right">Fee</th>
                  <th className="px-5 py-3 text-right">Studio amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.settlementId} className="border-b border-slate-100 hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="font-mono text-xs font-semibold text-slate-600">#{item.bookingCode}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.customerName} · {item.bookingStatus}</div>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-900">{item.studioName}</td>
                    <td className="px-5 py-4 text-right text-sm font-semibold">{formatVnd(item.grossAmount)}</td>
                    <td className="px-5 py-4 text-right text-sm text-rose-700">{item.platformFeePercent}% · {formatVnd(item.platformFeeAmount)}</td>
                    <td className="px-5 py-4 text-right text-sm font-bold text-emerald-700">{formatVnd(item.studioAmount)}</td>
                    <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      <div>Completed: {formatDate(item.completedAt)}</div>
                      <div className="mt-1">Paid: {formatDate(item.paidAt)}</div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button type="button" onClick={() => handlePayout(item)} disabled={item.status === 'PAID' || payingId === item.settlementId} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3 text-xs font-bold text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
                        <CheckCircle2 className="h-4 w-4" />
                        Payout
                      </button>
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
  return <div className="p-5">{Array.from({ length: 5 }).map((_, row) => <div key={row} className="grid grid-cols-8 gap-4 border-b border-slate-100 py-4">{Array.from({ length: 8 }).map((__, col) => <div key={col} className="h-4 rounded-full bg-slate-100" />)}</div>)}</div>
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-6 py-16 text-center text-sm text-slate-500">{text}</div>
}
