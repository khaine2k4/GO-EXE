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
  { value: 'ALL', label: 'Tat ca status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const methodOptions: { value: AdminPaymentMethod; label: string }[] = [
  { value: 'ALL', label: 'Tat ca method' },
  { value: 'CASH', label: 'Cash' },
  { value: 'VNPAY', label: 'VNPAY' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'MOMO', label: 'Momo' },
  { value: 'PAYPAL', label: 'PayPal' },
]

const updateStatusOptions: Exclude<AdminPaymentStatus, 'ALL'>[] = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED']

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
      setError('Khong tai duoc danh sach payment tu API admin.')
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
      setError('Khong tai duoc chi tiet payment.')
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
      toast.push({ type: 'success', title: 'Da cap nhat payment', message: response.payment.paymentCode })
      setUpdatingPayment(null)
      setDetail(response.payment)
      await fetchData()
    } catch {
      setError('Cap nhat trang thai payment that bai.')
      toast.push({ type: 'error', title: 'Cap nhat payment that bai' })
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
        <Metric label="Tong payment" value={stats.total} />
        <Metric label="Da thanh toan" value={stats.paid} tone="emerald" />
        <Metric label="Dang cho" value={stats.pending} tone="amber" />
        <Metric label="Tong gia tri" value={formatVnd(stats.amount)} tone="indigo" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-[280px] xl:w-[420px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tim payment, booking, giao dich, khach, studio..."
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
                { value: 'newest', label: 'Moi nhat' },
                { value: 'oldest', label: 'Cu nhat' },
                { value: 'amount_desc', label: 'Tien cao' },
                { value: 'amount_asc', label: 'Tien thap' },
                { value: 'status', label: 'Theo status' },
              ]}
            />
            <button type="button" onClick={fetchData} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Lam moi
            </button>
          </div>
        </div>

        {error && <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

        <PaymentsTable payments={payments} loading={loading} detailLoading={detailLoading} onDetail={openDetail} />

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
          <span>Hien thi {payments.length} payment</span>
          {(searchTerm || status !== 'ALL' || method !== 'ALL') && (
            <button type="button" onClick={clearFilters} className="font-medium text-indigo-600 hover:text-indigo-700">
              Xoa bo loc
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
  if (payments.length === 0) return <EmptyState text="Khong co payment phu hop." />

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px]">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
            <th className="px-5 py-3">Payment</th>
            <th className="px-5 py-3">Booking</th>
            <th className="px-5 py-3">Customer</th>
            <th className="px-5 py-3">Studio</th>
            <th className="px-5 py-3 text-right">Amount</th>
            <th className="px-5 py-3">Method</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Transaction</th>
            <th className="px-5 py-3">Dates</th>
            <th className="px-5 py-3 text-right">Actions</th>
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
                <div className="text-xs text-slate-500">Paid: {formatDate(payment.paidAt)}</div>
                <div className="mt-1 text-xs text-slate-500">Created: {formatDate(payment.createdAt)}</div>
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end">
                  <button type="button" onClick={() => onDetail(payment.paymentId)} disabled={detailLoading} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                    <Eye className="h-4 w-4" />
                    Detail
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
        <ModalHeader title="Payment detail" subtitle={payment.paymentCode} onClose={onClose} />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InfoRow label="Status" value={<PaymentStatusBadge status={payment.paymentStatus} />} />
          <InfoRow label="Amount" value={formatVnd(payment.amount)} />
          <InfoRow label="Method" value={payment.paymentMethod} />
          <InfoRow label="Transaction" value={payment.transactionCode || '-'} />
          <InfoRow label="Provider ref" value={payment.providerRef || '-'} />
          <InfoRow label="Failure reason" value={payment.failureReason || '-'} />
          <InfoRow label="Paid at" value={formatDate(payment.paidAt)} />
          <InfoRow label="Refunded at" value={formatDate(payment.refundedAt)} />
          <InfoRow label="Booking" value={`${payment.bookingCode} · ${payment.bookingStatus}`} />
          <InfoRow label="Package" value={payment.packageName} />
          <InfoRow label="Customer" value={`${payment.customerName} · ${payment.customerEmail}`} />
          <InfoRow label="Studio" value={payment.studioName} />
          <InfoRow label="Shooting date" value={payment.shootingDate || '-'} />
          <InfoRow label="Location" value={payment.shootingLocation || '-'} />
          <InfoRow label="Commission" value={`${payment.commissionPercent}% · ${formatVnd(payment.commissionAmount)}`} />
          <InfoRow label="Studio revenue" value={formatVnd(payment.studioRevenue)} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">Close</button>
          <button type="button" onClick={onUpdate} className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800">Update status</button>
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
        <ModalHeader title="Update payment status" subtitle={payment.paymentCode} onClose={onClose} />
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
            <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as Exclude<AdminPaymentStatus, 'ALL'>)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10">
              {updateStatusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transaction code</span>
            <input value={transactionCode} onChange={(event) => setTransactionCode(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reason / note</span>
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
          </label>
          <p className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs font-medium text-amber-800">Manual update chi doi payment status va timestamp lien quan, khong tu doi booking status.</p>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={onSubmit} disabled={loading} className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400">{loading ? 'Updating...' : 'Confirm update'}</button>
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
    CANCELLED: 'border-slate-200 bg-slate-50 text-slate-500',
  }
  return <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${config[status] ?? config.PENDING}`}>{status}</span>
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
