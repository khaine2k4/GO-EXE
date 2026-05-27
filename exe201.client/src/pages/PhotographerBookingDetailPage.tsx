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
  PENDING_PAYMENT: 'Cho thanh toan',
  PENDING_CONFIRMATION: 'Cho xac nhan',
  CONFIRMED: 'Da xac nhan',
  IN_PROGRESS: 'Dang chup',
  DEMO_UPLOADED: 'Da gui anh demo',
  EDITING: 'Dang chinh sua anh',
  FINAL_DELIVERED: 'Da giao anh final',
  AWAITING_CUSTOMER: 'Cho khach xac nhan',
  COMPLETED: 'Hoan thanh',
  CANCELLED: 'Da huy',
  REJECTED: 'Tu choi',
}

export default function PhotographerBookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [booking, setBooking] = useState<BookingDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)
  const [error, setError] = useState('')
  const [deliveryForm, setDeliveryForm] = useState<{ type: 'demo' | 'final'; urls: string; note: string } | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getBooking(id)
      .then(setBooking)
      .catch(() => setError('Khong tim thay booking.'))
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
      toast.push({ type: 'error', title: 'Thao tac that bai' })
    } finally {
      setActioning(false)
    }
  }

  function parsePhotoUrls(raw: string) {
    return raw
      .split(/\r?\n|,/)
      .map((url) => url.trim())
      .filter(Boolean)
  }

  async function submitDelivery() {
    if (!booking || !deliveryForm) return
    const photoUrls = parsePhotoUrls(deliveryForm.urls)
    if (photoUrls.length === 0) {
      toast.push({ type: 'error', title: 'Can nhap it nhat 1 link anh' })
      return
    }

    const payload = { photoUrls, note: deliveryForm.note.trim() || undefined }
    const action = deliveryForm.type === 'demo'
      ? () => uploadDemoPhotos(booking.id, payload)
      : () => uploadFinalPhotos(booking.id, payload)

    await runAction(action, deliveryForm.type === 'demo' ? 'Da gui anh demo' : 'Da gui anh final')
  }

  if (loading) return <StateBox text="Dang tai chi tiet booking..." />
  if (error || !booking) return <StateBox text={error || 'Khong tim thay booking.'} />

  return (
    <div className="mx-auto max-w-6xl pb-20">
      <button
        type="button"
        onClick={() => navigate('/photographer/dashboard?tab=bookings')}
        className="mb-6 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lai lich booking
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="font-mono text-xs font-black uppercase tracking-widest text-slate-400">#{booking.bookingCode}</div>
              <h1 className="mt-2 text-3xl font-black text-slate-950">{booking.customerName}</h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">{booking.packageName}</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Info icon={<CalendarDays className="h-4 w-4" />} label="Lich chup" value={`${formatDate(booking.shootingDate)} | ${booking.startTime} - ${booking.endTime}`} />
            <Info icon={<MapPin className="h-4 w-4" />} label="Dia diem" value={booking.shootingLocation || 'Tai studio'} />
            <Info icon={<CircleDollarSign className="h-4 w-4" />} label="Doanh thu studio" value={formatVnd(booking.studioRevenue)} />
            <Info icon={<Clock className="h-4 w-4" />} label="Tao luc" value={new Date(booking.createdAt).toLocaleString('vi-VN')} />
          </div>

          {booking.note && (
            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Ghi chu cua khach</div>
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-slate-700">{booking.note}</p>
            </div>
          )}

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <PhotoDeliveryPanel title="Anh demo" urls={booking.demoPhotoUrls ?? []} emptyText="Chua co anh demo." />
            <PhotoDeliveryPanel title="Anh final" urls={booking.finalPhotoUrls ?? []} emptyText="Chua co anh final." />
          </div>

          {booking.customerFeedback && (
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="text-xs font-black uppercase tracking-widest text-blue-700">Feedback cua customer</div>
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-blue-900">{booking.customerFeedback}</p>
            </div>
          )}

          {deliveryForm && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
                    {deliveryForm.type === 'demo' ? 'Gui anh demo' : 'Gui anh final'}
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Nhap moi link anh tren mot dong hoac cach nhau bang dau phay.</p>
                </div>
                <button type="button" onClick={() => setDeliveryForm(null)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase text-slate-500">
                  Huy
                </button>
              </div>
              <textarea
                value={deliveryForm.urls}
                onChange={(event) => setDeliveryForm({ ...deliveryForm, urls: event.target.value })}
                rows={6}
                placeholder="https://example.com/photo-01.jpg"
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold outline-none focus:border-indigo-400"
              />
              <input
                value={deliveryForm.note}
                onChange={(event) => setDeliveryForm({ ...deliveryForm, note: event.target.value })}
                placeholder="Ghi chu giao anh"
                className="mt-3 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                disabled={actioning || parsePhotoUrls(deliveryForm.urls).length === 0}
                onClick={submitDelivery}
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-xs font-black uppercase text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> Gui anh
              </button>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Thao tac</h2>
            <div className="mt-4 grid gap-3">
              {booking.status === 'PENDING_CONFIRMATION' && (
                <>
                  <button disabled={actioning} type="button" onClick={() => runAction(() => confirmBooking(booking.id), 'Da xac nhan booking')} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 text-xs font-black uppercase text-white disabled:opacity-50">
                    <CheckCircle2 className="h-4 w-4" /> Xac nhan
                  </button>
                  <button disabled={actioning} type="button" onClick={() => runAction(() => rejectBooking(booking.id, window.prompt('Ly do tu choi?') || undefined), 'Da tu choi booking')} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white text-xs font-black uppercase text-rose-600 disabled:opacity-50">
                    <XCircle className="h-4 w-4" /> Tu choi
                  </button>
                </>
              )}
              {booking.status === 'CONFIRMED' && (
                <button disabled={actioning} type="button" onClick={() => runAction(() => markInProgress(booking.id), 'Da bat dau buoi chup')} className="h-11 rounded-2xl bg-indigo-600 text-xs font-black uppercase text-white disabled:opacity-50">
                  Bat dau chup
                </button>
              )}
              {booking.status === 'IN_PROGRESS' && (
                <button disabled={actioning} type="button" onClick={() => setDeliveryForm({ type: 'demo', urls: '', note: '' })} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-xs font-black uppercase text-white disabled:opacity-50">
                  <ImageUp className="h-4 w-4" /> Upload demo
                </button>
              )}
              {(booking.status === 'DEMO_UPLOADED' || booking.status === 'EDITING') && (
                <button disabled={actioning} type="button" onClick={() => setDeliveryForm({ type: 'final', urls: '', note: '' })} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-teal-600 text-xs font-black uppercase text-white disabled:opacity-50">
                  <ImageUp className="h-4 w-4" /> Upload final
                </button>
              )}
              {booking.status === 'FINAL_DELIVERED' && (
                <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 text-xs font-black uppercase text-teal-700">
                  Dang cho customer xac nhan nhan anh.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Lien lac</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">Mo hoi thoai voi customer cho booking nay.</p>
            <button
              type="button"
              onClick={() => navigate(`/chat?studioId=${booking.studioId}&customerId=${booking.customerId}&bookingId=${booking.id}`)}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-xs font-black uppercase text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
            >
              <MessageCircle className="h-4 w-4" /> Nhan tin voi user
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
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'FINAL_DELIVERED'
        ? 'border-teal-200 bg-teal-50 text-teal-700'
        : status === 'DEMO_UPLOADED' || status === 'EDITING'
          ? 'border-blue-200 bg-blue-50 text-blue-700'
          : 'border-indigo-200 bg-indigo-50 text-indigo-700'

  return <span className={`inline-flex rounded-2xl border px-4 py-2 text-xs font-black uppercase tracking-widest ${color}`}>{STATUS_LABEL[status] ?? status}</span>
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
        {icon} {label}
      </div>
      <div className="mt-2 text-sm font-black text-slate-900">{value}</div>
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

function StateBox({ text }: { text: string }) {
  return <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-500">{text}</div>
}
