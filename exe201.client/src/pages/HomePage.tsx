import { ArrowRight, Camera, CheckCircle2, MapPin, Search, Shield, Sparkles, Star, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../api/axios'
import { getCategories } from '../services/categoryApi'
import { getServices } from '../services/serviceApi'
import type { Category, ServiceSummary } from '../services/catalogTypes'

const BENEFITS = [
  { icon: CheckCircle2, title: 'Verified studios', desc: 'Approved profiles with real contact and portfolio data.' },
  { icon: Camera, title: 'Real portfolios', desc: 'Large images help customers compare styles before booking.' },
  { icon: Shield, title: 'Clear packages', desc: 'Visible price, rating, category, and booking request flow.' },
]

const QUICK_FILTERS = ['Wedding', 'Portrait', 'Event', 'Product', 'Da Nang', 'Under 1M']

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=900&q=80',
]

type HomeData = {
  stats: { approvedStudiosCount: number; totalBookingsCount: number; avgRating: number }
  featuredStudios: Array<{ id: number; name: string; city: string; rating: number; reviewCount: number; coverUrl: string }>
}

export default function HomePage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [city, setCity] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [homeData, setHomeData] = useState<HomeData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([api.get('/public/home-data'), getCategories(), getServices()])
      .then(([homeResult, categoryResult, serviceResult]) => {
        if (homeResult.status === 'fulfilled') setHomeData(homeResult.value.data)
        if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value)
        if (serviceResult.status === 'fulfilled') setServices(serviceResult.value)
      })
      .finally(() => setLoading(false))
  }, [])

  const stats = homeData?.stats
  const hasRealStats = Boolean(
    stats &&
    (stats.approvedStudiosCount > 0 || stats.totalBookingsCount > 0 || stats.avgRating > 0)
  )

  const featuredServices = useMemo(() => {
    const norm = keyword.trim().toLowerCase()
    return services
      .filter((service) => !norm || `${service.name} ${service.studioName} ${service.city} ${service.categoryName}`.toLowerCase().includes(norm))
      .slice(0, 6)
  }, [keyword, services])

  const heroImages = useMemo(() => {
    const apiImages = services.map((service) => service.thumbnailUrl).filter(Boolean) as string[]
    return [...apiImages, ...FALLBACK_IMAGES].slice(0, 4)
  }, [services])

  function submitSearch() {
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('keyword', keyword.trim())
    if (city.trim()) params.set('city', city.trim())
    if (categoryId) params.set('categoryId', categoryId)
    if (maxPrice) params.set('maxPrice', maxPrice)
    navigate(`/photosets${params.toString() ? `?${params.toString()}` : ''}`)
  }

  function applyQuickFilter(value: string) {
    if (value === 'Da Nang') {
      setCity('Da Nang')
      return
    }
    if (value === 'Under 1M') {
      setMaxPrice('1000000')
      return
    }
    setKeyword(value)
  }

  return (
    <div className="space-y-20 pb-16">
      <section className="relative overflow-hidden rounded-[28px] bg-[var(--color-fog)] px-0 py-10 md:py-14">
        <div className="grid items-center gap-10 xl:grid-cols-[1fr_0.95fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[var(--color-slate)] shadow-sm ring-1 ring-[var(--color-border)]">
              <Sparkles className="h-4 w-4 text-[var(--color-azure)]" />
              Photography studio booking marketplace
            </div>

            <div>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl text-[44px] font-bold leading-[1.04] text-[var(--color-ink)] sm:text-[56px] lg:text-[72px]"
              >
                Find the right studio for every moment.
              </motion.h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-graphite)]">
                Browse approved studios with real portfolios, packages, prices, and customer ratings.
              </p>
            </div>

            <div className="rounded-[28px] border border-[var(--color-border)] bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
              <div className="grid gap-3 lg:grid-cols-[minmax(190px,1.35fr)_minmax(120px,0.8fr)_minmax(145px,0.85fr)_minmax(120px,0.7fr)_auto] lg:items-center">
                <label className="flex h-12 items-center gap-3 rounded-full bg-[var(--color-fog)] px-4">
                  <Search className="h-5 w-5 shrink-0 text-[var(--color-graphite)]" />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Studio, service, style"
                    className="min-w-0 w-full bg-transparent text-sm font-medium text-[var(--color-ink)] outline-none placeholder:text-slate-400"
                  />
                </label>
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="City"
                  className="h-12 rounded-full bg-[var(--color-fog)] px-4 text-sm font-medium outline-none placeholder:text-slate-400"
                />
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="h-12 rounded-full bg-[var(--color-fog)] px-4 text-sm font-medium outline-none"
                >
                  <option value="">Category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                <select value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className="h-12 rounded-full bg-[var(--color-fog)] px-4 text-sm font-medium outline-none">
                  <option value="">Price</option>
                  <option value="1000000">Under 1M</option>
                  <option value="3000000">Under 3M</option>
                  <option value="5000000">Under 5M</option>
                </select>
                <button type="button" onClick={submitSearch} className="primary-pill h-12 gap-2 px-6 text-sm font-semibold">
                  Search
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 px-1">
                {QUICK_FILTERS.map((item) => (
                  <button key={item} type="button" onClick={() => applyQuickFilter(item)} className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-slate)] hover:border-[var(--color-azure)] hover:text-[var(--color-azure)]">
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {hasRealStats ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat value={String(stats?.approvedStudiosCount ?? 0)} label="Approved studios" />
                <Stat value={String(stats?.totalBookingsCount ?? 0)} label="Bookings" />
                <Stat value={(stats?.avgRating ?? 0).toFixed(1)} label="Average rating" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {BENEFITS.map((item) => (
                  <Benefit key={item.title} icon={item.icon} title={item.title} />
                ))}
              </div>
            )}
          </div>

          <HeroCollage images={heroImages} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {BENEFITS.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="surface-card p-6"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-fog)] text-[var(--color-ink)]">
              <step.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-xl font-semibold">{step.title}</h2>
            <p className="mt-3 leading-7 text-[var(--color-graphite)]">{step.desc}</p>
          </motion.div>
        ))}
      </section>

      <section className="space-y-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="text-sm font-semibold uppercase text-[var(--color-azure)]">Featured services</div>
            <h2 className="mt-2 text-4xl font-bold">Explore trusted photography studios</h2>
            <p className="mt-3 max-w-2xl text-[var(--color-graphite)]">
              Browse approved studios with real portfolios, packages, prices, and customer ratings.
            </p>
          </div>
          <Link to="/photosets" className="primary-pill h-11 gap-2 px-5 text-sm font-semibold">
            Explore services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="surface-card p-12 text-center text-sm font-medium text-[var(--color-graphite)]">Loading featured services...</div>
        ) : featuredServices.length === 0 ? (
          <div className="surface-card border-dashed py-20 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <div className="mt-4 font-semibold text-[var(--color-graphite)]">No matching service found.</div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((service) => (
              <ServiceCard key={service.id} service={service} onClick={() => navigate(`/photosets/${service.id}`)} />
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-[28px] bg-black p-8 text-white sm:p-10">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="text-sm font-semibold uppercase text-white/70">For studios</div>
            <h2 className="mt-3 max-w-3xl text-3xl font-bold text-white sm:text-4xl">
              Manage services, packages, portfolio, bookings, and revenue in one clean dashboard.
            </h2>
          </div>
          <Link to="/register" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-slate-100">
            Register your studio
          </Link>
        </div>
      </section>
    </div>
  )
}

function HeroCollage({ images }: { images: string[] }) {
  return (
    <div className="grid min-h-[520px] grid-cols-[1.15fr_0.85fr] grid-rows-6 gap-4">
      <SafeImage src={images[0]} fallback={FALLBACK_IMAGES[0]} alt="Wedding photography service" className="row-span-6 h-full w-full rounded-[28px] object-cover" />
      <SafeImage src={images[1]} fallback={FALLBACK_IMAGES[1]} alt="Portrait studio session" className="row-span-2 h-full w-full rounded-[28px] object-cover" />
      <SafeImage src={images[2]} fallback={FALLBACK_IMAGES[2]} alt="Event photography booking" className="row-span-2 h-full w-full rounded-[28px] object-cover" />
      <div className="relative row-span-2 overflow-hidden rounded-[28px] bg-black">
        <SafeImage src={images[3]} fallback={FALLBACK_IMAGES[3]} alt="Product photography studio" className="h-full w-full object-cover opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 rounded-[20px] border border-white/20 bg-white/15 p-4 text-white backdrop-blur-xl">
          <div className="text-xs font-semibold uppercase text-white/75">Booking request</div>
          <div className="mt-1 text-base font-semibold leading-snug text-white">Pick a package and wait for studio confirmation.</div>
        </div>
      </div>
    </div>
  )
}

function ServiceCard({ service, onClick }: { service: ServiceSummary; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]">
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <SafeImage src={service.thumbnailUrl || FALLBACK_IMAGES[0]} fallback={FALLBACK_IMAGES[0]} alt={service.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-2 text-xl font-semibold text-[var(--color-ink)]">{service.name}</h3>
            <p className="mt-1 text-sm font-medium text-[var(--color-graphite)]">{service.studioName}</p>
          </div>
          <span className="rounded-full bg-[var(--color-fog)] px-3 py-1 text-xs font-semibold text-[var(--color-slate)]">{service.categoryName}</span>
        </div>
        <p className="line-clamp-2 text-sm text-[var(--color-graphite)]">{service.description || 'View portfolio, packages, and booking details for this service.'}</p>
        <div className="flex items-center justify-between border-t border-[var(--color-soft-border)] pt-4">
          <span className="text-sm font-semibold text-[var(--color-azure)]">From {formatVnd(service.minPrice)}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-slate)]">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {service.rating?.toFixed?.(1) ?? service.rating} ({service.reviewCount})
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase text-[var(--color-graphite)]">
            <MapPin className="h-3.5 w-3.5" />
            {service.city || 'Da Nang'}
          </span>
          <span className="secondary-pill h-9 px-4 text-xs font-semibold">View details</span>
        </div>
      </div>
    </button>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--color-border)] bg-white p-5">
      <div className="flex items-center gap-2 text-2xl font-bold text-[var(--color-ink)]">
        {label.toLowerCase().includes('rating') ? <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> : <MapPin className="h-5 w-5 text-[var(--color-azure)]" />}
        {value}
      </div>
      <div className="mt-1 text-sm font-medium text-[var(--color-graphite)]">{label}</div>
    </div>
  )
}

function Benefit({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--color-border)] bg-white p-5">
      <Icon className="h-5 w-5 text-[var(--color-azure)]" />
      <div className="mt-3 text-sm font-semibold text-[var(--color-ink)]">{title}</div>
    </div>
  )
}

function SafeImage({ src, fallback, alt, className }: { src: string; fallback: string; alt: string; className: string }) {
  return <img src={src || fallback} alt={alt} className={className} loading="lazy" onError={(event) => { event.currentTarget.src = fallback }} />
}

function formatVnd(value?: number) {
  if (!value) return 'Contact'
  return new Intl.NumberFormat('vi-VN').format(value) + ' VND'
}
