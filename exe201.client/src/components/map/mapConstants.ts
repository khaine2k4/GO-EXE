import type { StyleSpecification } from 'maplibre-gl'

export type MapCoordinate = {
  lat: number
  lng: number
}

export const DA_NANG_CENTER: MapCoordinate = {
  lat: 16.0471,
  lng: 108.2068,
}

export function hasCoordinate(value?: { lat?: number | null; lng?: number | null }): value is MapCoordinate {
  return typeof value?.lat === 'number'
    && Number.isFinite(value.lat)
    && typeof value?.lng === 'number'
    && Number.isFinite(value.lng)
}

export function coordinateToGoogleMapsUrl(value: MapCoordinate) {
  return `https://www.google.com/maps?q=${value.lat},${value.lng}`
}

export function coordinateToDirectionsUrl(value: MapCoordinate) {
  return `https://www.google.com/maps/dir/?api=1&destination=${value.lat},${value.lng}`
}

export function osmRasterStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'osm',
        type: 'raster',
        source: 'osm',
      },
    ],
  }
}
