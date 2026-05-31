import { Eye } from 'lucide-react'
import type { BookingDto } from '../../../services/bookingApi'
import { formatDate, formatVnd } from '../format'

const STATUS_STYLE: Record<string, string> = {
  PENDING_CONFIRMATION: 'bg-amber-50 text-amber-700 border border-amber-200/50',
  CONFIRMED: 'bg-indigo-50 text-indigo-700 border border-indigo-200/50',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border border-blue-200/50',
  AWAITING_CUSTOMER: 'bg-cyan-50 text-cyan-700 border border-cyan-200/50',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm shadow-emerald-100/10',
  CANCELLED: 'bg-slate-50 text-slate-500 border border-slate-200',
  REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200/50',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  AWAITING_CUSTOMER: 'Chờ khách hàng',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Từ chối',
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
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Đơn đặt lịch gần đây</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">Danh sách các yêu cầu đặt lịch chụp ảnh mới nhất và trạng thái.</p>
        </div>
        <button type="button" onClick={onManage} className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition active:scale-95 shadow-sm">Xem tất cả</button>
      </div>
      {bookings.length === 0 ? <Empty /> : (
        <div className="space-y-3">
          {bookings.slice(0, 5).map((booking) => (
            <div key={booking.id} className="grid gap-3 rounded-2xl border border-slate-100 p-4 hover:bg-slate-50/30 transition-colors sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/30">#{booking.bookingCode}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${STATUS_STYLE[booking.status] ?? 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {STATUS_LABELS[booking.status] ?? booking.status}
                  </span>
                </div>
                <div className="mt-2 truncate text-sm font-extrabold text-slate-900 leading-snug">{booking.customerName} / {booking.packageName}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <span>{formatDate(booking.shootingDate)}</span>
                  <span>•</span>
                  <span className="font-extrabold text-emerald-600">{formatVnd(booking.studioRevenue)}</span>
                </div>
              </div>
              <button type="button" onClick={() => onDetail(booking)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-950 hover:border-slate-300 hover:bg-slate-50 transition duration-150 shadow-sm active:scale-90 shrink-0">
                <Eye className="h-3.5 w-3.5" /> Chi tiết
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Empty() {
  return <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm font-bold text-slate-400">Chưa có đơn đặt lịch nào.</div>
}
