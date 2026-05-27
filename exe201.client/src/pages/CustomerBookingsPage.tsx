import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { CalendarDays, CircleDollarSign, Clock, ImageIcon } from 'lucide-react'
import { getBookings, type BookingDto } from '../services/bookingApi'

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ'
}

function formatDate(value: string) {
  return new Date(value + 'T00:00:00').toLocaleDateString('vi-VN', { dateStyle: 'medium' })
}

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PENDING_CONFIRMATION: 'Chờ Studio xác nhận',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang chụp',
  DEMO_UPLOADED: 'Đã gửi ảnh demo',
  EDITING: 'Đang chỉnh sửa ảnh',
  FINAL_DELIVERED: 'Đã giao ảnh final',
  AWAITING_CUSTOMER: 'Chờ bạn xác nhận',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Bị từ chối',
  DISPUTED: 'Đang báo cáo',
}

const TABS = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ thanh toán', value: 'PENDING_PAYMENT' },
  { label: 'Chờ xác nhận', value: 'PENDING_CONFIRMATION' },
  { label: 'Đã xác nhận', value: 'CONFIRMED' },
  { label: 'Chờ nhận ảnh', value: 'FINAL_DELIVERED' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
]

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<BookingDto[]>([])
  const [activeTab, setActiveTab] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getBookings(activeTab)
      .then(setBookings)
      .catch(() => setError('Không tải được lịch sử booking.'))
      .finally(() => setLoading(false))
  }, [activeTab])

  return (
    <div className="mx-auto max-w-6xl pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-950">Lịch chụp của tôi</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">Theo dõi booking, thanh toán và trạng thái xác nhận từ Studio.</p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition ${activeTab === tab.value ? 'bg-[var(--color-azure)] text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <StateBox text="Đang tải booking..." />
      ) : error ? (
        <StateBox text={error} />
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50/40 py-24 text-center">
          <ImageIcon className="h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-black text-slate-950">Chưa có booking</h3>
          <Link to="/photosets" className="primary-pill mt-6 h-12 px-6 text-xs font-black uppercase tracking-widest">
            Khám phá dịch vụ
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {bookings.map((booking) => (
            <Link
              key={booking.id}
              to={`/customer/bookings/${booking.id}`}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">{booking.bookingCode}</div>
                  <h2 className="mt-2 text-xl font-black text-slate-950">{booking.packageName}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{booking.studioName}</p>
                </div>
                <StatusBadge status={booking.status} />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Info icon={<CalendarDays className="h-4 w-4" />} label="Ngày chụp" value={`${formatDate(booking.shootingDate)} · ${booking.startTime}`} />
                <Info icon={<CircleDollarSign className="h-4 w-4" />} label="Thanh toán" value={booking.latestPayment?.status ?? 'N/A'} />
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Tổng tiền</span>
                <span className="text-2xl font-black text-[var(--color-azure)]">{formatVnd(booking.totalPrice)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'CANCELLED' || status === 'REJECTED'
    ? 'bg-slate-100 text-slate-500'
    : status === 'COMPLETED'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'DISPUTED'
        ? 'bg-orange-50 text-[var(--color-orange)]'
        : status === 'PENDING_PAYMENT'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-blue-50 text-[var(--color-azure)]'

  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${color}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
        {icon} {label}
      </div>
      <div className="mt-1 text-sm font-black text-slate-800">{value}</div>
    </div>
  )
}

function StateBox({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-500">
      <Clock className="mx-auto mb-3 h-8 w-8 text-slate-300" />
      {text}
    </div>
  )
}
