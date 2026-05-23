import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, RefreshCw, Save } from 'lucide-react'
import { useToast } from '../components/Toast'
import { getStudioRevenue } from '../services/studioRevenueApi'
import {
  getMySchedules,
  getStudioSlots,
  updateSlotDuration,
  updateSlotStatus,
  upsertSchedule,
  upsertWorkingDay,
  type TimeSlotItem,
  type WorkingSchedule,
} from '../services/scheduleApi'

const days = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

const durations = [30, 60, 90, 120, 180, 240]

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function PhotographerSchedulePage() {
  const toast = useToast()
  const [studioId, setStudioId] = useState<number | null>(null)
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([])
  const [slotDuration, setSlotDuration] = useState(60)
  const [selectedDate, setSelectedDate] = useState(today())
  const [dayAvailable, setDayAvailable] = useState(true)
  const [dayNote, setDayNote] = useState('')
  const [slots, setSlots] = useState<TimeSlotItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const scheduleRows = useMemo(() => days.map((day) => {
    const schedule = schedules.find((item) => item.dayOfWeek === day.value)
    return {
      dayOfWeek: day.value,
      label: day.label,
      openTime: schedule?.openTime ?? '08:00',
      closeTime: schedule?.closeTime ?? '17:00',
      isActive: schedule?.isActive ?? false,
    }
  }), [schedules])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [scheduleData, revenue] = await Promise.all([getMySchedules(), getStudioRevenue({})])
      setSchedules(scheduleData)
      setStudioId(scheduleData[0]?.studioId ?? revenue.studioId)
    } catch {
      setError('Khong tai duoc lich lam viec.')
      toast.push({ type: 'error', title: 'Tai schedule that bai' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchSlots = useCallback(async () => {
    if (!studioId || !selectedDate) return
    try {
      setSlots(await getStudioSlots(studioId, selectedDate))
    } catch {
      setSlots([])
    }
  }, [selectedDate, studioId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  async function saveSchedule(row: { dayOfWeek: number; openTime: string; closeTime: string; isActive: boolean }) {
    setSaving(true)
    try {
      const saved = await upsertSchedule(row)
      setSchedules((current) => {
        const others = current.filter((item) => item.dayOfWeek !== saved.dayOfWeek)
        return [...others, saved].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
      })
      setStudioId(saved.studioId)
      toast.push({ type: 'success', title: 'Da luu schedule' })
    } catch {
      toast.push({ type: 'error', title: 'Luu schedule that bai' })
    } finally {
      setSaving(false)
    }
  }

  async function saveSlotDuration() {
    setSaving(true)
    try {
      await updateSlotDuration(slotDuration)
      toast.push({ type: 'success', title: 'Da cap nhat slot duration' })
    } catch {
      toast.push({ type: 'error', title: 'Cap nhat slot duration that bai' })
    } finally {
      setSaving(false)
    }
  }

  async function saveWorkingDay() {
    setSaving(true)
    try {
      const day = await upsertWorkingDay({ date: selectedDate, isAvailable: dayAvailable, note: dayNote || undefined })
      setSlots(day.slots)
      toast.push({ type: 'success', title: 'Da luu working day' })
    } catch {
      toast.push({ type: 'error', title: 'Luu working day that bai' })
    } finally {
      setSaving(false)
    }
  }

  async function toggleSlot(slot: TimeSlotItem) {
    if (slot.status !== 'OPEN' && slot.status !== 'CLOSED') return
    const nextStatus = slot.status === 'OPEN' ? 'CLOSED' : 'OPEN'
    try {
      await updateSlotStatus(slot.id, nextStatus)
      setSlots((current) => current.map((item) => item.id === slot.id ? { ...item, status: nextStatus } : item))
    } catch {
      toast.push({ type: 'error', title: 'Cap nhat slot that bai' })
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Studio schedule</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950">Working hours & slots</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Cau hinh template tuan, tao working day va dong/mo slot theo ngay.</p>
          </div>
          <button type="button" onClick={fetchData} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        {error && <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-500">Slot duration</span>
            <select value={slotDuration} onChange={(event) => setSlotDuration(Number(event.target.value))} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none">
              {durations.map((item) => <option key={item} value={item}>{item} minutes</option>)}
            </select>
          </label>
          <button type="button" onClick={saveSlotDuration} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white hover:bg-indigo-600 disabled:bg-slate-300">
            <Save className="h-4 w-4" />
            Save duration
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 p-4">
          <h2 className="text-base font-semibold text-slate-900">Weekly template</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {scheduleRows.map((row) => (
            <ScheduleRow key={row.dayOfWeek} row={row} disabled={saving} onSave={saveSchedule} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-500">Working date</span>
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" />
          </label>
          <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600">
            <input type="checkbox" checked={dayAvailable} onChange={(event) => setDayAvailable(event.target.checked)} />
            Available
          </label>
          <input value={dayNote} onChange={(event) => setDayNote(event.target.value)} placeholder="Note" className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" />
          <button type="button" onClick={saveWorkingDay} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:bg-slate-300">
            <CalendarDays className="h-4 w-4" />
            Save day / generate slots
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 p-4">
          <h2 className="text-base font-semibold text-slate-900">Slots on {selectedDate}</h2>
        </div>
        {slots.length === 0 ? <EmptyState text="Chua co slot cho ngay nay." /> : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {slots.map((slot) => (
              <button key={slot.id} type="button" onClick={() => toggleSlot(slot)} disabled={slot.status !== 'OPEN' && slot.status !== 'CLOSED'} className={`rounded-xl border p-4 text-left transition ${slot.status === 'OPEN' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : slot.status === 'CLOSED' ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-indigo-200 bg-indigo-50 text-indigo-800'} disabled:cursor-not-allowed`}>
                <div className="text-sm font-black">{slot.startTime} - {slot.endTime}</div>
                <div className="mt-2 text-xs font-bold uppercase tracking-widest">{slot.status}</div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ScheduleRow({ row, disabled, onSave }: { row: { dayOfWeek: number; label: string; openTime: string; closeTime: string; isActive: boolean }; disabled: boolean; onSave: (row: { dayOfWeek: number; openTime: string; closeTime: string; isActive: boolean }) => void }) {
  const [openTime, setOpenTime] = useState(row.openTime)
  const [closeTime, setCloseTime] = useState(row.closeTime)
  const [isActive, setIsActive] = useState(row.isActive)

  useEffect(() => {
    setOpenTime(row.openTime)
    setCloseTime(row.closeTime)
    setIsActive(row.isActive)
  }, [row.closeTime, row.isActive, row.openTime])

  return (
    <div className="grid gap-3 p-4 md:grid-cols-[1.2fr_1fr_1fr_auto_auto] md:items-end">
      <div className="text-sm font-black text-slate-900">{row.label}</div>
      <TimeInput label="Open" value={openTime} onChange={setOpenTime} />
      <TimeInput label="Close" value={closeTime} onChange={setCloseTime} />
      <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600">
        <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
        Active
      </label>
      <button type="button" disabled={disabled} onClick={() => onSave({ dayOfWeek: row.dayOfWeek, openTime, closeTime, isActive })} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white hover:bg-indigo-600 disabled:bg-slate-300">
        <Save className="h-4 w-4" />
        Save
      </button>
    </div>
  )
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-500">{label}</span>
      <input type="time" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" />
    </label>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-6 py-16 text-center text-sm text-slate-500">{text}</div>
}
