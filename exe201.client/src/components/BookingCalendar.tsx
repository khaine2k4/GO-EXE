import { ChevronLeft, ChevronRight } from 'lucide-react'
import React from 'react'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

export default function BookingCalendar({
  value,
  onChange,
  busyDates,
}: {
  value?: string
  onChange: (isoDate: string) => void
  busyDates: string[]
}) {
  const selected = value ? new Date(value + 'T00:00:00') : null
  const [cursor, setCursor] = useMonthCursor(selected ?? new Date())

  const monthStart = startOfMonth(cursor)
  const totalDays = daysInMonth(cursor)
  const startWeekday = (monthStart.getDay() + 6) % 7 // Monday=0

  const grid: Array<{ iso: string; day: number; disabled: boolean }> = []
  for (let i = 0; i < startWeekday; i++) {
    grid.push({ iso: `blank-${i}`, day: 0, disabled: true })
  }
  const todayStr = toIsoDate(new Date())
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(cursor.getFullYear(), cursor.getMonth(), day)
    const iso = toIsoDate(d)
    const isPast = iso < todayStr
    const disabled = isPast || busyDates.includes(iso)
    grid.push({ iso, day, disabled })
  }

  const monthLabel = cursor.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 truncate text-center text-sm font-semibold text-slate-900">{monthLabel}</div>
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-slate-500 sm:gap-2">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">
        {grid.map((cell) => {
          if (cell.day === 0) return <div key={cell.iso} className="h-9 sm:h-10" />
          const isSelected = value === cell.iso
          const disabled = cell.disabled
          return (
            <button
              key={cell.iso}
              type="button"
              disabled={disabled}
              onClick={() => onChange(cell.iso)}
              className={[
                'flex h-9 items-center justify-center rounded-xl text-xs font-semibold transition-all duration-200 sm:h-10 sm:text-sm',
                disabled
                  ? 'cursor-not-allowed bg-slate-50 text-slate-300 border border-slate-100'
                  : isSelected
                    ? 'bg-slate-950 text-white border-transparent shadow-lg shadow-slate-950/15 scale-95 hover:bg-slate-900 hover:text-white'
                    : 'bg-white text-slate-900 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600',
              ].join(' ')}
              aria-label={cell.iso}
            >
              {cell.day}
            </button>
          )
        })}
      </div>

      <div className="mt-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-900">Tip:</span> ngày đã đầy sẽ bị mờ (disabled).
      </div>
    </div>
  )
}

function useMonthCursor(initial: Date): [Date, (d: Date) => void] {
  const [cursor, setCursor] = React.useState<Date>(startOfMonth(initial))
  return [cursor, setCursor]
}

