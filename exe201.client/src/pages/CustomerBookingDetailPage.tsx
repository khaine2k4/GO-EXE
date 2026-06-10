import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, CircleDollarSign, Clock, CreditCard, MapPin, MessageCircle, RotateCcw, Send, Star, X } from 'lucide-react'
import { cancelBooking, confirmCompletion, createBookingReview, disputeBooking, getBooking, payosCreatePaymentUrl, submitPhotoFeedback, type BookingDto } from '../services/bookingApi'
import { useToast } from '../components/Toast'
import BookingLocationMap from '../components/map/BookingLocationMap'
import ReasonDialog from '../components/ReasonDialog'
import WatermarkImage from '../components/WatermarkImage'

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ'
}

function formatDate(value: string) {
  return new Date(value + 'T00:00:00').toLocaleDateString('vi-VN', { dateStyle: 'long' })
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

export default function CustomerBookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const toast = useToast()
  const [booking, setBooking] = useState<BookingDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)
  const [payingNow, setPayingNow] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string; locked: boolean } | null>(null)

  async function refreshBooking() {
    if (!id) return
    const data = await getBooking(id)
    setBooking(data)
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getBooking(id)
      .then(setBooking)
      .catch(() => setError('Không tìm thấy booking.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handlePayNow() {
    if (!booking) return
    setPayingNow(true)
    try {
      const res = await payosCreatePaymentUrl(booking.id)
      if (res?.paymentUrl) {
        window.location.href = res.paymentUrl
      } else {
        toast.push({ type: 'error', title: 'Không tạo được link thanh toán', message: 'Vui lòng thử lại sau.' })
      }
    } catch {
      toast.push({ type: 'error', title: 'Lỗi thanh toán', message: 'Không kết nối được cổng PayOS. Vui lòng thử lại.' })
    } finally {
      setPayingNow(false)
    }
  }

  async function handleCancel(reason: string) {
    if (!booking) return
    setActioning(true)
    try {
      const updated = await cancelBooking(booking.id, reason.trim() || 'Khách hàng hủy booking')
      setBooking(updated)
      setCancelDialogOpen(false)
      toast.push({ type: 'info', title: 'Đã hủy booking', message: 'Slot đã được giải phóng.' })
    } catch {
      toast.push({ type: 'error', title: 'Không thể hủy booking', message: 'Chỉ có thể tự hủy trước khi Studio xác nhận.' })
    } finally {
      setActioning(false)
    }
  }

  async function handleSubmitFeedback() {
    if (!booking || !feedback.trim()) return
    setActioning(true)
    try {
      const updated = await submitPhotoFeedback(booking.id, feedback.trim())
      setBooking(updated)
      setFeedback('')
      toast.push({ type: 'success', title: 'Đã gửi góp ý ảnh demo' })
    } catch {
      toast.push({ type: 'error', title: 'Không thể gửi góp ý', message: 'Chỉ gửi góp ý sau khi Studio upload ảnh demo.' })
    } finally {
      setActioning(false)
    }
  }

  async function handleConfirmCompletion() {
    if (!booking) return
    setActioning(true)
    try {
      await confirmCompletion(booking.id)
      await refreshBooking()
      toast.push({ type: 'success', title: 'Đã xác nhận nhận ảnh', message: 'Booking đã hoàn thành. Bạn có thể đánh giá Studio.' })
    } catch {
      toast.push({ type: 'error', title: 'Không thể xác nhận', message: 'Chỉ xác nhận sau khi Studio giao ảnh final.' })
    } finally {
      setActioning(false)
    }
  }

  async function handleCreateReview() {
    if (!booking) return
    setActioning(true)
    try {
      await createBookingReview(booking.id, { rating: reviewRating, comment: reviewComment.trim() || undefined })
      await refreshBooking()
      setReviewComment('')
      toast.push({ type: 'success', title: 'Đã gửi đánh giá cho Studio' })
    } catch {
      toast.push({ type: 'error', title: 'Không thể đánh giá', message: 'Booking phải hoàn thành và mỗi booking chỉ được đánh giá một lần.' })
    } finally {
      setActioning(false)
    }
  }

  async function handleReport() {
    if (!booking || !reportReason.trim()) return
    setActioning(true)
    try {
      const updated = await disputeBooking(booking.id, reportReason.trim())
      setBooking(updated)
      setReportReason('')
      toast.push({ type: 'success', title: 'Đã gửi báo cáo', message: 'Admin sẽ kiểm tra vấn đề ảnh/booking này.' })
    } catch {
      toast.push({ type: 'error', title: 'Không thể báo cáo', message: 'Hiện tại chỉ báo cáo được khi booking đang trong quá trình chụp/xử lý.' })
    } finally {
      setActioning(false)
    }
  }

  if (loading) return <StateBox text="Đang tải chi tiết booking..." />
  if (error || !booking) return <StateBox text={error || 'Không tìm thấy booking.'} />

  const canReport = booking.status === 'IN_PROGRESS'

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <button onClick={() => nav('/customer/bookings')} className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
      </button>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{booking.bookingCode}</div>
            <h1 className="mt-2 text-3xl font-black text-slate-950">{booking.packageName}</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">{booking.studioName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={booking.status} />
            {booking.status === 'PENDING_PAYMENT' && (
              <button
                type="button"
                onClick={handlePayNow}
                disabled={payingNow}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--color-azure)] px-5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600 active:scale-95 disabled:opacity-60"
              >
                <CreditCard className="h-4 w-4" />
                {payingNow ? 'Đang chuyển hướng...' : 'Thanh toán ngay'}
              </button>
            )}
            {booking.canCancel && (
              <button type="button" onClick={() => setCancelDialogOpen(true)} disabled={actioning} className="inline-flex h-11 items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 text-xs font-black uppercase tracking-widest text-rose-700 disabled:opacity-50">
                <RotateCcw className="h-4 w-4" /> Hủy booking
              </button>
            )}
            {(booking.status === 'FINAL_DELIVERED' || booking.status === 'AWAITING_CUSTOMER') && (
              <button type="button" onClick={handleConfirmCompletion} disabled={actioning} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--color-azure)] px-4 text-xs font-black uppercase tracking-widest text-white transition hover:bg-sky-600 active:scale-95 disabled:opacity-50">
                <CheckCircle2 className="h-4 w-4" /> Xác nhận đã nhận ảnh
              </button>
            )}
            <button onClick={() => nav(`/chat?studioId=${booking.studioId}&bookingId=${booking.id}`)} className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-azure)] hover:text-[var(--color-azure)]">
              <MessageCircle className="h-4 w-4" /> Nhắn tin với Studio
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Info icon={<CalendarDays className="h-4 w-4" />} label="Ngày chụp" value={`${formatDate(booking.shootingDate)} - ${booking.startTime} - ${booking.endTime}`} />
          <Info icon={<MapPin className="h-4 w-4" />} label="Địa điểm" value={booking.shootingLocation || 'Chưa nhập'} />
          <Info icon={<CircleDollarSign className="h-4 w-4" />} label="Thanh toán" value={booking.latestPayment ? `${booking.latestPayment.status} - ${booking.latestPayment.methodName}` : 'Chưa có'} />
          <Info icon={<Clock className="h-4 w-4" />} label="Hạn giữ slot" value={booking.paymentExpiresAt ? new Date(booking.paymentExpiresAt).toLocaleString('vi-VN') : 'Không áp dụng'} />
        </div>

        <div className="mt-6">
          <BookingLocationMap
            lat={booking.shootingLat}
            lng={booking.shootingLng}
            address={booking.shootingLocation}
            subtitle={`${formatDate(booking.shootingDate)} - ${booking.startTime} - ${booking.endTime}`}
          />
        </div>

        <div className="mt-8 rounded-2xl bg-slate-50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Tổng tiền</span>
            <span className="text-3xl font-black text-[var(--color-azure)]">{formatVnd(booking.totalPrice)}</span>
          </div>
          {booking.note && (
            <div className="mt-3 border-t border-slate-200/60 pt-3 text-sm font-semibold text-slate-600">
              Ghi chú đặt lịch: {booking.note}
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <PhotoDeliveryPanel
            title="Ảnh demo"
            urls={booking.demoPhotoUrls ?? []}
            emptyText="Studio chưa gửi ảnh demo."
            locked
            onPreview={(url) => setPreviewPhoto({ url, title: 'Ảnh demo', locked: true })}
          />
          <PhotoDeliveryPanel
            title="Ảnh final"
            urls={booking.finalPhotoUrls ?? []}
            emptyText="Studio chưa gửi ảnh final."
            locked={booking.status !== 'COMPLETED'}
            onPreview={(url, locked) => setPreviewPhoto({ url, title: 'Ảnh final', locked })}
          />
        </div>

        {booking.status === 'DEMO_UPLOADED' && (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="text-xs font-black uppercase tracking-widest text-[var(--color-azure)]">Góp ý ảnh demo</div>
            <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={4} placeholder="Nhập góp ý hoặc danh sách ảnh muốn chỉnh..." className="mt-3 w-full rounded-xl border border-blue-100 bg-white p-3 text-sm font-semibold outline-none focus:border-[var(--color-azure)]" />
            <button type="button" onClick={handleSubmitFeedback} disabled={actioning || !feedback.trim()} className="primary-pill mt-3 h-10 gap-2 px-4 text-xs font-black uppercase disabled:opacity-50">
              <Send className="h-4 w-4" /> Gửi góp ý
            </button>
          </div>
        )}

        {booking.customerFeedback && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">Góp ý đã gửi</div>
            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-slate-700">{booking.customerFeedback}</p>
          </div>
        )}

        {canReport && (
          <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--color-orange)]">
              <AlertTriangle className="h-4 w-4" /> Báo cáo booking / không thích ảnh
            </div>
            <textarea value={reportReason} onChange={(event) => setReportReason(event.target.value)} rows={3} placeholder="Mô tả vấn đề bạn gặp với ảnh hoặc buổi chụp..." className="mt-3 w-full rounded-xl border border-orange-100 bg-white p-3 text-sm font-semibold outline-none focus:border-[var(--color-orange)]" />
            <button type="button" onClick={handleReport} disabled={actioning || !reportReason.trim()} className="accent-pill mt-3 h-10 gap-2 px-4 text-xs font-black uppercase disabled:opacity-50">
              Gửi báo cáo
            </button>
          </div>
        )}

        {booking.canReview && (
          <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-5">
            <div className="text-xs font-black uppercase tracking-widest text-[var(--color-orange)]">Đánh giá Studio</div>
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" onClick={() => setReviewRating(value)} className="p-1 text-[var(--color-orange)]">
                  <Star className={`h-6 w-6 ${value <= reviewRating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
            <textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} rows={4} placeholder="Chia sẻ trải nghiệm về buổi chụp và chất lượng ảnh final..." className="mt-3 w-full rounded-xl border border-orange-100 bg-white p-3 text-sm font-semibold outline-none focus:border-[var(--color-orange)]" />
            <button type="button" onClick={handleCreateReview} disabled={actioning} className="accent-pill mt-3 h-10 gap-2 px-4 text-xs font-black uppercase disabled:opacity-50">
              <Star className="h-4 w-4" /> Gửi đánh giá
            </button>
          </div>
        )}

        {booking.review && (
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <div className="text-xs font-black uppercase tracking-widest text-emerald-700">Đánh giá của bạn</div>
            <div className="mt-2 text-lg font-black text-emerald-800">{booking.review.rating}/5 sao</div>
            {booking.review.comment && <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-slate-700">{booking.review.comment}</p>}
          </div>
        )}
      </div>

      <Link to="/photosets" className="primary-pill mt-6 h-12 px-6 text-xs font-black uppercase tracking-widest">
        Đặt thêm dịch vụ
      </Link>
      <ReasonDialog
        open={cancelDialogOpen}
        title="Hủy booking"
        description="Lý do hủy sẽ được lưu lại để studio và admin nắm tình trạng booking."
        label="Lý do hủy"
        placeholder="Ví dụ: Tôi muốn đổi lịch chụp hoặc chọn gói khác..."
        defaultReason="Khách hàng hủy booking"
        confirmText="Hủy booking"
        danger
        loading={actioning}
        onCancel={() => setCancelDialogOpen(false)}
        onSubmit={handleCancel}
      />
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-3 text-white">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-white/60">{previewPhoto.title}</div>
                {previewPhoto.locked && <div className="mt-1 text-sm font-semibold text-white/80">Bản xem trước có watermark</div>}
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Đóng xem ảnh"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <WatermarkImage
              src={previewPhoto.url}
              alt={previewPhoto.title}
              isLocked={previewPhoto.locked}
              label="GO! DEMO"
              className="max-h-[78vh] w-full rounded-2xl"
              fit="contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function PhotoDeliveryPanel({
  title,
  urls,
  emptyText,
  locked = false,
  onPreview,
}: {
  title: string
  urls: string[]
  emptyText: string
  locked?: boolean
  onPreview?: (url: string, locked: boolean) => void
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</div>
        {locked && urls.length > 0 && (
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
            Watermark
          </span>
        )}
      </div>
      {urls.length === 0 ? (
        <div className="mt-3 text-sm font-semibold text-slate-500">{emptyText}</div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {urls.map((url, index) => {
            const image = (
              <WatermarkImage
                src={url}
                alt={`${title} ${index + 1}`}
                isLocked={locked}
                label="GO! DEMO"
                className="aspect-video w-full"
              />
            )

            if (locked) {
              return (
                <div key={url} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <button type="button" onClick={() => onPreview?.(url, locked)} className="block w-full text-left">
                    {image}
                  </button>
                  <div className="px-3 py-2 text-xs font-bold text-slate-500">Chỉ xem trước, không tải file gốc</div>
                </div>
              )
            }

            return (
              <button key={url} type="button" onClick={() => onPreview?.(url, locked)} className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left">
                {image}
                <div className="truncate px-3 py-2 text-xs font-bold text-slate-500">{url}</div>
              </button>
            )
          })}
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
        : status === 'FINAL_DELIVERED'
          ? 'bg-teal-50 text-teal-700'
          : status === 'DEMO_UPLOADED' || status === 'EDITING'
            ? 'bg-blue-50 text-[var(--color-azure)]'
            : status === 'PENDING_PAYMENT'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-blue-50 text-[var(--color-azure)]'

  return <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${color}`}>{STATUS_LABEL[status] ?? status}</span>
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
