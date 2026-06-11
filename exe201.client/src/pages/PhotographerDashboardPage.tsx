import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { getBookings, type BookingDto } from '../services/bookingApi'
import type { PackageItem, PortfolioItem, ReviewItem, ServiceSummary, StudioDashboard } from '../services/catalogTypes'
import { getStudioPackages } from '../services/packageApi'
import { getStudioPortfolios } from '../services/portfolioApi'
import { getStudioServices } from '../services/serviceApi'
import { getStudioDashboard } from '../services/studioApi'
import { getStudioSettlements } from '../services/settlementApi'
import { getStudioRevenue, type StudioRevenue } from '../services/studioRevenueApi'
import { getStudioReviews } from '../services/reviewApi'
import StudioOverviewCards from '../components/photographer/dashboard/StudioOverviewCards'
import RecentServices from '../components/photographer/dashboard/RecentServices'
import RecentPackages from '../components/photographer/dashboard/RecentPackages'
import PortfolioPreview from '../components/photographer/dashboard/PortfolioPreview'
import BookingSummary from '../components/photographer/dashboard/BookingSummary'
import RevenueSummary from '../components/photographer/dashboard/RevenueSummary'
import RatingSummary from '../components/photographer/dashboard/RatingSummary'
import ServiceManager from '../components/photographer/management/ServiceManager'
import PackageManager from '../components/photographer/management/PackageManager'
import PortfolioManager from '../components/photographer/management/PortfolioManager'
import BookingManager from '../components/photographer/management/BookingManager'
import FinanceManager from '../components/photographer/management/FinanceManager'
import PhotographerProfileManager from '../components/photographer/management/PhotographerProfileManager'
import ScheduleManager from '../components/photographer/management/ScheduleManager'
import ReviewManager from '../components/photographer/management/ReviewManager'
import StudioAnalyticsManager from '../components/photographer/management/StudioAnalyticsManager'

type DashboardTab = 'overview' | 'manage' | 'content' | 'bookings' | 'finance' | 'analytics'

export default function PhotographerDashboardPage() {
  const [params, setParams] = useSearchParams()
  const activeTab = normalizeTab(params.get('tab'))
  const section = params.get('section') ?? ''
  const intent = params.get('intent')

  const [dashboard, setDashboard] = useState<StudioDashboard | null>(null)
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [bookings, setBookings] = useState<BookingDto[]>([])
  const [revenue, setRevenue] = useState<StudioRevenue | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [readySettlement, setReadySettlement] = useState(0)
  const [selectedBooking, setSelectedBooking] = useState<BookingDto | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadOverview = useCallback(async () => {
    setLoading(true)
    const [dashboardResult, serviceResult, packageResult, portfolioResult, bookingResult, revenueResult, settlementResult] = await Promise.allSettled([
      getStudioDashboard(),
      getStudioServices(),
      getStudioPackages(),
      getStudioPortfolios(),
      getBookings(),
      getStudioRevenue(),
      getStudioSettlements({ status: 'READY' }),
    ])
    if (dashboardResult.status === 'fulfilled') setDashboard(dashboardResult.value)
    if (serviceResult.status === 'fulfilled') setServices(serviceResult.value)
    if (packageResult.status === 'fulfilled') setPackages(packageResult.value)
    if (portfolioResult.status === 'fulfilled') setPortfolio(portfolioResult.value)
    if (bookingResult.status === 'fulfilled') setBookings(bookingResult.value)
    if (revenueResult.status === 'fulfilled') setRevenue(revenueResult.value)
    if (settlementResult.status === 'fulfilled') setReadySettlement(settlementResult.value.reduce((sum, item) => sum + item.studioAmount, 0))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!revenue?.studioId) return
    getStudioReviews(revenue.studioId)
      .then(setReviews)
      .catch(() => setReviews([]))
  }, [revenue?.studioId])

  useEffect(() => { loadOverview() }, [loadOverview, refreshKey])

  const reviewCount = reviews.length
  const rating = reviewCount > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : 0
  const dashboardWithLiveReviews = useMemo(() => {
    if (!dashboard) return null
    return {
      ...dashboard,
      avgRating: rating,
      rating,
      totalReviews: reviewCount,
      reviewCount,
    }
  }, [dashboard, rating, reviewCount])

  function selectTab(tab: DashboardTab, nextIntent?: string, nextSection?: string) {
    const next = new URLSearchParams()
    if (tab !== 'overview') next.set('tab', tab)
    if (nextSection) next.set('section', nextSection)
    if (nextIntent) next.set('intent', nextIntent)
    setParams(next)
  }

  function refreshAll() {
    setRefreshKey((value) => value + 1)
  }

  function openBookingDetail(booking: BookingDto) {
    setSelectedBooking(booking)
    selectTab('bookings')
  }

  function openPackageEdit(item: PackageItem) {
    setSelectedPackage(item)
    selectTab('manage', undefined, 'packages')
  }

  const manageSection = section === 'packages' || section === 'schedule' ? section : 'services'
  const contentSection = section === 'profile' || section === 'reviews' ? section : 'portfolio'

  return (
    <div className="space-y-6 pb-20">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-900 bg-slate-950 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 translate-y-12 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-300">
              ⚡ BẢNG ĐIỀU KHIỂN CHUYÊN NGHIỆP
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white">Quản lý Studio ở một nơi duy nhất</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-400">
              Xem tổng quan hoạt động kinh doanh, sau đó quản lý dịch vụ, gói dịch vụ, đơn đặt lịch, doanh thu và hồ sơ năng lực nhanh chóng, hiệu quả.
            </p>
          </div>
          <Link to="/photosets" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-black uppercase tracking-widest px-5 shadow-lg active:scale-95 transition duration-150">
            <BarChart3 className="h-4 w-4" /> Xem thị trường
          </Link>
        </div>
      </section>

      {loading && !dashboard ? <StateBox text="Đang tải dữ liệu bảng điều khiển..." /> : activeTab === 'overview' ? (
        <>
          {dashboardWithLiveReviews && <StudioOverviewCards dashboard={dashboardWithLiveReviews} onOpen={(key) => {
            if (key === 'services') selectTab('manage', undefined, 'services')
            else if (key === 'packages') selectTab('manage', undefined, 'packages')
            else if (key === 'portfolio') selectTab('content', undefined, 'portfolio')
            else if (key === 'reviews') selectTab('content', undefined, 'reviews')
            else selectTab(key)
          }} />}
          <div className="grid gap-6 xl:grid-cols-2">
            <RecentServices services={services} onCreate={() => selectTab('manage', 'create', 'services')} onManage={() => selectTab('manage', undefined, 'services')} onChanged={refreshAll} />
            <RecentPackages packages={packages} onCreate={() => selectTab('manage', 'create', 'packages')} onManage={() => selectTab('manage', undefined, 'packages')} onEdit={openPackageEdit} onChanged={refreshAll} />
            <PortfolioPreview items={portfolio} onAdd={() => selectTab('content', 'create', 'portfolio')} onManage={() => selectTab('content', undefined, 'portfolio')} />
            <BookingSummary bookings={bookings} onManage={() => selectTab('bookings')} onDetail={openBookingDetail} />
            <RevenueSummary revenue={revenue} pendingPayout={readySettlement} onManage={() => selectTab('finance')} />
            <RatingSummary rating={rating} reviews={reviews} totalReviews={reviewCount} onManage={() => selectTab('content', undefined, 'reviews')} />
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {activeTab === 'manage' && (
            <>
              <SubTabs
                items={[
                  { key: 'services', label: 'Dịch vụ' },
                  { key: 'packages', label: 'Gói chụp' },
                  { key: 'schedule', label: 'Lịch biểu' },
                ]}
                active={manageSection}
                onChange={(value) => selectTab('manage', undefined, value)}
              />
              {manageSection === 'services' && <ServiceManager refreshKey={refreshKey} initialCreate={intent === 'create'} onChanged={refreshAll} />}
              {manageSection === 'packages' && <PackageManager initialCreate={intent === 'create'} initialEdit={selectedPackage} onChanged={refreshAll} />}
              {manageSection === 'schedule' && <ScheduleManager />}
            </>
          )}
          {activeTab === 'bookings' && <BookingManager initialBooking={selectedBooking} onChanged={refreshAll} />}
          {activeTab === 'finance' && <FinanceManager />}
          {activeTab === 'analytics' && <StudioAnalyticsManager />}
          {activeTab === 'content' && (
            <>
              <SubTabs
                items={[
                  { key: 'portfolio', label: 'Hồ sơ năng lực' },
                  { key: 'profile', label: 'Hồ sơ cá nhân' },
                  { key: 'reviews', label: 'Đánh giá' },
                ]}
                active={contentSection}
                onChange={(value) => selectTab('content', undefined, value)}
              />
              {contentSection === 'portfolio' && <PortfolioManager initialCreate={intent === 'create'} onChanged={refreshAll} />}
              {contentSection === 'profile' && <PhotographerProfileManager />}
              {contentSection === 'reviews' && <ReviewManager rating={rating} totalReviews={reviewCount} reviews={reviews} />}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function normalizeTab(value: string | null): DashboardTab {
  if (value === 'manage' || value === 'content' || value === 'bookings' || value === 'finance' || value === 'analytics') return value
  if (value === 'services' || value === 'packages' || value === 'schedule') return 'manage'
  if (value === 'portfolio' || value === 'reviews' || value === 'profile') return 'content'
  return 'overview'
}

function StateBox({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-500">{text}</div>
}

function SubTabs({ items, active, onChange }: { items: { key: string; label: string }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`h-10 rounded-xl px-4 text-xs font-black uppercase tracking-widest ${active === item.key ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
