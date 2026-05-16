import { useAppStore } from '../store/AppStore'
import { motion } from 'framer-motion'
import type { BookingStatus } from '../types'
import { Check, AlertTriangle, ShieldX } from 'lucide-react'

// Main linear flow for a successful booking
const SUCCESS_ORDER: BookingStatus[] = ['PENDING', 'CONFIRMED', 'DELIVERED', 'COMPLETED']

const STEP_CONFIG: Record<BookingStatus, { label: string; desc: string }> = {
  PENDING: { label: 'Chờ xác nhận', desc: 'Photographer đang xem xét' },
  CONFIRMED: { label: 'Đã xác nhận', desc: 'Job đã được nhận' },
  DELIVERED: { label: 'Đã giao ảnh', desc: 'Chờ bạn xác nhận chất lượng' },
  COMPLETED: { label: 'Hoàn thành', desc: 'Dịch vụ kết thúc tốt đẹp' },
  DISPUTED: { label: 'Tranh chấp', desc: 'Admin đang xử lý khiếu nại' },
  REFUNDED: { label: 'Hoàn tiền', desc: 'Đã hoàn tiền cho khách hàng' },
  CANCELLED: { label: 'Đã hủy', desc: 'Booking đã bị hủy' },
}

export default function StatusTimeline({ bookingId }: { bookingId: string }) {
  const { state } = useAppStore()
  const booking = state.bookings.find((b) => b.id === bookingId)
  if (!booking) return null

  // Determine what timeline to show based on current status
  const isFailed = booking.status === 'CANCELLED' || booking.status === 'REFUNDED'
  const isDisputed = booking.status === 'DISPUTED'

  // If it's cancelled or refunded, we show a shortened/error timeline
  let timelineSteps: BookingStatus[] = SUCCESS_ORDER
  if (isFailed) {
    if (booking.status === 'CANCELLED') timelineSteps = ['PENDING', 'CANCELLED']
    if (booking.status === 'REFUNDED') timelineSteps = ['PENDING', 'CONFIRMED', 'DELIVERED', 'DISPUTED', 'REFUNDED'] // Assuming refund happened after dispute
  } else if (isDisputed) {
    timelineSteps = ['PENDING', 'CONFIRMED', 'DELIVERED', 'DISPUTED']
  }

  // To find the current index for styling
  let currentIndex = timelineSteps.indexOf(booking.status)
  if (currentIndex === -1) {
    // Fallback if status isn't in steps (e.g. COMPLETED in a weird timeline)
    currentIndex = timelineSteps.length - 1
  }

  return (
    <div className="relative pl-3 mt-4">
      {/* Track Background */}
      <div className="absolute left-[15px] top-2 bottom-4 w-px bg-slate-100" />

      {/* Active Track */}
      {currentIndex > 0 && !isFailed && !isDisputed && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${(currentIndex / (timelineSteps.length - 1)) * 100}%` }}
          className="absolute left-[15px] top-2 w-px bg-indigo-500 origin-top"
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}

      {timelineSteps.map((stepStatus, idx) => {
        const isActive = idx === currentIndex
        const isPast = idx < currentIndex

        let icon = <Check className="h-2.5 w-2.5" />
        let dotClass = 'bg-slate-200 border-white'
        let textClass = 'text-slate-400 font-medium'
        let descClass = 'text-slate-400'

        if (isPast) {
          dotClass = 'bg-indigo-500 border-white text-white'
          textClass = 'text-slate-900 font-semibold'
        } else if (isActive) {
          if (isFailed) {
            dotClass = 'bg-rose-500 ring-4 ring-rose-50 text-white'
            textClass = 'text-rose-700 font-bold'
            descClass = 'text-rose-500'
            icon = <ShieldX className="h-2.5 w-2.5" />
          } else if (isDisputed) {
            dotClass = 'bg-amber-500 ring-4 ring-amber-50 text-white'
            textClass = 'text-amber-700 font-bold'
            descClass = 'text-amber-500'
            icon = <AlertTriangle className="h-2.5 w-2.5" />
          } else {
            dotClass = 'bg-white border-2 border-indigo-500 ring-4 ring-indigo-50 text-indigo-500'
            textClass = 'text-indigo-700 font-bold'
            descClass = 'text-indigo-500'
            icon = <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          }
        }

        return (
          <div key={stepStatus} className="relative mb-6 flex items-start gap-4 last:mb-0">
            {/* Dot */}
            <div className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${dotClass}`}>
              {icon}
            </div>

            {/* Content */}
            <div className={`flex-1 transition-all duration-300 ${isActive ? 'translate-x-1' : ''}`}>
              <div className={`text-[13px] ${textClass}`}>
                {STEP_CONFIG[stepStatus].label}
              </div>
              <div className={`mt-0.5 text-[11px] ${descClass}`}>
                {STEP_CONFIG[stepStatus].desc}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
