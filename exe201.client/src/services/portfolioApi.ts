import api from './api'
import type { PortfolioItem } from './catalogTypes'

export function getPortfolios(params: { serviceId?: number; studioId?: number } = {}) {
  return api.get<PortfolioItem[]>('/portfolios', { params }).then((res) => res.data)
}

export function getStudioPortfolios() {
  return api.get<PortfolioItem[]>('/studio/portfolios').then((res) => res.data)
}

export function createStudioPortfolio(payload: { serviceId?: number; imageUrl: string; caption?: string; sortOrder: number }) {
  return api.post<PortfolioItem>('/studio/portfolios', payload).then((res) => res.data)
}

export function deleteStudioPortfolio(id: number) {
  return api.delete(`/studio/portfolios/${id}`).then((res) => res.data)
}
