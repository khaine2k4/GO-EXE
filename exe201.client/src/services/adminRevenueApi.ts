import api from './api'

export type AdminRevenueParams = {
  from?: string
  to?: string
}

export type AdminRevenueSummary = {
  grossRevenue: number
  platformCommission: number
  studioPayout: number
  completedBookings: number
  paidPayments: number
  refundedAmount: number
  averageCommissionRate: number
}

export type AdminMonthlyRevenue = {
  year: number
  month: number
  grossRevenue: number
  platformCommission: number
  studioPayout: number
  completedBookings: number
}

export type AdminCommissionItem = {
  bookingId: number
  bookingCode: string
  studioId: number
  studioName: string
  customerName: string
  serviceName: string
  grossAmount: number
  commissionPercent: number
  commissionAmount: number
  studioRevenue: number
  paymentStatus: string
  bookingStatus: string
  completedAt?: string
  paidAt?: string
}

export type AdminCommissionParams = AdminRevenueParams & {
  studioId?: number | ''
  search?: string
  sortBy?: string
}

export function getAdminRevenueSummary(params: AdminRevenueParams = {}) {
  return api.get<AdminRevenueSummary>('/admin/revenue/summary', { params }).then((res) => res.data)
}

export function getAdminRevenueMonthly(params: AdminRevenueParams = {}) {
  return api.get<AdminMonthlyRevenue[]>('/admin/revenue/monthly', { params }).then((res) => res.data)
}

export function getAdminCommissions(params: AdminCommissionParams = {}) {
  return api.get<AdminCommissionItem[]>('/admin/commissions', { params }).then((res) => res.data)
}
