import { useEffect, useRef, useState } from 'react'
import { LocateFixed } from 'lucide-react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { DA_NANG_CENTER, type MapCoordinate, osmRasterStyle } from './mapConstants'

type LocationPickerMapProps = {
  value?: MapCoordinate | null
  onChange: (value: MapCoordinate) => void
  className?: string
}

export default function LocationPickerMap({ value, onChange, className = 'h-64 w-full' }: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const current = value ?? DA_NANG_CENTER

  function moveTo(next: MapCoordinate, zoom = 14) {
    markerRef.current?.setLngLat([next.lng, next.lat])
    mapRef.current?.easeTo({ center: [next.lng, next.lat], zoom, duration: 450 })
    onChange(next)
  }

  function useCurrentLocation() {
    setLocationError('')

    if (!navigator.geolocation) {
      setLocationError('Trình duyệt chưa hỗ trợ lấy vị trí hiện tại.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: roundCoordinate(position.coords.latitude),
          lng: roundCoordinate(position.coords.longitude),
        }
        moveTo(next, 15)
        setLocating(false)
      },
      () => {
        setLocationError('Không lấy được vị trí hiện tại. Bạn có thể kéo marker thủ công.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    )
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: osmRasterStyle(),
      center: [current.lng, current.lat],
      zoom: 12,
      attributionControl: { compact: true },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    const marker = new maplibregl.Marker({
      color: '#ff751f',
      draggable: true,
    })
      .setLngLat([current.lng, current.lat])
      .addTo(map)

    marker.on('dragend', () => {
      const position = marker.getLngLat()
      setLocationError('')
      onChange({ lat: roundCoordinate(position.lat), lng: roundCoordinate(position.lng) })
    })

    map.on('click', (event) => {
      const next = { lat: roundCoordinate(event.lngLat.lat), lng: roundCoordinate(event.lngLat.lng) }
      setLocationError('')
      marker.setLngLat([next.lng, next.lat])
      onChange(next)
    })

    mapRef.current = map
    markerRef.current = marker

    return () => {
      marker.remove()
      map.remove()
      markerRef.current = null
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker || !value) return

    marker.setLngLat([value.lng, value.lat])
    map.easeTo({ center: [value.lng, value.lat], duration: 400 })
  }, [value?.lat, value?.lng])

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute left-3 top-3 flex max-w-[calc(100%-88px)] flex-col gap-2">
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white/95 px-4 text-[11px] font-black uppercase tracking-wide text-slate-700 shadow-lg shadow-slate-950/10 backdrop-blur transition hover:text-orange-600 active:scale-95 disabled:opacity-60"
        >
          <LocateFixed className="h-4 w-4 text-orange-500" />
          {locating ? 'Đang lấy vị trí...' : 'Vị trí của tôi'}
        </button>
        {locationError && (
          <div className="rounded-2xl bg-white/95 px-3 py-2 text-xs font-semibold leading-5 text-rose-600 shadow-lg shadow-slate-950/10 backdrop-blur">
            {locationError}
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black text-slate-600 shadow-sm backdrop-blur">
        Kéo marker hoặc bấm vào bản đồ
      </div>
    </div>
  )
}

function roundCoordinate(value: number) {
  return Number(value.toFixed(7))
}
