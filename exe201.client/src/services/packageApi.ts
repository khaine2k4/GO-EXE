import api from './api'
import type { PackageItem } from './catalogTypes'

export function getPackages(params: { serviceId?: number; studioId?: number } = {}) {
  return api.get<PackageItem[]>('/packages', { params }).then((res) => res.data)
}

export function getPackageDetail(id: number) {
  return api.get<PackageItem>(`/packages/${id}`).then((res) => res.data)
}

export function getStudioPackages() {
  return api.get<PackageItem[]>('/studio/packages').then((res) => res.data)
}

export function createStudioPackage(payload: { serviceId: number; packageName: string; description?: string; price: number; durationHours?: number; maxPhotos?: number; inclusions?: string; sortOrder: number; isActive?: boolean }) {
  return api.post<PackageItem>('/studio/packages', payload).then((res) => res.data)
}

export function updateStudioPackage(id: number, payload: { serviceId: number; packageName: string; description?: string; price: number; durationHours?: number; maxPhotos?: number; inclusions?: string; sortOrder: number; isActive: boolean }) {
  return api.put<PackageItem>(`/studio/packages/${id}`, payload).then((res) => res.data)
}

export function deleteStudioPackage(id: number) {
  return api.delete(`/studio/packages/${id}`).then((res) => res.data)
}

export function updateStudioPackagePrice(id: number, price: number) {
  return api.put<PackageItem>(`/studio/packages/${id}/price`, { price }).then((res) => res.data)
}
