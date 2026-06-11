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
  ExternalLink,
  X,
  Loader2
} from 'lucide-react'
import { useToast } from '../components/Toast'
import {
  approveReschedule,
  confirmBooking,
  completeBooking,
  disputeBooking,
  getBooking,
  markNoShow,
  markInProgress,
  rejectReschedule,
  rejectBooking,
  uploadDemoPhotos,
  uploadFinalPhotos,
  type BookingDto,
} from '../services/bookingApi'
import MultiImageUploader from '../components/MultiImageUploader'
import BookingLocationMap from '../components/map/BookingLocationMap'
import ReasonDialog from '../components/ReasonDialog'

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
  DISPUTED: 'Bị khiếu nại',
  NO_SHOW: 'Khách không đến',
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
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false)
  const [noShowDialogOpen, setNoShowDialogOpen] = useState(false)

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
      return true
    } catch {
      toast.push({ type: 'error', title: 'Thao tác thất bại' })
      return false
    } finally {
      setActioning(false)
    }
  }

  async function handleReject(reason: string) {
    if (!booking) return
    const succeeded = await runAction(
      () => rejectBooking(booking.id, reason.trim() || undefined),
      'Đã từ chối đơn đặt lịch',
    )
    if (succeeded) setRejectDialogOpen(false)
  }

  async function handleDispute(reason: string) {
    if (!booking) return
    const succeeded = await runAction(
      () => disputeBooking(booking.id, reason),
      'Đã gửi khiếu nại khách hàng',
    )
    if (succeeded) setDisputeDialogOpen(false)
  }

  async function handleApproveReschedule() {
    if (!booking) return
    await runAction(
      () => approveReschedule(booking.id, 'Studio approved reschedule'),
      'Đã duyệt yêu cầu đổi lịch',
    )
  }

  async function handleRejectReschedule() {
    if (!booking) return
    await runAction(
      () => rejectReschedule(booking.id, 'Studio rejected reschedule'),
      'Đã từ chối yêu cầu đổi lịch',
    )
  }

  async function handleNoShow(reason: string) {
    if (!booking) return
    const succeeded = await runAction(
      () => markNoShow(booking.id, reason.trim() || 'Khách hàng không đến buổi chụp'),
      'Đã ghi nhận khách không đến',
    )
    if (succeeded) setNoShowDialogOpen(false)
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

          <div className="mt-6">
            <BookingLocationMap
              lat={booking.shootingLat}
              lng={booking.shootingLng}
              address={booking.shootingLocation}
              title="Điểm hẹn chụp ảnh"
              subtitle={`${formatDate(booking.shootingDate)} lúc ${booking.startTime} - ${booking.endTime}`}
            />
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


        </section>

        {/* Sidebar Actions */}
        <aside className="space-y-6">
          {/* Business Action Box */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 pb-3">Thao tác nghiệp vụ</h2>
            <div className="mt-4 grid gap-3">
              {booking.pendingReschedule && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-blue-700">Khách yêu cầu đổi lịch</div>
                  <div className="mt-2 text-sm font-black text-blue-950">
                    {formatDate(booking.pendingReschedule.newDate)} lúc {booking.pendingReschedule.newStartTime} - {booking.pendingReschedule.newEndTime}
                  </div>
                  {booking.pendingReschedule.reason && (
                    <p className="mt-2 text-xs font-semibold leading-5 text-blue-800">{booking.pendingReschedule.reason}</p>
                  )}
                  {booking.canRespondReschedule && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button disabled={actioning} type="button" onClick={handleApproveReschedule} className="h-10 rounded-xl bg-blue-600 text-xs font-black uppercase text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-50">
                        Duyệt
                      </button>
                      <button disabled={actioning} type="button" onClick={handleRejectReschedule} className="h-10 rounded-xl border border-blue-200 bg-white text-xs font-black uppercase text-blue-700 transition hover:bg-blue-50 active:scale-95 disabled:opacity-50">
                        Từ chối
                      </button>
                    </div>
                  )}
                </div>
              )}
              {booking.status === 'PENDING_CONFIRMATION' && (
                <>
                  <button disabled={actioning} type="button" onClick={() => runAction(() => confirmBooking(booking.id), 'Đã xác nhận đơn đặt lịch')} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 hover:bg-slate-800 text-xs font-black uppercase text-white shadow-md active:scale-95 transition-all disabled:opacity-50">
                    <CheckCircle2 className="h-4 w-4" /> Xác nhận đơn
                  </button>
                  <button disabled={actioning} type="button" onClick={() => setRejectDialogOpen(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white hover:bg-rose-50 text-xs font-black uppercase text-rose-600 active:scale-95 transition-all disabled:opacity-50">
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
                <button disabled={actioning} type="button" onClick={() => runAction(() => completeBooking(booking.id), 'Đã gửi yêu cầu khách hàng xác nhận hoàn tất')} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xs font-black uppercase text-white shadow-lg shadow-emerald-600/10 active:scale-95 transition-all disabled:opacity-50">
                  <CheckCircle2 className="h-4 w-4" /> Gửi yêu cầu hoàn tất
                </button>
              )}
              {booking.status === 'AWAITING_CUSTOMER' && (
                <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 text-xs font-black uppercase tracking-wider text-teal-700 text-center leading-relaxed">
                  ⏳ Đang chờ khách hàng xác nhận hoàn tất.
                </div>
              )}
              {booking.canMarkNoShow && (
                <button disabled={actioning} type="button" onClick={() => setNoShowDialogOpen(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-black uppercase tracking-wider text-amber-700 active:scale-95 transition-all disabled:opacity-50">
                  <XCircle className="h-4 w-4" /> Khách không đến
                </button>
              )}
              {booking.status === 'DISPUTED' && (
                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-xs font-black uppercase tracking-wider text-rose-700 text-center leading-relaxed animate-pulse">
                  ⚠️ Đơn hàng đang bị khiếu nại. Admin đang xử lý tranh chấp.
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
              {['CONFIRMED', 'IN_PROGRESS', 'DEMO_UPLOADED', 'EDITING', 'FINAL_DELIVERED', 'AWAITING_CUSTOMER'].includes(booking.status) && (
                <button
                  disabled={actioning}
                  type="button"
                  onClick={() => setDisputeDialogOpen(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white hover:bg-rose-50 text-xs font-black uppercase tracking-wider text-rose-600 active:scale-95 transition-all disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" /> Khiếu nại khách hàng
                </button>
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
      {/* Dialog Bàn giao ảnh (Demo / Final) */}
      {deliveryForm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
          <section className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-2xl shadow-slate-950/15 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 animate-out fade-out zoom-out-95">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  {deliveryForm.type === 'demo' ? '⚡ Bàn giao bộ ảnh mẫu (Demo)' : '⚡ Bàn giao bộ ảnh hoàn thiện (Final)'}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  Tải ảnh chất lượng cao lên hệ thống để bàn giao cho khách hàng xem duyệt.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeliveryForm(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 active:scale-95"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6">
              <MultiImageUploader
                label={deliveryForm.type === 'demo' ? 'Tải ảnh mẫu (Demo)' : 'Tải ảnh hoàn thiện (Final)'}
                folder={deliveryForm.type === 'demo' ? 'exe201/bookings/demo' : 'exe201/bookings/final'}
                onUrlsChanged={(urls) => setDeliveryForm((prev) => prev ? { ...prev, urls } : null)}
                maxFiles={50}
              />
            </div>

            <div className="mt-6">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                Ghi chú hoặc Liên kết đính kèm
              </span>
              <input
                value={deliveryForm.note}
                onChange={(event) => setDeliveryForm((prev) => prev ? { ...prev, note: event.target.value } : null)}
                placeholder="Nhập ghi chú giao ảnh hoặc liên kết Drive/Fshare đính kèm (nếu có)..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition"
              />
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setDeliveryForm(null)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-xs font-black uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 active:scale-95"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actioning || deliveryForm.urls.length === 0}
                onClick={submitDelivery}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-6 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-indigo-600/10 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actioning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang giao ảnh...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Bàn giao bộ ảnh ({deliveryForm.urls.length})
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}

      <ReasonDialog
        open={rejectDialogOpen}
        title="Từ chối nhận đơn đặt lịch"
        description="Lý do này giúp khách hàng hiểu rõ tình trạng đơn và hỗ trợ admin kiểm tra khi cần."
        label="Lý do từ chối"
        placeholder="Ví dụ: Studio bận lịch đột xuất, cần khách chọn khung giờ khác..."
        defaultReason="Studio từ chối nhận đơn đặt lịch"
        confirmText="Từ chối đơn"
        danger
        loading={actioning}
        onCancel={() => setRejectDialogOpen(false)}
        onSubmit={handleReject}
      />

      <ReasonDialog
        open={disputeDialogOpen}
        title="Khiếu nại khách hàng"
        description="Lý do này giúp Admin có cơ sở phân xử tranh chấp công bằng cho Studio và khách hàng."
        label="Lý do khiếu nại"
        placeholder="Ví dụ: Khách hàng không xác nhận hoàn tất sau khi nhận ảnh final hoặc yêu cầu vượt quá cam kết ban đầu..."
        defaultReason="Studio yêu cầu khiếu nại đơn hàng"
        confirmText="Gửi khiếu nại"
        danger
        loading={actioning}
        onCancel={() => setDisputeDialogOpen(false)}
        onSubmit={handleDispute}
      />

      <ReasonDialog
        open={noShowDialogOpen}
        title="Ghi nhận khách không đến"
        description="Hành động này hủy booking theo chính sách no-show và ghi nhận phần doanh thu Studio được nhận theo commission."
        label="Ghi chú no-show"
        placeholder="Ví dụ: Khách không có mặt sau 30 phút, Studio đã gọi xác nhận..."
        defaultReason="Khách hàng không đến buổi chụp"
        confirmText="Xác nhận no-show"
        danger
        loading={actioning}
        onCancel={() => setNoShowDialogOpen(false)}
        onSubmit={handleNoShow}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'CANCELLED' || status === 'REJECTED'
    ? 'border-slate-200 bg-slate-50 text-slate-500'
    : status === 'NO_SHOW'
      ? 'border-amber-200 bg-amber-50 text-amber-700 shadow-sm shadow-amber-100/10'
    : status === 'COMPLETED'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100/10'
      : status === 'DISPUTED'
        ? 'border-rose-200 bg-rose-50 text-rose-700 shadow-sm shadow-rose-100/10 animate-pulse'
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
