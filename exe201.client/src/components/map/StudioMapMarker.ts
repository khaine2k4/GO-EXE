import type { StudioSummary } from '../../services/catalogTypes'
import type { AppMapMarker } from './AppMap'
import { coordinateToDirectionsUrl, hasCoordinate } from './mapConstants'

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80'

export type StudioMapMarker = AppMapMarker

export function studioToMapMarker(studio: StudioSummary): AppMapMarker | null {
  if (!hasCoordinate(studio)) return null

  const cover = escapeHtml(studio.coverUrl || studio.logoUrl || FALLBACK_COVER)
  const name = escapeHtml(studio.name || 'Studio')
  const address = escapeHtml([studio.district, studio.city].filter(Boolean).join(', ') || studio.addressLine || 'Da Nang')
  const price = studio.minPrice ? `${new Intl.NumberFormat('vi-VN').format(studio.minPrice)} đ` : 'Liên hệ'
  const rating = Number(studio.rating ?? 0).toFixed(1)
  const directionsUrl = coordinateToDirectionsUrl({ lat: studio.lat, lng: studio.lng })

  return {
    id: studio.id,
    lat: studio.lat,
    lng: studio.lng,
    title: studio.name,
    tone: 'studio',
    popupHtml: `
      <div style="width:250px; font-family:Inter, system-ui, sans-serif; color:#0f172a;">
        <div style="position:relative;height:118px;margin:-2px -2px 12px;overflow:hidden;border-radius:16px;background:#e2e8f0;">
          <img src="${cover}" alt="${name}" style="height:100%;width:100%;object-fit:cover;" />
          <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.68));"></div>
          <div style="position:absolute;left:12px;right:12px;bottom:10px;color:#fff;font-size:15px;font-weight:900;line-height:1.25;">${name}</div>
        </div>
        <div style="font-size:12px;font-weight:700;color:#64748b;line-height:1.45;">${address}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:12px;">
          <span style="display:inline-flex;align-items:center;gap:4px;border-radius:999px;background:#fff7ed;color:#f97316;padding:6px 9px;font-size:12px;font-weight:900;">&#9733; ${rating}</span>
          <span style="font-size:12px;font-weight:900;color:#004aad;">Từ ${price}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;">
          <a href="#/photographers/${studio.id}" style="border-radius:999px;background:#004aad;color:#fff;text-align:center;text-decoration:none;font-size:11px;font-weight:900;padding:10px 12px;">Xem studio</a>
          <a href="${directionsUrl}" target="_blank" rel="noreferrer" style="border-radius:999px;border:1px solid #fed7aa;background:#fff7ed;color:#ea580c;text-align:center;text-decoration:none;font-size:11px;font-weight:900;padding:9px 12px;">Chỉ đường</a>
        </div>
      </div>
    `,
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
