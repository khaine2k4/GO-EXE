import api from './api'

export type WorkingSchedule = {
  id: number
  studioId: number
  dayOfWeek: number
  openTime: string
  closeTime: string
  isActive: boolean
}

export type TimeSlotItem = {
  id: number
  workingDayId: number
  date: string
  startTime: string
  endTime: string
  status: string
}

export type WorkingDayItem = {
  id: number
  studioId: number
  date: string
  isAvailable: boolean
  note?: string
  slots: TimeSlotItem[]
}

export function getMySchedules() {
  return api.get<WorkingSchedule[]>('/schedules/mine').then((res) => res.data)
}

export function upsertSchedule(payload: { dayOfWeek: number; openTime: string; closeTime: string; isActive: boolean }) {
  return api.put<WorkingSchedule>('/schedules/mine', payload).then((res) => res.data)
}

export function updateSlotDuration(slotDurationMinutes: number) {
  return api.put<{ message: string }>('/schedules/mine/slot-duration', { slotDurationMinutes }).then((res) => res.data)
}

export function getStudioDays(studioId: number, params: { from?: string; to?: string; includeClosed?: boolean } = {}) {
  return api.get<WorkingDayItem[]>(`/schedules/studios/${studioId}/days`, { params }).then((res) => res.data)
}

export function getStudioSlots(studioId: number, date: string) {
  return api.get<TimeSlotItem[]>(`/schedules/studios/${studioId}/slots`, { params: { date } }).then((res) => res.data)
}

export function upsertWorkingDay(payload: { date: string; isAvailable: boolean; note?: string }) {
  return api.put<WorkingDayItem>('/schedules/days', payload).then((res) => res.data)
}

export function createTimeSlot(payload: { date: string; startTime: string; endTime: string }) {
  return api.post<TimeSlotItem>('/schedules/slots', payload).then((res) => res.data)
}

export function updateSlotStatus(slotId: number, status: 'OPEN' | 'CLOSED') {
  return api.put<{ message: string }>(`/schedules/slots/${slotId}/status`, { status }).then((res) => res.data)
}
