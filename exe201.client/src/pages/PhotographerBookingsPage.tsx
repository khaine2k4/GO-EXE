import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  ListFilter,
  MapPin,
  Search,
  User,
} from 'lucide-react'
import { useToast } from '../components/Toast'
import {
  completeBooking,
  confirmBooking,
  getBookings,
  markInProgress,
  rejectBooking,
  type BookingDto,
} from '../services/bookingApi'

function formatVnd(value?: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value ?? 0)} VND`
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const STATUS_BADGE: Record<string, string> = {
  PENDING_PAYMENT: 'border-amber-200 bg-amber-50 text-amber-700',
  PENDING_CONFIRMATION: 'border-blue-200 bg-blue-50 text-blue-700',
  CONFIRMED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  IN_PROGRESS: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CANCELLED: 'border-slate-200 bg-slate-50 text-slate-500',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PENDING_CONFIRMATION: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Từ chối',
}

export default function PhotographerBookingsPage() {
  const toast = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list')
  const [bookings, setBookings] = useState<BookingDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  // Calendar States
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  )

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const data = await getBookings()
      setBookings(data)
    } catch {
      toast.push({
        type: 'error',
        title: 'Lỗi tải dữ liệu',
        message: 'Không thể tải danh sách booking từ máy chủ.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  // Quick Action Handlers
  const handleConfirm = async (id: number) => {
    setActionLoadingId(id)
    try {
      await confirmBooking(id)
      toast.push({
        type: 'success',
        title: 'Thành công',
        message: 'Đã xác nhận lịch chụp!',
      })
      await fetchBookings()
    } catch {
      toast.push({
        type: 'error',
        title: 'Thất bại',
        message: 'Không thể xác nhận lịch chụp này.',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReject = async (id: number) => {
    const reason = prompt('Nhập lý do từ chối (không bắt buộc):')
    if (reason === null) return // User cancelled prompt
    setActionLoadingId(id)
    try {
      await rejectBooking(id, reason || undefined)
      toast.push({
        type: 'success',
        title: 'Đã từ chối',
        message: 'Đã từ chối lịch chụp này thành công.',
      })
      await fetchBookings()
    } catch {
      toast.push({
        type: 'error',
        title: 'Thất bại',
        message: 'Không thể từ chối lịch chụp này.',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleStart = async (id: number) => {
    setActionLoadingId(id)
    try {
      await markInProgress(id)
      toast.push({
        type: 'success',
        title: 'Bắt đầu chụp',
        message: 'Booking đã chuyển sang trạng thái đang thực hiện.',
      })
      await fetchBookings()
    } catch {
      toast.push({
        type: 'error',
        title: 'Thất bại',
        message: 'Không thể cập nhật trạng thái lịch chụp.',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleComplete = async (id: number) => {
    setActionLoadingId(id)
    try {
      await completeBooking(id)
      toast.push({
        type: 'success',
        title: 'Hoàn thành!',
        message: 'Job chụp ảnh đã được xác nhận hoàn thành.',
      })
      await fetchBookings()
    } catch {
      toast.push({
        type: 'error',
        title: 'Thất bại',
        message: 'Không thể đánh dấu hoàn thành job.',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  // Filter & Search Logic
  const filteredBookings = useMemo(() => {
    return bookings.filter((item) => {
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter
      const matchSearch =
        !search.trim() ||
        item.bookingCode.toLowerCase().includes(search.toLowerCase()) ||
        item.customerName.toLowerCase().includes(search.toLowerCase()) ||
        item.packageName.toLowerCase().includes(search.toLowerCase()) ||
        (item.shootingLocation || '').toLowerCase().includes(search.toLowerCase())
      return matchStatus && matchSearch
    })
  }, [bookings, search, statusFilter])

  // KPIs
  const kpis = useMemo(() => {
    return {
      total: bookings.length,
      pendingConfirm: bookings.filter((b) => b.status === 'PENDING_CONFIRMATION').length,
      active: bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS').length,
      revenue: bookings
        .filter((b) => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + b.studioRevenue, 0),
    }
  }, [bookings])

  // Calendar Helper States
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = useMemo(() => {
    const date = new Date(year, month + 1, 0)
    return date.getDate()
  }, [year, month])

  const startDayOfWeek = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    return firstDay.getDay()
  }, [year, month])

  const calendarDays = useMemo(() => {
    const list = []
    // Add blank days for offset
    for (let index = 0; index < startDayOfWeek; index++) {
      list.push(null)
    }
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      list.push({ day, dateStr: dStr })
    }
    return list
  }, [year, month, daysInMonth, startDayOfWeek])

  // Group Bookings by Date string (yyyy-MM-dd) for Calendar dots
  const bookingsByDate = useMemo(() => {
    const groups: Record<string, BookingDto[]> = {}
    for (const b of bookings) {
      if (!b.shootingDate) continue
      const dateKey = b.shootingDate.split('T')[0]
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(b)
    }
    return groups
  }, [bookings])

  const selectedDateBookings = useMemo(() => {
    return bookingsByDate[selectedDateStr] ?? []
  }, [bookingsByDate, selectedDateStr])

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Quản lý Lịch chụp & Bookings
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Theo dõi yêu cầu, xác nhận lịch biểu, và cập nhật trạng thái chụp ảnh.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'list'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Danh sách
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'calendar'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Lịch chụp (UC52)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Tổng bookings" value={kpis.total} icon={<Activity />} />
        <KpiCard
          title="Chờ xác nhận"
          value={kpis.pendingConfirm}
          icon={<Clock />}
          tone={kpis.pendingConfirm > 0 ? 'amber' : 'slate'}
        />
        <KpiCard
          title="Lịch đang chụp"
          value={kpis.active}
          icon={<CalendarDays />}
          tone={kpis.active > 0 ? 'indigo' : 'slate'}
        />
        <KpiCard
          title="Doanh thu tạm nhận"
          value={formatVnd(kpis.revenue)}
          icon={<DollarSign />}
          tone="emerald"
        />
      </div>

      {/* Tab 1: LIST VIEW */}
      {activeTab === 'list' && (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
          {/* Controls Bar */}
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-[280px] lg:w-[400px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm mã, tên khách, gói dịch vụ, địa điểm..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="relative inline-flex h-11 items-center">
                <span className="pointer-events-none absolute left-3 text-slate-400">
                  <ListFilter className="h-4 w-4" />
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-11 appearance-none rounded-2xl border border-slate-200 bg-white pl-10 pr-9 text-xs font-black uppercase tracking-wider text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING_PAYMENT">Chờ thanh toán</option>
                  <option value="PENDING_CONFIRMATION">Chờ xác nhận</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="IN_PROGRESS">Đang thực hiện</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Đã hủy</option>
                  <option value="REJECTED">Từ chối</option>
                </select>
              </label>
            </div>
          </div>

          {/* List Table */}
          {loading ? (
            <div className="py-20 text-center text-sm font-bold text-slate-400">
              Đang tải danh sách bookings...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-20 text-center">
              <Calendar className="mx-auto h-12 w-12 text-slate-200" />
              <p className="mt-4 text-sm font-black text-slate-400 uppercase tracking-widest">
                Không tìm thấy booking nào phù hợp.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400">
                    <th className="px-6 py-4">Mã Booking</th>
                    <th className="px-6 py-4">Khách hàng</th>
                    <th className="px-6 py-4">Gói chụp</th>
                    <th className="px-6 py-4">Lịch hẹn chụp</th>
                    <th className="px-6 py-4">Thu nhập</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((item) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs font-bold text-slate-600">
                          #{item.bookingCode}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">ID: {item.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-black text-slate-900">
                          {item.customerName}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {item.shootingLocation || 'Tại Studio'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-800">{item.packageName}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          Tổng: {formatVnd(item.totalPrice)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        <div>{formatDate(item.shootingDate)}</div>
                        <div className="mt-1 flex items-center gap-1 text-xs font-black text-indigo-600">
                          <Clock className="h-3 w-3" />
                          {item.startTime} - {item.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-indigo-600">
                        {formatVnd(item.studioRevenue)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-xl border px-3 py-1 text-xs font-black uppercase tracking-wider ${
                            STATUS_BADGE[item.status] ?? STATUS_BADGE.PENDING_PAYMENT
                          }`}
                        >
                          {STATUS_LABEL[item.status] ?? item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/photographer/bookings/${item.id}`)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Quick Actions */}
                          <ActionButtons
                            status={item.status}
                            loading={actionLoadingId === item.id}
                            onConfirm={() => handleConfirm(item.id)}
                            onReject={() => handleReject(item.id)}
                            onStart={() => handleStart(item.id)}
                            onComplete={() => handleComplete(item.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Main Grid Calendar */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                Tháng {month + 1} - Năm {year}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
              <div>CN</div>
              <div>T2</div>
              <div>T3</div>
              <div>T4</div>
              <div>T5</div>
              <div>T6</div>
              <div>T7</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} className="aspect-square rounded-2xl bg-slate-50/30" />
                }

                const { day, dateStr } = cell
                const dayBookings = bookingsByDate[dateStr] ?? []
                const isSelected = selectedDateStr === dateStr
                const isToday = new Date().toISOString().split('T')[0] === dateStr

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl border transition group ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                        : isToday
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700 font-black'
                        : 'border-slate-100 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <span className="text-sm font-black">{day}</span>
                    {dayBookings.length > 0 && (
                      <div className="absolute bottom-2 flex gap-1 justify-center w-full">
                        {dayBookings.slice(0, 3).map((b) => (
                          <span
                            key={b.id}
                            className={`h-1.5 w-1.5 rounded-full ${
                              isSelected
                                ? 'bg-white'
                                : b.status === 'PENDING_CONFIRMATION'
                                ? 'bg-amber-400'
                                : 'bg-emerald-500'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Sidebar Detail for Selected Date */}
          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100 flex flex-col min-h-[420px]">
            <div className="border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600">
                <Calendar className="h-4 w-4" /> Chi tiết ngày chụp
              </div>
              <h3 className="mt-2 text-base font-black text-slate-900">
                {new Date(selectedDateStr).toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {selectedDateBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center text-slate-400">
                  <CalendarDays className="h-10 w-10 text-slate-200 mb-2" />
                  <p className="text-xs font-bold uppercase tracking-wider">
                    Không có lịch chụp trong ngày này.
                  </p>
                </div>
              ) : (
                selectedDateBookings.map((item) => (
                  <div
                    key={item.id}
                    className="group rounded-2xl border border-slate-150 p-4 transition-all hover:border-indigo-300 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-mono text-[10px] font-bold text-slate-400">
                          #{item.bookingCode}
                        </div>
                        <h4 className="mt-1 text-sm font-black text-slate-900">
                          {item.customerName}
                        </h4>
                      </div>
                      <span
                        className={`inline-flex rounded-lg border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          STATUS_BADGE[item.status] ?? STATUS_BADGE.PENDING_PAYMENT
                        }`}
                      >
                        {STATUS_LABEL[item.status] ?? item.status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2 text-xs text-slate-500 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-indigo-500" />
                        <span>
                          {item.startTime} - {item.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Gói: {item.packageName}</span>
                      </div>
                      {item.shootingLocation && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                          <span className="truncate">{item.shootingLocation}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/photographer/bookings/${item.id}`)}
                        className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition"
                      >
                        Chi tiết <ArrowRight className="h-3 w-3" />
                      </button>

                      {/* Small inline quick action buttons */}
                      <ActionButtons
                        status={item.status}
                        loading={actionLoadingId === item.id}
                        onConfirm={() => handleConfirm(item.id)}
                        onReject={() => handleReject(item.id)}
                        onStart={() => handleStart(item.id)}
                        onComplete={() => handleComplete(item.id)}
                        size="sm"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

function KpiCard({
  title,
  value,
  icon,
  tone = 'slate',
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  tone?: 'slate' | 'amber' | 'indigo' | 'emerald'
}) {
  const iconToneMap = {
    slate: 'bg-white text-slate-600',
    amber: 'bg-white text-amber-600',
    indigo: 'bg-white text-indigo-600',
    emerald: 'bg-white text-emerald-600',
  }

  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ring-1 ring-slate-100/5 transition flex items-center gap-4 bg-white`}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${iconToneMap[tone]}`}>
        {icon}
      </div>
      <div>
        <div className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</div>
        <div
          className={`mt-1.5 text-xl font-black ${
            tone === 'emerald'
              ? 'text-emerald-700'
              : tone === 'indigo'
              ? 'text-indigo-700'
              : tone === 'amber'
              ? 'text-amber-700'
              : 'text-slate-900'
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

function ActionButtons({
  status,
  loading,
  onConfirm,
  onReject,
  onStart,
  onComplete,
  size = 'md',
}: {
  status: string
  loading: boolean
  onConfirm: () => void
  onReject: () => void
  onStart: () => void
  onComplete: () => void
  size?: 'sm' | 'md'
}) {
  if (loading) {
    return (
      <span className="text-xs font-semibold text-slate-400 animate-pulse">
        Đang xử lý...
      </span>
    )
  }

  const btnClass =
    size === 'sm'
      ? 'h-8 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition active:scale-95'
      : 'h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition active:scale-95'

  if (status === 'PENDING_CONFIRMATION') {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onConfirm}
          className={`${btnClass} bg-slate-950 text-white hover:bg-slate-800`}
        >
          Xác nhận
        </button>
        <button
          type="button"
          onClick={onReject}
          className={`${btnClass} bg-white border border-rose-200 text-rose-600 hover:bg-rose-50`}
        >
          Từ chối
        </button>
      </div>
    )
  }

  if (status === 'CONFIRMED') {
    return (
      <button
        type="button"
        onClick={onStart}
        className={`${btnClass} bg-indigo-600 text-white hover:bg-indigo-700`}
      >
        Bắt đầu chụp
      </button>
    )
  }

  if (status === 'IN_PROGRESS') {
    return (
      <button
        type="button"
        onClick={onComplete}
        className={`${btnClass} bg-emerald-600 text-white hover:bg-emerald-700`}
      >
        Hoàn thành
      </button>
    )
  }

  return null
}
