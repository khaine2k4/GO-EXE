import api from './api'
import type { ServiceDetail, ServiceSummary } from './catalogTypes'

export type ServiceSearchParams = {
  keyword?: string
  categoryId?: number | ''
  city?: string
  minPrice?: number | ''
  maxPrice?: number | ''
}

export function getServices(params: ServiceSearchParams = {}) {
  return api.get<ServiceSummary[]>('/services', { params }).then((res) => res.data)
}

export function getServiceDetail(id: string | number) {
  return api.get<ServiceDetail>(`/services/${id}`).then((res) => res.data)
}

export function getStudioServices() {
  return api.get<ServiceSummary[]>('/studio/services').then((res) => res.data)
}

export function createStudioService(payload: { categoryId: number; serviceName: string; description?: string; thumbnailUrl?: string; city?: string; sortOrder: number }) {
  return api.post<ServiceDetail>('/studio/services', payload).then((res) => res.data)
}

export function updateStudioService(id: number, payload: { categoryId: number; serviceName: string; description?: string; thumbnailUrl?: string; city?: string; sortOrder: number; isActive: boolean }) {
  return api.put<ServiceDetail>(`/studio/services/${id}`, payload).then((res) => res.data)
}

export function deleteStudioService(id: number) {
  return api.delete(`/studio/services/${id}`).then((res) => res.data)
}

export function toggleStudioService(id: number, isActive: boolean) {
  return api.put(`/studio/services/${id}/toggle`, { isActive }).then((res) => res.data)
}
