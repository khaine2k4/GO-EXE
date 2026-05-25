import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, CheckCircle2, CircleDollarSign, Clock, MapPin, RotateCcw, MessageCircle } from 'lucide-react'
import { cancelBooking, confirmCompletion, getBooking, type BookingDto } from '../services/bookingApi'
import { useToast } from '../components/Toast'

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' VND'
}

function formatDate(value: string) {
  return new Date(value + 'T00:00:00').toLocaleDateString('vi-VN', { dateStyle: 'long' })
}

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PENDING_CONFIRMATION: 'Chờ Studio xác nhận',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang chụp',
  AWAITING_CUSTOMER: 'Chờ bạn xác nhận',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Bị từ chối',
}

export default function CustomerBookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const toast = useToast()
  const [booking, setBooking] = useState<BookingDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getBooking(id)
      .then(setBooking)
      .catch(() => setError('Không tìm thấy booking.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleCancel() {
    if (!booking) return
    const reason = window.prompt('Nhập lý do hủy booking') || 'Customer cancelled'
    setActioning(true)
    try {
      const updated = await cancelBooking(booking.id, reason)
      setBooking(updated)
      toast.push({ type: 'info', title: 'Đã hủy booking', message: 'Slot đã được giải phóng theo quy tắc MVP.' })
    } catch {
      toast.push({ type: 'error', title: 'Không thể hủy booking', message: 'Chỉ được tự hủy trước khi Studio xác nhận.' })
    } finally {
      setActioning(false)
    }
  }

  async function handleConfirmCompletion() {
    if (!booking) return
    setActioning(true)
    try {
      const updated = await confirmCompletion(booking.id)
      setBooking(updated)
      toast.push({ type: 'success', title: 'Đã xác nhận hoàn thành', message: 'Booking đã hoàn thành và settlement sẵn sàng cho admin xử lý.' })
    } catch {
      toast.push({ type: 'error', title: 'Không thể xác nhận', message: 'Booking chỉ xác nhận được sau khi Studio gửi hoàn tất.' })
    } finally {
      setActioning(false)
    }
  }

  if (loading) return <StateBox text="Đang tải chi tiết booking..." />
  if (error || !booking) return <StateBox text={error || 'Không tìm thấy booking.'} />

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <button onClick={() => nav('/customer/bookings')} className="mb-8 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
      </button>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">{booking.bookingCode}</div>
            <h1 className="mt-2 text-3xl font-black text-slate-950">{booking.packageName}</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">{booking.studioName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={booking.status} />
            {booking.canCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={actioning}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 text-xs font-black uppercase tracking-widest text-rose-700 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" /> Hủy booking
              </button>
            )}
            {booking.status === 'AWAITING_CUSTOMER' && (
              <button
                type="button"
                onClick={handleConfirmCompletion}
                disabled={actioning}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" /> Xác nhận hoàn thành
              </button>
            )}
            <button
              onClick={() => nav(`/chat?studioId=${booking.studioId}&bookingId=${booking.id}`)}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-azure)] hover:text-[var(--color-azure)]"
            >
              <MessageCircle className="h-4 w-4" /> Nhắn tin với Studio
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Info icon={<CalendarDays className="h-4 w-4" />} label="Ngày chụp" value={`${formatDate(booking.shootingDate)} · ${booking.startTime} - ${booking.endTime}`} />
          <Info icon={<MapPin className="h-4 w-4" />} label="Địa điểm" value={booking.shootingLocation || 'Chưa nhập'} />
          <Info icon={<CircleDollarSign className="h-4 w-4" />} label="Thanh toán" value={booking.latestPayment ? `${booking.latestPayment.status} · ${booking.latestPayment.methodName}` : 'Chưa có'} />
          <Info icon={<Clock className="h-4 w-4" />} label="Hạn giữ slot" value={booking.paymentExpiresAt ? new Date(booking.paymentExpiresAt).toLocaleString('vi-VN') : 'Đã thanh toán hoặc không áp dụng'} />
        </div>

        <div className="mt-8 rounded-2xl bg-slate-50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Tổng tiền</span>
            <span className="text-2xl font-black text-[var(--color-azure)]">{formatVnd(booking.totalPrice)}</span>
          </div>
          <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-600">
            <div>Phí nền tảng: {formatVnd(booking.commissionAmount)}</div>
            <div>Studio nhận dự kiến: {formatVnd(booking.studioRevenue)}</div>
            {booking.note && <div>Ghi chú: {booking.note}</div>}
          </div>
        </div>
      </div>

      <Link to="/photosets" className="mt-6 inline-flex rounded-2xl bg-slate-950 px-6 py-3 text-xs font-black uppercase tracking-widest text-white">
        Đặt thêm dịch vụ
      </Link>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'CANCELLED' || status === 'REJECTED'
    ? 'bg-slate-100 text-slate-500'
    : status === 'COMPLETED'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'AWAITING_CUSTOMER'
        ? 'bg-cyan-50 text-cyan-700'
      : status === 'PENDING_PAYMENT'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-blue-50 text-[var(--color-azure)]'

  return (
    <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${color}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
        {icon} {label}
      </div>
      <div className="mt-2 text-sm font-black text-slate-900">{value}</div>
    </div>
  )
}

function StateBox({ text }: { text: string }) {
  return <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-500">{text}</div>
}
