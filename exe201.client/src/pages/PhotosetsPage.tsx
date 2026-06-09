import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Search, SlidersHorizontal, X, GitCompare, Trash2, Tag, MapPin, Star, Wallet, FileText, ExternalLink, Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import { getCategories } from '../services/categoryApi'
import { getServices, type ServiceSearchParams } from '../services/serviceApi'
import type { Category, ServiceSummary } from '../services/catalogTypes'

function ServiceCard({
  service,
  index,
  isCompared,
  onCompareToggle,
}: {
  service: ServiceSummary
  index: number
  isCompared: boolean
  onCompareToggle: () => void
}) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoaded(true)
    }
  }, [])

  // Use a stable aspect ratio based on the service ID to prevent layout shifts
  const aspectClass = useMemo(() => {
    const idNum = typeof service.id === 'number'
      ? service.id
      : String(service.id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const aspects = [
      'aspect-[3/2]', // Landscape
      'aspect-[4/3]', // Landscape
      'aspect-[1/1]', // Square
      'aspect-[3/4]', // Portrait
      'aspect-[2/3]', // Portrait
    ]
    return aspects[idNum % aspects.length]
  }, [service.id])

  const pageEase = [0.22, 1, 0.36, 1] as const

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.72, ease: pageEase, delay: Math.min(index, 8) * 0.05 }}
      className="w-full"
    >
      <Link to={`/photosets/${service.id}`} className="group block">
        <article className="overflow-hidden rounded-[20px] bg-white shadow-sm ring-1 ring-[var(--color-border)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]">
          <div className={`relative overflow-hidden rounded-[20px] bg-slate-100 ${aspectClass}`}>
            {service.thumbnailUrl ? (
              <>
                {!loaded && (
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100" />
                )}
                <img
                  ref={imgRef}
                  src={service.thumbnailUrl}
                  alt={service.name}
                  onLoad={() => setLoaded(true)}
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
                    loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-[0.98]'
                  }`}
                  loading="lazy"
                />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-400">
                Chưa có ảnh
              </div>
            )}

            {/* Overlays */}
            <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/25" />
            
            {/* Category badge */}
            <div className="absolute left-3 top-3 opacity-0 transition duration-300 group-hover:opacity-100">
              <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[var(--color-graphite)] shadow-sm">
                {service.categoryName}
              </span>
            </div>
            
            {/* Compare checkbox button */}
            <div className={`absolute right-3 top-3 z-10 transition-opacity duration-300 ${
              isCompared ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <button
                type="button"
                title={isCompared ? 'Xóa khỏi so sánh' : 'Thêm vào so sánh'}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onCompareToggle()
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all duration-300 ${
                  isCompared
                    ? 'bg-[var(--color-orange)] text-white scale-110'
                    : 'bg-white/95 text-slate-700 hover:bg-white hover:text-[var(--color-orange)] hover:scale-110'
                }`}
              >
                <GitCompare className="h-4 w-4" />
              </button>
            </div>
            
            {/* Hover overlay sliding up from bottom */}
            <div className="absolute inset-x-0 bottom-0 translate-y-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <h2 className="line-clamp-2 text-base font-semibold text-white leading-snug">{service.name}</h2>
              <p className="mt-1 text-xs font-extrabold text-[var(--color-orange)]">
                {service.minPrice ? `Từ ${new Intl.NumberFormat('vi-VN').format(service.minPrice)} ₫` : 'Liên hệ'}
              </p>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs font-medium text-white/90 border-t border-white/20 pt-2">
                <span className="line-clamp-1">{service.studioName}</span>
                <span className="shrink-0">{service.rating ? `★ ${Number(service.rating).toFixed(1)}` : 'Mới'}</span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  )
}

function useWindowColumns() {
  const [columns, setColumns] = useState(4)

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth
      if (w < 640) setColumns(1)
      else if (w < 1024) setColumns(2)
      else if (w < 1536) setColumns(3)
      else setColumns(4)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return columns
}

export default function PhotosetsPage() {
  const toast = useToast()
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
  const [keywordInput, setKeywordInput] = useState(initialFilters.keyword)
  const [compareList, setCompareList] = useState<ServiceSummary[]>([])
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visibleCount, setVisibleCount] = useState(12)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const columnsCount = useWindowColumns()

  useEffect(() => {
    if (loading || services.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && visibleCount < services.length) {
          setVisibleCount((prev) => prev + 8)
        }
      },
      { threshold: 0.1 }
    )

    const currentSentinel = sentinelRef.current
    if (currentSentinel) {
      observer.observe(currentSentinel)
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel)
      }
    }
  }, [loading, services.length, visibleCount])

  async function loadData(nextFilters = filters) {
    setLoading(true)
    setError('')
    try {
      const [categoryData, serviceData] = await Promise.all([
        getCategories(),
        getServices(cleanParams(nextFilters)),
      ])
      setCategories(categoryData)
      setServices(serviceData)
    } catch {
      setError('Không tải được danh sách dịch vụ.')
    } finally {
      setLoading(false)
    }
  }

  // Debounce the keyword search input
  useEffect(() => {
    if (keywordInput === filters.keyword) return

    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, keyword: keywordInput }))
    }, 400)
    return () => clearTimeout(handler)
  }, [keywordInput, filters.keyword])

  // Automatically trigger data load when filters change
  useEffect(() => {
    loadData(filters)
  }, [filters])

  const hasFilter = useMemo(
    () => Boolean(filters.keyword || filters.categoryId || filters.minPrice || filters.maxPrice),
    [filters]
  )

  const visibleServices = services.slice(0, visibleCount)

  const columnsData = useMemo(() => {
    const cols: ServiceSummary[][] = Array.from({ length: columnsCount }, () => [])
    visibleServices.forEach((service, index) => {
      cols[index % columnsCount].push(service)
    })
    return cols
  }, [visibleServices, columnsCount])

  function clearFilters() {
    setKeywordInput('')
    const next: ServiceSearchParams = { keyword: '', categoryId: '', minPrice: '', maxPrice: '' }
    setFilters(next)
    setVisibleCount(12)
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
        <div className="space-y-5">
          {/* Horizontal Categories Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, categoryId: '' }))}
              className={`shrink-0 rounded-full px-5 py-2 text-xs sm:text-sm font-black transition-all duration-300 border ${
                filters.categoryId === ''
                  ? 'bg-[var(--color-azure)] border-[var(--color-azure)] text-white shadow-md shadow-blue-500/20'
                  : 'bg-white border-[var(--color-border)] text-[var(--color-graphite)] hover:border-[var(--color-azure)] hover:text-[var(--color-azure)]'
              }`}
            >
              Tất cả
            </button>
            {categories.map((category) => {
              const isActive = filters.categoryId === category.id
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, categoryId: category.id }))}
                  className={`shrink-0 rounded-full px-5 py-2 text-xs sm:text-sm font-black transition-all duration-300 border ${
                    isActive
                      ? 'bg-[var(--color-azure)] border-[var(--color-azure)] text-white shadow-md shadow-blue-500/20'
                      : 'bg-white border-[var(--color-border)] text-[var(--color-graphite)] hover:border-[var(--color-azure)] hover:text-[var(--color-azure)]'
                  }`}
                >
                  {category.name}
                </button>
              )
            })}
          </div>

          {/* Search bar & Price Dropdown */}
          <div className="rounded-[28px] border border-[var(--color-border)] bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
            <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr_auto]">
              <label className="relative flex items-center bg-[var(--color-fog)] rounded-full px-4 h-11">
                <Search className="h-4 w-4 shrink-0 text-slate-400 mr-2.5" />
                <input
                  value={keywordInput}
                  onChange={(event) => setKeywordInput(event.target.value)}
                  placeholder="Tìm dịch vụ, studio, danh mục hoặc khu vực..."
                  className="min-w-0 w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                />
              </label>

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

              {hasFilter && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex h-11 items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 text-sm font-bold text-rose-600 hover:bg-rose-100 transition"
                >
                  <X className="h-4 w-4" />
                  Xóa bộ lọc
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
          <div className="flex gap-5 items-start">
            {columnsData.map((colItems, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-5 flex-1 min-w-0">
                {colItems.map((service) => {
                  const globalIndex = visibleServices.findIndex((s) => s.id === service.id)
                  const isCompared = compareList.some((item) => item.id === service.id)
                  return (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      index={globalIndex >= 0 ? globalIndex : 0}
                      isCompared={isCompared}
                      onCompareToggle={() => {
                        const exists = compareList.some((item) => item.id === service.id)
                        if (exists) {
                          setCompareList((prev) => prev.filter((item) => item.id !== service.id))
                        } else {
                          if (compareList.length >= 3) {
                            toast.push({
                              type: 'info',
                              title: 'Giới hạn so sánh',
                              message: 'Bạn chỉ có thể chọn tối đa 3 dịch vụ cùng lúc.'
                            })
                          } else {
                            setCompareList((prev) => [...prev, service])
                          }
                        }
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {/* Sentinel element for infinite scroll / lazy loading */}
          {visibleCount < services.length ? (
            <div ref={sentinelRef} className="py-10 flex justify-center items-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--color-azure)]" />
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center gap-2 py-8 border-t border-[var(--color-border)]">
              <div className="text-sm font-semibold text-slate-400">
                Đã hiển thị tất cả {services.length} dịch vụ
              </div>
              <div className="text-xs text-slate-300">Không có thêm kết quả phù hợp</div>
            </div>
          )}
        </>
      )}

      {/* Floating Compare Drawer */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <CompareDrawer
            list={compareList}
            onRemove={(id) => setCompareList((prev) => prev.filter((item) => item.id !== id))}
            onClear={() => setCompareList([])}
            onCompare={() => setIsCompareModalOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Compare Matrix Modal */}
      <AnimatePresence>
        {isCompareModalOpen && (
          <CompareModal
            list={compareList}
            onClose={() => setIsCompareModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CompareDrawer({
  list,
  onRemove,
  onClear,
  onCompare,
}: {
  list: ServiceSummary[]
  onRemove: (id: number) => void
  onClear: () => void
  onCompare: () => void
}) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-[var(--color-border)] shadow-[0_-12px_40px_rgba(0,0,0,0.12)] px-4 py-4 sm:px-6 md:py-5"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-azure)] text-[10px] font-black text-white">
              {list.length}
            </span>
            <h3 className="text-sm font-black text-[var(--color-ink)]">So sánh dịch vụ chụp ảnh</h3>
          </div>
          <p className="text-xs text-[var(--color-graphite)]">Chọn tối đa 3 dịch vụ để so sánh trực quan</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            {list.map((service) => (
              <div key={service.id} className="group relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--color-border)] bg-slate-50 shadow-sm">
                <img
                  src={service.thumbnailUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=200&q=80'}
                  alt={service.name}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemove(service.id)}
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900/80 text-white transition hover:bg-slate-950"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 3 - list.length) }).map((_, i) => (
              <div key={i} className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                <span className="text-[10px] font-bold">Chờ...</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1 transition"
            >
              Xóa tất cả
            </button>
            <button
              type="button"
              disabled={list.length < 2}
              onClick={onCompare}
              className={`inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-xs font-black text-white shadow transition-all duration-300 ${
                list.length >= 2
                  ? 'bg-[var(--color-orange)] hover:bg-[var(--color-orange-dark)] hover:scale-105'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" />
              <span>So sánh ngay {list.length < 2 && '(Cần ít nhất 2)'}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function CompareModal({
  list,
  onClose,
}: {
  list: ServiceSummary[]
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
      />

      {/* Content box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="relative z-10 flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[var(--color-orange)]">
              <GitCompare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[var(--color-ink)]">Bảng so sánh dịch vụ & studio</h2>
              <p className="text-xs text-[var(--color-graphite)]">So sánh chi tiết các tiêu chí của tối đa 3 dịch vụ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable table container */}
        <div className="flex-1 overflow-auto p-6">
          <div className="min-w-[800px] border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full border-collapse text-left table-fixed">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="w-[180px] p-5 text-xs font-bold uppercase tracking-wider text-slate-400 align-middle">Tiêu chí</th>
                  {list.map((service) => (
                    <th key={service.id} className="p-5 align-top border-l border-slate-200">
                      <div className="group block space-y-3">
                        <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                          <img
                            src={service.thumbnailUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=300&q=80'}
                            alt={service.name}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div>
                          <div className="line-clamp-2 text-sm font-black leading-tight text-[var(--color-ink)]" title={service.name}>
                            {service.name}
                          </div>
                          <div className="mt-1 text-xs font-bold text-[var(--color-azure)]">
                            {service.studioName}
                          </div>
                        </div>
                      </div>
                    </th>
                  ))}
                  {Array.from({ length: 3 - list.length }).map((_, i) => (
                    <th key={i} className="p-5 align-middle border-l border-slate-200 bg-slate-50/20 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-300">
                        <Plus className="h-6 w-6 border border-dashed border-slate-300 rounded-full p-1" />
                        <span className="text-xs font-bold">Trống</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {/* Category Row */}
                <tr className="hover:bg-slate-50/40">
                  <td className="p-4 font-bold text-slate-600 bg-slate-50/20">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-blue-500" />
                      <span>Danh mục</span>
                    </div>
                  </td>
                  {list.map((service) => (
                    <td key={service.id} className="p-4 border-l border-slate-100">
                      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[var(--color-azure)]">
                        {service.categoryName}
                      </span>
                    </td>
                  ))}
                  {Array.from({ length: 3 - list.length }).map((_, i) => (
                    <td key={i} className="p-4 border-l border-slate-100 bg-slate-50/10 text-slate-300 text-center">-</td>
                  ))}
                </tr>

                {/* Price Row */}
                <tr className="hover:bg-slate-50/40">
                  <td className="p-4 font-bold text-slate-600 bg-slate-50/20">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-[var(--color-orange)]" />
                      <span>Khoảng giá</span>
                    </div>
                  </td>
                  {list.map((service) => (
                    <td key={service.id} className="p-4 border-l border-slate-100 font-extrabold text-[var(--color-orange)]">
                      {service.minPrice ? `Từ ${new Intl.NumberFormat('vi-VN').format(service.minPrice)} ₫` : 'Liên hệ'}
                    </td>
                  ))}
                  {Array.from({ length: 3 - list.length }).map((_, i) => (
                    <td key={i} className="p-4 border-l border-slate-100 bg-slate-50/10 text-slate-300 text-center">-</td>
                  ))}
                </tr>

                {/* Location Row */}
                <tr className="hover:bg-slate-50/40">
                  <td className="p-4 font-bold text-slate-600 bg-slate-50/20">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      <span>Khu vực</span>
                    </div>
                  </td>
                  {list.map((service) => (
                    <td key={service.id} className="p-4 border-l border-slate-100 font-semibold text-slate-700">
                      {service.city || 'Đà Nẵng'}
                    </td>
                  ))}
                  {Array.from({ length: 3 - list.length }).map((_, i) => (
                    <td key={i} className="p-4 border-l border-slate-100 bg-slate-50/10 text-slate-300 text-center">-</td>
                  ))}
                </tr>

                {/* Rating Row */}
                <tr className="hover:bg-slate-50/40">
                  <td className="p-4 font-bold text-slate-600 bg-slate-50/20">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span>Đánh giá</span>
                    </div>
                  </td>
                  {list.map((service) => (
                    <td key={service.id} className="p-4 border-l border-slate-100">
                      <span className="inline-flex items-center gap-1 font-extrabold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">
                        ★ {service.rating ? Number(service.rating).toFixed(1) : 'Mới'}
                      </span>
                    </td>
                  ))}
                  {Array.from({ length: 3 - list.length }).map((_, i) => (
                    <td key={i} className="p-4 border-l border-slate-100 bg-slate-50/10 text-slate-300 text-center">-</td>
                  ))}
                </tr>

                {/* Description Row */}
                <tr className="hover:bg-slate-50/40">
                  <td className="p-4 font-bold text-slate-600 bg-slate-50/20 align-top">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-500" />
                      <span>Đặc điểm</span>
                    </div>
                  </td>
                  {list.map((service) => (
                    <td key={service.id} className="p-4 border-l border-slate-100 align-top text-xs leading-relaxed text-slate-600 whitespace-pre-line">
                      {service.description || 'Chi tiết thông tin gói dịch vụ chụp ảnh và các thỏa thuận đi kèm.'}
                    </td>
                  ))}
                  {Array.from({ length: 3 - list.length }).map((_, i) => (
                    <td key={i} className="p-4 border-l border-slate-100 bg-slate-50/10 text-slate-300 text-center">-</td>
                  ))}
                </tr>

                {/* Action Row */}
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-slate-50/20">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-slate-500" />
                      <span>Liên kết</span>
                    </div>
                  </td>
                  {list.map((service) => (
                    <td key={service.id} className="p-4 border-l border-slate-100">
                      <Link
                        to={`/photosets/${service.id}`}
                        onClick={onClose}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-azure)] px-4 text-xs font-black text-white hover:bg-[var(--color-azure-dark)] transition duration-200"
                      >
                        <span>Chi tiết gói</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  ))}
                  {Array.from({ length: 3 - list.length }).map((_, i) => (
                    <td key={i} className="p-4 border-l border-slate-100 bg-slate-50/10 text-slate-300 text-center">-</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end border-t border-[var(--color-border)] bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Đóng
          </button>
        </div>
      </motion.div>
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
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 text-left text-sm font-medium text-[var(--color-ink)] transition focus:border-[var(--color-azure)] hover:border-[var(--color-azure)]"
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-1 shadow-xl">
          <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-500 hover:bg-[var(--color-fog)]">
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
