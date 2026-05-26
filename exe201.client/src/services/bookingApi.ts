import api from './api'

export type TimeSlotDto = {
  id: number
  workingDayId: number
  date: string
  startTime: string
  endTime: string
  status: 'OPEN' | 'HOLDING' | 'BOOKED' | 'CLOSED' | string
}

export type PaymentDto = {
  id: number
  bookingId: number
  paymentCode: string
  methodName: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUND_PENDING' | 'REFUNDED' | 'DISPUTED' | string
  paymentProvider: string
  amount: number
  currencyCode: string
  transactionCode?: string
  paidAt?: string
  refundedAt?: string
  refundMethod?: string
  refundPendingReason?: string
  createdAt: string
}

export type BookingDto = {
  id: number
  bookingCode: string
  customerId: number
  customerName: string
  studioId: number
  studioName: string
  packageId: number
  packageName: string
  slotId: number
  shootingDate: string
  startTime: string
  endTime: string
  shootingLocation?: string
  note?: string
  status: 'PENDING_PAYMENT' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'IN_PROGRESS' | 'AWAITING_CUSTOMER' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | string
  totalPrice: number
  commissionAmount: number
  studioRevenue: number
  paymentExpiresAt?: string
  canCancel: boolean
  createdAt: string
  latestPayment?: PaymentDto
}

export function getStudioSlots(studioId: number, date: string) {
  return api.get<TimeSlotDto[]>(`/schedules/studios/${studioId}/slots`, { params: { date } }).then((res) => res.data)
}

export function createBooking(payload: { packageId: number; slotId: number; shootingLocation?: string; note?: string }) {
  return api.post<BookingDto>('/bookings', payload).then((res) => res.data)
}

export function payBooking(payload: { bookingId: number; methodName: 'BANK_TRANSFER' | 'CASH' | string; transactionCode?: string }) {
  return api.post<PaymentDto>('/payments/pay', payload).then((res) => res.data)
}

export function getBookings(status?: string) {
  return api.get<BookingDto[]>('/bookings', { params: status && status !== 'ALL' ? { status } : undefined }).then((res) => res.data)
}

export function getBooking(id: string | number) {
  return api.get<BookingDto>(`/bookings/${id}`).then((res) => res.data)
}

export function cancelBooking(id: string | number, reason?: string) {
  return api.put<BookingDto>(`/bookings/${id}/cancel`, { reason }).then((res) => res.data)
}

export function disputeBooking(id: string | number, reason: string) {
  return api.put<BookingDto>(`/bookings/${id}/dispute`, { reason }).then((res) => res.data)
}

export function vnpayCreatePaymentUrl(bookingId: number) {
  return api.post<{ paymentUrl: string }>('/payments/vnpay-create', { bookingId }).then((res) => res.data)
}

export function payosCreatePaymentUrl(bookingId: number) {
  return api.post<{ paymentUrl: string }>('/payments/payos-create', { bookingId }).then((res) => res.data)
}

export function confirmBooking(id: string | number) {
  return api.put<BookingDto>(`/bookings/${id}/confirm`).then((res) => res.data)
}

export function rejectBooking(id: string | number, reason?: string) {
  return api.put<BookingDto>(`/bookings/${id}/reject`, { reason }).then((res) => res.data)
}

export function markInProgress(id: string | number) {
  return api.put<BookingDto>(`/bookings/${id}/in-progress`).then((res) => res.data)
}

export function completeBooking(id: string | number) {
  return api.put<BookingDto>(`/bookings/${id}/complete`).then((res) => res.data)
}

export function confirmCompletion(id: string | number) {
  return api.put<BookingDto>(`/bookings/${id}/confirm-completion`).then((res) => res.data)
}
