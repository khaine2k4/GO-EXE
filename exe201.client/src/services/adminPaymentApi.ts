import api from './api'

export type AdminPaymentStatus = 'ALL' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'FORFEITED' | 'CANCELLED' | 'REFUND_PENDING'
export type AdminPaymentMethod = 'ALL' | 'CASH' | 'VNPAY' | 'BANK_TRANSFER' | 'MOMO' | 'PAYPAL' | 'PAYOS'

export type AdminPaymentItem = {
  paymentId: number
  paymentCode: string
  bookingId: number
  bookingCode: string
  customerId: number
  customerName: string
  customerEmail: string
  studioId: number
  studioName: string
  amount: number
  currencyCode: string
  paymentMethod: string
  paymentStatus: string
  transactionCode?: string
  providerRef?: string
  failureReason?: string
  paidAt?: string
  refundedAt?: string
  refundAmount?: number
  retainedAmount?: number
  studioCompensationAmount?: number
  policyCode?: string
  policyNote?: string
  createdAt: string
  updatedAt: string
}

export type AdminPaymentDetail = AdminPaymentItem & {
  bookingStatus: string
  shootingDate?: string
  shootingLocation?: string
  packageName: string
  grossAmount: number
  commissionPercent: number
  commissionAmount: number
  studioRevenue: number
  refundReason?: string
}

export type AdminPaymentParams = {
  search?: string
  status?: AdminPaymentStatus
  method?: AdminPaymentMethod
  studioId?: number | ''
  from?: string
  to?: string
  sortBy?: string
}

export type UpdateAdminPaymentStatusPayload = {
  status: Exclude<AdminPaymentStatus, 'ALL'>
  reason?: string
  transactionCode?: string
}

type AdminPaymentMutationResponse = {
  message: string
  payment: AdminPaymentDetail
}

export function getAdminPayments(params: AdminPaymentParams = {}) {
  return api.get<AdminPaymentItem[]>('/admin/payments', { params }).then((res) => res.data)
}

export function getAdminPaymentDetail(id: number) {
  return api.get<AdminPaymentDetail>(`/admin/payments/${id}`).then((res) => res.data)
}

export function updateAdminPaymentStatus(id: number, payload: UpdateAdminPaymentStatusPayload) {
  return api.patch<AdminPaymentMutationResponse>(`/admin/payments/${id}/status`, payload).then((res) => res.data)
}
