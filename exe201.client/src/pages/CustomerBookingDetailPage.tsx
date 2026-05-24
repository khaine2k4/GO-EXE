import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeft, CalendarDays, CircleDollarSign, Clock, MapPin, RotateCcw, MessageCircle } from 'lucide-react'
import { cancelBooking, disputeBooking, getBooking, type BookingDto } from '../services/bookingApi'
import { useToast } from '../components/Toast'
import CustomDialog from '../components/CustomDialog'

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
  COMPLETED: 'Hoàn thành',
  DISPUTED: 'Khiếu nại',
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
  const [dialog, setDialog] = useState<{ isOpen: boolean; title: string; message: string; type: 'confirm' | 'prompt'; placeholder?: string; onConfirm: (val?: string) => void } | null>(null)

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
    setDialog({
      isOpen: true,
      title: 'Hủy Đặt Lịch Chụp',
      message: 'Bạn có chắc chắn muốn hủy đặt lịch này không? Vui lòng nhập lý do hủy bên dưới:',
      type: 'prompt',
      placeholder: 'Nhập lý do hủy...',
      onConfirm: async (reason) => {
        setDialog(null)
        setActioning(true)
        try {
          const updated = await cancelBooking(booking.id, reason || 'Customer cancelled')
          setBooking(updated)
          toast.push({ type: 'info', title: 'Đã hủy booking', message: 'Slot đã được giải phóng theo quy tắc MVP.' })
        } catch {
          toast.push({ type: 'error', title: 'Không thể hủy booking', message: 'Chỉ được tự hủy trước khi Studio xác nhận.' })
        } finally {
          setActioning(false)
        }
      }
    })
  }

  async function handleDispute() {
    if (!booking) return
    setDialog({
      isOpen: true,
      title: 'Khiếu Nại Lịch Chụp',
      message: 'Vui lòng nhập chi tiết nội dung khiếu nại để gửi cho ban quản trị Admin phân xử:',
      type: 'prompt',
      placeholder: 'Nhập nội dung khiếu nại...',
      onConfirm: async (reason) => {
        if (!reason?.trim()) return
        setDialog(null)
        setActioning(true)
        try {
          const updated = await disputeBooking(booking.id, reason.trim())
          setBooking(updated)
          toast.push({ type: 'success', title: 'Đã gửi khiếu nại', message: 'Admin sẽ xem xét và phân xử booking này.' })
        } catch {
          toast.push({ type: 'error', title: 'Không thể khiếu nại', message: 'Chỉ hỗ trợ khi booking đang ở trạng thái IN_PROGRESS.' })
        } finally {
          setActioning(false)
        }
      }
    })
  }

  if (loading) return <StateBox text="Đang tải chi tiết booking..." />
  if (error || !booking) return <StateBox text={error || 'Không tìm thấy booking.'} />
  const canDispute = booking.status === 'IN_PROGRESS' && booking.latestPayment?.status === 'PAID'

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
            {canDispute && (
              <button
                type="button"
                onClick={handleDispute}
                disabled={actioning}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 text-xs font-black uppercase tracking-widest text-amber-700 disabled:opacity-50"
              >
                <AlertTriangle className="h-4 w-4" /> Khiếu nại đặt lịch
              </button>
            )}
            <button
              onClick={() => nav(`/chat?studioId=${booking.studioId}&bookingId=${booking.id}`)}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 text-xs font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-100"
            >
              <MessageCircle className="h-4.5 w-4.5" /> Nhắn tin với Studio
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
            <span className="text-2xl font-black text-indigo-600">{formatVnd(booking.totalPrice)}</span>
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

      <CustomDialog
        isOpen={!!dialog?.isOpen}
        title={dialog?.title || ''}
        message={dialog?.message || ''}
        type={dialog?.type || 'confirm'}
        placeholder={dialog?.placeholder || ''}
        onConfirm={dialog?.onConfirm || (() => {})}
        onCancel={() => setDialog(null)}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'CANCELLED' || status === 'REJECTED'
    ? 'bg-slate-100 text-slate-500'
    : status === 'DISPUTED'
      ? 'bg-rose-50 text-rose-700'
    : status === 'COMPLETED'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'PENDING_PAYMENT'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-indigo-50 text-indigo-700'

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
