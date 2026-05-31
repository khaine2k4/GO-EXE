import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { CalendarDays, CircleDollarSign, Clock, ImageIcon, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [currentPage, setCurrentPage] = useState(1)
  
  const itemsPerPage = 6

  useEffect(() => {
    setLoading(true)
    setError('')
    setCurrentPage(1)
    getBookings(activeTab)
      .then(setBookings)
      .catch(() => setError('Không tải được lịch sử booking.'))
      .finally(() => setLoading(false))
  }, [activeTab])

  // Pagination calculations
  const totalPages = Math.ceil(bookings.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedBookings = bookings.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="mx-auto max-w-6xl pt-24 pb-20 px-4 md:px-0">
      {/* Header section with integrated compact pagination */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Lịch chụp của tôi</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Theo dõi trạng thái chụp ảnh, các đợt thanh toán và tương tác với các Studio.
          </p>
        </div>

        {/* Compact Top Navigation to prevent layout jitter */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-95 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-black text-slate-600 px-2 tracking-widest uppercase">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-95 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tabs list with modern visual designs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-[var(--color-azure)] text-white shadow-md shadow-sky-500/10'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <StateBox text="Đang tải danh sách booking..." />
      ) : error ? (
        <StateBox text={error} />
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/40 py-24 text-center">
          <ImageIcon className="h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-black text-slate-950">Chưa có booking nào</h3>
          <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Khám phá dịch vụ chụp ảnh đẹp mắt từ các photographer đối tác
          </p>
          <Link to="/photosets" className="primary-pill mt-6 h-12 px-8 text-xs font-black uppercase tracking-widest bg-slate-950 text-white hover:bg-slate-800 transition">
            Khám phá dịch vụ
          </Link>
        </div>
      ) : (
        <>
          {/* Bookings Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {paginatedBookings.map((booking) => (
              <Link
                key={booking.id}
                to={`/customer/bookings/${booking.id}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-150 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-350"
              >
                {/* Visual Accent Hover Border */}
                <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-sky-400 to-indigo-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex self-start items-center rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 ring-1 ring-inset ring-slate-100">
                        {booking.bookingCode}
                      </span>
                      <h2 className="mt-2 text-lg font-black text-slate-900 tracking-tight group-hover:text-[var(--color-azure)] transition-colors duration-200">
                        {booking.packageName}
                      </h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {booking.studioName}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {/* Shooting Date Panel */}
                    <div className="rounded-2xl bg-slate-50 p-4 transition-colors duration-300 group-hover:bg-sky-50/20">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <CalendarDays className="h-4 w-4 text-indigo-500" />
                        <span>Ngày chụp</span>
                      </div>
                      <div className="mt-1.5 text-sm font-black text-slate-800">
                        {formatDate(booking.shootingDate)}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        Khung giờ: {booking.startTime}
                      </div>
                    </div>

                    {/* Payment Panel */}
                    <div className="rounded-2xl bg-slate-50 p-4 transition-colors duration-300 group-hover:bg-emerald-50/20">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <CircleDollarSign className="h-4 w-4 text-emerald-500" />
                        <span>Thanh toán</span>
                      </div>
                      <div className="mt-1.5">
                        <PaymentBadge status={booking.latestPayment?.status} />
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 mt-1">
                        Phương thức: Chuyển khoản
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer pricing */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng chi phí</span>
                    <span className="text-2xl font-black text-[var(--color-azure)]">{formatVnd(booking.totalPrice)}</span>
                  </div>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all duration-300 group-hover:bg-[var(--color-azure)] group-hover:text-white group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Full Bottom Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6">
              <span className="text-xs font-semibold text-slate-500">
                Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, bookings.length)} trên tổng số {bookings.length} booking
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-black uppercase tracking-widest text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-95 disabled:opacity-40"
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black transition active:scale-95 ${
                      currentPage === page
                        ? 'bg-[var(--color-azure)] text-white shadow-sm shadow-sky-500/10'
                        : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-black uppercase tracking-widest text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-95 disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABEL[status] ?? status

  let color = 'bg-blue-50 text-[var(--color-azure)] ring-1 ring-blue-100/50'
  
  if (status === 'CANCELLED' || status === 'REJECTED') {
    color = 'bg-rose-50 text-rose-700 ring-1 ring-rose-100/50'
  } else if (status === 'COMPLETED') {
    color = 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100/50'
  } else if (status === 'DISPUTED') {
    color = 'bg-orange-50 text-orange-700 ring-1 ring-orange-100/50'
  } else if (status === 'PENDING_PAYMENT') {
    color = 'bg-amber-50 text-amber-700 ring-1 ring-amber-100/50'
  } else if (status === 'PENDING_CONFIRMATION') {
    color = 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100/50'
  } else if (status === 'CONFIRMED') {
    color = 'bg-sky-50 text-sky-700 ring-1 ring-sky-100/50'
  } else if (status === 'FINAL_DELIVERED' || status === 'AWAITING_CUSTOMER') {
    color = 'bg-purple-50 text-purple-700 ring-1 ring-purple-100/50'
  }

  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${color}`}>
      {label}
    </span>
  )
}

function PaymentBadge({ status }: { status?: string }) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200">
        Chưa thanh toán
      </span>
    )
  }

  const normalized = status.toUpperCase()
  if (normalized === 'PAID' || normalized === 'SUCCESS' || normalized === 'COMPLETED') {
    return (
      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
        Đã thanh toán
      </span>
    )
  }

  if (normalized === 'PENDING') {
    return (
      <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-600/10">
        Chờ thanh toán
      </span>
    )
  }

  if (normalized === 'FAILED') {
    return (
      <span className="inline-flex items-center rounded-md bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-600/10">
        Thất bại
      </span>
    )
  }

  if (normalized === 'REFUNDED') {
    return (
      <span className="inline-flex items-center rounded-md bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 ring-1 ring-inset ring-purple-600/10">
        Đã hoàn tiền
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200">
      {status}
    </span>
  )
}

function StateBox({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm font-bold text-slate-500">
      <Clock className="mx-auto mb-3 h-8 w-8 animate-pulse text-indigo-400" />
      {text}
    </div>
  )
}
