import api from './api'

export interface DailyEventCount {
  date: string
  count: number
}

export interface PackageClickStats {
  packageId: number
  packageName: string
  clickCount: number
}

export interface StudioAnalyticsSummary {
  totalViews: number
  totalBookingClicks: number
  bookingConversionRate: number
  popularPackages: PackageClickStats[]
  dailyViews: DailyEventCount[]
  dailyBookings: DailyEventCount[]
}

export interface TopStudioAnalytics {
  studioId: number
  studioName: string
  city: string
  views: number
  bookingClicks: number
  conversionRate: number
}

export interface AdminAnalyticsSummary {
  totalViews: number
  totalBookingClicks: number
  bookingConversionRate: number
  topStudios: TopStudioAnalytics[]
  dailyViews: DailyEventCount[]
  dailyBookings: DailyEventCount[]
}

export async function logAnalyticsEvent(eventName: string, pageUrl: string, studioId?: number, packageId?: number): Promise<void> {
  await api.post('/analytics/event', {
    eventName,
    pageUrl,
    studioId,
    packageId
  })
}

export async function getStudioAnalytics(days = 7): Promise<StudioAnalyticsSummary> {
  const response = await api.get<StudioAnalyticsSummary>(`/analytics/studio-stats?days=${days}`)
  return response.data
}

export async function getAdminAnalytics(days = 7): Promise<AdminAnalyticsSummary> {
  const response = await api.get<AdminAnalyticsSummary>(`/analytics/admin-stats?days=${days}`)
  return response.data
}
