import api from './api'
import type { StudioDashboard, StudioDetail } from './catalogTypes'

export function getStudioDetail(id: string | number) {
  return api.get<StudioDetail>(`/studios/${id}`).then((res) => res.data)
}

export function getStudioDashboard() {
  return api.get<StudioDashboard>('/studio/dashboard').then((res) => res.data)
}
