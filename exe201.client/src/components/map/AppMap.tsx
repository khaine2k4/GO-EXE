import { useEffect, useMemo, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { DA_NANG_CENTER, type MapCoordinate, osmRasterStyle } from './mapConstants'

export type AppMapMarker = MapCoordinate & {
  id: string | number
  title?: string
  popupHtml?: string
  tone?: 'studio' | 'booking'
}

type AppMapProps = {
  center?: MapCoordinate
  zoom?: number
  markers?: AppMapMarker[]
  selectedMarkerId?: string | number | null
  className?: string
  interactive?: boolean
  fitToMarkers?: boolean
  openSelectedPopup?: boolean
  onMarkerClick?: (id: string | number) => void
}

export default function AppMap({
  center = DA_NANG_CENTER,
  zoom = 12,
  markers = [],
  selectedMarkerId,
  className = 'h-80 w-full',
  interactive = true,
  fitToMarkers = false,
  openSelectedPopup = false,
  onMarkerClick,
}: AppMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRefs = useRef<Array<{ id: string | number; marker: maplibregl.Marker; element: HTMLDivElement }>>([])
  const onMarkerClickRef = useRef(onMarkerClick)
  const markerKey = useMemo(() => markers.map((marker) => `${marker.id}:${marker.lat}:${marker.lng}`).join('|'), [markers])

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick
  }, [onMarkerClick])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: osmRasterStyle(),
      center: [center.lng, center.lat],
      zoom,
      attributionControl: { compact: true },
      interactive,
    })

    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    }

    mapRef.current = map

    return () => {
      markerRefs.current.forEach(({ marker }) => marker.remove())
      markerRefs.current = []
      map.remove()
      mapRef.current = null
    }
  }, [center.lat, center.lng, interactive, zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (fitToMarkers && markers.length > 0) return

    map.easeTo({ center: [center.lng, center.lat], zoom, duration: 450 })
  }, [center.lat, center.lng, fitToMarkers, markers.length, zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markerRefs.current.forEach(({ marker }) => marker.remove())
    markerRefs.current = markers.map((marker) => {
      const element = createMarkerElement(marker.tone ?? 'studio')
      const mapMarker = new maplibregl.Marker({ element })
        .setLngLat([marker.lng, marker.lat])

      if (marker.popupHtml || marker.title) {
        mapMarker.setPopup(
          new maplibregl.Popup({ offset: 24, closeButton: false, maxWidth: 'none' }).setHTML(
            marker.popupHtml ?? marker.title ?? ''
          )
        )
      }

      element.addEventListener('click', () => onMarkerClickRef.current?.(marker.id))
      mapMarker.addTo(map)
      return { id: marker.id, marker: mapMarker, element }
    })
  }, [markerKey, markers])

  useEffect(() => {
    markerRefs.current.forEach(({ id, element }) => {
      setMarkerSelected(element, id === selectedMarkerId)
    })
  }, [selectedMarkerId])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !fitToMarkers || markers.length === 0 || selectedMarkerId) return

    if (markers.length === 1) {
      const marker = markers[0]
      map.easeTo({ center: [marker.lng, marker.lat], zoom: Math.max(zoom, 13), duration: 500 })
      return
    }

    const bounds = new maplibregl.LngLatBounds()
    markers.forEach((marker) => bounds.extend([marker.lng, marker.lat]))
    map.fitBounds(bounds, { padding: 72, maxZoom: 14, duration: 600 })
  }, [fitToMarkers, markerKey, markers, selectedMarkerId, zoom])

  useEffect(() => {
    const map = mapRef.current
    const selected = markers.find((marker) => marker.id === selectedMarkerId)
    if (!map || !selected) return

    map.easeTo({ center: [selected.lng, selected.lat], zoom: Math.max(zoom, 13), duration: 450 })
    if (openSelectedPopup) {
      const markerRef = markerRefs.current.find((item) => item.id === selectedMarkerId)
      const popup = markerRef?.marker.getPopup()
      markerRefs.current.forEach(({ id, marker }) => {
        const itemPopup = marker.getPopup()
        if (id !== selectedMarkerId && itemPopup?.isOpen()) marker.togglePopup()
      })
      if (markerRef && popup && !popup.isOpen()) markerRef.marker.togglePopup()
    }
  }, [markerKey, markers, openSelectedPopup, selectedMarkerId, zoom])

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}

function createMarkerElement(tone: 'studio' | 'booking') {
  const element = document.createElement('div')
  element.className = [
    'relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-[3px] border-white shadow-xl shadow-slate-950/20 transition-[box-shadow,filter] duration-150 will-change-auto hover:brightness-105',
    tone === 'booking' ? 'bg-orange-500' : 'bg-[var(--color-azure)]',
  ].join(' ')
  const icon = tone === 'booking'
    ? '<path d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>'
    : '<path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3h5Z"/><circle cx="12" cy="13" r="3.25"/>'
  element.innerHTML = `
    <div data-marker-halo="true" class="pointer-events-none absolute -inset-1 rounded-full border-2 border-transparent opacity-0 transition-opacity duration-150"></div>
    <div class="pointer-events-none absolute inset-0 rounded-full ring-4 ring-white/35"></div>
    <svg viewBox="0 0 24 24" class="relative h-5 w-5 fill-none stroke-white stroke-[2.4]">
      ${icon}
    </svg>
    <div class="pointer-events-none absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-[3px] border-r-[3px] border-white ${tone === 'booking' ? 'bg-orange-500' : 'bg-[var(--color-azure)]'}"></div>
  `
  return element
}

function setMarkerSelected(element: HTMLDivElement, selected: boolean) {
  const halo = element.querySelector('[data-marker-halo="true"]')
  element.classList.toggle('z-10', selected)
  element.classList.toggle('shadow-2xl', selected)
  element.classList.toggle('shadow-slate-950/30', selected)
  halo?.classList.toggle('opacity-100', selected)
  halo?.classList.toggle('border-orange-300', selected)
}
