import api from './api'

export type AdminDashboardStats = {
  systemStats: {
    activeUsers: number
    approvedStudios: number
    pendingStudios: number
    totalBookings: number
    totalCommission: number
    pendingReports: number
    disputedBookings: number
    completedBookings: number
    cancelledBookings: number
    completionRate: number
  }
  topStudios: {
    studioId: number
    studioName: string
    city?: string
    avgRating: number
    totalReviews: number
    totalBookings: number
  }[]
  monthlyRevenue: {
    month: string
    totalBookings: number
    grossRevenue: number
    platformCommission: number
    studioPayout: number
  }[]
  recentBookings: {
    id: number
    bookingCode: string
    customerName: string
    studioName: string
    packageName: string
    shootingDate: string
    status: string
    totalPrice: number
    commissionAmount: number
    paymentStatus?: string
    createdAt: string
  }[]
}

export function getAdminDashboardStats() {
  return api.get<AdminDashboardStats>('/admin/dashboard-stats').then((res) => res.data)
}
