import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Star, MapPin, Check, ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp, CalendarDays } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/AppStore'
import BookingModal from '../components/BookingModal'

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
}

export default function PhotosetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { state } = useAppStore()
  const nav = useNavigate()
  const photoset = state.photosets.find((p) => p.id === id)
  const photographer = photoset ? state.photographers.find((p) => p.id === photoset.photographer.id) : null

  const [activeIndex, setActiveIndex] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [policiesOpen, setPoliciesOpen] = useState(false)
  const [addOnsOpen, setAddOnsOpen] = useState(true)
  const [bookingOpen, setBookingOpen] = useState(false)

  // Gallery = ảnh từ Portfolio Showcase (photographer.portfolio), fallback sang ảnh gói
  const portfolioUrls = photographer?.portfolio?.map((p) => p.url) ?? []
  const fallbackImages = photoset ? [photoset.coverImage, ...photoset.images] : []
  const allImages = portfolioUrls.length > 0 ? portfolioUrls : fallbackImages
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

  if (!photoset) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <div className="text-xl font-black uppercase tracking-[0.2em]">Bộ ảnh không tìm thấy</div>
        <button onClick={() => nav('/photosets')} className="mt-8 text-[11px] font-black uppercase tracking-widest text-indigo-600 hover:underline">
          ← Xem tất cả bộ sưu tập
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-900 transition-colors">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link to="/photosets" className="hover:text-slate-900 transition-colors">Bộ sưu tập</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-semibold truncate max-w-[200px] inline-block align-bottom" title={photoset.title}>{photoset.title}</span>
      </nav>

      {/* Hero gallery */}
      <div className="rounded-[40px] border border-slate-100 bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
        <div
          className="relative bg-slate-100 cursor-pointer group"
          style={{ maxHeight: '560px' }}
          onClick={() => setGalleryOpen(true)}
        >
          <img
            src={activeImage}
            alt={photoset.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            style={{ maxHeight: '560px' }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-900 shadow-lg transition-opacity">
              Xem {allImages.length} ảnh
            </span>
          </div>
        </div>
        <div className="p-4 flex gap-3 overflow-x-auto scrollbar-hide border-t border-slate-50">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${safeIndex === idx ? 'border-indigo-600 ring-2 ring-indigo-200 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Photographer bar + CTA (1 cột, không còn 2 cột) */}
      <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-lg flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img src={photoset.photographer.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-lg" />
          <div>
            <h3 className="font-black text-lg text-slate-900">{photoset.photographer.name}</h3>
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-black text-slate-900">{photoset.photographer.rating}</span>
              <span>· {photoset.photographer.reviewCount} đánh giá</span>
              <span>·</span>
              <MapPin className="h-4 w-4 text-indigo-500 inline" />
              <span>{photoset.photographer.location}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/photographers/${photoset.photographer.id}`}
            className="rounded-xl border-2 border-slate-200 py-3 px-6 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            Xem profile
          </Link>
          {photographer && photographer.status === 'APPROVED' && (
            <button
              type="button"
              onClick={() => setBookingOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 px-8 text-[11px] font-black uppercase tracking-widest text-white shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              <CalendarDays className="h-5 w-5" /> Đặt lịch gói này
            </button>
          )}
        </div>
      </div>

      <div className="space-y-10">
          <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap gap-2 mb-4">
              {photoset.tags.map((tag) => (
                <span key={tag} className="rounded-xl bg-slate-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-100">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">{photoset.title}</h1>
            <p className="mt-4 text-2xl font-black text-indigo-600">Từ {formatVnd(photoset.price)}</p>
            <p className="mt-6 text-slate-600 leading-relaxed">{photoset.description}</p>
            <h3 className="mt-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Bao gồm</h3>
            <ul className="mt-4 grid sm:grid-cols-2 gap-3">
              {photoset.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                  <span className="text-sm font-medium">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Package details */}
          <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-900">Chi tiết gói chụp ảnh</h3>
            <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/50 p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-black text-slate-900">Standard</h4>
                <span className="font-black text-indigo-700">{formatVnd(photoset.packageDetails.standard.price)}</span>
              </div>
              <ul className="space-y-2">
                {photoset.packageDetails.standard.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            {photoset.packageDetails.premium && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-900">Premium</h4>
                    <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">DELUXE</span>
                  </div>
                  <span className="font-black text-slate-700">{formatVnd(photoset.packageDetails.premium.price)}</span>
                </div>
                <ul className="space-y-2">
                  {photoset.packageDetails.premium.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Add-ons */}
            {photoset.addOns.length > 0 && (
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setAddOnsOpen(!addOnsOpen)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <span className="font-black text-slate-900 text-sm">Add-ons có thể chọn thêm</span>
                  {addOnsOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                </button>
                <AnimatePresence>
                  {addOnsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 overflow-hidden"
                    >
                      <div className="p-4 pt-0 space-y-3">
                        {photoset.addOns.map((ao) => (
                          <div key={ao.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-sm font-medium text-slate-700">{ao.name}</span>
                            <span className="text-sm font-black text-slate-600">+{formatVnd(ao.price)}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Policies */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setPoliciesOpen(!policiesOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <span className="font-black text-slate-900 text-sm">Quy định và chính sách</span>
                {policiesOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
              </button>
              <AnimatePresence>
                {policiesOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100 overflow-hidden"
                  >
                    <ul className="p-4 pt-0 space-y-2">
                      {photoset.policies.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="text-slate-300">•</span> {p}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      {/* Booking modal — đặt gói chụp (book gói) */}
      {photographer && (
        <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} photographer={photographer} photoset={photoset} />
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {galleryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          >
            <div className="flex justify-between items-center p-4 text-white">
              <span className="text-sm text-slate-300">{activeIndex + 1} / {allImages.length}</span>
              <button type="button" onClick={() => setGalleryOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 relative">
              <img src={activeImage} alt="" className="max-h-full max-w-full object-contain" />
              <button
                type="button"
                onClick={() => goToImage('prev')}
                className="absolute left-4 p-3 bg-black/50 hover:bg-black/70 rounded-2xl text-white backdrop-blur transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => goToImage('next')}
                className="absolute right-4 p-3 bg-black/50 hover:bg-black/70 rounded-2xl text-white backdrop-blur transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
            <div className="h-24 bg-black/50 overflow-x-auto flex items-center gap-2 px-4 scrollbar-hide">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeIndex === idx ? 'border-indigo-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-75'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
