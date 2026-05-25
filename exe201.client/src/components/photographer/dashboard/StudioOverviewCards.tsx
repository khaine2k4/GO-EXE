import { BriefcaseBusiness, Camera, Image, Package, Star, Wallet } from 'lucide-react'
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

  const cards = [
    { label: 'Total services', value: dashboard.totalServices, icon: Camera, key: 'services' as OverviewKey },
    { label: 'Active services', value: dashboard.activeServices, icon: Camera, key: 'services' as OverviewKey },
    { label: 'Total packages', value: dashboard.totalPackages, icon: Package, key: 'packages' as OverviewKey },
    { label: 'Portfolio photos', value: totalPortfolios, icon: Image, key: 'portfolio' as OverviewKey },
    { label: 'Total bookings', value: dashboard.totalBookings ?? 0, icon: BriefcaseBusiness, key: 'bookings' as OverviewKey },
    { label: 'Pending bookings', value: dashboard.pendingBookings, icon: BriefcaseBusiness, key: 'bookings' as OverviewKey },
    { label: 'Completed bookings', value: dashboard.completedBookings, icon: BriefcaseBusiness, key: 'bookings' as OverviewKey },
    { label: 'Total revenue', value: formatCompactVnd(revenue), icon: Wallet, key: 'finance' as OverviewKey },
    { label: 'Average rating', value: rating.toFixed(1), icon: Star, key: 'reviews' as OverviewKey },
    { label: 'Total reviews', value: reviews, icon: Star, key: 'reviews' as OverviewKey },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <button
          key={card.label}
          type="button"
          onClick={() => onOpen(card.key)}
          className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">{card.label}</p>
              <p className="mt-2 truncate text-[clamp(1.25rem,1.8vw,1.5rem)] font-black leading-tight text-slate-950">{card.value}</p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-indigo-600 transition group-hover:bg-indigo-50">
              <card.icon className="h-5 w-5" />
            </span>
          </div>
        </button>
      ))}
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
