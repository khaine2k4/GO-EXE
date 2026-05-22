import api from './api'

export type AdminServiceStatus = 'ALL' | 'ACTIVE' | 'INACTIVE'

export type AdminServiceItem = {
  serviceId: number
  serviceName: string
  studioId: number
  studioName: string
  categoryId: number
  categoryName: string
  city?: string
  minPrice?: number
  maxPrice?: number
  isActive: boolean
  isHidden: boolean
  hiddenBy?: number
  hiddenByName?: string
  hiddenAt?: string
  createdAt: string
  updatedAt: string
  packageCount: number
}

export type AdminServiceParams = {
  search?: string
  status?: AdminServiceStatus
  categoryId?: number | ''
  studioId?: number | ''
  isHidden?: boolean | ''
  sortBy?: string
}

type AdminServiceMutationResponse = {
  message: string
  service: AdminServiceItem
}

export function getAdminServices(params: AdminServiceParams = {}) {
  return api.get<AdminServiceItem[]>('/admin/services', { params }).then((res) => res.data)
}

export function hideAdminService(id: number, reason?: string) {
  return api.patch<AdminServiceMutationResponse>(`/admin/services/${id}/hide`, { reason }).then((res) => res.data)
}

export function unhideAdminService(id: number) {
  return api.patch<AdminServiceMutationResponse>(`/admin/services/${id}/unhide`).then((res) => res.data)
}

export function deleteAdminService(id: number, reason?: string) {
  return api.patch<AdminServiceMutationResponse>(`/admin/services/${id}/delete`, { reason }).then((res) => res.data)
}
