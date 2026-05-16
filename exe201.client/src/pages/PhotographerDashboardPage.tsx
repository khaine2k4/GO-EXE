import { useAppStore } from '../store/AppStore'
import { useToast } from '../components/Toast'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Clock, CheckCircle, UploadCloud, BadgeCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { BookingStatus } from '../types'

function formatVnd(v: number) { return new Intl.NumberFormat('vi-VN').format(v) + ' ₫' }
function formatDate(iso: string) { return new Date(iso).toLocaleDateString('vi-VN', { dateStyle: 'medium' }) }

const STATUS_CFG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'CHỜ XÁC NHẬN', color: 'text-amber-600', bg: 'bg-amber-50' },
  CONFIRMED: { label: 'ĐÃ XÁC NHẬN', color: 'text-blue-600', bg: 'bg-blue-50' },
  DELIVERED: { label: 'ĐÃ GIAO ẢNH', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  COMPLETED: { label: 'HOÀN THÀNH', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  DISPUTED: { label: 'KHIẾU NẠI', color: 'text-rose-600', bg: 'bg-rose-50' },
  REFUNDED: { label: 'HOÀN TIỀN', color: 'text-slate-500', bg: 'bg-slate-50' },
  CANCELLED: { label: 'ĐÃ HỦY', color: 'text-slate-400', bg: 'bg-slate-50' },
}

const MOCK_DELIVERY_URLS = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=800&auto=format&fit=crop&q=80',
]

const TABS: { label: string; value: BookingStatus | 'ALL' }[] = [
  { label: 'TẤT CẢ', value: 'ALL' },
  { label: 'CHỜ XÁC NHẬN', value: 'PENDING' },
  { label: 'ĐÃ XÁC NHẬN', value: 'CONFIRMED' },
  { label: 'ĐÃ GIAO ẢNH', value: 'DELIVERED' },
  { label: 'HOÀN THÀNH', value: 'COMPLETED' },
]

export default function PhotographerDashboardPage() {
  const { state, actions } = useAppStore()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<BookingStatus | 'ALL'>('ALL')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const photographer = state.photographers.find((p) => p.id === state.currentUser?.id)
  const myBookings = state.bookings.filter((b) => b.photographerId === state.currentUser?.id)
  const filtered = activeTab === 'ALL' ? myBookings : myBookings.filter((b) => b.status === activeTab)

  const pendingCount = myBookings.filter((b) => b.status === 'PENDING').length
  const confirmedCount = myBookings.filter((b) => b.status === 'CONFIRMED').length
  const completedCount = myBookings.filter((b) => b.status === 'COMPLETED').length

  const releasedTxs = state.transactions.filter((tx) => {
    const b = myBookings.find((b) => b.id === tx.bookingId)
    return b && tx.type === 'RELEASE'
  })
  const earnings = releasedTxs.reduce((s, tx) => s + tx.amount, 0)

  async function handleConfirmJob(bookingId: string) {
    setLoadingId(bookingId)
    await new Promise((r) => setTimeout(r, 600))
    actions.confirmJob(bookingId)
    toast.push({ type: 'success', title: 'Job Accepted! 📸', message: 'Bạn đã nhận job thành công. Hãy liên hệ với khách ngay.' })
    setLoadingId(null)
  }

  async function handleDeliver(bookingId: string) {
    setLoadingId(bookingId)
    await new Promise((r) => setTimeout(r, 800))
    actions.deliverPhotos(bookingId, MOCK_DELIVERY_URLS)
    toast.push({ type: 'success', title: 'Giao ảnh thành công! ✨', message: 'Hồ sơ đã được gửi đến khách hàng.' })
    setLoadingId(null)
  }

  const isPending = photographer?.status === 'PENDING'

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Premium Header */}
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Photographer Studio</h1>
          {photographer && (
            <p className="mt-2 text-[15px] font-medium text-slate-500 max-w-xl leading-relaxed">
              Chào mừng trở lại, <span className="text-slate-900 font-black">{photographer.name}</span>! Quản lý các dự án và theo dõi tăng trưởng doanh thu của bạn.
            </p>
          )}
        </div>

        {isPending && (
          <div className="inline-flex items-center gap-2.5 rounded-2xl bg-amber-50 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-amber-600 ring-1 ring-inset ring-amber-100 shadow-sm">
            ⏳ Hồ sơ đang được xét duyệt
          </div>
        )}
      </div>

      {/* KPI Stats - Premium Cards */}
      <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4 px-2">
        {[
          { label: 'CHỜ NHẬN JOB', value: String(pendingCount), icon: <Clock className="h-4 w-4" />, color: 'amber' },
          { label: 'ĐANG THỰC HIỆN', value: String(confirmedCount), icon: <CalendarDays className="h-4 w-4" />, color: 'blue' },
          { label: 'HOÀN THÀNH', value: String(completedCount), icon: <CheckCircle className="h-4 w-4" />, color: 'emerald' },
          { label: 'DOANH THU', value: formatVnd(earnings), icon: <BadgeCheck className="h-4 w-4" />, color: 'indigo' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm ring-1 ring-slate-100 hover:shadow-xl transition-all"
          >
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${s.color === 'amber' ? 'bg-amber-50 text-amber-600' :
              s.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                s.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-indigo-50 text-indigo-600'
              }`}>
              {s.icon}
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</div>
            <div className="text-2xl font-black tracking-tight text-slate-900">{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="mx-2 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Danh sách Bookings</h2>

          {/* Modern Tabs */}
          <div className="inline-flex gap-1 rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
            {TABS.map((tab) => {
              const count = tab.value === 'ALL' ? myBookings.length : myBookings.filter((b) => b.status === tab.value).length
              const isActive = activeTab === tab.value
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                    : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  {tab.label}
                  {count > 0 && <span className="ml-2 opacity-50">{count}</span>}
                </button>
              )
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-slate-100 py-32 text-center bg-slate-50/30">
            <CalendarDays className="mb-6 h-12 w-12 text-slate-200" />
            <h3 className="text-[17px] font-black text-slate-900">Không có lịch trình nào</h3>
            <p className="mt-2 text-[14px] font-medium text-slate-500 max-w-sm leading-relaxed">
              Dường như bạn chưa có booking nào trong danh mục này. Hãy cập nhật thêm ảnh đẹp để khách tìm thấy bạn!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filtered.map((booking, i) => {
              const sc = STATUS_CFG[booking.status]
              const isLoading = loadingId === booking.id
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="group relative flex flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white p-2 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/40">
                    {/* Header Info */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6 md:px-8 py-5">
                      <span className="text-[10px] font-black font-mono text-slate-300 tracking-tighter uppercase whitespace-nowrap">REF: #{booking.id.substring(0, 12)}</span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full ring-1 ring-inset px-3 py-1 text-[10px] font-black uppercase tracking-widest ${sc.bg} ${sc.color} ring-white/20 shadow-sm`}>
                        {sc.label}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-6 md:p-8">
                      <div className="mb-8 flex items-start justify-between gap-4">
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Khách hàng</div>
                          <h3 className="text-xl font-black tracking-tight text-slate-900">{booking.customerName}</h3>
                          <div className="mt-2 text-xs font-bold text-slate-400 flex items-center gap-1.5">
                            <CalendarDays className="h-3 w-3" /> {formatDate(booking.date)} · <span className="text-indigo-600">{booking.packageTier}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 text-right">Giá gói</div>
                          <div className="text-lg font-black text-slate-900">{formatVnd(booking.totalPrice)}</div>
                        </div>
                      </div>

                      <div className="mt-auto flex gap-3">
                        {booking.status === 'PENDING' && (
                          <button onClick={() => handleConfirmJob(booking.id)} disabled={isLoading}
                            className={`flex-1 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] ${isLoading ? 'opacity-50' : 'hover:bg-indigo-700'}`}>
                            <CheckCircle className="h-4 w-4" />
                            {isLoading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN JOB'}
                          </button>
                        )}
                        {booking.status === 'CONFIRMED' && (
                          <button onClick={() => handleDeliver(booking.id)} disabled={isLoading}
                            className={`flex-1 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] ${isLoading ? 'opacity-50' : 'hover:bg-indigo-700'}`}>
                            <UploadCloud className="h-4 w-4" />
                            {isLoading ? 'ĐANG TẢI...' : 'GIAO ẢNH'}
                          </button>
                        )}
                        <Link to={`/photographer/bookings/${booking.id}`}
                          className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white px-6 text-[11px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98] ${booking.status === 'PENDING' || booking.status === 'CONFIRMED' ? 'w-auto' : 'flex-1'}`}>
                          CHI TIẾT
                        </Link>
                      </div>
                    </div>

                    <div className="absolute inset-0 z-[-1] bg-gradient-to-br from-indigo-50/0 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
