import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, CircleDollarSign, RefreshCw, Search } from 'lucide-react'
import { useToast } from '../components/Toast'
import { getAdminSettlements, reconcileSettlement, type SettlementItem, type SettlementStatus } from '../services/settlementApi'

const statusOptions: SettlementStatus[] = ['ALL', 'READY', 'RECONCILED', 'PAID', 'PENDING', 'FAILED', 'CANCELLED']
const statusLabels: Record<string, string> = {
  ALL: 'All',
  READY: 'Chờ đối soát',
  RECONCILED: 'Đã đối soát',
  PENDING: 'Pending',
  PAID: 'Đã đối soát (cũ)',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
}

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
  const [payoutMethod, setPayoutMethod] = useState('RECONCILIATION')
  const [confirmTarget, setConfirmTarget] = useState<SettlementItem | null>(null)

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

  async function handleReconcile(item: SettlementItem) {
    if (item.status !== 'READY') return

    setPayingId(item.settlementId)
    try {
      const response = await reconcileSettlement(item.settlementId, payoutMethod || item.payoutMethod || 'RECONCILIATION')
      setItems((current) => current.map((row) => row.settlementId === item.settlementId ? response.settlement : row))
      setConfirmTarget(null)
      toast.push({ type: 'success', title: 'Đã ghi nhận đối soát', message: item.bookingCode })
    } catch {
      toast.push({ type: 'error', title: 'Ghi nhận đối soát thất bại' })
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
            <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Settlement reconciliation</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950">Đối soát doanh thu Studio</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Tiền đã cộng vào ví Studio khi booking hoàn tất. Màn này chỉ ghi nhận đối soát kế toán, không chuyển tiền thật.</p>
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
        <Metric label="Chờ đối soát" value={totals.ready} tone="indigo" />
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
              {statusOptions.map((item) => <option key={item} value={item}>{statusLabels[item] ?? item}</option>)}
            </select>
            <select value={payoutMethod} onChange={(event) => setPayoutMethod(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none">
              <option value="RECONCILIATION">Reconciliation</option>
              <option value="MANUAL">Manual note</option>
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
                      <div className="mt-1">Đối soát: {formatDate(item.paidAt)}</div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button type="button" onClick={() => setConfirmTarget(item)} disabled={item.status !== 'READY' || payingId === item.settlementId} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3 text-xs font-bold text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
                        <CheckCircle2 className="h-4 w-4" />
                        {item.status === 'READY' ? 'Ghi nhận đối soát' : 'Đã xử lý'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Ghi nhận đối soát</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">{confirmTarget.studioName}</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">Hành động này chỉ đánh dấu đã đối soát. Studio rút tiền thật qua ví và yêu cầu withdraw riêng.</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-semibold text-slate-500">Booking</span>
                <span className="font-mono font-black text-slate-800">#{confirmTarget.bookingCode}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                <span className="font-semibold text-slate-500">Studio amount</span>
                <span className="font-black text-emerald-700">{formatVnd(confirmTarget.studioAmount)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                <span className="font-semibold text-slate-500">Loại ghi nhận</span>
                <span className="font-black text-slate-800">{payoutMethod}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmTarget(null)} disabled={payingId === confirmTarget.settlementId} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={() => handleReconcile(confirmTarget)} disabled={payingId === confirmTarget.settlementId} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-indigo-600 disabled:bg-slate-300">
                <CheckCircle2 className="h-4 w-4" />
                {payingId === confirmTarget.settlementId ? 'Đang ghi nhận...' : 'Ghi nhận đối soát'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'slate' | 'emerald' | 'rose' | 'indigo' }) {
  const color = { slate: 'text-slate-950', emerald: 'text-emerald-700', rose: 'text-rose-700', indigo: 'text-indigo-700' }[tone]
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p><p className={`mt-2 truncate text-xl font-black ${color}`}>{value}</p></div>
}

function StatusBadge({ status }: { status: string }) {
  const style = status === 'RECONCILED' || status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : status === 'READY' ? 'bg-indigo-50 text-indigo-700' : status === 'FAILED' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${style}`}><CircleDollarSign className="h-3.5 w-3.5" />{statusLabels[status] ?? status}</span>
}

function TableSkeleton() {
  return <div className="p-5">{Array.from({ length: 5 }).map((_, row) => <div key={row} className="grid grid-cols-8 gap-4 border-b border-slate-100 py-4">{Array.from({ length: 8 }).map((__, col) => <div key={col} className="h-4 rounded-full bg-slate-100" />)}</div>)}</div>
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-6 py-16 text-center text-sm text-slate-500">{text}</div>
}
