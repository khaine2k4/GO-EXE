import { Eye } from 'lucide-react'
import type { BookingDto } from '../../../services/bookingApi'
import { formatDate, formatVnd } from '../format'

const STATUS_STYLE: Record<string, string> = {
  PENDING_CONFIRMATION: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-indigo-50 text-indigo-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  AWAITING_CUSTOMER: 'bg-cyan-50 text-cyan-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
  REJECTED: 'bg-rose-50 text-rose-700',
}

export default function BookingSummary({
  bookings,
  onManage,
  onDetail,
}: {
  bookings: BookingDto[]
  onManage: () => void
  onDetail: (booking: BookingDto) => void
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">Booking summary</h2>
          <p className="text-sm font-medium text-slate-500">Recent requests and shoot status.</p>
        </div>
        <button type="button" onClick={onManage} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase text-slate-700">View all</button>
      </div>
      {bookings.length === 0 ? <Empty /> : (
        <div className="space-y-3">
          {bookings.slice(0, 5).map((booking) => (
            <div key={booking.id} className="grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black text-slate-500">#{booking.bookingCode}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${STATUS_STYLE[booking.status] ?? 'bg-slate-100 text-slate-600'}`}>{booking.status}</span>
                </div>
                <div className="mt-2 truncate text-sm font-black text-slate-950">{booking.customerName} / {booking.packageName}</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">{formatDate(booking.shootingDate)} / {formatVnd(booking.studioRevenue)}</div>
              </div>
              <button type="button" onClick={() => onDetail(booking)} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black uppercase text-slate-600">
                <Eye className="h-4 w-4" /> Detail
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Empty() {
  return <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">No booking yet.</div>
}
