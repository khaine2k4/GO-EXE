import { AnimatePresence, motion } from 'framer-motion'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, CircleDollarSign, Eye, Filter, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react'
import { useToast } from '../components/Toast'
import {
  getAdminPaymentDetail,
  getAdminPayments,
  type AdminPaymentDetail,
  type AdminPaymentItem,
  type AdminPaymentMethod,
  type AdminPaymentStatus,
  updateAdminPaymentStatus,
} from '../services/adminPaymentApi'

const statusOptions: { value: AdminPaymentStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền' },
  { value: 'PARTIALLY_REFUNDED', label: 'Hoàn một phần' },
  { value: 'FORFEITED', label: 'Mất phí' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'REFUND_PENDING', label: 'Chờ hoàn tiền' },
]

const methodOptions: { value: AdminPaymentMethod; label: string }[] = [
  { value: 'ALL', label: 'Tất cả phương thức' },
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'PAYOS', label: 'payOS (VietQR)' },
  { value: 'VNPAY', label: 'VNPAY' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
  { value: 'MOMO', label: 'Momo' },
  { value: 'PAYPAL', label: 'PayPal' },
]

const updateStatusOptions: Exclude<AdminPaymentStatus, 'ALL'>[] = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED', 'REFUND_PENDING']

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
  PARTIALLY_REFUNDED: 'Hoàn một phần',
  FORFEITED: 'Mất phí',
  CANCELLED: 'Đã hủy',
  REFUND_PENDING: 'Chờ hoàn tiền',
}

function formatVnd(value?: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value ?? 0)} VND`
}

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}

export default function AdminPaymentsPage() {
  const toast = useToast()
  const [payments, setPayments] = useState<AdminPaymentItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState<AdminPaymentStatus>('ALL')
  const [method, setMethod] = useState<AdminPaymentMethod>('ALL')
  const [sortBy, setSortBy] = useState('newest')
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<AdminPaymentDetail | null>(null)
  const [updatingPayment, setUpdatingPayment] = useState<AdminPaymentDetail | null>(null)
  const [nextStatus, setNextStatus] = useState<Exclude<AdminPaymentStatus, 'ALL'>>('PAID')
  const [reasonText, setReasonText] = useState('')
  const [transactionCode, setTransactionCode] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const params = useMemo(() => {
    const query: Record<string, string> = { sortBy }
    if (searchTerm.trim()) query.search = searchTerm.trim()
    if (status !== 'ALL') query.status = status
    if (method !== 'ALL') query.method = method
    return query
  }, [method, searchTerm, sortBy, status])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setPayments(await getAdminPayments(params))
    } catch {
      setError('Không tải được danh sách payment từ API admin.')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchData, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [fetchData])

  async function openDetail(paymentId: number) {
    setDetailLoading(true)
    setError('')
    try {
      setDetail(await getAdminPaymentDetail(paymentId))
    } catch {
      setError('Không tải được chi tiết payment.')
    } finally {
      setDetailLoading(false)
    }
  }

  function openUpdateModal(payment: AdminPaymentDetail) {
    const current = updateStatusOptions.includes(payment.paymentStatus as Exclude<AdminPaymentStatus, 'ALL'>)
      ? payment.paymentStatus as Exclude<AdminPaymentStatus, 'ALL'>
      : 'PAID'
    setUpdatingPayment(payment)
    setNextStatus(current)
    setReasonText('')
    setTransactionCode(payment.transactionCode ?? '')
  }

  async function submitStatusUpdate() {
    if (!updatingPayment) return
    setActionLoading(true)
    setError('')
    try {
      const response = await updateAdminPaymentStatus(updatingPayment.paymentId, {
        status: nextStatus,
        reason: reasonText.trim() || undefined,
        transactionCode: transactionCode.trim() || undefined,
      })
      toast.push({ type: 'success', title: 'Đã cập nhật payment', message: response.payment.paymentCode })
      setUpdatingPayment(null)
      setDetail(response.payment)
      await fetchData()
    } catch {
      setError('Cập nhật trạng thái payment thất bại.')
      toast.push({ type: 'error', title: 'Cập nhật payment thất bại' })
    } finally {
      setActionLoading(false)
    }
  }

  function clearFilters() {
    setSearchTerm('')
    setStatus('ALL')
    setMethod('ALL')
    setSortBy('newest')
  }

  const stats = {
    total: payments.length,
    paid: payments.filter((item) => item.paymentStatus === 'PAID').length,
    pending: payments.filter((item) => item.paymentStatus === 'PENDING').length,
    amount: payments.reduce((sum, item) => sum + item.amount, 0),
  }

  return (
    <div className="space-y-5 pb-12">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Tổng payment" value={stats.total} />
        <Metric label="Đã thanh toán" value={stats.paid} tone="emerald" />
        <Metric label="Đang chờ" value={stats.pending} tone="amber" />
        <Metric label="Tổng giá trị" value={formatVnd(stats.amount)} tone="indigo" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-[280px] xl:w-[420px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm payment, booking, giao dịch, khách, studio..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <SelectBox icon={<Filter className="h-4 w-4" />} value={status} onChange={(value) => setStatus(value as AdminPaymentStatus)} options={statusOptions} />
            <SelectBox icon={<CircleDollarSign className="h-4 w-4" />} value={method} onChange={(value) => setMethod(value as AdminPaymentMethod)} options={methodOptions} />
            <SelectBox
              icon={<SlidersHorizontal className="h-4 w-4" />}
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'newest', label: 'Mới nhất' },
                { value: 'oldest', label: 'Cũ nhất' },
                { value: 'amount_desc', label: 'Tiền cao' },
                { value: 'amount_asc', label: 'Tiền thấp' },
                { value: 'status', label: 'Theo trạng thái' },
              ]}
            />
            <button type="button" onClick={fetchData} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        {error && <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

        <PaymentsTable payments={payments} loading={loading} detailLoading={detailLoading} onDetail={openDetail} />

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
          <span>Hiển thị {payments.length} payment</span>
          {(searchTerm || status !== 'ALL' || method !== 'ALL') && (
            <button type="button" onClick={clearFilters} className="font-medium text-indigo-600 hover:text-indigo-700">
              Xóa bộ lọc
            </button>
          )}
        </div>
      </section>

      <AnimatePresence>
        {detail && (
          <PaymentDetailModal
            payment={detail}
            onClose={() => setDetail(null)}
            onUpdate={() => openUpdateModal(detail)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {updatingPayment && (
          <UpdateStatusModal
            payment={updatingPayment}
            nextStatus={nextStatus}
            setNextStatus={setNextStatus}
            reason={reasonText}
            setReason={setReasonText}
            transactionCode={transactionCode}
            setTransactionCode={setTransactionCode}
            loading={actionLoading}
            onClose={() => setUpdatingPayment(null)}
            onSubmit={submitStatusUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function PaymentsTable({ payments, loading, detailLoading, onDetail }: { payments: AdminPaymentItem[]; loading: boolean; detailLoading: boolean; onDetail: (paymentId: number) => void }) {
  if (loading) return <TableSkeleton columns={10} />
  if (payments.length === 0) return <EmptyState text="Không có payment phù hợp." />

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px]">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
            <th className="px-5 py-3">Payment</th>
            <th className="px-5 py-3">Booking</th>
            <th className="px-5 py-3">Khách hàng</th>
            <th className="px-5 py-3">Studio</th>
            <th className="px-5 py-3 text-right">Số tiền</th>
            <th className="px-5 py-3">Phương thức</th>
            <th className="px-5 py-3">Trạng thái</th>
            <th className="px-5 py-3">Giao dịch</th>
            <th className="px-5 py-3">Thời gian</th>
            <th className="px-5 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.paymentId} className="border-b border-slate-100 transition hover:bg-slate-50/70">
              <td className="px-5 py-4">
                <div className="font-mono text-xs font-semibold text-slate-500">#{payment.paymentCode}</div>
                <div className="mt-1 text-xs text-slate-400">ID {payment.paymentId}</div>
              </td>
              <td className="px-5 py-4">
                <div className="font-mono text-xs font-semibold text-slate-600">#{payment.bookingCode}</div>
                <div className="mt-1 text-xs text-slate-400">Booking ID {payment.bookingId}</div>
              </td>
              <td className="px-5 py-4">
                <div className="text-sm font-medium text-slate-900">{payment.customerName}</div>
                <div className="mt-1 text-xs text-slate-500">{payment.customerEmail}</div>
              </td>
              <td className="px-5 py-4 text-sm font-medium text-slate-800">{payment.studioName}</td>
              <td className="px-5 py-4 text-right text-sm font-semibold text-slate-950">{formatVnd(payment.amount)}</td>
              <td className="px-5 py-4 text-sm text-slate-600">{payment.paymentMethod}</td>
              <td className="px-5 py-4"><PaymentStatusBadge status={payment.paymentStatus} /></td>
              <td className="px-5 py-4">
                <div className="max-w-[160px] truncate font-mono text-xs text-slate-600">{payment.transactionCode || '-'}</div>
                {payment.providerRef && <div className="mt-1 max-w-[160px] truncate text-xs text-slate-400">{payment.providerRef}</div>}
              </td>
              <td className="px-5 py-4">
                <div className="text-xs text-slate-500">Đã trả: {formatDate(payment.paidAt)}</div>
                <div className="mt-1 text-xs text-slate-500">Tạo lúc: {formatDate(payment.createdAt)}</div>
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end">
                  <button type="button" onClick={() => onDetail(payment.paymentId)} disabled={detailLoading} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                    <Eye className="h-4 w-4" />
                    Chi tiết
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PaymentDetailModal({ payment, onClose, onUpdate }: { payment: AdminPaymentDetail; onClose: () => void; onUpdate: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <ModalHeader title="Chi tiết payment" subtitle={payment.paymentCode} onClose={onClose} />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InfoRow label="Trạng thái" value={<PaymentStatusBadge status={payment.paymentStatus} />} />
          <InfoRow label="Số tiền" value={formatVnd(payment.amount)} />
          <InfoRow label="Phương thức" value={payment.paymentMethod} />
          <InfoRow label="Giao dịch" value={payment.transactionCode || '-'} />
          <InfoRow label="Mã tham chiếu" value={payment.providerRef || '-'} />
          <InfoRow label="Lý do thất bại" value={payment.failureReason || '-'} />
          <InfoRow label="Đã trả lúc" value={formatDate(payment.paidAt)} />
          <InfoRow label="Đã hoàn tiền lúc" value={formatDate(payment.refundedAt)} />
          <InfoRow label="Số tiền hoàn" value={payment.refundAmount != null ? formatVnd(payment.refundAmount) : '-'} />
          <InfoRow label="Số tiền giữ lại" value={payment.retainedAmount != null ? formatVnd(payment.retainedAmount) : '-'} />
          <InfoRow label="Studio nhận do policy" value={payment.studioCompensationAmount != null ? formatVnd(payment.studioCompensationAmount) : '-'} />
          <InfoRow label="Policy" value={payment.policyCode || '-'} />
          <InfoRow label="Ghi chú policy" value={payment.policyNote || '-'} />
          <InfoRow label="Booking" value={`${payment.bookingCode} · ${payment.bookingStatus}`} />
          <InfoRow label="Gói chụp" value={payment.packageName} />
          <InfoRow label="Khách hàng" value={`${payment.customerName} · ${payment.customerEmail}`} />
          <InfoRow label="Studio" value={payment.studioName} />
          <InfoRow label="Ngày chụp" value={payment.shootingDate || '-'} />
          <InfoRow label="Địa điểm" value={payment.shootingLocation || '-'} />
          <InfoRow label="Commission" value={`${payment.commissionPercent}% · ${formatVnd(payment.commissionAmount)}`} />
          <InfoRow label="Doanh thu studio" value={formatVnd(payment.studioRevenue)} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">Đóng</button>
          <button type="button" onClick={onUpdate} className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800">Cập nhật trạng thái</button>
        </div>
      </motion.div>
    </div>
  )
}

function UpdateStatusModal({
  payment,
  nextStatus,
  setNextStatus,
  reason,
  setReason,
  transactionCode,
  setTransactionCode,
  loading,
  onClose,
  onSubmit,
}: {
  payment: AdminPaymentDetail
  nextStatus: Exclude<AdminPaymentStatus, 'ALL'>
  setNextStatus: (status: Exclude<AdminPaymentStatus, 'ALL'>) => void
  reason: string
  setReason: (value: string) => void
  transactionCode: string
  setTransactionCode: (value: string) => void
  loading: boolean
  onClose: () => void
  onSubmit: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <ModalHeader title="Cập nhật trạng thái payment" subtitle={payment.paymentCode} onClose={onClose} />
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</span>
            <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as Exclude<AdminPaymentStatus, 'ALL'>)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10">
              {updateStatusOptions.map((item) => <option key={item} value={item}>{paymentStatusLabels[item] ?? item}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mã giao dịch</span>
            <input value={transactionCode} onChange={(event) => setTransactionCode(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lý do / ghi chú</span>
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
          </label>
          <p className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs font-medium text-amber-800">Cập nhật thủ công chỉ đổi trạng thái payment và timestamp liên quan, không tự đổi trạng thái booking.</p>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">Hủy</button>
          <button type="button" onClick={onSubmit} disabled={loading} className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400">{loading ? 'Đang cập nhật...' : 'Xác nhận cập nhật'}</button>
        </div>
      </motion.div>
    </div>
  )
}

function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 font-mono text-xs text-slate-500">#{subtitle}</p>
      </div>
      <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</div>
    </div>
  )
}

function Metric({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'slate' | 'amber' | 'emerald' | 'indigo' }) {
  const toneClass = {
    slate: 'text-slate-950',
    amber: 'text-amber-700',
    emerald: 'text-emerald-700',
    indigo: 'text-indigo-700',
  }[tone]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-2 truncate text-xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  )
}

function SelectBox({ icon, value, onChange, options }: { icon: React.ReactNode; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="relative inline-flex h-10 items-center">
      <span className="pointer-events-none absolute left-3 text-slate-400">{icon}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-400" />
    </label>
  )
}

function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
    PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    FAILED: 'border-rose-200 bg-rose-50 text-rose-700',
    REFUNDED: 'border-slate-200 bg-slate-50 text-slate-600',
    PARTIALLY_REFUNDED: 'border-blue-200 bg-blue-50 text-blue-700',
    FORFEITED: 'border-amber-200 bg-amber-50 text-amber-700',
    CANCELLED: 'border-slate-200 bg-slate-50 text-slate-500',
    REFUND_PENDING: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  }
  return <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${config[status] ?? config.PENDING}`}>{paymentStatusLabels[status] ?? status}</span>
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="p-5">
      {Array.from({ length: 6 }).map((_, row) => (
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
