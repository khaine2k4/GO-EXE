import api from './api'

export type StudioRevenueParams = {
  from?: string
  to?: string
}

export type StudioMonthlyRevenue = {
  year: number
  month: number
  grossRevenue: number
  commissionDeducted: number
  netRevenue: number
  completedBookings: number
}

export type StudioRevenue = {
  studioId: number
  studioName: string
  grossRevenue: number
  commissionDeducted: number
  netRevenue: number
  completedBookings: number
  paidPayments: number
  refundedAmount: number
  averageBookingValue: number
  monthlyRevenue: StudioMonthlyRevenue[]
}

export type StudioCommission = {
  bookingId: number
  bookingCode: string
  customerName: string
  serviceName: string
  grossAmount: number
  commissionPercent: number
  commissionAmount: number
  netRevenue: number
  bookingStatus: string
  paymentStatus: string
  completedAt?: string
  paidAt?: string
}

export type StudioCommissionParams = StudioRevenueParams & {
  search?: string
  sortBy?: string
}

export type StudioMonthlyBooking = {
  year: number
  month: number
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
}

export type StudioTopService = {
  serviceId: number
  serviceName: string
  bookingCount: number
  grossRevenue: number
  netRevenue: number
}

export type StudioBookingStatistics = {
  totalBookings: number
  pendingBookings: number
  confirmedBookings: number
  inProgressBookings: number
  completedBookings: number
  cancelledBookings: number
  rejectedBookings: number
  completionRate: number
  cancellationRate: number
  monthlyBookings: StudioMonthlyBooking[]
  topServices: StudioTopService[]
}

export type StudioCommissionSetting = {
  studioId: number
  studioName: string
  commissionPercent: number
  note: string
  updatedAt: string
}

export function getStudioRevenue(params: StudioRevenueParams = {}) {
  return api.get<StudioRevenue>('/studio/revenue', { params }).then((res) => res.data)
}

export function getStudioCommissions(params: StudioCommissionParams = {}) {
  return api.get<StudioCommission[]>('/studio/commissions', { params }).then((res) => res.data)
}

export function getStudioBookingStatistics(params: StudioRevenueParams = {}) {
  return api.get<StudioBookingStatistics>('/studio/bookings/statistics', { params }).then((res) => res.data)
}

export function getStudioCommissionSetting() {
  return api.get<StudioCommissionSetting>('/studio/commission-setting').then((res) => res.data)
}
