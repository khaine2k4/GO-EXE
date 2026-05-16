import { Link } from 'react-router-dom'
import { Star, Camera } from 'lucide-react'
import type { Album, Photographer, Photoset } from '../types'

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
}

export type AlbumWithMeta = {
  album: Album
  photographer: Photographer
  photoset?: Photoset
}

export default function AlbumCard({ album, photographer, photoset, style }: AlbumWithMeta & { style?: React.CSSProperties }) {
  const photographerInfo = photoset?.photographer ?? {
    id: photographer.id,
    name: photographer.name,
    avatar: photographer.avatarUrl,
    rating: photographer.rating,
    reviewCount: photographer.reviewCount,
    location: photographer.location,
    bio: photographer.bio,
  }

  return (
    <div className="masonry-item" style={style}>
      <Link
        to={`/albums/${album.id}`}
        className="group relative block h-full w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-200/50 transition-all duration-300 hover:shadow-xl hover:ring-slate-300/50"
      >
        <div className="relative h-full w-full overflow-hidden">
          <img
            src={album.coverUrl}
            alt={album.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          {/* Info overlay — hover */}
          <div className="absolute inset-x-0 bottom-0 pt-12 pb-4 px-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0">
            <h3 className="text-white font-bold leading-tight mb-1 line-clamp-1 drop-shadow-md">{album.title}</h3>
            {photoset && (
              <p className="text-white/90 text-sm font-medium mb-3 drop-shadow-md">
                Gói: {photoset.title} · Từ {formatVnd(photoset.price)}
              </p>
            )}
            <div className="flex items-center gap-2 pt-3 border-t border-white/20">
              <img
                src={photographerInfo.avatar}
                alt={photographerInfo.name}
                className="h-6 w-6 rounded-full object-cover border border-white/50"
              />
              <div className="flex-1 min-w-0 text-white">
                <p className="text-xs font-medium truncate">{photographerInfo.name}</p>
                <div className="flex items-center text-xs text-white/70">
                  <Star className="h-[10px] w-[10px] text-yellow-400 fill-current mr-0.5" />
                  <span>{photographerInfo.rating} ({photographerInfo.reviewCount})</span>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-4 -translate-y-full mb-2 bg-black/50 backdrop-blur-sm p-1.5 rounded-full text-white">
              <Camera className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
