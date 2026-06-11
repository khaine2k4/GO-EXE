import api from './api'

export type SettlementStatus = 'ALL' | 'PENDING' | 'READY' | 'RECONCILED' | 'PAID' | 'FAILED' | 'CANCELLED'

export type SettlementItem = {
  settlementId: number
  bookingId: number
  bookingCode: string
  studioId: number
  studioName: string
  customerName: string
  bookingStatus: string
  grossAmount: number
  platformFeePercent: number
  platformFeeAmount: number
  studioAmount: number
  status: string
  payoutMethod: string
  completedAt?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
}

export type SettlementParams = {
  status?: SettlementStatus
  studioId?: number
  search?: string
  sortBy?: string
}

export function getAdminSettlements(params: SettlementParams = {}) {
  return api.get<SettlementItem[]>('/admin/settlements', { params }).then((res) => res.data)
}

export function reconcileSettlement(id: number, payoutMethod = 'RECONCILIATION') {
  return api.post<{ message: string; settlement: SettlementItem }>(`/admin/settlements/${id}/payout`, { payoutMethod }).then((res) => res.data)
}

export const markSettlementPaid = reconcileSettlement

export function getStudioSettlements(params: Pick<SettlementParams, 'status'> = {}) {
  return api.get<SettlementItem[]>('/studio/settlements', { params }).then((res) => res.data)
}
