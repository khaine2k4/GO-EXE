import { useCallback, useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { CalendarDays, Plus, RefreshCw, Save } from 'lucide-react'
import { useToast } from '../../Toast'
import { getStudioRevenue } from '../../../services/studioRevenueApi'
import {
  createTimeSlot,
  getMySchedules,
  getStudioSlots,
  updateSlotDuration,
  updateSlotStatus,
  upsertSchedule,
  upsertWorkingDay,
  type TimeSlotItem,
  type WorkingSchedule,
} from '../../../services/scheduleApi'
import { Drawer, EmptyState, SectionPanel } from './Panel'

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

export default function ScheduleManager() {
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [manualSlot, setManualSlot] = useState({ startTime: '09:00', endTime: '10:00' })

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
    try {
      const [scheduleData, revenue] = await Promise.all([getMySchedules(), getStudioRevenue({})])
      setSchedules(scheduleData)
      setStudioId(scheduleData[0]?.studioId ?? revenue.studioId)
    } catch {
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

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchSlots() }, [fetchSlots])

  async function saveSchedule(row: { dayOfWeek: number; openTime: string; closeTime: string; isActive: boolean }) {
    setSaving(true)
    try {
      const saved = await upsertSchedule(row)
      setSchedules((current) => {
        const others = current.filter((item) => item.dayOfWeek !== saved.dayOfWeek)
        return [...others, saved].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
      })
      setStudioId(saved.studioId)
      toast.push({ type: 'success', title: 'Da luu weekly schedule' })
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
      const selectedDayOfWeek = new Date(`${selectedDate}T00:00:00`).getDay()
      const template = scheduleRows.find((row) => row.dayOfWeek === selectedDayOfWeek)
      if (dayAvailable && template && !template.isActive) {
        const saved = await upsertSchedule({
          dayOfWeek: template.dayOfWeek,
          openTime: template.openTime,
          closeTime: template.closeTime,
          isActive: true,
        })
        setSchedules((current) => {
          const others = current.filter((item) => item.dayOfWeek !== saved.dayOfWeek)
          return [...others, saved].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
        })
        setStudioId(saved.studioId)
      }
      const day = await upsertWorkingDay({ date: selectedDate, isAvailable: dayAvailable, note: dayNote || undefined })
      setSlots(day.slots)
      if (dayAvailable && day.slots.length === 0) {
        toast.push({ type: 'error', title: 'Chua tao duoc slot', message: 'Kiem tra open/close time hoac them slot thu cong.' })
      } else {
        toast.push({ type: 'success', title: 'Da tao ngay lam viec va slot' })
      }
    } catch {
      toast.push({ type: 'error', title: 'Luu working day that bai' })
    } finally {
      setSaving(false)
    }
  }

  async function addManualSlot(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const slot = await createTimeSlot({ date: selectedDate, startTime: manualSlot.startTime, endTime: manualSlot.endTime })
      setSlots((current) => [...current, slot].sort((a, b) => a.startTime.localeCompare(b.startTime)))
      setDrawerOpen(false)
      toast.push({ type: 'success', title: 'Da them slot' })
    } catch {
      toast.push({ type: 'error', title: 'Them slot that bai', message: 'Kiem tra gio bat dau/ket thuc hoac slot bi trung.' })
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
    <>
      <div className="space-y-6">
        <SectionPanel
          title="Schedule"
          subtitle="Set weekly hours, generate daily slots, and open/close booking times visible to customers."
          actions={<button type="button" onClick={fetchData} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black uppercase text-slate-700"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button>}
        >
          <div className="grid gap-4 md:grid-cols-[220px_auto] md:items-end">
            <label className="block">
              <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">Slot duration</span>
              <select value={slotDuration} onChange={(event) => setSlotDuration(Number(event.target.value))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold">
                {durations.map((item) => <option key={item} value={item}>{item} minutes</option>)}
              </select>
            </label>
            <button type="button" onClick={saveSlotDuration} disabled={saving} className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black uppercase text-white disabled:bg-slate-300">
              <Save className="h-4 w-4" />Save duration
            </button>
          </div>
        </SectionPanel>

        <SectionPanel title="Weekly template" subtitle="Save the open days first, then generate slots for a concrete date below.">
          <div className="divide-y divide-slate-100">
            {scheduleRows.map((row) => <ScheduleRow key={row.dayOfWeek} row={row} disabled={saving} onSave={saveSchedule} />)}
          </div>
        </SectionPanel>

        <SectionPanel title="Daily slots" subtitle="These are the actual slots customers see in 'Chon gio chup'." actions={<button type="button" onClick={() => setDrawerOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-black uppercase text-white"><Plus className="h-4 w-4" />Add slot</button>}>
          <div className="mb-5 grid gap-3 lg:grid-cols-[180px_auto_1fr_auto] lg:items-end">
            <label className="block">
              <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">Working date</span>
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold" />
            </label>
            <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-600">
              <input type="checkbox" checked={dayAvailable} onChange={(event) => setDayAvailable(event.target.checked)} />
              Available
            </label>
            <input value={dayNote} onChange={(event) => setDayNote(event.target.value)} placeholder="Note" className="h-11 min-w-0 rounded-xl border border-slate-200 px-3 text-sm font-semibold" />
            <button type="button" onClick={saveWorkingDay} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black uppercase text-white disabled:bg-slate-300">
              <CalendarDays className="h-4 w-4" />Generate slots
            </button>
          </div>

          {slots.length === 0 ? <EmptyState text="No slots for this date. Save an active weekly template, then Generate slots, or Add slot manually." /> : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {slots.map((slot) => (
                <button key={slot.id} type="button" onClick={() => toggleSlot(slot)} disabled={slot.status !== 'OPEN' && slot.status !== 'CLOSED'} className={`rounded-xl border p-4 text-left transition ${slot.status === 'OPEN' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : slot.status === 'CLOSED' ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-indigo-200 bg-indigo-50 text-indigo-800'} disabled:cursor-not-allowed`}>
                  <div className="text-sm font-black">{slot.startTime} - {slot.endTime}</div>
                  <div className="mt-2 text-xs font-bold uppercase tracking-widest">{slot.status}</div>
                </button>
              ))}
            </div>
          )}
        </SectionPanel>
      </div>

      <Drawer title="Add manual slot" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <form onSubmit={addManualSlot} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">Date</span>
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">Start time</span>
            <input type="time" value={manualSlot.startTime} onChange={(event) => setManualSlot((prev) => ({ ...prev, startTime: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">End time</span>
            <input type="time" value={manualSlot.endTime} onChange={(event) => setManualSlot((prev) => ({ ...prev, endTime: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold" />
          </label>
          <button disabled={saving} className="h-11 w-full rounded-xl bg-indigo-600 text-xs font-black uppercase tracking-widest text-white disabled:bg-slate-300">Add slot</button>
        </form>
      </Drawer>
    </>
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
    <div className="grid gap-3 py-4 md:grid-cols-[1.2fr_1fr_1fr_auto_auto] md:items-end">
      <div className="text-sm font-black text-slate-900">{row.label}</div>
      <TimeInput label="Open" value={openTime} onChange={setOpenTime} />
      <TimeInput label="Close" value={closeTime} onChange={setCloseTime} />
      <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600">
        <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
        Active
      </label>
      <button type="button" disabled={disabled} onClick={() => onSave({ dayOfWeek: row.dayOfWeek, openTime, closeTime, isActive })} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white hover:bg-indigo-600 disabled:bg-slate-300">
        <Save className="h-4 w-4" />Save
      </button>
    </div>
  )
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-500">{label}</span>
      <input type="time" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-indigo-400" />
    </label>
  )
}
