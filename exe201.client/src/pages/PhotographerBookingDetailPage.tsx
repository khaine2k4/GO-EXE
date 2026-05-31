import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  ImageUp,
  MapPin,
  MessageCircle,
  Send,
  XCircle,
  Download,
  ExternalLink
} from 'lucide-react'
import { useToast } from '../components/Toast'
import {
  confirmBooking,
  getBooking,
  markInProgress,
  rejectBooking,
  uploadDemoPhotos,
  uploadFinalPhotos,
  type BookingDto,
} from '../services/bookingApi'
import MultiImageUploader from '../components/MultiImageUploader'

function formatVnd(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value)} VND`
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PENDING_CONFIRMATION: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  DEMO_UPLOADED: 'Đã gửi ảnh mẫu (Demo)',
  EDITING: 'Đang chỉnh sửa ảnh',
  FINAL_DELIVERED: 'Đã giao ảnh hoàn thiện',
  AWAITING_CUSTOMER: 'Chờ khách hàng duyệt',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Từ chối',
}

export default function PhotographerBookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [booking, setBooking] = useState<BookingDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)
  const [error, setError] = useState('')
  const [deliveryForm, setDeliveryForm] = useState<{ type: 'demo' | 'final'; urls: string[]; note: string } | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getBooking(id)
      .then(setBooking)
      .catch(() => setError('Không tìm thấy đơn đặt lịch này.'))
      .finally(() => setLoading(false))
  }, [id])

  async function runAction(action: () => Promise<BookingDto>, title: string) {
    setActioning(true)
    try {
      const updated = await action()
      setBooking(updated)
      setDeliveryForm(null)
      toast.push({ type: 'success', title })
    } catch {
      toast.push({ type: 'error', title: 'Thao tác thất bại' })
    } finally {
      setActioning(false)
    }
  }

  async function submitDelivery() {
    if (!booking || !deliveryForm) return
    if (deliveryForm.urls.length === 0) {
      toast.push({ type: 'error', title: 'Vui lòng tải lên ít nhất 1 hình ảnh' })
      return
    }

    const payload = { photoUrls: deliveryForm.urls, note: deliveryForm.note.trim() || undefined }
    const action = deliveryForm.type === 'demo'
      ? () => uploadDemoPhotos(booking.id, payload)
      : () => uploadFinalPhotos(booking.id, payload)

    await runAction(action, deliveryForm.type === 'demo' ? 'Đã gửi ảnh mẫu (Demo)' : 'Đã giao ảnh hoàn thiện')
  }

  if (loading) return <StateBox text="Đang tải chi tiết đơn đặt lịch..." />
  if (error || !booking) return <StateBox text={error || 'Không tìm thấy đơn đặt lịch này.'} />

  return (
    <div className="mx-auto max-w-6xl pb-20 px-4 sm:px-6 lg:px-8">
      {/* Return Button */}
      <button
        type="button"
        onClick={() => navigate('/photographer/dashboard?tab=bookings')}
        className="group mb-6 inline-flex items-center gap-2 text-sm font-black text-slate-400 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Quay lại danh sách đơn đặt
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        {/* Main Content Card */}
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          {/* Header row */}
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex font-mono text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200/50 px-2.5 py-0.5 rounded-lg">
                #{booking.bookingCode}
              </div>
              <h1 className="mt-3 text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                {booking.customerName}
              </h1>
              <p className="mt-1.5 text-sm font-semibold text-slate-500 flex items-center gap-1.5">
                Gói dịch vụ: <span className="font-extrabold text-indigo-600">{booking.packageName}</span>
              </p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          {/* Details Info Grid */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Info icon={<CalendarDays className="h-4 w-4 text-indigo-600" />} label="Lịch chụp hẹn hẹn" value={`${formatDate(booking.shootingDate)} lúc ${booking.startTime} - ${booking.endTime}`} />
            <Info icon={<MapPin className="h-4 w-4 text-indigo-600" />} label="Địa điểm buổi chụp" value={booking.shootingLocation || 'Tại Studio'} />
            <Info icon={<CircleDollarSign className="h-4 w-4 text-indigo-600" />} label="Doanh thu Studio của bạn" value={formatVnd(booking.studioRevenue)} />
            <Info icon={<Clock className="h-4 w-4 text-indigo-600" />} label="Thời gian tạo đơn" value={new Date(booking.createdAt).toLocaleString('vi-VN')} />
          </div>

          {/* Guest Notes */}
          {booking.note && (
            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ghi chú từ khách hàng</div>
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-slate-700 leading-relaxed">{booking.note}</p>
            </div>
          )}

          {/* Photos Panels (Demo & Final) */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <PhotoDeliveryPanel title="Bộ ảnh mẫu (Demo)" urls={booking.demoPhotoUrls ?? []} emptyText="Chưa có ảnh mẫu." />
            <PhotoDeliveryPanel title="Bộ ảnh hoàn thiện (Final)" urls={booking.finalPhotoUrls ?? []} emptyText="Chưa có ảnh hoàn thiện." />
          </div>

          {/* Customer Reviews Feedback */}
          {booking.customerFeedback && (
            <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5">
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Phản hồi từ khách hàng</div>
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-indigo-900 leading-relaxed">{booking.customerFeedback}</p>
            </div>
          )}

          {/* Photo Delivery Form */}
          {deliveryForm && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/40 p-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {deliveryForm.type === 'demo' ? '⚡ Tải lên bộ ảnh mẫu (Demo)' : '⚡ Giao bộ ảnh hoàn thiện (Final)'}
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-400">Tải ảnh chất lượng cao lên hệ thống để bàn giao cho khách hàng xem duyệt.</p>
                </div>
                <button type="button" onClick={() => setDeliveryForm(null)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase text-slate-500 hover:bg-slate-50 active:scale-95 transition-all">
                  Hủy
                </button>
              </div>

              <div className="mt-4">
                <MultiImageUploader
                  label={deliveryForm.type === 'demo' ? 'Ảnh mẫu (Demo)' : 'Ảnh hoàn thiện (Final)'}
                  folder={deliveryForm.type === 'demo' ? 'exe201/bookings/demo' : 'exe201/bookings/final'}
                  onUrlsChanged={(urls) => setDeliveryForm((prev) => prev ? { ...prev, urls } : null)}
                  maxFiles={50}
                />
              </div>

              <input
                value={deliveryForm.note}
                onChange={(event) => setDeliveryForm((prev) => prev ? { ...prev, note: event.target.value } : null)}
                placeholder="Nhập ghi chú giao ảnh hoặc liên kết Drive/Fshare đính kèm (nếu có)..."
                className="mt-4 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition"
              />
              <button
                type="button"
                disabled={actioning || deliveryForm.urls.length === 0}
                onClick={submitDelivery}
                className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-6 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-indigo-600/10 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" /> Bàn giao bộ ảnh ({deliveryForm.urls.length})
              </button>
            </div>
          )}
        </section>

        {/* Sidebar Actions */}
        <aside className="space-y-6">
          {/* Business Action Box */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 pb-3">Thao tác nghiệp vụ</h2>
            <div className="mt-4 grid gap-3">
              {booking.status === 'PENDING_CONFIRMATION' && (
                <>
                  <button disabled={actioning} type="button" onClick={() => runAction(() => confirmBooking(booking.id), 'Đã xác nhận đơn đặt lịch')} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 hover:bg-slate-800 text-xs font-black uppercase text-white shadow-md active:scale-95 transition-all disabled:opacity-50">
                    <CheckCircle2 className="h-4 w-4" /> Xác nhận đơn
                  </button>
                  <button disabled={actioning} type="button" onClick={() => runAction(() => rejectBooking(booking.id, window.prompt('Nhập lý do từ chối nhận đơn đặt lịch này:') || undefined), 'Đã từ chối đơn đặt lịch')} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white hover:bg-rose-50 text-xs font-black uppercase text-rose-600 active:scale-95 transition-all disabled:opacity-50">
                    <XCircle className="h-4 w-4" /> Từ chối nhận
                  </button>
                </>
              )}
              {booking.status === 'CONFIRMED' && (
                <button disabled={actioning} type="button" onClick={() => runAction(() => markInProgress(booking.id), 'Đã bắt đầu buổi chụp ảnh')} className="h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-xs font-black uppercase text-white shadow-lg shadow-indigo-600/10 active:scale-95 transition-all disabled:opacity-50">
                  Bắt đầu buổi chụp
                </button>
              )}
              {booking.status === 'IN_PROGRESS' && (
                <button disabled={actioning} type="button" onClick={() => setDeliveryForm({ type: 'demo', urls: [], note: '' })} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-xs font-black uppercase text-white shadow-lg shadow-blue-600/10 active:scale-95 transition-all disabled:opacity-50">
                  <ImageUp className="h-4 w-4" /> Bàn giao ảnh Demo
                </button>
              )}
              {(booking.status === 'DEMO_UPLOADED' || booking.status === 'EDITING') && (
                <button disabled={actioning} type="button" onClick={() => setDeliveryForm({ type: 'final', urls: [], note: '' })} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-teal-600 hover:bg-teal-700 text-xs font-black uppercase text-white shadow-lg shadow-teal-600/10 active:scale-95 transition-all disabled:opacity-50">
                  <ImageUp className="h-4 w-4" /> Bàn giao ảnh Final
                </button>
              )}
              {booking.status === 'FINAL_DELIVERED' && (
                <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 text-xs font-black uppercase tracking-wider text-teal-700 text-center leading-relaxed">
                  ⏳ Đang chờ khách hàng xác nhận hoàn tất.
                </div>
              )}
              {booking.status === 'COMPLETED' && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs font-black uppercase tracking-wider text-emerald-700 text-center leading-relaxed">
                  🟢 Đơn đặt lịch đã hoàn thành xuất sắc!
                </div>
              )}
              {(booking.status === 'CANCELLED' || booking.status === 'REJECTED') && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-black uppercase tracking-wider text-slate-500 text-center leading-relaxed">
                  🚫 Đơn đặt lịch này đã bị hủy hoặc từ chối.
                </div>
              )}
            </div>
          </div>

          {/* Chat box */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 pb-3">Liên lạc</h2>
            <p className="mt-2 text-xs font-semibold text-slate-500 leading-relaxed">Mở hội thoại nhắn tin trao đổi trực tiếp với khách hàng cho buổi chụp này.</p>
            <button
              type="button"
              onClick={() => navigate(`/chat?studioId=${booking.studioId}&customerId=${booking.customerId}&bookingId=${booking.id}`)}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-xs font-black uppercase tracking-wider text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition active:scale-95"
            >
              <MessageCircle className="h-4 w-4" /> Nhắn tin với khách
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'CANCELLED' || status === 'REJECTED'
    ? 'border-slate-200 bg-slate-50 text-slate-500'
    : status === 'COMPLETED'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100/10'
      : status === 'FINAL_DELIVERED'
        ? 'border-teal-200 bg-teal-50 text-teal-700 shadow-sm shadow-teal-100/10'
        : status === 'DEMO_UPLOADED' || status === 'EDITING'
          ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/10'
          : 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/10'

  return (
    <span className={`inline-flex rounded-2xl border px-4 py-2 text-xs font-black uppercase tracking-wider ${color}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition hover:shadow-sm">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
        {icon} {label}
      </div>
      <div className="mt-2 text-sm font-extrabold text-slate-900">{value}</div>
    </div>
  )
}

function PhotoDeliveryPanel({ title, urls, emptyText }: { title: string; urls: string[]; emptyText: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</div>
      {urls.length === 0 ? (
        <div className="mt-3 text-xs font-semibold text-slate-400 italic">{emptyText}</div>
      ) : (
        <div className="mt-3 grid gap-3 grid-cols-2">
          {urls.map((url) => (
            <div key={url} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img src={url} alt={title} className="aspect-video w-full object-cover transition duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center gap-2">
                <a href={url} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-800 hover:bg-slate-100 active:scale-90 transition">
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a href={url} download target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-800 hover:bg-slate-100 active:scale-90 transition">
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StateBox({ text }: { text: string }) {
  return <div className="mx-auto max-w-xl rounded-[32px] border border-dashed border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-500">{text}</div>
}
