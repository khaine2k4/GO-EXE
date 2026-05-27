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
  const [visibleCount, setVisibleCount] = useState(12)

  async function loadData(nextFilters = filters) {
    setLoading(true)
    setError('')
    try {
      const [categoryData, serviceData] = await Promise.all([getCategories(), getServices(cleanParams(nextFilters))])
      setCategories(categoryData)
      setServices(serviceData)
    } catch {
      setError('Không tải được danh sách dịch vụ.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(initialFilters)
  }, [])

  const hasFilter = useMemo(
    () => Boolean(filters.keyword || filters.categoryId || filters.minPrice || filters.maxPrice),
    [filters]
  )

  const visibleServices = services.slice(0, visibleCount)

  function applyFilters() {
    setVisibleCount(12)
    loadData(filters)
  }

  function clearFilters() {
    const next: ServiceSearchParams = { keyword: '', categoryId: '', minPrice: '', maxPrice: '' }
    setFilters(next)
    setVisibleCount(12)
    loadData(next)
  }

  function setPriceRange(value: string) {
    const ranges: Record<string, Pick<ServiceSearchParams, 'minPrice' | 'maxPrice'>> = {
      '0-1000000': { minPrice: '', maxPrice: 1000000 },
      '1000000-3000000': { minPrice: 1000000, maxPrice: 3000000 },
      '3000000-5000000': { minPrice: 3000000, maxPrice: 5000000 },
      '5000000-': { minPrice: 5000000, maxPrice: '' },
    }
    setFilters((prev) => ({ ...prev, ...(ranges[value] ?? { minPrice: '', maxPrice: '' }) }))
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="surface-card p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--color-azure)]">Dịch vụ chụp ảnh</p>
            <h1 className="mt-2 text-4xl font-bold">Tìm kiếm, lọc và so sánh studio</h1>
            <p className="mt-3 max-w-2xl text-[var(--color-graphite)]">
              Xem dịch vụ đang hoạt động với danh mục, giá, đánh giá và hồ sơ studio từ hệ thống.
            </p>
          </div>
          <button type="button" onClick={() => setShowFilters((value) => !value)} className="secondary-pill h-11 gap-2 px-5 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="rounded-[28px] border border-[var(--color-border)] bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
          <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
            <label className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-[var(--color-graphite)]" />
              <input
                value={filters.keyword}
                onChange={(event) => setFilters((prev) => ({ ...prev, keyword: event.target.value }))}
                placeholder="Tìm dịch vụ, studio, danh mục hoặc khu vực"
                className="h-11 w-full rounded-full border border-[var(--color-border)] pl-10 pr-4 text-sm font-medium outline-none focus:border-[var(--color-azure)]"
              />
            </label>
            <Dropdown
              value={filters.categoryId ? String(filters.categoryId) : ''}
              placeholder="Tất cả danh mục"
              options={categories.map((category) => ({ value: String(category.id), label: category.name }))}
              onChange={(value) => setFilters((prev) => ({ ...prev, categoryId: value ? Number(value) : '' }))}
            />
            <Dropdown
              value={priceRangeValue(filters)}
              placeholder="Khoảng giá"
              options={[
                { value: '0-1000000', label: 'Dưới 1 triệu' },
                { value: '1000000-3000000', label: '1 - 3 triệu' },
                { value: '3000000-5000000', label: '3 - 5 triệu' },
                { value: '5000000-', label: 'Trên 5 triệu' },
              ]}
              onChange={setPriceRange}
            />
            <div className="flex gap-2">
              <button type="button" onClick={applyFilters} className="primary-pill h-11 px-5 text-sm font-semibold">Áp dụng</button>
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
        <StateBox text="Đang tải dịch vụ..." />
      ) : error ? (
        <StateBox text={error} />
      ) : services.length === 0 ? (
        <StateBox text="Không tìm thấy dịch vụ phù hợp." />
      ) : (
        <>
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 2xl:columns-4">
            {visibleServices.map((service) => (
              <Link key={service.id} to={`/photosets/${service.id}`} className="group mb-5 block break-inside-avoid">
                <article className="overflow-hidden rounded-[20px] bg-white shadow-sm ring-1 ring-[var(--color-border)]">
                  <div className="relative overflow-hidden rounded-[20px] bg-slate-100">
                    {service.thumbnailUrl ? (
                      <img src={service.thumbnailUrl} alt={service.name} className="w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="flex aspect-[3/4] items-center justify-center text-sm font-medium text-slate-400">
                        Chưa có ảnh
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/25" />
                    <div className="absolute left-3 top-3 opacity-0 transition duration-300 group-hover:opacity-100">
                      <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[var(--color-graphite)]">
                        {service.categoryName}
                      </span>
                    </div>
                    <div className="absolute right-3 top-3 opacity-0 transition duration-300 group-hover:opacity-100">
                      <span className="rounded-full bg-[var(--color-azure)] px-4 py-2 text-sm font-black text-white">
                        GO
                      </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 translate-y-3 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <h2 className="line-clamp-2 text-base font-semibold text-white">{service.name}</h2>
                      <div className="mt-2 flex items-center justify-between gap-3 text-xs font-medium text-white/90">
                        <span className="line-clamp-1">{service.studioName}</span>
                        <span className="shrink-0">{service.rating ? `★ ${Number(service.rating).toFixed(1)}` : 'Mới'}</span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
          {visibleCount < services.length && (
            <div className="pt-4 text-center">
              <button type="button" onClick={() => setVisibleCount((count) => count + 8)} className="secondary-pill h-11 px-6 text-sm font-bold">
                Xem thêm
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function cleanParams(params: ServiceSearchParams) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined))
}

function priceRangeValue(filters: ServiceSearchParams) {
  if (filters.minPrice === '' && filters.maxPrice === 1000000) return '0-1000000'
  if (filters.minPrice === 1000000 && filters.maxPrice === 3000000) return '1000000-3000000'
  if (filters.minPrice === 3000000 && filters.maxPrice === 5000000) return '3000000-5000000'
  if (filters.minPrice === 5000000 && filters.maxPrice === '') return '5000000-'
  return ''
}

function Dropdown({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string
  placeholder: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((state) => !state)} className="flex h-11 w-full items-center justify-between gap-3 rounded-full border border-[var(--color-border)] bg-white px-4 text-left text-sm font-medium text-[var(--color-ink)] transition focus:border-[var(--color-azure)]">
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <span className="text-xs text-slate-500">⌄</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-1 shadow-xl">
          <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-[var(--color-fog)]">
            {placeholder}
          </button>
          {options.map((option) => (
            <button key={option.value} type="button" onClick={() => { onChange(option.value); setOpen(false) }} className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium ${option.value === value ? 'bg-blue-50 text-[var(--color-azure)]' : 'text-slate-700 hover:bg-[var(--color-fog)]'}`}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function StateBox({ text }: { text: string }) {
  return <div className="surface-card border-dashed p-12 text-center text-sm font-medium text-[var(--color-graphite)]">{text}</div>
}
