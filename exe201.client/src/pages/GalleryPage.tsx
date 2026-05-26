import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, MapPin, Search, SlidersHorizontal, Star, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { getCategories } from '../services/categoryApi'
import { getStudios, type StudioSearchParams } from '../services/studioApi'
import type { Category, StudioSummary } from '../services/catalogTypes'

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80'

function formatVnd(value?: number) {
  if (!value) return 'Contact'
  return new Intl.NumberFormat('vi-VN').format(value) + ' VND'
}

export default function GalleryPage() {
  const nav = useNavigate()
  const [studios, setStudios] = useState<StudioSummary[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<StudioSearchParams>({ keyword: '', city: '', categoryId: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load(nextFilters = filters) {
    setLoading(true)
    setError('')
    try {
      const [studioData, categoryData] = await Promise.all([
        getStudios(cleanParams(nextFilters)),
        getCategories(),
      ])
      setStudios(studioData)
      setCategories(categoryData)
    } catch {
      setError('Could not load studios from API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const hasFilter = useMemo(() => Boolean(filters.keyword || filters.city || filters.categoryId), [filters])

  function applyFilters() {
    load(filters)
  }

  function clearFilters() {
    const next: StudioSearchParams = { keyword: '', city: '', categoryId: '' }
    setFilters(next)
    load(next)
  }

  return (
    <div className="space-y-10 pb-20">
      <section className="surface-card p-8 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="text-sm font-semibold uppercase text-[var(--color-azure)]">Studios</div>
          <h1 className="mt-3 text-4xl font-bold text-[var(--color-ink)] md:text-5xl">Explore approved photography studios</h1>
          <p className="mt-4 text-[var(--color-graphite)]">
            Studio data is loaded from the database through the public studios API, including services, categories, portfolio count, rating, and price range.
          </p>
        </div>
      </section>

      <section className="sticky top-20 z-20 rounded-[28px] border border-[var(--color-border)] bg-white/90 p-3 shadow-[0_12px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex h-12 flex-1 items-center gap-3 rounded-full bg-[var(--color-fog)] px-4">
            <Search className="h-5 w-5 shrink-0 text-[var(--color-graphite)]" />
            <input
              value={filters.keyword}
              onChange={(event) => setFilters((prev) => ({ ...prev, keyword: event.target.value }))}
              onKeyDown={(event) => { if (event.key === 'Enter') applyFilters() }}
              placeholder="Search studio, service, category..."
              className="min-w-0 w-full bg-transparent text-sm font-medium text-[var(--color-ink)] outline-none placeholder:text-slate-400"
            />
            {filters.keyword && (
              <button type="button" onClick={() => setFilters((prev) => ({ ...prev, keyword: '' }))} className="rounded-full bg-white p-1 text-[var(--color-graphite)]">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowFilters((value) => !value)} className="secondary-pill h-12 gap-2 px-5 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
            <button type="button" onClick={applyFilters} className="primary-pill h-12 px-6 text-sm font-semibold">Search</button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-3 grid gap-3 border-t border-[var(--color-soft-border)] pt-3 md:grid-cols-[1fr_1fr_auto]">
                <input
                  value={filters.city}
                  onChange={(event) => setFilters((prev) => ({ ...prev, city: event.target.value }))}
                  placeholder="City"
                  className="h-11 rounded-full bg-[var(--color-fog)] px-4 text-sm font-medium outline-none"
                />
                <select
                  value={filters.categoryId}
                  onChange={(event) => setFilters((prev) => ({ ...prev, categoryId: event.target.value ? Number(event.target.value) : '' }))}
                  className="h-11 rounded-full bg-[var(--color-fog)] px-4 text-sm font-medium outline-none"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                {hasFilter && <button type="button" onClick={clearFilters} className="secondary-pill h-11 px-5 text-sm font-semibold">Clear</button>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {loading ? (
        <StateBox text="Loading studios..." />
      ) : error ? (
        <StateBox text={error} />
      ) : studios.length === 0 ? (
        <StateBox text="No approved studio matched your filters." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {studios.map((studio, index) => (
            <motion.div key={studio.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <StudioCard studio={studio} onClick={() => nav(`/photographers/${studio.id}`)} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function StudioCard({ studio, onClick }: { studio: StudioSummary; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group h-full overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={studio.coverUrl || FALLBACK_COVER}
          alt={studio.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(event) => { event.currentTarget.src = FALLBACK_COVER }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="line-clamp-2 text-xl font-semibold text-white">{studio.name}</h2>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white/85">
            <MapPin className="h-4 w-4" />
            {[studio.city, studio.district].filter(Boolean).join(', ') || 'Location updating'}
          </p>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase text-[var(--color-graphite)]">Starting from</div>
            <div className="mt-1 text-lg font-semibold text-[var(--color-ink)]">{formatVnd(studio.minPrice)}</div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {Number(studio.rating ?? 0).toFixed(1)}
            {studio.reviewCount > 0 ? <span className="text-slate-400">({studio.reviewCount})</span> : null}
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-[var(--color-graphite)]">{studio.description || 'View services, portfolio, packages, and reviews from this studio.'}</p>

        <div className="flex flex-wrap gap-2">
          {studio.categories.length > 0 ? studio.categories.slice(0, 3).map((category) => (
            <span key={category} className="rounded-full bg-[var(--color-fog)] px-3 py-1 text-xs font-medium text-[var(--color-slate)]">{category}</span>
          )) : (
            <span className="rounded-full bg-[var(--color-fog)] px-3 py-1 text-xs font-medium text-[var(--color-slate)]">Services updating</span>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--color-soft-border)] pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase text-[var(--color-graphite)]">
            <Camera className="h-3.5 w-3.5" />
            {studio.serviceCount} services · {studio.portfolioCount} portfolio
          </span>
          <span className="secondary-pill h-9 px-4 text-xs font-semibold">View studio</span>
        </div>
      </div>
    </button>
  )
}

function cleanParams(params: StudioSearchParams) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined))
}

function StateBox({ text }: { text: string }) {
  return <div className="surface-card border-dashed p-12 text-center text-sm font-medium text-[var(--color-graphite)]">{text}</div>
}
