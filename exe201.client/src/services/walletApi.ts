import api from './api'

export interface WalletTransactionItem {
  txId: number
  walletId: number
  txType: 'CREDIT_REFUND' | 'CREDIT_EARNING' | 'DEBIT_WITHDRAW'
  amount: number
  balanceAfter: number
  bookingId?: number
  paymentId?: number
  description?: string
  createdAt: string
}

export interface WalletDetail {
  walletId: number
  ownerType: 'CUSTOMER' | 'STUDIO'
  ownerId: number
  balance: number
  totalIn: number
  totalOut: number
  transactions: WalletTransactionItem[]
}

export async function getStudioWallet(): Promise<WalletDetail> {
  const response = await api.get<WalletDetail>('/wallet/mine')
  return response.data
}

export async function getCustomerWallet(): Promise<WalletDetail> {
  const response = await api.get<WalletDetail>('/customer/wallet')
  return response.data
}

export async function getAllWalletsAdmin(): Promise<WalletDetail[]> {
  const response = await api.get<WalletDetail[]>('/admin/wallets')
  return response.data
}

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

export async function createWithdrawal(amount: number, bankCode: string, accountNumber: string, description?: string): Promise<{ message: string; payoutId: number }> {
  const response = await api.post<{ message: string; payoutId: number }>('/wallet/withdraw', {
    amount,
    bankCode,
    accountNumber,
    description
  })
  return response.data
}

export async function getMyWithdrawals(): Promise<PayoutRequestItem[]> {
  const response = await api.get<PayoutRequestItem[]>('/wallet/withdrawals')
  return response.data
}
