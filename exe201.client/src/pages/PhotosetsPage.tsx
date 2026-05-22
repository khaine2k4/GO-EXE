import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { getCategories } from '../services/categoryApi'
import { getServices, type ServiceSearchParams } from '../services/serviceApi'
import type { Category, ServiceSummary } from '../services/catalogTypes'

export default function PhotosetsPage() {
  const initialFilters = useMemo<ServiceSearchParams>(() => {
    const params = new URLSearchParams(window.location.search)
    return {
      keyword: params.get('keyword') ?? '',
      categoryId: params.get('categoryId') ? Number(params.get('categoryId')) : '',
      city: params.get('city') ?? '',
      minPrice: params.get('minPrice') ? Number(params.get('minPrice')) : '',
      maxPrice: params.get('maxPrice') ? Number(params.get('maxPrice')) : '',
    }
  }, [])
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<ServiceSearchParams>(initialFilters)
  const [showFilters, setShowFilters] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData(nextFilters = filters) {
    setLoading(true)
    setError('')
    try {
      const [categoryData, serviceData] = await Promise.all([getCategories(), getServices(cleanParams(nextFilters))])
      setCategories(categoryData)
      setServices(serviceData)
    } catch {
      setError('Could not load services.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(initialFilters)
  }, [])

  const hasFilter = useMemo(
    () => Boolean(filters.keyword || filters.categoryId || filters.city || filters.minPrice || filters.maxPrice),
    [filters]
  )

  function applyFilters() {
    loadData(filters)
  }

  function clearFilters() {
    const next: ServiceSearchParams = { keyword: '', categoryId: '', city: '', minPrice: '', maxPrice: '' }
    setFilters(next)
    loadData(next)
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="surface-card p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--color-azure)]">Photography services</p>
            <h1 className="mt-2 text-4xl font-bold">Search, filter, and compare studios</h1>
            <p className="mt-3 max-w-2xl text-[var(--color-graphite)]">
              Browse active public services from the marketplace API with real categories, prices, ratings, and studio profiles.
            </p>
          </div>
          <button type="button" onClick={() => setShowFilters((value) => !value)} className="secondary-pill h-11 gap-2 px-5 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="rounded-[28px] border border-[var(--color-border)] bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
          <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
            <label className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-[var(--color-graphite)]" />
              <input
                value={filters.keyword}
                onChange={(event) => setFilters((prev) => ({ ...prev, keyword: event.target.value }))}
                placeholder="Search service, studio, or category"
                className="h-11 w-full rounded-full border border-[var(--color-border)] pl-10 pr-4 text-sm font-medium outline-none focus:border-[var(--color-azure)]"
              />
            </label>
            <select
              value={filters.categoryId}
              onChange={(event) => setFilters((prev) => ({ ...prev, categoryId: event.target.value ? Number(event.target.value) : '' }))}
              className="h-11 rounded-full border border-[var(--color-border)] px-4 text-sm font-medium outline-none focus:border-[var(--color-azure)]"
            >
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <input value={filters.city} onChange={(event) => setFilters((prev) => ({ ...prev, city: event.target.value }))} placeholder="City" className="h-11 rounded-full border border-[var(--color-border)] px-4 text-sm font-medium outline-none focus:border-[var(--color-azure)]" />
            <input type="number" value={filters.minPrice} onChange={(event) => setFilters((prev) => ({ ...prev, minPrice: event.target.value ? Number(event.target.value) : '' }))} placeholder="Min price" className="h-11 rounded-full border border-[var(--color-border)] px-4 text-sm font-medium outline-none focus:border-[var(--color-azure)]" />
            <input type="number" value={filters.maxPrice} onChange={(event) => setFilters((prev) => ({ ...prev, maxPrice: event.target.value ? Number(event.target.value) : '' }))} placeholder="Max price" className="h-11 rounded-full border border-[var(--color-border)] px-4 text-sm font-medium outline-none focus:border-[var(--color-azure)]" />
            <div className="flex gap-2">
              <button type="button" onClick={applyFilters} className="primary-pill h-11 px-5 text-sm font-semibold">Apply</button>
              {hasFilter && (
                <button type="button" onClick={clearFilters} className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-graphite)]">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <StateBox text="Loading services..." />
      ) : error ? (
        <StateBox text={error} />
      ) : services.length === 0 ? (
        <StateBox text="No matching service found." />
      ) : (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 2xl:columns-4">
          {services.map((service) => (
            <Link
              key={service.id}
              to={`/photosets/${service.id}`}
              className="group mb-5 block break-inside-avoid"
            >
              <article className="overflow-hidden rounded-[20px] bg-white">
                <div className="relative overflow-hidden rounded-[20px] bg-slate-100">
                  {service.thumbnailUrl ? (
                    <img
                      src={service.thumbnailUrl}
                      alt={service.name}
                      className="w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex aspect-[3/4] items-center justify-center text-sm font-medium text-slate-400">
                      No image
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/25" />

                  <div className="absolute left-3 top-3 opacity-0 transition duration-300 group-hover:opacity-100">
                    <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[var(--color-graphite)]">
                      {service.categoryName}
                    </span>
                  </div>

                  <div className="absolute right-3 top-3 opacity-0 transition duration-300 group-hover:opacity-100">
                    <span className="rounded-full bg-[#e60023] px-4 py-2 text-sm font-semibold text-white">
                      View
                    </span>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 translate-y-3 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <h2 className="line-clamp-2 text-base font-semibold text-white">
                      {service.name}
                    </h2>
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs font-medium text-white/90">
                      <span className="line-clamp-1">{service.studioName}</span>
                      <span className="shrink-0">
                        {service.rating ? `★ ${Number(service.rating).toFixed(1)}` : 'New'}
                      </span>
                    </div>
                  </div>
                </div>

              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function cleanParams(params: ServiceSearchParams) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined))
}

function StateBox({ text }: { text: string }) {
  return <div className="surface-card border-dashed p-12 text-center text-sm font-medium text-[var(--color-graphite)]">{text}</div>
}
