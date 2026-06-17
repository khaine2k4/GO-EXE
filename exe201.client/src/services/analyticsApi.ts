import api from './api'

export type AnalyticsStats = {
  todayViews: number
  weekViews: number
  monthViews: number
  allTimeViews: number
  todayUniqueVisitors: number
  weekUniqueVisitors: number
  monthUniqueVisitors: number
  allTimeUniqueVisitors: number
  monthPotentialCustomerVisitors: number
  totalRegisteredUsers: number
  dailyViews: {
    date: string
    views: number
    uniqueVisitors: number
  }[]
  topPages: {
    pagePath: string
    views: number
    uniqueVisitors: number
  }[]
  visitorSegments: {
    segment: string
    label: string
    views: number
    uniqueVisitors: number
  }[]
  userGrowth: {
    year: number
    month: number
    newUsers: number
    cumulativeUsers: number
  }[]
}

export function getAnalyticsStats(params?: { startDate?: string; endDate?: string }) {
  return api.get<AnalyticsStats>('/analytics/stats', { params }).then((res) => res.data)
}
