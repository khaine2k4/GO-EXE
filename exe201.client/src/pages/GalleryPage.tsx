import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, List, Map as MapIcon, Search, SlidersHorizontal, Star, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import AppMap from '../components/map/AppMap'
import { DA_NANG_CENTER } from '../components/map/mapConstants'
import { studioToMapMarker, type StudioMapMarker } from '../components/map/StudioMapMarker'
import { getCategories } from '../services/categoryApi'
import { getStudios, type StudioSearchParams } from '../services/studioApi'
import type { Category, StudioSummary } from '../services/catalogTypes'

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80'

function formatVnd(value?: number) {
  if (!value) return 'Liên hệ'
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ'
}

export default function GalleryPage() {
  const nav = useNavigate()
  const [studios, setStudios] = useState<StudioSummary[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<StudioSearchParams>({ keyword: '', categoryId: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visibleCount, setVisibleCount] = useState(9)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [selectedStudioId, setSelectedStudioId] = useState<number | null>(null)

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
      setError('Không tải được danh sách studio.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const hasFilter = useMemo(() => Boolean(filters.keyword || filters.categoryId), [filters])
  const visibleStudios = studios.slice(0, visibleCount)
  const mapMarkers = useMemo(
    () => studios.map(studioToMapMarker).filter((marker): marker is StudioMapMarker => Boolean(marker)),
    [studios],
  )

  function applyFilters() {
    setVisibleCount(9)
    load(filters)
  }

  function clearFilters() {
    const next: StudioSearchParams = { keyword: '', categoryId: '' }
    setFilters(next)
    setVisibleCount(9)
    load(next)
  }

  return (
    <div className="space-y-10 pb-20">
      <section className="surface-card p-8 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="text-sm font-semibold uppercase text-[var(--color-azure)]">Studio</div>
          <h1 className="mt-3 text-4xl font-bold text-[var(--color-ink)] md:text-5xl">Khám phá studio đã được duyệt</h1>
          <p className="mt-4 text-[var(--color-graphite)]">
            So sánh dịch vụ, portfolio, đánh giá và khoảng giá trước khi gửi yêu cầu đặt lịch.
          </p>
        </div>
      </section>

      <section className="sticky top-20 z-20 rounded-[28px] border border-[var(--color-border)] bg-white/95 p-3 shadow-[0_12px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex h-12 flex-1 items-center gap-3 rounded-full bg-[var(--color-fog)] px-4">
            <Search className="h-5 w-5 shrink-0 text-[var(--color-graphite)]" />
            <input
              value={filters.keyword}
              onChange={(event) => setFilters((prev) => ({ ...prev, keyword: event.target.value }))}
              onKeyDown={(event) => { if (event.key === 'Enter') applyFilters() }}
              placeholder="Tìm studio, dịch vụ, danh mục hoặc khu vực..."
              className="min-w-0 w-full bg-transparent text-sm font-medium text-[var(--color-ink)] outline-none placeholder:text-slate-400"
            />
            {filters.keyword && (
              <button type="button" onClick={() => setFilters((prev) => ({ ...prev, keyword: '' }))} className="rounded-full bg-white p-1 text-[var(--color-graphite)]">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            <div className="flex h-12 rounded-full bg-[var(--color-fog)] p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-2 rounded-full px-4 text-sm font-bold transition ${viewMode === 'list' ? 'bg-white text-[var(--color-azure)] shadow-sm' : 'text-[var(--color-graphite)] hover:text-[var(--color-ink)]'}`}
              >
                <List className="h-4 w-4" />
                Danh sách
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`inline-flex items-center gap-2 rounded-full px-4 text-sm font-bold transition ${viewMode === 'map' ? 'bg-white text-[var(--color-azure)] shadow-sm' : 'text-[var(--color-graphite)] hover:text-[var(--color-ink)]'}`}
              >
                <MapIcon className="h-4 w-4" />
                Bản đồ
              </button>
            </div>
            <button type="button" onClick={() => setShowFilters((value) => !value)} className="secondary-pill h-12 gap-2 px-5 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
            </button>
            <button type="button" onClick={applyFilters} className="primary-pill h-12 w-12 text-sm font-semibold" aria-label="Tìm kiếm">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-3 grid gap-3 border-t border-[var(--color-soft-border)] pt-3 md:grid-cols-[1fr_auto]">
                <Dropdown
                  value={filters.categoryId ? String(filters.categoryId) : ''}
                  placeholder="Tất cả danh mục"
                  options={categories.map((category) => ({ value: String(category.id), label: category.name }))}
                  onChange={(value) => setFilters((prev) => ({ ...prev, categoryId: value ? Number(value) : '' }))}
                />
                {hasFilter && <button type="button" onClick={clearFilters} className="secondary-pill h-11 px-5 text-sm font-semibold">Xóa lọc</button>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {loading ? (
        <StateBox text="Đang tải studio..." />
      ) : error ? (
        <StateBox text={error} />
      ) : studios.length === 0 ? (
        <StateBox text="Không có studio phù hợp với bộ lọc." />
      ) : viewMode === 'map' ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <AppMap
            center={mapMarkers[0] ? { lat: mapMarkers[0].lat, lng: mapMarkers[0].lng } : DA_NANG_CENTER}
            zoom={12}
            markers={mapMarkers}
            selectedMarkerId={selectedStudioId}
            fitToMarkers
            openSelectedPopup
            onMarkerClick={(markerId) => setSelectedStudioId(Number(markerId))}
            className="h-[620px] w-full"
          />
          <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
            {mapMarkers.length === 0 ? (
              <StateBox text="Chưa có studio nào có tọa độ để hiển thị trên bản đồ." />
            ) : null}
            {studios.map((studio) => (
              <MapStudioCard
                key={studio.id}
                studio={studio}
                active={selectedStudioId === studio.id}
                onFocus={() => setSelectedStudioId(studio.id)}
                onOpen={() => nav(`/photographers/${studio.id}`)}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleStudios.map((studio, index) => (
              <motion.div key={studio.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                <StudioCard studio={studio} onClick={() => nav(`/photographers/${studio.id}`)} />
              </motion.div>
            ))}
          </div>
          {visibleCount < studios.length && (
            <div className="pt-2 text-center">
              <button type="button" onClick={() => setVisibleCount((count) => count + 6)} className="secondary-pill h-11 px-6 text-sm font-bold">
                Xem thêm
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MapStudioCard({
  studio,
  active,
  onFocus,
  onOpen,
}: {
  studio: StudioSummary
  active: boolean
  onFocus: () => void
  onOpen: () => void
}) {
  const hasLocation = typeof studio.lat === 'number' && typeof studio.lng === 'number'
  const location = [studio.district, studio.city].filter(Boolean).join(', ') || studio.addressLine || 'Chưa có địa chỉ'

  return (
    <article className={`rounded-3xl border bg-white p-3 shadow-sm transition ${active ? 'border-[var(--color-azure)] shadow-[0_16px_34px_rgba(0,74,173,0.14)]' : 'border-[var(--color-border)]'}`}>
      <button
        type="button"
        onClick={onFocus}
        disabled={!hasLocation}
        className="flex w-full gap-3 text-left disabled:cursor-not-allowed disabled:opacity-70"
      >
        <img
          src={studio.coverUrl || FALLBACK_COVER}
          alt={studio.name}
          className="h-20 w-20 shrink-0 rounded-2xl object-cover"
          loading="lazy"
          onError={(event) => { event.currentTarget.src = FALLBACK_COVER }}
        />
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-sm font-black text-[var(--color-ink)]">{studio.name || 'Studio đang cập nhật'}</h2>
          <p className="mt-1 line-clamp-1 text-xs font-semibold text-[var(--color-graphite)]">{location}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-[var(--color-orange)]">
              <Star className="h-3.5 w-3.5 fill-[var(--color-orange)]" />
              {Number(studio.rating ?? 0).toFixed(1)}
            </span>
            <span className="truncate text-xs font-black text-[var(--color-azure)]">{formatVnd(studio.minPrice)}</span>
          </div>
        </div>
      </button>
      <div className="mt-3 flex items-center justify-between border-t border-[var(--color-soft-border)] pt-3">
        <span className={`text-xs font-bold ${hasLocation ? 'text-emerald-600' : 'text-slate-400'}`}>
          {hasLocation ? 'Có tọa độ' : 'Chưa có tọa độ'}
        </span>
        <button type="button" onClick={onOpen} className="primary-pill h-9 px-4 text-xs font-bold">
          Xem studio
        </button>
      </div>
    </article>
  )
}

function StudioCard({ studio, onClick }: { studio: StudioSummary; onClick: () => void }) {
  const categories = studio.categories?.length ? studio.categories : ['Đang cập nhật dịch vụ']

  return (
    <button type="button" onClick={onClick} className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={studio.coverUrl || FALLBACK_COVER}
          alt={studio.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(event) => { event.currentTarget.src = FALLBACK_COVER }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="line-clamp-2 text-xl font-bold text-white">{studio.name || 'Studio đang cập nhật'}</h2>
        </div>
      </div>
      <div className="flex flex-1 flex-col space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase text-[var(--color-graphite)]">Giá từ</div>
            <div className="mt-1 text-2xl font-black text-[var(--color-azure)]">{formatVnd(studio.minPrice)}</div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-[var(--color-orange)]">
            <Star className="h-4 w-4 fill-[var(--color-orange)] text-[var(--color-orange)]" />
            {Number(studio.rating ?? 0).toFixed(1)}
            {studio.reviewCount > 0 ? <span className="text-slate-400">({studio.reviewCount})</span> : null}
          </div>
        </div>

        <p className="line-clamp-2 min-h-[44px] text-sm text-[var(--color-graphite)]">{studio.description || 'Studio đang cập nhật mô tả. Bạn vẫn có thể xem dịch vụ, portfolio và gói chụp hiện có.'}</p>

        <div className="flex min-h-[32px] flex-wrap gap-2">
          {categories.slice(0, 3).map((category) => (
            <span key={category} className="rounded-full bg-[var(--color-fog)] px-3 py-1 text-xs font-medium text-[var(--color-slate)]">{category}</span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-[var(--color-soft-border)] pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase text-[var(--color-graphite)]">
            <Camera className="h-3.5 w-3.5" />
            {studio.serviceCount || 0} dịch vụ · {studio.portfolioCount || 0} ảnh
          </span>
        </div>
      </div>
    </button>
  )
}

function cleanParams(params: StudioSearchParams) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined))
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
      <button type="button" onClick={() => setOpen((state) => !state)} className="flex h-11 w-full items-center justify-between gap-3 rounded-full bg-[var(--color-fog)] px-4 text-left text-sm font-medium text-[var(--color-ink)]">
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
