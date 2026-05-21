import api from './api'
import type { ReviewItem } from './catalogTypes'

export function getStudioReviews(studioId: number) {
  return api.get<ReviewItem[]>(`/studios/${studioId}/reviews`).then((res) => res.data)
}

export function getStudioRatingSummary(studioId: number) {
  return api.get<{ avgRating: number; totalReviews: number }>(`/studios/${studioId}/rating-summary`).then((res) => res.data)
}
