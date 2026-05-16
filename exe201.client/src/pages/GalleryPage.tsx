import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/AppStore'
import PhotoCard from '../components/PhotoCard'

const ALL_TAGS = ['Wedding', 'Portrait', 'Lifestyle', 'Street', 'Couple', 'Editorial', 'Landscape', 'Travel', 'Nature', 'Commercial', 'Product', 'Fashion', 'Romantic', 'Film', 'Vintage', 'Architecture', 'Urban', 'Documentary']
const LOCATIONS = ['Tất cả', 'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hội An']

export default function GalleryPage() {
  const { state } = useAppStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [location, setLocation] = useState('Tất cả')
  const [showFilters, setShowFilters] = useState(false)

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  function clearFilters() {
    setQ('')
    setSelectedTags([])
    setLocation('Tất cả')
  }

  const results = useMemo(() => {
    const norm = q.trim().toLowerCase()
    return state.photographers.filter((p) => {
      if (p.status !== 'APPROVED') return false
      if (norm && !(p.name + ' ' + p.location + ' ' + p.tags.join(' ')).toLowerCase().includes(norm)) return false
      if (selectedTags.length > 0 && !selectedTags.some((t) => p.tags.includes(t))) return false
      if (location !== 'Tất cả' && p.location !== location) return false
      return true
    })
  }, [q, selectedTags, location, state.photographers])

  const hasFilter = q || selectedTags.length > 0 || location !== 'Tất cả'

  // Build columns for masonry
  const columns: (typeof results)[] = [[], [], []]
  results.forEach((p, i) => columns[i % 3].push(p))

  return (
    <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[40px] bg-slate-900 px-8 py-16 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4">DISCOVER TALENT</div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">Thư viện Nghệ sĩ</h1>
          <p className="mt-4 text-slate-400 font-medium max-w-lg">Tìm kiếm và kết nối với những nhiếp ảnh gia hàng đầu phù hợp với phong cách của bạn.</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Controls Bar */}
        <div className="sticky top-20 z-20 flex flex-col gap-4 sm:flex-row sm:items-center justify-between rounded-[28px] border border-slate-100 bg-white/80 p-3 shadow-xl shadow-slate-200/40 backdrop-blur-xl ring-1 ring-slate-200/50">
          <div className="flex flex-1 items-center gap-3 px-4 py-2">
            <Search className="h-4.5 w-4.5 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên, phong cách, thành phố..."
              className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
            />
            {q && (
              <button onClick={() => setQ('')} className="rounded-full bg-slate-100 p-1 text-slate-400 hover:text-slate-900 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 p-1">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex h-11 items-center gap-2.5 rounded-2xl px-6 text-[11px] font-black uppercase tracking-widest transition-all ${showFilters ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <SlidersHorizontal className="h-4 w-4" /> BỘ LỌC {hasFilter && '(!)'}
            </button>
          </div>
        </div>

        {/* Expandable Filters */}
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
                    <button onClick={clearFilters} className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors">Xoá tất cả</button>
                  )}
                </div>

                <div className="grid gap-10 md:grid-cols-2">
                  <div>
                    <label className="mb-4 block text-[10px] font-black uppercase tracking-widest text-slate-400">Khu vực</label>
                    <div className="flex flex-wrap gap-2">
                      {LOCATIONS.map((loc) => (
                        <button
                          key={loc}
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
                      {ALL_TAGS.map((tag) => (
                        <button
                          key={tag}
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

        {/* Results */}
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-50 text-slate-200 ring-1 ring-inset ring-slate-100">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-[15px] font-black uppercase tracking-widest text-slate-900">Không tìm thấy nhiếp ảnh gia</h3>
            <p className="mt-3 text-xs font-bold text-slate-400 leading-relaxed max-w-[240px]">Thử thay đổi bộ lọc hoặc từ khoá để tìm thấy mảnh ghép bạn cần.</p>
            <button onClick={clearFilters} className="mt-8 rounded-2xl bg-slate-900 px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95">Reset bộ lọc</button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6 sm:flex-nowrap">
            {columns.map((col, ci) => (
              <div key={ci} className="flex flex-1 flex-col gap-6">
                {col.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (ci + i * 3) * 0.05 }}
                  >
                    <PhotoCard
                      imageUrl={p.portfolio[0]?.url ?? p.coverUrl}
                      photographerName={p.name}
                      location={p.location}
                      startingPriceVnd={p.startingPrice}
                      rating={p.rating}
                      reviewCount={p.reviewCount}
                      tags={p.tags}
                      isTopRated={p.rating >= 4.9}
                      onClick={() => nav(`/photographers/${p.id}`)}
                    />
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
