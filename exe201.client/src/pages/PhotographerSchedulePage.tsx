import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, RefreshCw, Save, Clock, HelpCircle, ToggleLeft, ToggleRight, Play } from 'lucide-react'
import { useToast } from '../components/Toast'
import { getStudioRevenue } from '../services/studioRevenueApi'
import { getStudioDashboard } from '../services/studioApi'
import {
  getMySchedules,
  getStudioSlots,
  updateSlotDuration,
  updateSlotStatus,
  upsertSchedule,
  upsertWorkingDay,
  createSlot,
  type TimeSlotItem,
  type WorkingSchedule,
} from '../services/scheduleApi'

const days = [
  { value: 1, label: 'Thứ Hai' },
  { value: 2, label: 'Thứ Ba' },
  { value: 3, label: 'Thứ Tư' },
  { value: 4, label: 'Thứ Năm' },
  { value: 5, label: 'Thứ Sáu' },
  { value: 6, label: 'Thứ Bảy' },
  { value: 0, label: 'Chủ Nhật' },
]

const durations = [
  { label: '30 Phút / Ca chụp', value: 30 },
  { label: '1 Tiếng / Ca (Khuyên dùng)', value: 60 },
  { label: '1.5 Tiếng / Ca', value: 90 },
  { label: '2 Tiếng / Ca chụp', value: 120 },
  { label: '3 Tiếng / Ca chụp', value: 180 },
  { label: '4 Tiếng / Ca chụp', value: 240 },
]

function today() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
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
  const [showGuide, setShowGuide] = useState(true)

  // Manual slot creation state
  const [manualStart, setManualStart] = useState('18:00')
  const [manualEnd, setManualEnd] = useState('19:00')

  const scheduleRows = useMemo(() => {
    return days.map((day) => {
      const schedule = schedules.find((item) => item.dayOfWeek === day.value)
      return {
        dayOfWeek: day.value,
        label: day.label,
        openTime: schedule?.openTime ?? '08:00',
        closeTime: schedule?.closeTime ?? '17:00',
        isActive: schedule?.isActive ?? false,
      }
    })
  }, [schedules])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const results = await Promise.allSettled([
        getMySchedules(),
        getStudioRevenue({}),
        getStudioDashboard(),
      ])

      const scheduleResult = results[0]
      const revenueResult = results[1]
      const dashboardResult = results[2]

      let scheduleData: WorkingSchedule[] = []
      if (scheduleResult.status === 'fulfilled') {
        scheduleData = scheduleResult.value
        setSchedules(scheduleData)
      } else {
        console.error('Failed to load schedules:', scheduleResult.reason)
      }

      let retrievedStudioId: number | null = null
      if (scheduleData[0]?.studioId) {
        retrievedStudioId = scheduleData[0].studioId
      } else if (revenueResult.status === 'fulfilled') {
        retrievedStudioId = revenueResult.value.studioId
      } else if (dashboardResult.status === 'fulfilled') {
        retrievedStudioId = (dashboardResult.value as any).studioId || (dashboardResult.value as any).id || null
      }

      setStudioId(retrievedStudioId)

      if (scheduleResult.status === 'rejected' && !retrievedStudioId) {
        throw new Error('Schedules load failed and no studio ID found.')
      }
    } catch {
      setError('Không thể tải lịch làm việc của Studio.')
      toast.push({ type: 'error', title: 'Tải lịch thất bại', message: 'Vui lòng kiểm tra kết nối mạng.' })
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
        return [...others, saved].sort((a, b) => {
          const valA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek
          const valB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek
          return valA - valB
        })
      })
      setStudioId(saved.studioId)
      toast.push({ type: 'success', title: 'Đã lưu thiết lập', message: `Đã cập nhật lịch template cho ${days.find(d => d.value === row.dayOfWeek)?.label}.` })
    } catch {
      toast.push({ type: 'error', title: 'Lưu thất bại', message: 'Không thể cập nhật thời gian làm việc.' })
    } finally {
      setSaving(false)
    }
  }

  async function saveSlotDuration() {
    setSaving(true)
    try {
      await updateSlotDuration(slotDuration)
      toast.push({ type: 'success', title: 'Cập nhật thành công', message: 'Thời lượng ca chụp đã được thay đổi.' })
    } catch {
      toast.push({ type: 'error', title: 'Cập nhật thất bại', message: 'Không thể lưu thời lượng ca chụp.' })
    } finally {
      setSaving(false)
    }
  }

  async function saveWorkingDay() {
    setSaving(true)
    try {
      const day = await upsertWorkingDay({ date: selectedDate, isAvailable: dayAvailable, note: dayNote || undefined })
      setSlots(day.slots)
      toast.push({ 
        type: 'success', 
        title: 'Sinh Slot tự động thành công! 🎉', 
        message: `Đã kích hoạt lịch ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')} với ${day.slots.length} ca chụp mới.` 
      })
    } catch {
      toast.push({ type: 'error', title: 'Sinh Slot thất bại', message: 'Vui lòng kiểm tra lại thiết lập thời gian làm việc mẫu.' })
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
      toast.push({
        type: 'info',
        title: nextStatus === 'OPEN' ? 'Đã Mở Slot 🔓' : 'Đã Đóng Slot 🔒',
        message: `Ca chụp ${slot.startTime} - ${slot.endTime} đã được ${nextStatus === 'OPEN' ? 'mở lại' : 'tạm đóng'}.`
      })
    } catch {
      toast.push({ type: 'error', title: 'Cập nhật slot thất bại' })
    }
  }

  async function handleCreateManualSlot() {
    setSaving(true)
    try {
      const newSlot = await createSlot({ date: selectedDate, startTime: manualStart, endTime: manualEnd })
      setSlots((current) => [...current, newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime)))
      toast.push({ 
        type: 'success', 
        title: 'Tạo ca chụp thành công! 🎉', 
        message: `Ca chụp ${manualStart} - ${manualEnd} đã được thêm vào ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')}.` 
      })
    } catch (err: any) {
      const msg = err.response?.data || 'Không thể tạo ca chụp trùng lặp hoặc ngoài khoảng thời gian.'
      toast.push({ type: 'error', title: 'Tạo ca chụp thất bại ❌', message: msg })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Upper Premium Header */}
      <section className="rounded-3xl border border-slate-200 bg-slate-950 p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50/20 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-indigo-300">
              ⚡ QUẢN LÝ CA CHỤP & LỊCH LÀM VIỆC
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Thiết lập Lịch biểu Studio</h1>
            <p className="mt-2 text-slate-400 text-sm font-medium max-w-xl leading-relaxed">
              Công cụ giúp bạn định cấu hình thời lượng chụp chuẩn, lên khung giờ mẫu hàng tuần và tự động tạo ca chụp theo ngày chỉ với 1 click!
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white transition"
            >
              <HelpCircle className="h-4 w-4" />
              {showGuide ? 'Ẩn Hướng Dẫn' : 'Xem Hướng Dẫn'}
            </button>
            <button 
              type="button" 
              onClick={fetchData} 
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-950 hover:bg-indigo-50 transition"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Làm Mới
            </button>
          </div>
        </div>
      </section>

      {/* Guide Wizard Card */}
      {showGuide && (
        <section className="rounded-3xl border border-indigo-100 bg-indigo-50/40 p-6 md:p-8 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-widest text-indigo-900 flex items-center gap-2">
            💡 HƯỚNG DẪN 3 BƯỚC ĐỂ TẠO CA CHỤP (SLOT) CHO STUDIO:
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 border border-indigo-100 shadow-sm relative">
              <span className="absolute -top-3 left-4 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">1</span>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">BƯỚC 1: CA KHUNG MẪU TUẦN</h3>
              <p className="mt-2 text-xs text-slate-600 font-semibold leading-relaxed">
                Định dạng giờ mở & đóng cửa template hàng tuần trong bảng <b>Lịch Khung Mẫu Tuần</b> phía dưới (ví dụ: Bật active Thứ 2 từ 08:00 - 17:00).
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 border border-indigo-100 shadow-sm relative">
              <span className="absolute -top-3 left-4 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">2</span>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">BƯỚC 2: CHỌN NGÀY & TẠO</h3>
              <p className="mt-2 text-xs text-slate-600 font-semibold leading-relaxed">
                Chọn ngày cụ thể bạn muốn nhận khách ở ô <b>Chọn Ngày Làm Việc</b>, sau đó nhấn nút <b>"⚡ KÍCH HOẠT & TỰ ĐỘNG TẠO SLOT"</b>.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 border border-indigo-100 shadow-sm relative">
              <span className="absolute -top-3 left-4 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">3</span>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">BƯỚC 3: BẬT TẮT NHANH</h3>
              <p className="mt-2 text-xs text-slate-600 font-semibold leading-relaxed">
                Các slot được tự động chia nhỏ và hiển thị bên dưới. Nhập trực tiếp vào ô slot để <b>ĐÓNG/MỞ</b> ca chụp cho khách đặt lịch.
              </p>
            </div>
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-6 py-4 text-sm font-semibold text-rose-700">
          ⚠️ {error}
        </div>
      )}

      {/* Main Grid: Left sidebar (Cấu hình mẫu) & Right main panel (Sinh Slot) */}
      <div className="grid gap-8 lg:grid-cols-[400px_1fr] items-start">
        
        {/* LEFT COLUMN: Configurations & Weekly template */}
        <div className="space-y-8">
          
          {/* Card 1: Slot Duration */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-indigo-600 animate-pulse" /> Thời lượng 1 ca chụp
            </h2>
            <p className="text-xs font-medium text-slate-500 mb-4 leading-relaxed">
              Mỗi ca chụp chuẩn của khách hàng sẽ kéo dài trong bao lâu?
            </p>
            <div className="flex gap-2">
              <select 
                value={slotDuration} 
                onChange={(event) => setSlotDuration(Number(event.target.value))} 
                className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              >
                {durations.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <button 
                type="button" 
                onClick={saveSlotDuration} 
                disabled={saving} 
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 px-5 text-xs font-black uppercase tracking-widest text-white shadow-md active:scale-95 disabled:bg-slate-300 transition-all"
              >
                Lưu
              </button>
            </div>
          </div>

          {/* Card 2: Weekly Template */}
          <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-1.5">
                📅 Lịch khung mẫu tuần
              </h2>
            </div>
            <div className="p-6 divide-y divide-slate-100">
              {scheduleRows.map((row) => (
                <ScheduleRow key={row.dayOfWeek} row={row} disabled={saving} onSave={saveSchedule} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Generator & Slot management */}
        <div className="space-y-8">
          
          {/* Card 3: Date Activator and Generator */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 leading-tight">1. Chọn ngày & Tự động sinh Slot</h2>
                <p className="text-xs font-medium text-slate-400 mt-0.5">Chọn một ngày cụ thể để kích hoạt lịch làm việc</p>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
              {/* Row 1: Select Date + Available Switch */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">Chọn Ngày Làm Việc</span>
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(event) => setSelectedDate(event.target.value)} 
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" 
                  />
                </label>
                
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng Thái Ngày</span>
                  <button
                    type="button"
                    onClick={() => setDayAvailable(!dayAvailable)}
                    className={`h-11 w-full inline-flex items-center justify-center gap-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${
                      dayAvailable 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}
                  >
                    {dayAvailable ? <ToggleRight className="h-5 w-5 text-emerald-600" /> : <ToggleLeft className="h-5 w-5 text-rose-600" />}
                    {dayAvailable ? 'Studio Mở Cửa' : 'Studio Đóng Cửa'}
                  </button>
                </label>
              </div>

              {/* Row 2: Note Field + Large Glowing CTA Button */}
              <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
                <label className="block w-full">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">Ghi chú ngày (nếu có)</span>
                  <input 
                    value={dayNote} 
                    onChange={(event) => setDayNote(event.target.value)} 
                    placeholder="Ví dụ: Chụp ngoại cảnh buổi chiều, nghỉ trưa..." 
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500" 
                  />
                </label>

                <button 
                  type="button" 
                  onClick={saveWorkingDay} 
                  disabled={saving} 
                  className="h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/10 active:scale-95 disabled:bg-slate-300 transition-all shrink-0"
                >
                  <Play className="h-4 w-4 fill-current" />
                  ⚡ Kích hoạt & Tự động tạo Slot
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Slot Visualizer Grid */}
          <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-5 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900 leading-tight">2. Quản lý ca chụp ngày {new Date(selectedDate).toLocaleDateString('vi-VN', { dateStyle: 'medium' })}</h2>
                <p className="text-xs font-medium text-slate-400 mt-0.5">Nhấp chuột trực tiếp vào từng slot để Đóng (màu xám) hoặc Mở (màu xanh)</p>
              </div>
              <div className="flex gap-3 text-[10px] font-black uppercase tracking-widest">
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Đang Mở (Cho đặt)</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" /> Tạm Đóng</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Đã được đặt</span>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-slate-50/20">
              
              {/* BRAND NEW: Manual Custom Slot Creator inside Card 4 */}
              <div className="mb-6 bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100 flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900 block mb-1">
                    ➕ TỰ TẠO THÊM CA CHỤP THỦ CÔNG (NGOÀI TEMPLATE)
                  </span>
                  <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                    Nếu muốn mở thêm ca chụp ngoài khung giờ tuần mẫu (ví dụ: ca tối, ca lễ đặc biệt...)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="block">
                    <span className="mb-1 block text-[9px] font-black text-slate-400 uppercase tracking-widest">Bắt Đầu</span>
                    <input 
                      type="time" 
                      value={manualStart} 
                      onChange={(e) => setManualStart(e.target.value)} 
                      className="h-10 w-28 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[9px] font-black text-slate-400 uppercase tracking-widest">Kết Thúc</span>
                    <input 
                      type="time" 
                      value={manualEnd} 
                      onChange={(e) => setManualEnd(e.target.value)} 
                      className="h-10 w-28 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleCreateManualSlot}
                    disabled={saving}
                    className="h-10 inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 text-xs font-black uppercase tracking-widest text-white shadow-md active:scale-95 disabled:bg-slate-300 transition-all shrink-0"
                  >
                    + Thêm Ca Chụp
                  </button>
                </div>
              </div>

              {slots.length === 0 ? (
                <div className="rounded-[24px] border-2 border-dashed border-slate-200 bg-white py-16 text-center">
                  <Clock className="mx-auto h-12 w-12 text-slate-200" />
                  <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">
                    Chưa có slot chụp nào trong ngày này
                  </p>
                  <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto font-medium leading-relaxed">
                    Bạn có thể bấm nút <b>"⚡ Kích hoạt & Tự động tạo Slot"</b> ở trên để tạo tự động, hoặc sử dụng thanh **Tự tạo thêm ca chụp thủ công** ở trên để tự định nghĩa các ca chụp của riêng mình!
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {slots.map((slot) => {
                    const isOpen = slot.status === 'OPEN'
                    const isClosed = slot.status === 'CLOSED'
                    const isBooked = !isOpen && !isClosed

                    let cardStyle = ''
                    let statusLabel = ''

                    if (isOpen) {
                      cardStyle = 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300'
                      statusLabel = '🟢 ĐANG MỞ'
                    } else if (isClosed) {
                      cardStyle = 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:border-slate-300'
                      statusLabel = '🔴 ĐÃ ĐÓNG'
                    } else {
                      cardStyle = 'border-indigo-200 bg-indigo-50 text-indigo-900 cursor-not-allowed'
                      statusLabel = '🔒 ĐÃ ĐẶT LỊCH'
                    }

                    return (
                      <button 
                        key={slot.id} 
                        type="button" 
                        onClick={() => toggleSlot(slot)} 
                        disabled={isBooked} 
                        className={`rounded-2xl border p-5 text-left transition duration-300 active:scale-95 shadow-sm font-sans flex flex-col justify-between h-28 ${cardStyle}`}
                      >
                        <div className="text-[15px] font-black">{slot.startTime} - {slot.endTime}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest">{statusLabel}</div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function ScheduleRow({ 
  row, 
  disabled, 
  onSave 
}: { 
  row: { dayOfWeek: number; label: string; openTime: string; closeTime: string; isActive: boolean }
  disabled: boolean
  onSave: (row: { dayOfWeek: number; openTime: string; closeTime: string; isActive: boolean }) => void 
}) {
  const [openTime, setOpenTime] = useState(row.openTime)
  const [closeTime, setCloseTime] = useState(row.closeTime)
  const [isActive, setIsActive] = useState(row.isActive)

  useEffect(() => {
    setOpenTime(row.openTime)
    setCloseTime(row.closeTime)
    setIsActive(row.isActive)
  }, [row.closeTime, row.isActive, row.openTime])

  return (
    <div className="py-4 first:pt-0 last:pb-0 flex flex-col gap-2.5">
      {/* Line 1: Day Name + Toggle Button (Active/Inactive) */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-slate-900 uppercase tracking-wider">{row.label}</span>
        
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={`h-7 px-3 inline-flex items-center justify-center rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${
            isActive 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' 
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}
        >
          {isActive ? 'Hoạt động' : 'Nghỉ'}
        </button>
      </div>

      {/* Line 2: Time Inputs + Save Button */}
      <div className="flex items-center gap-2">
        <div className="grid grid-cols-2 gap-2 flex-1">
          <TimePicker value={openTime} onChange={setOpenTime} />
          <TimePicker value={closeTime} onChange={setCloseTime} />
        </div>
        
        <button 
          type="button" 
          disabled={disabled} 
          onClick={() => onSave({ dayOfWeek: row.dayOfWeek, openTime, closeTime, isActive })} 
          className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-indigo-600 text-white disabled:bg-slate-200 transition-all active:scale-95 shadow-sm"
        >
          <Save className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function TimePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <input 
      type="time" 
      value={value} 
      onChange={(event) => onChange(event.target.value)} 
      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-black text-slate-800 outline-none focus:border-indigo-500" 
    />
  )
}
