import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Star, MapPin, ChevronLeft, ChevronRight, X, CalendarDays } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/AppStore'
import BookingModal from '../components/BookingModal'

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
}

export default function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { state } = useAppStore()
  const nav = useNavigate()

  const allAlbumsWithMeta = state.photographers.flatMap((p) =>
    (p.albums ?? []).map((album) => ({ album, photographer: p }))
  )
  const found = allAlbumsWithMeta.find((x) => x.album.id === id)
  const photoset = found?.album.photosetId
    ? state.photosets.find((ps) => ps.id === found.album.photosetId)
    : undefined
  const photographer = found ? state.photographers.find((p) => p.id === found.photographer.id) ?? found.photographer : null

  const [activeIndex, setActiveIndex] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)

  const allImages = found?.album.images?.map((img) => img.url) ?? []
  const safeIndex = Math.min(activeIndex, Math.max(0, allImages.length - 1))
  const activeImage = allImages[safeIndex]

  const goToImage = useCallback(
    (dir: 'prev' | 'next') => {
      setActiveIndex((prev) => {
        if (dir === 'prev') return prev <= 0 ? allImages.length - 1 : prev - 1
        return prev >= allImages.length - 1 ? 0 : prev + 1
      })
    },
    [allImages.length]
  )

  useEffect(() => {
    if (allImages.length > 0 && activeIndex >= allImages.length) {
      setActiveIndex(allImages.length - 1)
    }
  }, [allImages.length, activeIndex])

  useEffect(() => {
    if (!galleryOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGalleryOpen(false)
      if (e.key === 'ArrowLeft') goToImage('prev')
      if (e.key === 'ArrowRight') goToImage('next')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [galleryOpen, goToImage])

  if (!found) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <div className="text-xl font-black uppercase tracking-[0.2em]">Album không tìm thấy</div>
        <button onClick={() => nav('/photosets')} className="mt-8 text-[11px] font-black uppercase tracking-widest text-indigo-600 hover:underline">
          ← Bộ sưu tập
        </button>
      </div>
    )
  }

  const { album } = found

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <nav className="text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-900 transition-colors">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link to="/photosets" className="hover:text-slate-900 transition-colors">Bộ sưu tập</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-semibold truncate max-w-[200px] inline-block align-bottom" title={album.title}>{album.title}</span>
      </nav>

      {/* Gallery ảnh trong album */}
      <div className="rounded-[40px] border border-slate-100 bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
        <div
          className="relative bg-slate-100 cursor-pointer group"
          style={{ maxHeight: '560px' }}
          onClick={() => allImages.length > 0 && setGalleryOpen(true)}
        >
          {allImages.length > 0 ? (
            <img
              src={activeImage}
              alt={album.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              style={{ maxHeight: '560px' }}
            />
          ) : (
            <div className="w-full h-64 flex items-center justify-center text-slate-400 font-medium">Chưa có ảnh</div>
          )}
          {allImages.length > 0 && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-900 shadow-lg transition-opacity">
                Xem {allImages.length} ảnh
              </span>
            </div>
          )}
        </div>
        {allImages.length > 0 && (
          <div className="p-4 flex gap-3 overflow-x-auto scrollbar-hide border-t border-slate-50">
            {allImages.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${safeIndex === idx ? 'border-indigo-600 ring-2 ring-indigo-200 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Studio + Gói liên kết */}
      <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-lg flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img src={photographer?.avatarUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-lg" />
          <div>
            <h3 className="font-black text-lg text-slate-900">{photographer?.name}</h3>
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-black text-slate-900">{photographer?.rating}</span>
              <span>· {photographer?.reviewCount} đánh giá</span>
              <span>·</span>
              <MapPin className="h-4 w-4 text-indigo-500 inline" />
              <span>{photographer?.location}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/photographers/${photographer?.id}`}
            className="rounded-xl border-2 border-slate-200 py-3 px-6 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            Xem profile
          </Link>
          {photoset && photographer && photographer.status === 'APPROVED' && (
            <button
              type="button"
              onClick={() => setBookingOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 px-8 text-[11px] font-black uppercase tracking-widest text-white shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              <CalendarDays className="h-5 w-5" /> Đặt lịch gói chụp
            </button>
          )}
        </div>
      </div>

      {/* Gói chụp ảnh liên kết */}
      {photoset && (
        <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">GÓI CHỤP ẢNH LIÊN KẾT</h3>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{photoset.title}</h2>
              <p className="mt-2 text-xl font-black text-indigo-600">Từ {formatVnd(photoset.price)}</p>
              <p className="mt-3 text-slate-600">{photoset.description}</p>
            </div>
            <Link
              to={`/photosets/${photoset.id}`}
              className="rounded-xl border-2 border-indigo-200 py-3 px-6 text-[11px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Xem chi tiết gói
            </Link>
          </div>
        </div>
      )}

      {photographer && (
        <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} photographer={photographer} photoset={photoset ?? undefined} />
      )}

      <AnimatePresence>
        {galleryOpen && allImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          >
            <div className="flex justify-between items-center p-4 text-white">
              <span className="text-sm text-slate-300">{safeIndex + 1} / {allImages.length}</span>
              <button type="button" onClick={() => setGalleryOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 relative">
              <img src={activeImage} alt="" className="max-h-full max-w-full object-contain" />
              <button type="button" onClick={() => goToImage('prev')} className="absolute left-4 p-3 bg-black/50 hover:bg-black/70 rounded-2xl text-white backdrop-blur transition-colors">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button type="button" onClick={() => goToImage('next')} className="absolute right-4 p-3 bg-black/50 hover:bg-black/70 rounded-2xl text-white backdrop-blur transition-colors">
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
            <div className="h-24 bg-black/50 overflow-x-auto flex items-center gap-2 px-4 scrollbar-hide">
              {allImages.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeIndex === idx ? 'border-indigo-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-75'}`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
