import api from '../api/axios'

export interface PayoutRequestItem {
  payoutId: number
  walletId: number
  ownerName: string
  ownerType: 'CUSTOMER' | 'STUDIO'
  amount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FAILED'
  bankCode: string
  accountNumber: string
  accountName: string
  description?: string
  referenceId: string
  transactionCode?: string
  failureReason?: string
  createdAt: string
  updatedAt: string
}

export async function getPayoutRequests(status?: string): Promise<PayoutRequestItem[]> {
  const response = await api.get<PayoutRequestItem[]>('/admin/payouts', {
    params: { status }
  })
  return response.data
}

export async function approvePayout(payoutId: number): Promise<{ message: string; transactionCode?: string }> {
  const response = await api.post<{ message: string; transactionCode?: string }>(`/admin/payouts/${payoutId}/approve`)
  return response.data
}

export async function rejectPayout(payoutId: number, reason: string): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>(`/admin/payouts/${payoutId}/reject`, { reason })
  return response.data
}
