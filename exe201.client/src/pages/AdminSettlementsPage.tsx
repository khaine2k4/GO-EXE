import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, CircleDollarSign, RefreshCw, Search } from 'lucide-react'
import { useToast } from '../components/Toast'
import { getAdminSettlements, markSettlementPaid, type SettlementItem, type SettlementStatus } from '../services/settlementApi'

const statusOptions: SettlementStatus[] = ['ALL', 'READY', 'PENDING', 'PAID', 'FAILED', 'CANCELLED']
const statusLabels: Record<string, string> = {
  ALL: 'Tất cả trạng thái',
  READY: 'Sẵn sàng payout',
  PENDING: 'Đang chờ',
  PAID: 'Đã payout',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
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
      setError('Không tải được danh sách settlement.')
      toast.push({ type: 'error', title: 'Tải settlement thất bại' })
    } finally {
      setLoading(false)
    }
  }, [params, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handlePayout(item: SettlementItem, method: string) {
    setPayingId(item.settlementId)
    try {
      const response = await markSettlementPaid(item.settlementId, method)
      setItems((current) => current.map((row) => row.settlementId === item.settlementId ? response.settlement : row))
      toast.push({ type: 'success', title: 'Đã xác nhận payout', message: item.bookingCode })
    } catch {
      toast.push({ type: 'error', title: 'Payout thất bại' })
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
            <h1 className="mt-2 text-2xl font-black text-slate-950">Hàng chờ payout studio</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Theo dõi dòng tiền từ booking đã hoàn thành và xác nhận chuyển khoản thủ công.</p>
          </div>
          <button type="button" onClick={fetchData} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
        {error && <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Bản ghi" value={totals.count} />
        <Metric label="Sẵn sàng payout" value={totals.ready} tone="indigo" />
        <Metric label="Tiền studio" value={formatVnd(totals.studioAmount)} tone="emerald" />
        <Metric label="Phí nền tảng" value={formatVnd(totals.platformFee)} tone="rose" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm booking, studio, khách hàng..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" />
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={status} onChange={(event) => setStatus(event.target.value as SettlementStatus)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none">
              {statusOptions.map((item) => <option key={item} value={item}>{statusLabels[item] ?? item}</option>)}
            </select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none">
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="amount_desc">Tiền studio cao</option>
              <option value="amount_asc">Tiền studio thấp</option>
              <option value="status">Trạng thái</option>
            </select>
          </div>
        </div>

        {loading ? <TableSkeleton /> : items.length === 0 ? <EmptyState text="Không có settlement phù hợp." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-5 py-3">Studio</th>
                  <th className="px-5 py-3 text-right">Tổng tiền</th>
                  <th className="px-5 py-3 text-right">Phí</th>
                  <th className="px-5 py-3 text-right">Tiền studio</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3">Thời gian</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
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
                      <div>Hoàn thành: {formatDate(item.completedAt)}</div>
                      <div className="mt-1">Đã trả: {formatDate(item.paidAt)}</div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {item.status !== 'PAID' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handlePayout(item, 'PAYOS_PAYOUT')}
                              disabled={payingId === item.settlementId}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              payOS Payout
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePayout(item, 'MANUAL')}
                              disabled={payingId === item.settlementId}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Manual Payout
                            </button>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">Đã quyết toán ({item.payoutMethod})</span>
                        )}
                      </div>
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
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${style}`}><CircleDollarSign className="h-3.5 w-3.5" />{statusLabels[status] ?? status}</span>
}

function TableSkeleton() {
  return <div className="p-5">{Array.from({ length: 5 }).map((_, row) => <div key={row} className="grid grid-cols-8 gap-4 border-b border-slate-100 py-4">{Array.from({ length: 8 }).map((__, col) => <div key={col} className="h-4 rounded-full bg-slate-100" />)}</div>)}</div>
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-6 py-16 text-center text-sm text-slate-500">{text}</div>
}
