import { Star, MapPin } from 'lucide-react'

interface PhotoCardProps {
  imageUrl: string
  photographerName: string
  location: string
  startingPriceVnd: number
  rating: number
  reviewCount?: number
  tags?: string[]
  isTopRated?: boolean
  onClick: () => void
}

function formatVnd(v: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(v) + ' ₫'
}

export default function PhotoCard({
  imageUrl,
  photographerName,
  location,
  startingPriceVnd,
  rating,
  reviewCount,
  tags = [],
  isTopRated,
  onClick,
}: PhotoCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-[40px] bg-slate-100 text-left shadow-2xl shadow-slate-200/20 transition-all duration-700 hover:-translate-y-2 hover:shadow-indigo-200/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20"
    >
      {/* Image Container with Zoom Effect */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={imageUrl}
          alt={photographerName}
          className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
          loading="lazy"
        />

        {/* Dynamic Glass Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80" />

        {/* Top-rated Ribbon */}
        {isTopRated && (
          <div className="absolute left-6 top-6 z-10 flex items-center gap-2 rounded-2xl bg-white/20 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-xl ring-1 ring-white/30">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> MASTER CLASS
          </div>
        )}

        {/* Content Content Area */}
        <div className="absolute bottom-0 left-0 right-0 p-8 pt-20">
          <div className="space-y-4">
            {/* Essential Info */}
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-xl font-black tracking-tight text-white drop-shadow-2xl">{photographerName}</h3>
                <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-indigo-300 uppercase tracking-widest">
                  <MapPin className="h-3.5 w-3.5" />
                  {location}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dịch vụ từ</div>
                <div className="text-base font-black text-white">{formatVnd(startingPriceVnd)}</div>
              </div>
            </div>

            {/* Tags & Rating Expand (Visible on Hover / Bottom on Default) */}
            <div className="flex flex-col gap-4 overflow-hidden pt-2">
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 3).map((t) => (
                  <span key={t} className="rounded-xl border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4 opacity-0 transition-all duration-500 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                <div className="flex items-center gap-2 rounded-full px-1 text-white">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-[13px] font-black">{rating.toFixed(1)}</span>
                  {reviewCount && <span className="text-[11px] text-white/50 font-bold ml-1">{reviewCount} reviews</span>}
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">XEM HỒ SƠ →</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
