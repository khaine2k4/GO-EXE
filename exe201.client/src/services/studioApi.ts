import api from './api'
import type { StudioDashboard, StudioDetail, StudioSummary } from './catalogTypes'

export type StudioSearchParams = {
  keyword?: string
  search?: string
  city?: string
  categoryId?: number | ''
}

export function getStudios(params: StudioSearchParams = {}) {
  return api.get<StudioSummary[]>('/studios', { params }).then((res) => res.data)
}

export function getStudioDetail(id: string | number) {
  return api.get<StudioDetail>(`/studios/${id}`).then((res) => res.data)
}

export function getStudioDashboard() {
  return api.get<StudioDashboard>('/studio/dashboard').then((res) => res.data)
}
