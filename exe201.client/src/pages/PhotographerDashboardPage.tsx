import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Image, Package, Star, Wallet } from 'lucide-react'
import { getStudioDashboard } from '../services/studioApi'
import type { StudioDashboard } from '../services/catalogTypes'

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' VND'
}

export default function PhotographerDashboardPage() {
  const [dashboard, setDashboard] = useState<StudioDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getStudioDashboard()
      .then(setDashboard)
      .catch(() => setError('Khong the tai dashboard studio.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <StateBox text="Dang tai dashboard..." />
  if (error || !dashboard) return <StateBox text={error || 'Khong co du lieu dashboard.'} />

  const totalPortfolios = dashboard.totalPortfolios ?? dashboard.portfolioImages ?? 0
  const revenue = dashboard.totalRevenue ?? dashboard.grossRevenue ?? 0
  const rating = dashboard.avgRating ?? dashboard.rating ?? 0
  const reviews = dashboard.totalReviews ?? dashboard.reviewCount ?? 0

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Studio dashboard</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Tong quan hoat dong</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">So lieu lay truc tiep tu /api/studio/dashboard.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/photographer/services" className="rounded-xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-widest text-white">Services</Link>
          <Link to="/photographer/packages" className="rounded-xl bg-indigo-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white">Packages</Link>
          <Link to="/photographer/portfolio" className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700">Portfolio</Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Tong services" value={dashboard.totalServices} icon={<Camera className="h-5 w-5" />} />
        <Metric label="Services active" value={dashboard.activeServices} icon={<Camera className="h-5 w-5" />} />
        <Metric label="Packages" value={dashboard.totalPackages} icon={<Package className="h-5 w-5" />} />
        <Metric label="Portfolio" value={totalPortfolios} icon={<Image className="h-5 w-5" />} />
        <Metric label="Bookings" value={dashboard.totalBookings ?? 0} icon={<Camera className="h-5 w-5" />} />
        <Metric label="Pending" value={dashboard.pendingBookings} icon={<Camera className="h-5 w-5" />} />
        <Metric label="Completed" value={dashboard.completedBookings} icon={<Camera className="h-5 w-5" />} />
        <Metric label="Doanh thu" value={formatVnd(revenue)} icon={<Wallet className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-xl font-black text-slate-950">Services gan day</h2>
          {dashboard.recentServices?.length ? (
            <div className="space-y-3">
              {dashboard.recentServices.map((service) => (
                <Link key={service.id} to={`/photosets/${service.id}`} className="flex items-center justify-between rounded-xl border border-slate-100 p-4 hover:bg-slate-50">
                  <div>
                    <div className="font-black text-slate-950">{service.name}</div>
                    <div className="text-sm font-semibold text-slate-500">{service.categoryName}</div>
                  </div>
                  <span className={service.isActive ? 'text-emerald-600 font-black text-sm' : 'text-slate-400 font-black text-sm'}>{service.isActive ? 'Active' : 'Inactive'}</span>
                </Link>
              ))}
            </div>
          ) : <StateBox text="Chua co service." compact />}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-xl font-black text-slate-950">Packages gan day</h2>
          {dashboard.recentPackages?.length ? (
            <div className="space-y-3">
              {dashboard.recentPackages.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                  <div>
                    <div className="font-black text-slate-950">{item.name}</div>
                    <div className="text-sm font-semibold text-slate-500">{item.isActive ? 'Active' : 'Inactive'}</div>
                  </div>
                  <span className="font-black text-indigo-600">{formatVnd(item.price)}</span>
                </div>
              ))}
            </div>
          ) : <StateBox text="Chua co package." compact />}
        </section>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          <span className="font-black text-slate-950">Rating {rating} / {reviews} reviews</span>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">{icon}</div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  )
}

function StateBox({ text, compact = false }: { text: string; compact?: boolean }) {
  return <div className={`rounded-2xl border border-dashed border-slate-200 bg-white text-center text-sm font-bold text-slate-500 ${compact ? 'p-6' : 'p-12'}`}>{text}</div>
}
