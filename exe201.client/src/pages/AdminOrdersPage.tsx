import { useAppStore } from '../store/AppStore'
import { useToast } from '../components/Toast'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BookingStatus } from '../types'
import { RotateCcw, TrendingUp, AlertTriangle, CheckCircle, Clock, Shield, Search, Calendar } from 'lucide-react'

function formatVnd(v: number) { return new Intl.NumberFormat('vi-VN').format(v) + ' ₫' }
function formatDate(iso: string) { return new Date(iso).toLocaleDateString('vi-VN', { dateStyle: 'short' }) }

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'CHỜ DUYỆT', CONFIRMED: 'ĐÃ XÁC NHẬN', DELIVERED: 'ĐÃ GIAO ẢNH',
  COMPLETED: 'HOÀN THÀNH', DISPUTED: 'KHIẾU NẠI', REFUNDED: 'HOÀN TIỀN', CANCELLED: 'ĐÃ HỦY',
}
const STATUS_COLOR: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-600 ring-amber-100',
  CONFIRMED: 'bg-blue-50 text-blue-600 ring-blue-100',
  DELIVERED: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  COMPLETED: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  DISPUTED: 'bg-rose-50 text-rose-600 ring-rose-100',
  REFUNDED: 'bg-slate-50 text-slate-500 ring-slate-100',
  CANCELLED: 'bg-slate-50 text-slate-400 ring-slate-100',
}

export default function AdminOrdersPage() {
  const { state, actions } = useAppStore()
  const toast = useToast()
  const [filter, setFilter] = useState<BookingStatus | 'ALL' | 'DISPUTES'>('ALL')
  const [resolveNote, setResolveNote] = useState('')
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const openDisputes = state.disputes.filter((d) => d.status === 'open')
  const bookings = filter === 'ALL'
    ? state.bookings
    : filter === 'DISPUTES'
      ? state.bookings.filter((b) => b.status === 'DISPUTED')
      : state.bookings.filter((b) => b.status === filter)

  const totalPlatformFee = state.payments.reduce((s, p) => s + (p.status === 'released' ? p.platformFee : 0), 0)
  const holdingAmount = state.payments.filter((p) => p.status === 'holding').reduce((s, p) => s + p.amount, 0)

  async function handleResolve(bookingId: string, decision: 'refund' | 'release') {
    setResolvingId(bookingId)
    await new Promise((r) => setTimeout(r, 700))
    actions.resolveDispute(bookingId, decision, resolveNote)
    toast.push({
      type: 'success',
      title: decision === 'refund' ? 'Hoàn tiền thành công' : 'Đã release thanh toán',
      message: resolveNote || (decision === 'refund' ? 'Yêu cầu hoàn tiền đã được xử lý.' : 'Tiền đã được chuyển vào ví Photographer.'),
    })
    setResolvingId(null)
    setResolveNote('')
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Premium Header */}
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Giao dịch & Escrow</h1>
          <p className="mt-2 text-[15px] font-medium text-slate-500 max-w-xl leading-relaxed">
            Theo dõi dòng tiền an toàn (Escrow), phí nền tảng và quản lý các tranh chấp thanh toán chuyên nghiệp.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Tổng đơn hàng" value={state.bookings.length} icon={<Clock className="h-5 w-5" />} color="slate" />
        <KpiCard label="Đang giữ Escrow" value={formatVnd(holdingAmount)} icon={<Shield className="h-5 w-5" />} color="amber" />
        <KpiCard label="Doanh thu Platform" value={formatVnd(totalPlatformFee)} icon={<TrendingUp className="h-5 w-5" />} color="indigo" highlight />
        <KpiCard label="Khiếu nại cần xử lý" value={openDisputes.length} icon={<AlertTriangle className="h-5 w-5" />} color="rose" urgent={openDisputes.length > 0} />
      </div>

      {/* Disputes section */}
      <AnimatePresence>
        {openDisputes.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mb-12 space-y-6">
            <h2 className="text-lg font-black text-rose-600 flex items-center gap-3 px-2">
              <div className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
              TRANH CHẤP TRỌNG YẾU ({openDisputes.length})
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {openDisputes.map((d) => {
                const booking = state.bookings.find((b) => b.id === d.bookingId)
                const payment = state.payments.find((p) => p.bookingId === d.bookingId)
                const isResolving = resolvingId === d.bookingId
                if (!booking) return null
                return (
                  <div key={d.id} className="flex flex-col rounded-[32px] border border-rose-100 bg-white shadow-xl shadow-rose-200/20 overflow-hidden ring-1 ring-rose-50">
                    <div className="bg-rose-50/40 p-6 md:p-8">
                      <div className="flex items-center justify-between mb-6">
                        <span className="font-black text-[10px] tracking-widest text-slate-400 uppercase">CASE #{booking.id.substring(0, 12)}</span>
                        <span className="rounded-xl bg-white px-3 py-1 text-[11px] font-black text-rose-600 shadow-sm">{formatDate(booking.date)}</span>
                      </div>

                      <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1">
                          <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Khách hàng</div>
                          <div className="text-[15px] font-black text-slate-900 truncate">{booking.customerName}</div>
                        </div>
                        <div className="h-8 w-8 flex items-center justify-center rounded-full bg-rose-100 italic font-black text-rose-600">vs</div>
                        <div className="flex-1 text-right">
                          <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Photographer</div>
                          <div className="text-[15px] font-black text-slate-900 truncate">{booking.photographerName}</div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-rose-100">
                        <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <AlertTriangle className="h-3 w-3" /> Lý do khiếu nại
                        </div>
                        <p className="text-[13px] font-medium leading-relaxed text-slate-700 italic">"{d.reason}"</p>
                      </div>
                    </div>

                    <div className="flex flex-col flex-1 p-6 md:p-8">
                      <div className="mb-6 flex flex-row items-center justify-between rounded-2xl bg-slate-50 px-5 py-3 border border-slate-100 ring-1 ring-inset ring-white">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Escrow Balance</span>
                        <span className="text-lg font-black text-slate-900">{payment ? formatVnd(payment.amount) : '0 ₫'}</span>
                      </div>

                      <div className="mt-auto space-y-4">
                        <input value={resolveNote} onChange={(e) => setResolveNote(e.target.value)}
                          placeholder="Ghi chú phán xử từ Admin..."
                          className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold outline-none ring-indigo-500/10 transition focus:border-indigo-500 focus:ring-4 placeholder:text-slate-300" />

                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => handleResolve(d.bookingId, 'refund')} disabled={isResolving}
                            className={`flex items-center justify-center gap-2 rounded-2xl border py-4 text-[11px] font-black uppercase tracking-widest transition-all ${isResolving ? 'bg-slate-50 text-slate-300' : 'border-rose-100 bg-white text-rose-600 hover:bg-rose-50 active:scale-[0.98]'}`}>
                            <RotateCcw className="h-4 w-4" /> HOÀN TIỀN
                          </button>
                          <button onClick={() => handleResolve(d.bookingId, 'release')} disabled={isResolving}
                            className={`flex items-center justify-center gap-2 rounded-2xl py-4 text-[11px] font-black uppercase tracking-widest transition-all ${isResolving ? 'bg-slate-50 text-slate-300' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-[0.98]'}`}>
                            <CheckCircle className="h-4 w-4" /> TRẢ TIỀN THỢ
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Transactions Section */}
      <div className="mt-16 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-col border-b border-slate-100 px-8 py-6 lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Bảng giao dịch</h2>
            <p className="mt-1 text-xs font-bold text-slate-400">Tất cả lịch chụp và trạng thái thanh toán Escrow</p>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {(['ALL', 'PENDING', 'CONFIRMED', 'DELIVERED', 'COMPLETED', 'DISPUTED', 'REFUNDED'] as const).map((s) => {
              const count = s === 'ALL' ? state.bookings.length : state.bookings.filter((b) => b.status === s).length
              const isSelected = filter === s
              if (count === 0 && s !== 'ALL') return null
              return (
                <button key={s} onClick={() => setFilter(s)}
                  className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${isSelected
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
                  {s === 'ALL' ? 'Tất cả' : STATUS_LABEL[s as BookingStatus]}
                  <span className={`inline-flex items-center justify-center rounded-lg px-1.5 py-0.5 text-[9px] font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="overflow-x-auto px-2 pb-2">
          <table className="w-full border-separate border-spacing-0 px-4 py-2">
            <thead>
              <tr className="text-left">
                <th className="rounded-l-2xl border-b border-slate-50 bg-slate-50/50 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Reference</th>
                <th className="border-b border-slate-50 bg-slate-50/50 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Khách hàng / Thợ</th>
                <th className="border-b border-slate-50 bg-slate-50/50 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Booking Info</th>
                <th className="border-b border-slate-50 bg-slate-50/50 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Giá trị Escrow</th>
                <th className="rounded-r-2xl border-b border-slate-50 bg-slate-50/50 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.map((b, i) => {
                const payment = state.payments.find((p) => p.bookingId === b.id)
                return (
                  <motion.tr key={b.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className="group hover:bg-slate-50/40 transition-all duration-300">
                    <td className="px-6 py-6 items-start">
                      <div className="text-[10px] font-black font-mono text-slate-300 group-hover:text-indigo-500 transition-colors">#{b.id.substring(0, 12)}</div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-md bg-indigo-50 flex items-center justify-center text-[9px] font-black text-indigo-600 ring-1 ring-indigo-100">K</div>
                          <span className="text-sm font-black text-slate-900">{b.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-md bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400">T</div>
                          <span className="text-[13px] font-bold text-slate-500">{b.photographerName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="text-[13px] font-black text-slate-800">{b.packageTier} Edition</div>
                      <div className="mt-1 text-xs font-bold text-slate-400 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" /> {formatDate(b.date)}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="text-sm font-black text-slate-900">{formatVnd(b.totalPrice)}</div>
                      {payment && (
                        <div className="mt-1.5 flex justify-end">
                          <EscrowBadge status={payment.status} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className={`inline-flex items-center rounded-xl ring-1 ring-inset px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${STATUS_COLOR[b.status]}`}>
                        {STATUS_LABEL[b.status]}
                      </span>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <div className="py-20 text-center">
              <Search className="mx-auto h-12 w-12 text-slate-200 mb-4" />
              <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Không có dữ liệu phù hợp</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, icon, color, highlight, urgent }: { label: string, value: string | number, icon: React.ReactNode, color: string, highlight?: boolean, urgent?: boolean }) {
  const colorMap: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-600 ring-slate-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    rose: 'bg-rose-50 text-rose-600 ring-rose-100',
  }
  return (
    <div className={`flex flex-col rounded-[28px] border p-6 shadow-sm transition-all hover:shadow-lg ${urgent ? 'border-rose-200 bg-rose-50/20' : highlight ? 'border-indigo-100 bg-white ring-1 ring-indigo-50' : 'border-slate-100 bg-white'}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ring-inset ${colorMap[color]}`}>
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <div className={`text-2xl font-black tracking-tight ${highlight ? 'text-indigo-700' : 'text-slate-900'}`}>{value}</div>
    </div>
  )
}

function EscrowBadge({ status }: { status: string }) {
  if (status === 'holding') return <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 border border-amber-200 bg-amber-50 px-2 py-0.5 rounded-lg">🔒 HOLDING</span>
  if (status === 'released') return <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 border border-emerald-200 bg-emerald-50 px-2 py-0.5 rounded-lg">✅ RELEASED</span>
  return <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 border border-slate-200 bg-slate-50 px-2 py-0.5 rounded-lg">↩ REFUNDED</span>
}
