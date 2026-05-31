import { BriefcaseBusiness, Camera, Image, Star, Wallet, ArrowUpRight } from 'lucide-react'
import type { StudioDashboard } from '../../../services/catalogTypes'

type OverviewKey = 'services' | 'packages' | 'portfolio' | 'bookings' | 'finance' | 'reviews'

export default function StudioOverviewCards({
  dashboard,
  onOpen,
}: {
  dashboard: StudioDashboard
  onOpen: (key: OverviewKey) => void
}) {
  const totalPortfolios = dashboard.totalPortfolios ?? dashboard.portfolioImages ?? 0
  const revenue = dashboard.totalRevenue ?? dashboard.grossRevenue ?? 0
  const rating = dashboard.avgRating ?? dashboard.rating ?? 0
  const reviews = dashboard.totalReviews ?? dashboard.reviewCount ?? 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* CARD 1: REVENUE */}
      <button
        type="button"
        onClick={() => onOpen('finance')}
        className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
      >
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-indigo-500/5 blur-2xl group-hover:bg-indigo-500/10 transition-all duration-300" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Doanh thu Studio</span>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors duration-300 group-hover:bg-indigo-600 group-hover:text-white">
            <Wallet className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-black tracking-tight text-slate-900 leading-none">{formatCompactVnd(revenue)}</h3>
          <p className="mt-3 text-xs font-semibold text-slate-400 flex items-center gap-1">
            Tổng thu nhập tích lũy <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
          </p>
        </div>
      </button>

      {/* CARD 2: BOOKINGS */}
      <button
        type="button"
        onClick={() => onOpen('bookings')}
        className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
      >
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đơn đặt lịch</span>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-colors duration-300 group-hover:bg-emerald-600 group-hover:text-white">
            <BriefcaseBusiness className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-black tracking-tight text-slate-900 leading-none">{dashboard.totalBookings ?? 0} Đơn</h3>
          <div className="mt-2.5 flex items-center gap-2 text-[10px] font-black tracking-wide">
            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100/50">{dashboard.pendingBookings} Chờ duyệt</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/50">{dashboard.completedBookings} Đã xong</span>
          </div>
        </div>
      </button>

      {/* CARD 3: SERVICES & PACKAGES */}
      <button
        type="button"
        onClick={() => onOpen('services')}
        className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
      >
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-blue-500/5 blur-2xl group-hover:bg-blue-500/10 transition-all duration-300" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dịch vụ & Gói</span>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white">
            <Camera className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-black tracking-tight text-slate-900 leading-none">{dashboard.totalPackages} Gói chụp</h3>
          <p className="mt-3 text-xs font-semibold text-slate-400">
            Có <span className="font-extrabold text-blue-600">{dashboard.activeServices}</span> / <span className="font-extrabold text-slate-600">{dashboard.totalServices}</span> dịch vụ hoạt động
          </p>
        </div>
      </button>

      {/* CARD 4: REVIEWS & PORTFOLIO */}
      <button
        type="button"
        onClick={() => onOpen('reviews')}
        className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg"
      >
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-amber-500/5 blur-2xl group-hover:bg-amber-500/10 transition-all duration-300" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đánh giá & Hồ sơ</span>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition-colors duration-300 group-hover:bg-amber-600 group-hover:text-white">
            <Star className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-black tracking-tight text-slate-900 leading-none flex items-center gap-1.5">
            {rating.toFixed(1)} <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          </h3>
          <p className="mt-3 text-xs font-semibold text-slate-400">
            <span className="font-extrabold text-slate-700">{reviews}</span> đánh giá • <span className="font-extrabold text-slate-700">{totalPortfolios}</span> ảnh hồ sơ
          </p>
        </div>
      </button>
    </div>
  )
}

function formatCompactVnd(value: number) {
  if (value >= 1_000_000_000) return `${trim(value / 1_000_000_000)}B VND`
  if (value >= 1_000_000) return `${trim(value / 1_000_000)}M VND`
  if (value >= 1_000) return `${trim(value / 1_000)}K VND`
  return `${new Intl.NumberFormat('vi-VN').format(value)} VND`
}

function trim(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
