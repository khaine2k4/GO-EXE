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
