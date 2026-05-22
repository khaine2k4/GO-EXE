import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, Star, X } from 'lucide-react'
import { getCategories } from '../services/categoryApi'
import { getServices, type ServiceSearchParams } from '../services/serviceApi'
import type { Category, ServiceSummary } from '../services/catalogTypes'

function formatVnd(value?: number) {
  if (!value) return 'Lien he'
  return new Intl.NumberFormat('vi-VN').format(value) + ' VND'
}

export default function PhotosetsPage() {
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<ServiceSearchParams>({ keyword: '', categoryId: '', city: '', minPrice: '', maxPrice: '' })
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
      setError('Khong the tai danh sach dich vu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
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
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Dich vu chup anh</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Tim, loc va so sanh studio</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">Du lieu lay truc tiep tu API services, categories va packages.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-black uppercase tracking-widest text-white"
          >
            <SlidersHorizontal className="h-4 w-4" /> Bo loc
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
            <label className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                value={filters.keyword}
                onChange={(event) => setFilters((prev) => ({ ...prev, keyword: event.target.value }))}
                placeholder="Tim ten dich vu, studio, danh muc..."
                className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm font-semibold outline-none focus:border-indigo-500"
              />
            </label>
            <select
              value={filters.categoryId}
              onChange={(event) => setFilters((prev) => ({ ...prev, categoryId: event.target.value ? Number(event.target.value) : '' }))}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-indigo-500"
            >
              <option value="">Tat ca danh muc</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <input
              value={filters.city}
              onChange={(event) => setFilters((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="Thanh pho"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-indigo-500"
            />
            <input
              type="number"
              value={filters.minPrice}
              onChange={(event) => setFilters((prev) => ({ ...prev, minPrice: event.target.value ? Number(event.target.value) : '' }))}
              placeholder="Gia tu"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-indigo-500"
            />
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(event) => setFilters((prev) => ({ ...prev, maxPrice: event.target.value ? Number(event.target.value) : '' }))}
              placeholder="Gia den"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <button type="button" onClick={applyFilters} className="h-11 rounded-xl bg-indigo-600 px-4 text-xs font-black uppercase tracking-widest text-white">Loc</button>
              {hasFilter && (
                <button type="button" onClick={clearFilters} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <StateBox text="Dang tai dich vu..." />
      ) : error ? (
        <StateBox text={error} />
      ) : services.length === 0 ? (
        <StateBox text="Khong co dich vu phu hop." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <Link key={service.id} to={`/photosets/${service.id}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
              <div className="aspect-[4/3] bg-slate-100">
                {service.thumbnailUrl ? (
                  <img src={service.thumbnailUrl} alt={service.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">No image</div>
                )}
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="line-clamp-2 text-lg font-black text-slate-950">{service.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{service.studioName}</p>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase text-indigo-700">{service.categoryName}</span>
                </div>
                <p className="line-clamp-2 text-sm text-slate-500">{service.description || 'Chua co mo ta.'}</p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-sm font-black text-indigo-600">Tu {formatVnd(service.minPrice)}</span>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-600">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {service.rating?.toFixed?.(1) ?? service.rating} ({service.reviewCount})
                  </span>
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{service.city || 'Da Nang'}</div>
              </div>
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
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-500">{text}</div>
}
