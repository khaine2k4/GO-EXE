import { ExternalLink, MapPin, Navigation } from 'lucide-react'
import AppMap from './AppMap'
import { coordinateToDirectionsUrl, coordinateToGoogleMapsUrl, hasCoordinate } from './mapConstants'

type BookingLocationMapProps = {
  lat?: number | null
  lng?: number | null
  address?: string
  title?: string
  subtitle?: string
}

export default function BookingLocationMap({ lat, lng, address, title = 'Địa điểm chụp', subtitle }: BookingLocationMapProps) {
  const coordinate = { lat, lng }

  if (!hasCoordinate(coordinate)) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
        Chưa có tọa độ bản đồ cho booking này.
      </div>
    )
  }

  const googleMapsUrl = coordinateToGoogleMapsUrl(coordinate)
  const directionsUrl = coordinateToDirectionsUrl(coordinate)
  const popupTitle = escapeHtml(address || 'Địa điểm chụp')

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
            <MapPin className="h-4 w-4 text-orange-500" />
            {title}
          </div>
          <p className="mt-1 text-sm font-bold text-slate-900">{address || 'Địa điểm đã chọn trên bản đồ'}</p>
          {subtitle && <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black uppercase text-slate-700 hover:border-orange-200 hover:text-orange-600"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Google Maps
          </a>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 text-[10px] font-black uppercase text-white shadow-lg shadow-orange-500/15 hover:bg-orange-600"
          >
            <Navigation className="h-3.5 w-3.5" />
            Chỉ đường
          </a>
        </div>
      </div>
      <AppMap
        center={coordinate}
        zoom={14}
        className="h-64 w-full"
        markers={[{
          id: 'booking-location',
          ...coordinate,
          tone: 'booking',
          popupHtml: `
            <div style="width:220px;font-family:Inter,system-ui,sans-serif;color:#0f172a;">
              <div style="font-size:13px;font-weight:900;line-height:1.35;">${popupTitle}</div>
              ${subtitle ? `<div style="margin-top:4px;font-size:11px;font-weight:700;color:#64748b;">${escapeHtml(subtitle)}</div>` : ''}
              <a href="${directionsUrl}" target="_blank" rel="noreferrer" style="display:block;margin-top:12px;border-radius:999px;background:#f97316;color:white;text-align:center;text-decoration:none;font-size:11px;font-weight:900;padding:9px 12px;">Chỉ đường</a>
            </div>
          `,
        }]}
      />
    </section>
  )
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
