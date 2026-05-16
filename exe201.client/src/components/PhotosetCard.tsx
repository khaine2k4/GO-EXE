import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, ChevronLeft, ChevronRight, Camera } from 'lucide-react'
import type { Photoset } from '../types'

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
}

export default function PhotosetCard({ photoset, style }: { photoset: Photoset; style: React.CSSProperties }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const images = [photoset.coverImage, ...photoset.images]

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="masonry-item" style={style}>
      <Link
        to={`/photosets/${photoset.id}`}
        className="group relative block h-full w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-200/50 transition-all duration-300 hover:shadow-xl hover:ring-slate-300/50"
      >
        <div className="relative h-full w-full overflow-hidden">
          <img
            src={images[currentImageIndex]}
            alt={photoset.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          {/* Carousel arrows (chỉ hover mới hiện) */}
          <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none">
            <button
              type="button"
              onClick={prevImage}
              className="p-1.5 bg-white/50 hover:bg-white text-slate-900 rounded-full backdrop-blur-sm shadow-sm transition-all pointer-events-auto transform -translate-x-2 group-hover:translate-x-0"
            >
              <ChevronLeft className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="p-1.5 bg-white/50 hover:bg-white text-slate-900 rounded-full backdrop-blur-sm shadow-sm transition-all pointer-events-auto transform translate-x-2 group-hover:translate-x-0"
            >
              <ChevronRight className="h-[18px] w-[18px]" />
            </button>
          </div>

          {/* Dots (chỉ hover) */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10">
            {images.slice(0, 5).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 w-1.5 rounded-full transition-colors shadow-sm ${idx === currentImageIndex ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>

          {/* Info overlay — chỉ vào (hover) mới trượt lên */}
          <div className="absolute inset-x-0 bottom-0 pt-12 pb-4 px-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0">
            <h3 className="text-white font-bold leading-tight mb-1 line-clamp-1 drop-shadow-md">{photoset.title}</h3>
            <p className="text-white/90 text-sm font-medium mb-3 drop-shadow-md">Từ {formatVnd(photoset.price)}</p>
            <div className="flex items-center gap-2 pt-3 border-t border-white/20">
              <img
                src={photoset.photographer.avatar}
                alt={photoset.photographer.name}
                className="h-6 w-6 rounded-full object-cover border border-white/50"
              />
              <div className="flex-1 min-w-0 text-white">
                <p className="text-xs font-medium truncate">{photoset.photographer.name}</p>
                <div className="flex items-center text-xs text-white/70">
                  <Star className="h-[10px] w-[10px] text-yellow-400 fill-current mr-0.5" />
                  <span>{photoset.photographer.rating} ({photoset.photographer.reviewCount})</span>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-4 -translate-y-full mb-2 bg-black/50 backdrop-blur-sm p-1.5 rounded-full text-white">
              <Camera className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Tag góc trái trên (chỉ hover) */}
          {photoset.tags[0] && (
            <div className="absolute left-3 top-3 flex flex-wrap gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-black/50 backdrop-blur-sm text-white rounded shadow-sm">
                {photoset.tags[0]}
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}
