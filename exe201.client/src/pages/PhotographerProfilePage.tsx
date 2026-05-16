import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, Star, ArrowLeft, CalendarDays, X, Shield, Check, Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/AppStore'
import BookingModal from '../components/BookingModal'
import type { Photoset } from '../types'

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
}

export default function PhotographerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { state } = useAppStore()
  const nav = useNavigate()
  const [bookingOpen, setBookingOpen] = useState(false)
  const [selectedPhotoset, setSelectedPhotoset] = useState<Photoset | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  function openBooking() {
    setBookingOpen(true)
  }

  const photographer = state.photographers.find((p) => p.id === id)
  const myPhotosets = state.photosets.filter((ps) => ps.photographer.id === id)
  const priceMin = myPhotosets.length > 0 ? Math.min(...myPhotosets.map((p) => p.price)) : photographer?.startingPrice ?? 0
  const priceMax = myPhotosets.length > 0
    ? Math.max(...myPhotosets.flatMap((p) => [p.price, p.packageDetails.premium?.price ?? 0, p.packageDetails.deluxe?.price ?? 0].filter(Boolean)))
    : photographer ? Math.round(photographer.startingPrice * 2.75) : 0
  // Portfolio Showcase = ảnh trong portfolio (Studio dùng ảnh này để tạo album trong gói)
  const portfolioItems = photographer
    ? photographer.portfolio.map((p) => ({ id: p.id, url: p.url, title: p.title }))
    : []

  if (!photographer) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <div className="text-xl font-black uppercase tracking-[0.2em]">Photographer Not Found</div>
        <button onClick={() => nav('/gallery')} className="mt-8 text-[11px] font-black uppercase tracking-widest text-indigo-600 hover:underline">← Quay lại Gallery</button>
      </div>
    )
  }

  return (
    <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Premium Studio Header */}
      <div className="relative overflow-hidden rounded-[48px] bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
        <div className="relative h-56 md:h-80 w-full overflow-hidden bg-slate-900">
          <img src={photographer.coverUrl} alt="cover" className="h-full w-full object-cover transition-transform duration-1000 hover:scale-105 opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

          <button
            onClick={() => nav(-1)}
            className="absolute left-8 top-8 z-20 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-xl transition-all hover:bg-white/20 active:scale-90"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        </div>

        <div className="relative -mt-24 px-8 pb-10 md:px-16 md:pb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex flex-col md:flex-row md:items-end gap-8">
              <div className="relative h-36 w-36 md:h-48 md:w-48 shrink-0 overflow-hidden rounded-[40px] border-8 border-white bg-white shadow-2xl">
                <img src={photographer.avatarUrl} alt={photographer.name} className="h-full w-full object-cover" />
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">{photographer.name}</h1>
                  {photographer.status === 'APPROVED' && (
                    <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 ring-1 ring-indigo-200">
                      VERIFIED STUDIO
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-6">
                  <span className="flex items-center gap-2 text-[13px] font-bold text-slate-500 uppercase tracking-widest">
                    <MapPin className="h-4.5 w-4.5 text-indigo-500" /> {photographer.location}
                  </span>
                  <span className="flex items-center gap-2 text-[13px] font-black text-amber-500 bg-amber-50 px-3 py-1 rounded-xl">
                    <Star className="h-4 w-4 fill-current" /> {photographer.rating.toFixed(1)}
                    <span className="text-slate-400 font-bold ml-1">({photographer.reviewCount})</span>
                  </span>
                  <span className="text-[13px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">
                    Giá dịch vụ: {new Intl.NumberFormat('vi-VN').format(priceMin)} – {new Intl.NumberFormat('vi-VN').format(priceMax)} ₫
                  </span>
                </div>
              </div>
            </div>

            {photographer.status === 'APPROVED' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  title={isFavorite ? "Bỏ lưu Yêu thích" : "Lưu vào Yêu thích"}
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-all active:scale-95 ${
                    isFavorite
                      ? 'border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100'
                      : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => openBooking()}
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-slate-900 px-10 text-[11px] font-black uppercase tracking-widest text-white shadow-2xl shadow-slate-900/20 transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-95"
                >
                  <CalendarDays className="h-5 w-5" /> ĐẶT LỊCH
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_380px] px-2">
        {/* Left Content */}
        <div className="space-y-12">
          {/* Bio & Style Tags */}
          <div className="rounded-[40px] border border-slate-100 bg-white p-10 shadow-sm transition-all hover:shadow-md">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">GIỚI THIỆU STUDIO</h2>
            <p className="text-lg leading-relaxed font-medium text-slate-600 italic">"{photographer.bio}"</p>
            <div className="mt-10 flex flex-wrap gap-2.5">
              {photographer.tags.map((tag) => (
                <span key={tag} className="rounded-xl bg-slate-50 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-100 transition-colors hover:bg-slate-900 hover:text-white cursor-default">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Portfolio Showcase — ảnh từ album đã tạo hoặc portfolio */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Portfolio Showcase</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{portfolioItems.length} WORK PIECES</span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {portfolioItems.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedPhoto(photo.url)}
                  className="group relative cursor-pointer aspect-square overflow-hidden rounded-[28px] bg-slate-50 shadow-sm ring-1 ring-slate-200/50"
                >
                  <img
                    src={photo.url}
                    alt={photo.title ?? `Photo ${i + 1}`}
                    className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white scale-90 group-hover:scale-100 transition-transform">VIEW MASTERPIECE</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Các gói đang có */}
        <div className="space-y-8">
          <div className="rounded-[36px] border border-slate-200 bg-white p-2 shadow-sm sticky top-24 ring-1 ring-slate-100">
            <div className="bg-slate-50/50 p-8 rounded-[32px]">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">CÁC GÓI CHỤP ẢNH</h3>
              {myPhotosets.length === 0 ? (
                <p className="text-sm font-medium text-slate-500 py-4">Studio chưa có gói nào.</p>
              ) : (
                <div className="space-y-2">
                  {myPhotosets.map((ps) => {
                    const isSelected = selectedPhotoset?.id === ps.id
                    return (
                      <div
                        key={ps.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedPhotoset(isSelected ? null : ps)}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedPhotoset(isSelected ? null : ps)}
                        className={`rounded-2xl border p-4 transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-200'
                            : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                        }`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white'
                        }`}>
                          {isSelected && <Check className="h-4 w-4" strokeWidth={3} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[13px] font-black text-slate-900 leading-tight line-clamp-2">{ps.title}</h4>
                          <p className="mt-0.5 text-sm font-black text-indigo-600">Từ {formatVnd(ps.price)}</p>
                        </div>
                        <Link
                          to={`/photosets/${ps.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 rounded-xl border border-slate-200 py-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          Xem gói
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="mt-8 flex items-start gap-4 rounded-2xl border border-indigo-100 bg-white p-5 text-[11px] font-bold text-slate-500 leading-relaxed shadow-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Shield className="h-4 w-4" />
                </div>
                <span>Số tiền đặt cọc được giữ an toàn bởi <strong>Escrow Protection</strong>. Chỉ giải ngân cho studio khi bạn hài lòng.</span>
              </div>

              {photographer.status === 'APPROVED' && myPhotosets.length > 0 ? (
                <button
                  onClick={() => openBooking()}
                  className="mt-8 flex w-full h-14 items-center justify-center gap-3 rounded-2xl bg-slate-900 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedPhotoset}
                  title={!selectedPhotoset ? 'Chọn một gói trước khi đặt lịch' : undefined}
                >
                  <CalendarDays className="h-5 w-5" /> ĐẶT LỊCH
                </button>
              ) : photographer.status !== 'APPROVED' ? (
                <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 py-4 text-center text-[10px] font-black text-amber-600 uppercase tracking-widest">
                  ⏳ STUDIO ĐANG CHỜ PHÊ DUYỆT
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Book Button */}
      {photographer.status === 'APPROVED' && (
        <div className="fixed bottom-8 left-4 right-4 md:hidden z-30">
          <button
            onClick={() => openBooking()}
            className="w-full rounded-[24px] bg-slate-900 py-5 text-[11px] font-black uppercase tracking-widest text-white shadow-2xl transition-all active:scale-[0.98]"
          >
            📅 Đặt lịch chụp ngay
          </button>
        </div>
      )}

      {/* Premium Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-xl"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-5xl"
            >
              <img
                src={selectedPhoto}
                alt="Preview"
                className="max-h-[85vh] w-full rounded-[40px] shadow-2xl ring-1 ring-white/20 object-contain"
              />
              <button className="absolute -top-16 right-0 h-12 w-12 flex items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all">
                <X className="h-6 w-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        photographer={photographer}
        photoset={selectedPhotoset ?? undefined}
      />
    </div>
  )
}
