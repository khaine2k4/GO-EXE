import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useAppStore } from '../store/AppStore'
import type { BookingStatus } from '../types'
import { Clock, CheckCircle, AlertTriangle, ImageIcon, Lock, CircleCheck } from 'lucide-react'

function formatVnd(v: number) { return new Intl.NumberFormat('vi-VN').format(v) + ' ₫' }
function formatDate(iso: string) { return new Date(iso).toLocaleDateString('vi-VN', { dateStyle: 'medium' }) }

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING: { label: 'CHỜ XÁC NHẬN', color: 'text-amber-600', bg: 'bg-amber-50', icon: <Clock className="h-3.5 w-3.5" /> },
  CONFIRMED: { label: 'ĐÃ XÁC NHẬN', color: 'text-blue-600', bg: 'bg-blue-50', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  DELIVERED: { label: 'ĐÃ GIAO ẢNH', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: <ImageIcon className="h-3.5 w-3.5" /> },
  COMPLETED: { label: 'HOÀN THÀNH', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CircleCheck className="h-3.5 w-3.5" /> },
  DISPUTED: { label: 'KHIẾU NẠI', color: 'text-rose-600', bg: 'bg-rose-50', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  REFUNDED: { label: 'HOÀN TIỀN', color: 'text-slate-500', bg: 'bg-slate-50', icon: <Lock className="h-3.5 w-3.5" /> },
  CANCELLED: { label: 'ĐÃ HỦY', color: 'text-slate-400', bg: 'bg-slate-50', icon: <Lock className="h-3.5 w-3.5" /> },
}

const TABS: { label: string; value: BookingStatus | 'ALL' }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ xác nhận', value: 'PENDING' },
  { label: 'Đã xác nhận', value: 'CONFIRMED' },
  { label: 'Đã giao ảnh', value: 'DELIVERED' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Tranh chấp', value: 'DISPUTED' },
]

export default function CustomerBookingsPage() {
  const { state } = useAppStore()
  const [activeTab, setActiveTab] = useState<BookingStatus | 'ALL'>('ALL')

  const myBookings = state.bookings.filter((b) => b.customerId === state.currentUser?.id)
  const filtered = activeTab === 'ALL' ? myBookings : myBookings.filter((b) => b.status === activeTab)

  return (
    <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Premium Header */}
      <div className="mb-10 px-2 text-center lg:text-left">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Lịch chụp của tôi</h1>
        <p className="mt-2 text-[15px] font-medium text-slate-500 max-w-xl leading-relaxed">
          Nơi lưu giữ những khoảnh khắc và quản lý các giao dịch chụp ảnh an toàn qua Escrow.
        </p>
      </div>

      {/* Modern Glassmorphism Tabs */}
      <div className="mb-10 flex items-center justify-center lg:justify-start">
        <div className="inline-flex flex-wrap gap-1.5 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm">
          {TABS.map((tab) => {
            const count = tab.value === 'ALL' ? myBookings.length : myBookings.filter((b) => b.status === tab.value).length
            if (count === 0 && tab.value !== 'ALL') return null
            const isActive = activeTab === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${isActive
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`rounded-lg px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bookings Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-slate-100 py-32 text-center bg-slate-50/30">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-xl shadow-slate-200/50">
            <ImageIcon className="h-10 w-10 text-slate-200" />
          </div>
          <h3 className="text-[17px] font-black text-slate-900">Chưa có giao dịch chụp ảnh</h3>
          <p className="mt-2 text-[14px] font-medium text-slate-500 max-w-xs leading-relaxed">
            Mọi khoảnh khắc đẹp đều bắt đầu từ một lịch chụp. Hãy tìm nhiếp ảnh gia phù hợp ngay!
          </p>
          <Link to="/" className="mt-8 rounded-2xl bg-slate-900 px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-800 shadow-xl shadow-slate-900/10">
            KHÁM PHÁ NGAY
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {filtered.map((b, i) => {
            const sc = STATUS_CONFIG[b.status]
            const photographer = state.photographers.find((p) => p.id === b.photographerId)
            const payment = state.payments.find((p) => p.bookingId === b.id)

            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={`/customer/bookings/${b.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white p-2 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/40"
                >
                  {/* Status Overlay */}
                  <div className={`absolute right-6 top-6 z-10 flex items-center gap-2 rounded-full border border-white/50 px-3.5 py-1.5 text-[10px] font-black tracking-widest uppercase ring-1 ring-inset backdrop-blur-md ${sc.bg} ${sc.color} ring-white/20 shadow-sm`}>
                    {sc.icon} {sc.label}
                  </div>

                  <div className="p-6 md:p-8">
                    <div className="mb-8 flex items-center gap-4">
                      {photographer ? (
                        <img src={photographer.avatarUrl} alt={photographer.name} className="h-16 w-16 rounded-2xl object-cover ring-4 ring-slate-50" />
                      ) : (
                        <div className="h-16 w-16 rounded-2xl bg-slate-100 ring-4 ring-slate-50" />
                      )}
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Photographer</div>
                        <h3 className="text-xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">{b.photographerName}</h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-slate-50 bg-slate-50/50 p-4 ring-1 ring-inset ring-white">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Ngày chụp</div>
                        <div className="text-[15px] font-black text-slate-800">{formatDate(b.date)}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-50 bg-slate-50/50 p-4 ring-1 ring-inset ring-white">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Giá trị gói</div>
                        <div className="text-[15px] font-black text-slate-900">{formatVnd(b.totalPrice)}</div>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                      <div className="text-[10px] font-black font-mono text-slate-300">REF: #{b.id.substring(0, 8)}</div>

                      {payment && (
                        <div className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${payment.status === 'holding'
                          ? 'bg-amber-50 text-amber-600 ring-amber-100'
                          : payment.status === 'released'
                            ? 'bg-emerald-50 text-emerald-600 ring-emerald-100'
                            : 'bg-slate-50 text-slate-400 ring-slate-100'
                          }`}>
                          {payment.status === 'holding' ? <Lock className="h-3 w-3" /> : <CircleCheck className="h-3 w-3" />}
                          {payment.status === 'holding' ? 'Bảo lãnh Escrow' : payment.status === 'released' ? 'Hoàn tất thanh toán' : 'Đã hoàn tiền'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="absolute inset-0 z-[-1] bg-gradient-to-br from-indigo-50/0 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
