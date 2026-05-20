import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronDown, CircleDollarSign, Filter, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react'
import api from '../api/axios'

type BookingStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'COMPLETED' | 'DISPUTED' | 'REFUNDED' | 'CANCELLED'
type PaymentStatus = 'ALL' | 'PENDING' | 'PAID' | 'HOLDING' | 'RELEASED' | 'REFUNDED' | 'FAILED'

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

const bookingStatusOptions: { value: BookingStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả booking' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'DELIVERED', label: 'Đã giao ảnh' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'DISPUTED', label: 'Khiếu nại' },
  { value: 'REFUNDED', label: 'Hoàn tiền' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

const paymentStatusOptions: { value: PaymentStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả payment' },
  { value: 'PENDING', label: 'Chờ thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'HOLDING', label: 'Đang giữ' },
  { value: 'RELEASED', label: 'Đã giải ngân' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền' },
  { value: 'FAILED', label: 'Thất bại' },
]

function formatVnd(value?: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value ?? 0)} đ`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN', { dateStyle: 'short' })
}

export default function AdminOrdersPage() {
  const [bookings, setBookings] = useState<AdminBookingDto[]>([])
  const [allBookings, setAllBookings] = useState<AdminBookingDto[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState<BookingStatus>('ALL')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('ALL')
  const [sortBy, setSortBy] = useState('newest')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

  const stats = {
    total: allBookings.length,
    holding: allBookings.filter((item) => item.paymentStatus === 'HOLDING').reduce((sum, item) => sum + (item.paymentAmount ?? item.totalPrice), 0),
    revenue: allBookings.reduce((sum, item) => sum + item.commissionAmount, 0),
    disputed: allBookings.filter((item) => item.status === 'DISPUTED').length,
  }

  function clearFilters() {
    setSearchTerm('')
    setStatus('ALL')
    setPaymentStatus('ALL')
    setSortBy('newest')
  }

  return (
    <div className="space-y-5 pb-12">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Tổng booking" value={stats.total} />
        <Metric label="Đang giữ" value={formatVnd(stats.holding)} tone="amber" />
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
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            )}
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
          <table className="w-full min-w-[1040px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                <th className="px-5 py-3">Booking</th>
                <th className="px-5 py-3">Khách / Studio</th>
                <th className="px-5 py-3">Dịch vụ</th>
                <th className="px-5 py-3 text-right">Thanh toán</th>
                <th className="px-5 py-3 text-right">Commission</th>
                <th className="px-5 py-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-slate-100 transition hover:bg-slate-50/70">
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
                  <td className="px-5 py-4 text-center">
                    <StatusBadge status={booking.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && bookings.length === 0 && (
            <div className="px-6 py-16 text-center text-sm text-slate-500">Không có booking phù hợp.</div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
          <span>Hiển thị {bookings.length} booking</span>
          {(searchTerm || status !== 'ALL' || paymentStatus !== 'ALL') && (
            <button type="button" onClick={clearFilters} className="font-medium text-indigo-600 hover:text-indigo-700">
              Xóa bộ lọc
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'slate' | 'amber' | 'indigo' | 'rose' }) {
  const toneClass = {
    slate: 'text-slate-950',
    amber: 'text-amber-700',
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
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-400" />
    </label>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
    CONFIRMED: 'border-blue-200 bg-blue-50 text-blue-700',
    DELIVERED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    DISPUTED: 'border-rose-200 bg-rose-50 text-rose-700',
    REFUNDED: 'border-slate-200 bg-slate-50 text-slate-600',
    CANCELLED: 'border-slate-200 bg-slate-50 text-slate-500',
  }

  const label: Record<string, string> = {
    PENDING: 'Chờ duyệt',
    CONFIRMED: 'Đã xác nhận',
    DELIVERED: 'Đã giao ảnh',
    COMPLETED: 'Hoàn thành',
    DISPUTED: 'Khiếu nại',
    REFUNDED: 'Hoàn tiền',
    CANCELLED: 'Đã hủy',
  }

  return <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${config[status] ?? config.PENDING}`}>{label[status] ?? status}</span>
}

function PaymentBadge({ status }: { status?: string }) {
  const normalized = status ?? 'PENDING'
  const config: Record<string, string> = {
    PENDING: 'border-slate-200 bg-slate-50 text-slate-600',
    PAID: 'border-blue-200 bg-blue-50 text-blue-700',
    HOLDING: 'border-amber-200 bg-amber-50 text-amber-700',
    RELEASED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    REFUNDED: 'border-slate-200 bg-slate-50 text-slate-600',
    FAILED: 'border-rose-200 bg-rose-50 text-rose-700',
  }
  const label: Record<string, string> = {
    PENDING: 'Chờ thanh toán',
    PAID: 'Đã thanh toán',
    HOLDING: 'Đang giữ',
    RELEASED: 'Đã giải ngân',
    REFUNDED: 'Đã hoàn tiền',
    FAILED: 'Thất bại',
  }

  return <span className={`mt-2 inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${config[normalized] ?? config.PENDING}`}>{label[normalized] ?? normalized}</span>
}
