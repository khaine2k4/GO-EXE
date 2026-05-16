import { useState, useMemo, useCallback } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import MasonryGrid from '../components/layout/MasonryGrid'
import AlbumCard, { type AlbumWithMeta } from '../components/AlbumCard'
import { useAppStore } from '../store/AppStore'

const LOCATIONS = ['Tất cả', 'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hội An']

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Giữ shuffle để layout đa dạng; tất cả card chỉ 1 cột (không span 2)
function arrangeAlbums(items: AlbumWithMeta[]): AlbumWithMeta[] {
  return shuffle(items)
}

export default function PhotosetsPage() {
  const { state } = useAppStore()
  const [q, setQ] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [location, setLocation] = useState('Tất cả')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const allAlbums: AlbumWithMeta[] = useMemo(() => {
    return state.photographers.flatMap((p) =>
      (p.albums ?? []).map((album) => ({
        album,
        photographer: p,
        photoset: album.photosetId ? state.photosets.find((ps) => ps.id === album.photosetId) : undefined,
      }))
    )
  }, [state.photographers, state.photosets])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    state.photosets.forEach((p) => p.tags.forEach((t) => set.add(t)))
    state.photographers.forEach((p) => p.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [state.photosets, state.photographers])

  const filtered = useMemo(() => {
    const norm = q.trim().toLowerCase()
    return allAlbums.filter(({ album, photographer, photoset }) => {
      const matchSearch =
        !norm ||
        album.title.toLowerCase().includes(norm) ||
        photographer.name.toLowerCase().includes(norm) ||
        photoset?.title.toLowerCase().includes(norm) ||
        photographer.tags.some((t) => t.toLowerCase().includes(norm)) ||
        photoset?.tags.some((t) => t.toLowerCase().includes(norm))
      const matchTag =
        selectedTags.length === 0 ||
        selectedTags.some((t) => photographer.tags.includes(t) || photoset?.tags.includes(t))
      const matchLocation = location === 'Tất cả' || photographer.location === location
      return matchSearch && matchTag && matchLocation
    })
  }, [allAlbums, q, selectedTags, location])

  const arranged = useMemo(() => arrangeAlbums(filtered), [filtered])

  const getItemAspectRatio = useCallback((item: AlbumWithMeta) => {
    const ratio = item.photoset?.coverAspectRatio ?? [0.75, 1, 1.25, 1.5][item.album.id.length % 4]
    return ratio >= 2 ? 1 : ratio
  }, [])
  const getItemSpan = useCallback((): 1 | 2 => 1, [])
  const getItemKey = useCallback((item: AlbumWithMeta) => item.album.id, [])
  const renderCard = useCallback(
    (item: AlbumWithMeta, style: React.CSSProperties) => (
      <AlbumCard key={item.album.id} album={item.album} photographer={item.photographer} photoset={item.photoset} style={style} />
    ),
    []
  )

  const hasFilter = q || selectedTags.length > 0 || location !== 'Tất cả'
  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }
  function clearFilters() {
    setQ('')
    setSelectedTags([])
    setLocation('Tất cả')
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative overflow-hidden rounded-[40px] bg-slate-900 px-8 py-16 text-white shadow-2xl">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4">BỘ SƯU TẬP</div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">Các album</h1>
          <p className="mt-4 text-slate-400 font-medium max-w-lg">
            Khám phá các album từ studio. Mỗi album gắn với một gói chụp ảnh — xem ảnh và đặt lịch dễ dàng.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="sticky top-20 z-20 flex flex-col gap-4 sm:flex-row sm:items-center justify-between rounded-[28px] border border-slate-100 bg-white/80 p-3 shadow-xl shadow-slate-200/40 backdrop-blur-xl ring-1 ring-slate-200/50">
          <div className="flex flex-1 items-center gap-3 px-4 py-2">
            <Search className="h-4.5 w-4.5 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên album, studio, gói chụp, tag..."
              className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
            />
            {q && (
              <button type="button" onClick={() => setQ('')} className="rounded-full bg-slate-100 p-1 text-slate-400 hover:text-slate-900 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 p-1">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex h-11 items-center gap-2.5 rounded-2xl px-6 text-[11px] font-black uppercase tracking-widest transition-all ${showFilters ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <SlidersHorizontal className="h-4 w-4" /> BỘ LỌC {hasFilter && '(!)'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Tuỳ chỉnh tìm kiếm</h3>
                  {hasFilter && (
                    <button type="button" onClick={clearFilters} className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors">
                      Xoá tất cả
                    </button>
                  )}
                </div>
                <div className="grid gap-10 md:grid-cols-2">
                  <div>
                    <label className="mb-4 block text-[10px] font-black uppercase tracking-widest text-slate-400">Khu vực</label>
                    <div className="flex flex-wrap gap-2">
                      {LOCATIONS.map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setLocation(loc)}
                          className={`rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${location === loc ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-4 block text-[10px] font-black uppercase tracking-widest text-slate-400">Phong cách</label>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${selectedTags.includes(tag) ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[32px] border border-slate-100 bg-white p-16 text-center text-slate-500">
          <p className="font-bold">Không tìm thấy album nào.</p>
          <button type="button" onClick={clearFilters} className="mt-4 text-indigo-600 font-black text-sm hover:underline">
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <MasonryGrid
          items={arranged}
          renderItem={renderCard}
          getItemAspectRatio={getItemAspectRatio}
          getItemSpan={getItemSpan}
          getItemKey={getItemKey}
          gap={28}
          maxColumns={4}
          minColumnWidth={280}
        />
      )}
    </div>
  )
}
