import { AnimatePresence, motion } from 'framer-motion'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Calendar, ChevronDown, CircleDollarSign, Eye, Filter, RefreshCw, Search, ShieldCheck, SlidersHorizontal, X } from 'lucide-react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import CustomDialog from '../components/CustomDialog'
import { useSearchParams } from 'react-router-dom'

type BookingStatus = 'ALL' | 'PENDING_PAYMENT' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'DISPUTED' | 'NO_SHOW'
type PaymentStatus = 'ALL' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUND_PENDING' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'FORFEITED' | 'DISPUTED'

interface AdminBookingDto {
  id: number
  bookingCode: string
  customerName: string
  studioName: string
  packageName: string
  shootingDate: string
  status: string
  totalPrice: number
  commissionPercent: number
  commissionAmount: number
  studioRevenue: number
  paymentStatus?: string
  paymentAmount?: number
  paymentCode?: string
  city?: string
  disputeNote?: string
  createdAt: string
}

type PaymentDto = {
  id: number
  paymentCode: string
  methodName: string
  status: string
  amount: number
  currencyCode: string
  transactionCode?: string
  paidAt?: string
  refundedAt?: string
  refundMethod?: string
  refundPendingReason?: string
  createdAt: string
}

type BookingLogDto = {
  id: number
  oldStatus?: string
  newStatus?: string
  changedBy?: number
  changedByName?: string
  note?: string
  changedAt: string
}

type AdminBookingDetail = {
  id: number
  bookingCode: string
  status: string
  realStatus: string
  shootingDate: string
  startTime: string
  endTime: string
  shootingLocation?: string
  note?: string
  totalPrice: number
  commissionPercent: number
  commissionAmount: number
  studioRevenue: number
  confirmedAt?: string
  rejectedAt?: string
  rejectReason?: string
  completedAt?: string
  cancelledAt?: string
  cancelReason?: string
  customer: { id: number; name: string; email: string; phone?: string }
  studio: { id: number; name: string; studioName: string; email: string; phone?: string; city?: string; district?: string; addressLine?: string }
  package: { id: number; packageName: string; serviceName?: string; price: number }
  latestPayment?: PaymentDto
  payments: PaymentDto[]
  logs: BookingLogDto[]
  dispute?: {
    reason?: string
    disputedAt?: string
    createdBy?: number
    createdByName?: string
    createdByRole?: string
    resolvedAt?: string
    resolvedBy?: number
    resolvedByName?: string
  }
}

const bookingStatusOptions: { value: BookingStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả booking' },
  { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
  { value: 'PENDING_CONFIRMATION', label: 'Chờ Studio xác nhận' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'IN_PROGRESS', label: 'Đang chụp' },
  { value: 'DISPUTED', label: 'Khiếu nại' },
  { value: 'NO_SHOW', label: 'Khách không đến' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'REJECTED', label: 'Từ chối' },
]

const paymentStatusOptions: { value: PaymentStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả payment' },
  { value: 'PENDING', label: 'Chờ thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'REFUND_PENDING', label: 'Chờ hoàn tiền' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền' },
  { value: 'PARTIALLY_REFUNDED', label: 'Hoàn một phần' },
  { value: 'FORFEITED', label: 'Mất phí' },
  { value: 'DISPUTED', label: 'Tranh chấp' },
]

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PENDING_CONFIRMATION: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang chụp',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Từ chối',
  DISPUTED: 'Khiếu nại',
  NO_SHOW: 'Khách không đến',
}

const paymentLabels: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
  REFUND_PENDING: 'Chờ hoàn tiền',
  REFUNDED: 'Đã hoàn tiền',
  PARTIALLY_REFUNDED: 'Hoàn một phần',
  FORFEITED: 'Mất phí',
  DISPUTED: 'Tranh chấp',
}

function formatVnd(value?: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value ?? 0)} VND`
}

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: value.includes('T') ? 'short' : undefined })
}

function renderLogNote(note?: string) {
  if (!note) return null
  const trimmed = note.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      const photoUrls = parsed.PhotoUrls || parsed.photoUrls || []
      const textNote = parsed.Note || parsed.note || ''

      return (
        <div className="mt-2 space-y-2.5">
          {textNote && (
            <p className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs font-semibold text-slate-600 leading-relaxed">
              📝 {textNote}
            </p>
          )}
          {photoUrls.length > 0 && (
            <div className="grid gap-2 grid-cols-4 sm:grid-cols-6 mt-2">
              {photoUrls.map((url: string, index: number) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                >
                  <img src={url} alt={`Photo ${index + 1}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center text-[10px] font-black text-white uppercase tracking-wider">
                    Xem
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )
    } catch {
      // Fallback
    }
  }
  return <p className="mt-2 text-xs font-semibold text-slate-500 leading-relaxed">{note}</p>
}

export default function AdminOrdersPage() {
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const bookingIdParam = searchParams.get('bookingId')
  const [bookings, setBookings] = useState<AdminBookingDto[]>([])
  const [allBookings, setAllBookings] = useState<AdminBookingDto[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState<BookingStatus>('ALL')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('ALL')
  const [sortBy, setSortBy] = useState('newest')
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<AdminBookingDetail | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dialog, setDialog] = useState<{
    title: string
    message: string
    type?: 'confirm' | 'prompt'
    placeholder?: string
    defaultValue?: string
    confirmText?: string
    onConfirm: (value?: string) => void
  } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const params = useMemo(() => {
    const query: Record<string, string> = { sortBy }
    if (searchTerm.trim()) query.search = searchTerm.trim()
    if (status !== 'ALL') query.status = status
    if (paymentStatus !== 'ALL') query.paymentStatus = paymentStatus
    return query
  }, [paymentStatus, searchTerm, sortBy, status])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [filtered, total] = await Promise.all([
        api.get<AdminBookingDto[]>('/admin/bookings', { params }),
        api.get<AdminBookingDto[]>('/admin/bookings'),
      ])
      setBookings(filtered.data)
      setAllBookings(total.data)
    } catch {
      setError('Không tải được dữ liệu booking từ API admin.')
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

  useEffect(() => {
    setPage(1)
  }, [searchTerm, status, paymentStatus, sortBy, pageSize])

  const totalPages = Math.max(1, Math.ceil(bookings.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedBookings = bookings.slice(startIndex, startIndex + pageSize)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  async function openDetail(id: number) {
    setDetailLoading(true)
    setError('')
    try {
      const response = await api.get<AdminBookingDetail>(`/admin/bookings/${id}`)
      setDetail(response.data)
      setAdminNote('')
    } catch {
      setError('Không tải được chi tiết booking.')
    } finally {
      setDetailLoading(false)
    }
  }

  async function reloadDetail(id: number) {
    const response = await api.get<AdminBookingDetail>(`/admin/bookings/${id}`)
    setDetail(response.data)
  }

  useEffect(() => {
    if (bookingIdParam) {
      openDetail(Number(bookingIdParam))
      setSearchParams({}, { replace: true })
    }
  }, [bookingIdParam, setSearchParams])

  async function cancelSelectedBooking() {
    if (!detail) return
    setDialog({
      title: 'Hủy Booking Có Vấn Đề',
      message: `Nhập lý do hủy booking ${detail.bookingCode}. Lý do này sẽ được lưu vào lịch sử và gửi theo luồng hủy/hoàn tiền nếu có.`,
      type: 'prompt',
      placeholder: 'Ví dụ: Studio không thể thực hiện lịch chụp, cần hoàn tiền cho khách...',
      defaultValue: adminNote.trim(),
      confirmText: 'Hủy booking',
      onConfirm: async (value) => {
        const reason = value?.trim()
        if (!reason) return
        setActionLoading(true)
        try {
          await api.put(`/bookings/${detail.id}/cancel`, { reason })
          toast.push({ type: 'success', title: 'Đã hủy booking', message: detail.bookingCode })
          await reloadDetail(detail.id)
          await fetchData()
          setAdminNote('')
        } catch {
          toast.push({ type: 'error', title: 'Không thể hủy booking' })
        } finally {
          setActionLoading(false)
        }
      }
    })
  }

  async function resolveDispute(decision: 'RELEASE' | 'REFUND') {
    if (!detail) return
    setActionLoading(true)
    try {
      const response = await api.put<{ booking: AdminBookingDetail }>(`/admin/bookings/${detail.id}/resolve-dispute`, {
        decision,
        adminNote: adminNote.trim() || undefined,
      })
      setDetail(response.data.booking)
      toast.push({ type: 'success', title: 'Đã phân xử tranh chấp', message: decision === 'RELEASE' ? 'Giải ngân cho Studio' : 'Hoàn tiền cho khách' })
      setAdminNote('')
      await fetchData()
    } catch {
      toast.push({ type: 'error', title: 'Phân xử tranh chấp thất bại' })
    } finally {
      setActionLoading(false)
    }
  }

  function clearFilters() {
    setSearchTerm('')
    setStatus('ALL')
    setPaymentStatus('ALL')
    setSortBy('newest')
  }

  const stats = {
    total: allBookings.length,
    paid: allBookings.filter((item) => item.paymentStatus === 'PAID').reduce((sum, item) => sum + (item.paymentAmount ?? item.totalPrice), 0),
    revenue: allBookings.reduce((sum, item) => sum + item.commissionAmount, 0),
    disputed: allBookings.filter((item) => item.status === 'DISPUTED').length,
  }

  return (
    <div className="space-y-5 pb-12">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Tổng booking" value={stats.total} />
        <Metric label="Đã thanh toán" value={formatVnd(stats.paid)} tone="emerald" />
        <Metric label="Commission" value={formatVnd(stats.revenue)} tone="indigo" />
        <Metric label="Khiếu nại" value={stats.disputed} tone="rose" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-[280px] xl:w-[360px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm mã booking, khách, studio..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
            />
            {searchTerm && <button type="button" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="h-4 w-4" /></button>}
          </div>

          <div className="flex flex-wrap gap-2">
            <SelectBox icon={<Filter className="h-4 w-4" />} value={status} onChange={(value) => setStatus(value as BookingStatus)} options={bookingStatusOptions} />
            <SelectBox icon={<CircleDollarSign className="h-4 w-4" />} value={paymentStatus} onChange={(value) => setPaymentStatus(value as PaymentStatus)} options={paymentStatusOptions} />
            <SelectBox
              icon={<SlidersHorizontal className="h-4 w-4" />}
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'newest', label: 'Mới nhất' },
                { value: 'oldest', label: 'Cũ nhất' },
                { value: 'amount', label: 'Giá trị cao' },
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

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                <th className="px-5 py-3">Booking</th>
                <th className="px-5 py-3">Khách / Studio</th>
                <th className="px-5 py-3">Dịch vụ</th>
                <th className="px-5 py-3 text-right">Thanh toán</th>
                <th className="px-5 py-3 text-right">Commission</th>
                <th className="px-5 py-3 text-center">Trạng thái</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBookings.map((booking) => (
                <tr key={booking.id} onClick={() => openDetail(booking.id)} className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <div className="font-mono text-xs font-medium text-slate-500">#{booking.bookingCode}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(booking.shootingDate)}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-slate-900">{booking.customerName}</div>
                    <div className="mt-1 text-sm text-slate-500">{booking.studioName}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-slate-900">{booking.packageName}</div>
                    <div className="mt-1 text-xs text-slate-500">{booking.city || 'Chưa có khu vực'}</div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="text-sm font-semibold text-slate-950">{formatVnd(booking.paymentAmount ?? booking.totalPrice)}</div>
                    <PaymentBadge status={booking.paymentStatus} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="text-sm font-semibold text-slate-950">{formatVnd(booking.commissionAmount)}</div>
                    <div className="mt-1 text-xs text-slate-500">{booking.commissionPercent}%</div>
                  </td>
                  <td className="px-5 py-4 text-center"><StatusBadge status={booking.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <button type="button" disabled={detailLoading} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                        <Eye className="h-4 w-4" />
                        Chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && bookings.length === 0 && <div className="px-6 py-16 text-center text-sm text-slate-500">Không có booking phù hợp.</div>}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Hiển thị {bookings.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, bookings.length)} / {bookings.length} booking
            </span>
            <label className="inline-flex items-center gap-2">
              <span>Số dòng</span>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
            {(searchTerm || status !== 'ALL' || paymentStatus !== 'ALL') && (
              <button type="button" onClick={clearFilters} className="font-medium text-indigo-600 hover:text-indigo-700">
                Xóa bộ lọc
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage <= 1}
              className="h-8 rounded-lg border border-slate-200 bg-white px-3 font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>
            <span className="min-w-[92px] text-center font-medium text-slate-600">
              Trang {currentPage}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={currentPage >= totalPages}
              className="h-8 rounded-lg border border-slate-200 bg-white px-3 font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {detail && (
          <BookingDetailModal
            booking={detail}
            adminNote={adminNote}
            setAdminNote={setAdminNote}
            actionLoading={actionLoading}
            onClose={() => setDetail(null)}
            onCancel={cancelSelectedBooking}
            onResolve={resolveDispute}
          />
        )}
      </AnimatePresence>

      <CustomDialog
        isOpen={!!dialog}
        title={dialog?.title || ''}
        message={dialog?.message || ''}
        type={dialog?.type || 'confirm'}
        placeholder={dialog?.placeholder}
        defaultValue={dialog?.defaultValue}
        confirmText={dialog?.confirmText}
        onConfirm={(value) => {
          dialog?.onConfirm(value)
          setDialog(null)
        }}
        onCancel={() => setDialog(null)}
      />
    </div>
  )
}

function BookingDetailModal({
  booking,
  adminNote,
  setAdminNote,
  actionLoading,
  onClose,
  onCancel,
  onResolve,
}: {
  booking: AdminBookingDetail
  adminNote: string
  setAdminNote: (value: string) => void
  actionLoading: boolean
  onClose: () => void
  onCancel: () => void
  onResolve: (decision: 'RELEASE' | 'REFUND') => void
}) {
  const canAdminCancel = !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(booking.status)
  const isDisputed = booking.status === 'DISPUTED'

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
    >
      <motion.div
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        className="max-h-[92vh] w-full max-w-5xl overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <div className="font-mono text-xs font-semibold text-slate-500">#{booking.bookingCode}</div>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">{booking.package.packageName}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={booking.status} />
              <PaymentBadge status={booking.latestPayment?.status} />
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_340px] items-start">
          <div className="space-y-5 min-w-0">
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="Khách hàng" value={`${booking.customer.name} · ${booking.customer.email}`} />
              <Info label="Studio" value={`${booking.studio.studioName} · ${booking.studio.email}`} />
              <Info label="Ngày chụp" value={`${booking.shootingDate} · ${booking.startTime} - ${booking.endTime}`} />
              <Info label="Địa điểm" value={booking.shootingLocation || 'Chưa cập nhật'} />
              <Info label="Dịch vụ" value={booking.package.serviceName || '-'} />
              <Info label="Tổng tiền" value={formatVnd(booking.totalPrice)} />
              <Info label="Commission" value={`${booking.commissionPercent}% · ${formatVnd(booking.commissionAmount)}`} />
              <Info label="Studio revenue" value={formatVnd(booking.studioRevenue)} />
            </div>

            {(booking.dispute || booking.cancelReason || booking.rejectReason) && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5">
                <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Ghi chú nghiệp vụ
                </div>
                <div className="space-y-2 text-sm font-semibold text-amber-900/90 leading-relaxed">
                  {booking.dispute?.reason && (
                    <p>
                      🚨 Khiếu nại (bởi {booking.dispute.createdByRole === 'STUDIO_OWNER' ? 'Studio' : 'Khách hàng'} - {booking.dispute.createdByName || 'N/A'}): {booking.dispute.reason}
                    </p>
                  )}
                  {booking.cancelReason && <p>🚫 Lý do hủy: {booking.cancelReason}</p>}
                  {booking.rejectReason && <p>❌ Lý do từ chối: {booking.rejectReason}</p>}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200">
              <div className="border-b border-slate-100 p-4 text-sm font-semibold text-slate-950">Thanh toán</div>
              <div className="divide-y divide-slate-100">
                {booking.payments.map((payment) => (
                  <div key={payment.id} className="grid gap-2 p-4 text-sm md:grid-cols-[1fr_140px_140px]">
                    <div>
                      <div className="font-mono text-xs font-semibold text-slate-600">#{payment.paymentCode}</div>
                      <div className="mt-1 text-xs text-slate-500">{payment.methodName} · {payment.transactionCode || 'Chưa có mã giao dịch'}</div>
                    </div>
                    <div className="font-semibold text-slate-900">{formatVnd(payment.amount)}</div>
                    <PaymentBadge status={payment.status} />
                  </div>
                ))}
                {booking.payments.length === 0 && <div className="p-4 text-sm text-slate-500">Chưa có payment.</div>}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200">
              <div className="border-b border-slate-100 p-4 text-sm font-semibold text-slate-950">Lịch sử booking</div>
              <div className="divide-y divide-slate-100">
                {booking.logs.map((log) => (
                  <div key={log.id} className="p-4 text-sm">
                    <div className="font-semibold text-slate-900">{log.oldStatus || 'START'} {'->'} {log.newStatus || '-'}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatDate(log.changedAt)} · {log.changedByName || `User ${log.changedBy ?? '-'}`}</div>
                    {renderLogNote(log.note)}
                  </div>
                ))}
                {booking.logs.length === 0 && <div className="p-4 text-sm text-slate-500">Chưa có lịch sử.</div>}
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-5">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
                <ShieldCheck className="h-4 w-4" />
                Thao tác Admin
              </div>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ghi chú Admin</span>
                <textarea value={adminNote} onChange={(event) => setAdminNote(event.target.value)} rows={4} className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" />
              </label>
              <div className="mt-4 grid gap-2.5">
                {canAdminCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={actionLoading}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white hover:bg-rose-50 text-xs font-black uppercase tracking-wider text-rose-600 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hủy booking có vấn đề
                  </button>
                )}
                {isDisputed && (
                  <>
                    <button
                      type="button"
                      onClick={() => onResolve('REFUND')}
                      disabled={actionLoading}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-rose-600/10 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Hoàn tiền cho khách
                    </button>
                    <button
                      type="button"
                      onClick={() => onResolve('RELEASE')}
                      disabled={actionLoading}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-600/10 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Giải ngân cho Studio
                    </button>
                  </>
                )}
              </div>
            </section>
          </aside>
        </div>
      </motion.div>
    </div>
  )
}

function Metric({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'slate' | 'emerald' | 'indigo' | 'rose' }) {
  const toneClass = {
    slate: 'text-slate-950',
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

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    PENDING_PAYMENT: 'border-amber-200 bg-amber-50 text-amber-700',
    PENDING_CONFIRMATION: 'border-blue-200 bg-blue-50 text-blue-700',
    CONFIRMED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    IN_PROGRESS: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    DISPUTED: 'border-rose-200 bg-rose-50 text-rose-700',
    NO_SHOW: 'border-amber-200 bg-amber-50 text-amber-700',
    CANCELLED: 'border-slate-200 bg-slate-50 text-slate-500',
    REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  }
  return <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${config[status] ?? config.PENDING_PAYMENT}`}>{statusLabels[status] ?? status}</span>
}

function PaymentBadge({ status }: { status?: string }) {
  const normalized = status ?? 'PENDING'
  const config: Record<string, string> = {
    PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
    PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    FAILED: 'border-rose-200 bg-rose-50 text-rose-700',
    REFUND_PENDING: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    REFUNDED: 'border-slate-200 bg-slate-50 text-slate-600',
    PARTIALLY_REFUNDED: 'border-blue-200 bg-blue-50 text-blue-700',
    FORFEITED: 'border-amber-200 bg-amber-50 text-amber-700',
    DISPUTED: 'border-rose-200 bg-rose-50 text-rose-700',
  }
  return <span className={`mt-2 inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${config[normalized] ?? config.PENDING}`}>{paymentLabels[normalized] ?? normalized}</span>
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-2 break-words text-sm font-extrabold text-slate-900">{value}</div>
    </div>
  )
}
