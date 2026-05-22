import { MapPin, Star } from 'lucide-react'

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
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(v) + ' VND'
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
      type="button"
      onClick={onClick}
      className="group w-full overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={photographerName}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
        {isTopRated && (
          <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[var(--color-ink)] shadow-sm">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            Top rated
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="truncate text-xl font-semibold text-white">{photographerName}</h3>
          <div className="mt-2 flex items-center gap-2 text-sm font-medium text-white/85">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{location}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase text-[var(--color-graphite)]">Service from</div>
            <div className="mt-1 text-lg font-semibold text-[var(--color-ink)]">{formatVnd(startingPriceVnd)}</div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
            {reviewCount ? <span className="text-slate-400">({reviewCount})</span> : null}
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-[var(--color-fog)] px-3 py-1 text-xs font-medium text-[var(--color-slate)]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}
