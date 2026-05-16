interface WatermarkImageProps {
  src: string
  alt?: string
  isLocked: boolean
  label?: string
  className?: string
}

export default function WatermarkImage({ src, alt = 'Photo', isLocked, label = 'PREVIEW', className = '' }: WatermarkImageProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-100 ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-300 ${isLocked ? 'scale-105 select-none' : ''}`}
        onContextMenu={(e) => isLocked && e.preventDefault()}
      />
      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          {/* Watermark grid */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 select-none pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 60px,
                  rgba(255,255,255,0.08) 60px,
                  rgba(255,255,255,0.08) 61px
                )`,
              }}
            />
          </div>
          {/* Center badge */}
          <div className="relative z-10 rounded-xl border border-white/60 bg-black/50 px-4 py-2 backdrop-blur-sm">
            <span className="text-xs font-black tracking-[0.25em] text-white/90">{label}</span>
          </div>
          <p className="relative z-10 text-[10px] text-white drop-shadow-md font-semibold bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">Duyệt ảnh để nhận file gốc</p>
        </div>
      )}
    </div>
  )
}
