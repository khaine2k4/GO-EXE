import { useEffect, useState, type SyntheticEvent } from 'react'

interface WatermarkImageProps {
  src: string
  alt?: string
  isLocked: boolean
  label?: string
  className?: string
  fit?: 'cover' | 'contain'
}

export default function WatermarkImage({
  src,
  alt = 'Photo',
  isLocked,
  label = 'GO! PREVIEW',
  className = '',
  fit = 'cover',
}: WatermarkImageProps) {
  const [displaySrc, setDisplaySrc] = useState(src)
  const [loadError, setLoadError] = useState(false)
  const isApiPreview = src.startsWith('/api/')

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    async function loadProtectedImage() {
      setLoadError(false)

      if (!src.startsWith('/api/')) {
        setDisplaySrc(src)
        return
      }

      const token = localStorage.getItem('token')
      if (!token) {
        setLoadError(true)
        setDisplaySrc('')
        return
      }

      try {
        const response = await fetch(src, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) throw new Error(`Image preview failed: ${response.status}`)

        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)
        if (!cancelled) setDisplaySrc(objectUrl)
      } catch {
        if (!cancelled) {
          setLoadError(true)
          setDisplaySrc('')
        }
      }
    }

    void loadProtectedImage()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src])

  function blockLockedImage(event: SyntheticEvent) {
    if (isLocked) event.preventDefault()
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-slate-100 ${className}`}
      onContextMenu={blockLockedImage}
      onDragStart={blockLockedImage}
    >
      {displaySrc ? (
        <img
          src={displaySrc}
          alt={alt}
          draggable={!isLocked}
          className={`h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} transition-all duration-300 ${isLocked ? 'pointer-events-none select-none' : ''}`}
        />
      ) : (
        <div className="flex h-full min-h-28 w-full items-center justify-center bg-slate-100 px-4 text-center text-xs font-bold text-slate-400">
          {loadError ? 'Không thể tải ảnh xem trước' : 'Đang tải ảnh...'}
        </div>
      )}
      {isLocked && !isApiPreview && (
        <div className="pointer-events-none absolute inset-0 select-none">
          <div className="absolute inset-0 bg-slate-950/10" />
          <div
            className="absolute inset-[-80px] opacity-35"
            style={{
              backgroundImage:
                'repeating-linear-gradient(-28deg, transparent 0 76px, rgba(255,255,255,0.55) 76px 78px, transparent 78px 152px)',
            }}
          />
          <div className="absolute inset-0 grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className="flex -rotate-12 items-center justify-center rounded-xl border border-white/45 bg-white/20 px-3 py-2 text-center text-lg font-black tracking-[0.18em] text-white shadow-sm backdrop-blur-[1px]"
              >
                GO!
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl border border-white/70 bg-slate-950/55 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white shadow-lg backdrop-blur-sm">
              {label}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
