import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, CheckCircle2, CircleDollarSign, Clock, MapPin, MessageCircle, RotateCcw, Send, Star } from 'lucide-react'
import { cancelBooking, confirmCompletion, createBookingReview, getBooking, submitPhotoFeedback, type BookingDto } from '../services/bookingApi'
import { useToast } from '../components/Toast'

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' VND'
}

function formatDate(value: string) {
  return new Date(value + 'T00:00:00').toLocaleDateString('vi-VN', { dateStyle: 'long' })
}

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Cho thanh toan',
  PENDING_CONFIRMATION: 'Cho Studio xac nhan',
  CONFIRMED: 'Da xac nhan',
  IN_PROGRESS: 'Dang chup',
  DEMO_UPLOADED: 'Da gui anh demo',
  EDITING: 'Dang chinh sua anh',
  FINAL_DELIVERED: 'Da giao anh final',
  AWAITING_CUSTOMER: 'Cho ban xac nhan',
  COMPLETED: 'Hoan thanh',
  CANCELLED: 'Da huy',
  REJECTED: 'Bi tu choi',
}

export default function CustomerBookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const toast = useToast()
  const [booking, setBooking] = useState<BookingDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getBooking(id)
      .then(setBooking)
      .catch(() => setError('Khong tim thay booking.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleCancel() {
    if (!booking) return
    const reason = window.prompt('Nhap ly do huy booking') || 'Customer cancelled'
    setActioning(true)
    try {
      const updated = await cancelBooking(booking.id, reason)
      setBooking(updated)
      toast.push({ type: 'info', title: 'Da huy booking', message: 'Slot da duoc giai phong.' })
    } catch {
      toast.push({ type: 'error', title: 'Khong the huy booking', message: 'Chi duoc tu huy truoc khi Studio xac nhan.' })
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
      toast.push({ type: 'success', title: 'Da gui feedback anh demo' })
    } catch {
      toast.push({ type: 'error', title: 'Khong the gui feedback', message: 'Chi gui feedback sau khi Studio upload anh demo.' })
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
      toast.push({ type: 'success', title: 'Da xac nhan nhan anh', message: 'Booking da hoan thanh. Ban co the review Studio.' })
    } catch {
      toast.push({ type: 'error', title: 'Khong the xac nhan', message: 'Chi xac nhan sau khi Studio giao anh final.' })
    } finally {
      setActioning(false)
    }
  }

  async function handleCreateReview() {
    if (!booking) return
    setActioning(true)
    try {
      const review = await createBookingReview(booking.id, { rating: reviewRating, comment: reviewComment.trim() || undefined })
      setBooking({ ...booking, review, canReview: false })
      setReviewComment('')
      toast.push({ type: 'success', title: 'Da gui review cho Studio' })
    } catch {
      toast.push({ type: 'error', title: 'Khong the review', message: 'Booking phai completed va moi booking chi review mot lan.' })
    } finally {
      setActioning(false)
    }
  }

  if (loading) return <StateBox text="Dang tai chi tiet booking..." />
  if (error || !booking) return <StateBox text={error || 'Khong tim thay booking.'} />

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <button onClick={() => nav('/customer/bookings')} className="mb-8 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" /> Quay lai danh sach
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
              <button type="button" onClick={handleCancel} disabled={actioning} className="inline-flex h-11 items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 text-xs font-black uppercase tracking-widest text-rose-700 disabled:opacity-50">
                <RotateCcw className="h-4 w-4" /> Huy booking
              </button>
            )}
            {booking.status === 'FINAL_DELIVERED' && (
              <button type="button" onClick={handleConfirmCompletion} disabled={actioning} className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
                <CheckCircle2 className="h-4 w-4" /> Xac nhan da nhan anh
              </button>
            )}
            <button onClick={() => nav(`/chat?studioId=${booking.studioId}&bookingId=${booking.id}`)} className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-azure)] hover:text-[var(--color-azure)]">
              <MessageCircle className="h-4 w-4" /> Nhan tin voi Studio
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Info icon={<CalendarDays className="h-4 w-4" />} label="Ngay chup" value={`${formatDate(booking.shootingDate)} - ${booking.startTime} - ${booking.endTime}`} />
          <Info icon={<MapPin className="h-4 w-4" />} label="Dia diem" value={booking.shootingLocation || 'Chua nhap'} />
          <Info icon={<CircleDollarSign className="h-4 w-4" />} label="Thanh toan" value={booking.latestPayment ? `${booking.latestPayment.status} - ${booking.latestPayment.methodName}` : 'Chua co'} />
          <Info icon={<Clock className="h-4 w-4" />} label="Han giu slot" value={booking.paymentExpiresAt ? new Date(booking.paymentExpiresAt).toLocaleString('vi-VN') : 'Khong ap dung'} />
        </div>

        <div className="mt-8 rounded-2xl bg-slate-50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Tong tien</span>
            <span className="text-2xl font-black text-[var(--color-azure)]">{formatVnd(booking.totalPrice)}</span>
          </div>
          <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-600">
            <div>Phi nen tang: {formatVnd(booking.commissionAmount)}</div>
            <div>Studio nhan du kien: {formatVnd(booking.studioRevenue)}</div>
            {booking.note && <div>Ghi chu: {booking.note}</div>}
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <PhotoDeliveryPanel title="Anh demo" urls={booking.demoPhotoUrls ?? []} emptyText="Studio chua gui anh demo." />
          <PhotoDeliveryPanel title="Anh final" urls={booking.finalPhotoUrls ?? []} emptyText="Studio chua gui anh final." />
        </div>

        {booking.status === 'DEMO_UPLOADED' && (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="text-xs font-black uppercase tracking-widest text-blue-700">Feedback anh demo</div>
            <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={4} placeholder="Nhap gop y hoac danh sach anh muon chinh..." className="mt-3 w-full rounded-xl border border-blue-100 bg-white p-3 text-sm font-semibold outline-none focus:border-blue-400" />
            <button type="button" onClick={handleSubmitFeedback} disabled={actioning || !feedback.trim()} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black uppercase text-white disabled:opacity-50">
              <Send className="h-4 w-4" /> Gui feedback
            </button>
          </div>
        )}

        {booking.customerFeedback && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">Feedback da gui</div>
            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-slate-700">{booking.customerFeedback}</p>
          </div>
        )}

        {booking.canReview && (
          <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <div className="text-xs font-black uppercase tracking-widest text-amber-700">Review Studio</div>
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" onClick={() => setReviewRating(value)} className="p-1 text-amber-500">
                  <Star className={`h-6 w-6 ${value <= reviewRating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
            <textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} rows={4} placeholder="Chia se trai nghiem ve buoi chup va chat luong anh final..." className="mt-3 w-full rounded-xl border border-amber-100 bg-white p-3 text-sm font-semibold outline-none focus:border-amber-400" />
            <button type="button" onClick={handleCreateReview} disabled={actioning} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-amber-600 px-4 text-xs font-black uppercase text-white disabled:opacity-50">
              <Star className="h-4 w-4" /> Gui review
            </button>
          </div>
        )}

        {booking.review && (
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <div className="text-xs font-black uppercase tracking-widest text-emerald-700">Review cua ban</div>
            <div className="mt-2 text-lg font-black text-emerald-800">{booking.review.rating}/5 sao</div>
            {booking.review.comment && <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-slate-700">{booking.review.comment}</p>}
          </div>
        )}
      </div>

      <Link to="/photosets" className="mt-6 inline-flex rounded-2xl bg-slate-950 px-6 py-3 text-xs font-black uppercase tracking-widest text-white">
        Dat them dich vu
      </Link>
    </div>
  )
}

function PhotoDeliveryPanel({ title, urls, emptyText }: { title: string; urls: string[]; emptyText: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
      <div className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</div>
      {urls.length === 0 ? (
        <div className="mt-3 text-sm font-semibold text-slate-500">{emptyText}</div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {urls.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img src={url} alt={title} className="aspect-video w-full object-cover transition group-hover:scale-105" />
              <div className="truncate px-3 py-2 text-xs font-bold text-slate-500">{url}</div>
            </a>
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
      : status === 'FINAL_DELIVERED'
        ? 'bg-teal-50 text-teal-700'
        : status === 'DEMO_UPLOADED' || status === 'EDITING'
          ? 'bg-blue-50 text-blue-700'
          : status === 'PENDING_PAYMENT'
            ? 'bg-amber-50 text-amber-700'
            : 'bg-indigo-50 text-indigo-700'

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
