import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, Check, Clock, CreditCard, MapPin, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BookingCalendar from './BookingCalendar'
import Stepper, { Step } from './Stepper'
import { useAppStore } from '../store/AppStore'
import { useToast } from './Toast'
import type { Photographer, Photoset } from '../types'
import type { ServiceDetail } from '../services/catalogTypes'
import { getStudioDays } from '../services/scheduleApi'
import { logAnalyticsEvent } from '../services/analyticsApi'
import LocationPickerMap from './map/LocationPickerMap'
import { DA_NANG_CENTER, hasCoordinate, type MapCoordinate } from './map/mapConstants'
import {
  createBooking,
  getStudioSlots,
  payBooking,
  payosCreatePaymentUrl,
  vnpayCreatePaymentUrl,
  type TimeSlotDto,
} from '../services/bookingApi'

type PaymentMethod = 'BANK_TRANSFER' | 'CASH' | 'VNPAY' | 'PAYOS'

export default function BookingModal({
  photographer,
  photoset,
  service,
  open,
  onClose,
}: {
  photographer?: Photographer
  photoset?: Photoset
  service?: ServiceDetail
  open: boolean
  onClose: () => void
}) {
  const nav = useNavigate()
  const toast = useToast()
  const { actions } = useAppStore()

  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<TimeSlotDto[]>([])
  const [slotLoading, setSlotLoading] = useState(false)
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null)
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(service?.packages[0]?.id ?? null)
  const [shootingLocation, setShootingLocation] = useState('')
  const [shootingCoordinate, setShootingCoordinate] = useState<MapCoordinate>(getInitialShootingCoordinate(service))
  const [note, setNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PAYOS')
  const [submitting, setSubmitting] = useState(false)
  const [successCode, setSuccessCode] = useState('')
  const [error, setError] = useState('')
  const [busyDates, setBusyDates] = useState<string[]>([])
  const [activeStep, setActiveStep] = useState(1)

  const [suggestions, setSuggestions] = useState<Array<{ label: string; lat: number; lng: number }>>([])
  const [searching, setSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const suggestionRef = useRef<HTMLDivElement | null>(null)

  // Handle typing location in input
  const handleLocationInputChange = (value: string) => {
    setShootingLocation(value)
    setSearchQuery(value)
  }

  // Handle selecting location suggestion
  const handleSelectSuggestion = (item: { label: string; lat: number; lng: number }) => {
    setShootingLocation(item.label)
    setShootingCoordinate({ lat: item.lat, lng: item.lng })
    setSuggestions([])
    setShowSuggestions(false)
  }

  // Handle map marker drag & click -> reverse geocode to get address string
  const handleMapLocationChange = async (coord: MapCoordinate) => {
    setShootingCoordinate(coord)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coord.lat}&lon=${coord.lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'GoExeStudioBookingApp/1.0',
            'Accept-Language': 'vi',
          },
        }
      )
      const data = await response.json()
      if (data && data.display_name) {
        setShootingLocation(data.display_name)
      }
    } catch (error) {
      console.error('Lỗi giải ngược tọa độ:', error)
    }
  }

  // Debounced search for Nominatim geocoding suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1&countrycodes=vn`,
          {
            headers: {
              'User-Agent': 'GoExeStudioBookingApp/1.0',
              'Accept-Language': 'vi',
            },
          }
        )
        const data = await res.json()
        if (Array.isArray(data)) {
          const formatted = data.map((item: any) => ({
            label: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }))
          setSuggestions(formatted)
          setShowSuggestions(formatted.length > 0)
        }
      } catch (err) {
        console.error('Lỗi khi gợi ý vị trí:', err)
      } finally {
        setSearching(false)
      }
    }, 600) // 600ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Handle clicking outside location suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) return
    setDate('')
    setSlots([])
    setSelectedSlotId(null)
    setSelectedPackageId(service?.packages[0]?.id ?? null)
    setShootingLocation('')
    setShootingCoordinate(getInitialShootingCoordinate(service))
    setNote('')
    setPaymentMethod('PAYOS')
    setSubmitting(false)
    setSuccessCode('')
    setError('')
    setBusyDates([])
    setActiveStep(1)
    setSuggestions([])
    setSearchQuery('')
    setShowSuggestions(false)

    if (service?.studioId) {
      logAnalyticsEvent('CLICK_BOOKING', window.location.pathname, service.studioId, service.packages[0]?.id).catch(() => {})
    }
  }, [open, service?.id])

  useEffect(() => {
    if (open && service?.studioId && selectedPackageId) {
      logAnalyticsEvent('SELECT_PACKAGE', window.location.pathname, service.studioId, selectedPackageId).catch(() => {})
    }
  }, [selectedPackageId, open, service?.studioId])

  useEffect(() => {
    if (!open || !service?.studioId) {
      setBusyDates([])
      return
    }

    const todayStr = new Date().toISOString().split('T')[0]
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 90)
    const futureStr = futureDate.toISOString().split('T')[0]

    getStudioDays(service.studioId, { from: todayStr, to: futureStr, includeClosed: true })
      .then((days) => {
        const busy: string[] = []
        const availableSet = new Set<string>()
        
        // 1. Chỉ gom các ngày có slot trống trạng thái 'OPEN' thực sự
        days.forEach((day) => {
          const hasOpenSlots = day.slots && day.slots.some((slot) => slot.status === 'OPEN')
          if (day.isAvailable && hasOpenSlots) {
            availableSet.add(day.date)
          }
        })

        // 2. Với mọi ngày trong khoảng 90 ngày tới, nếu không có slot trống thì mờ đi (disabled)
        const today = new Date()
        for (let i = 0; i < 90; i++) {
          const future = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
          const year = future.getFullYear()
          const month = String(future.getMonth() + 1).padStart(2, '0')
          const dayVal = String(future.getDate()).padStart(2, '0')
          const iso = `${year}-${month}-${dayVal}`
          
          if (!availableSet.has(iso)) {
            busy.push(iso)
          }
        }
        
        setBusyDates(busy)
      })
      .catch((err) => {
        console.error('Không thể tải lịch làm việc của Studio:', err)
      })
  }, [open, service?.studioId])

  useEffect(() => {
    if (!service || !date) return
    setSlotLoading(true)
    setSelectedSlotId(null)
    getStudioSlots(service.studioId, date)
      .then(setSlots)
      .catch(() => setError('Không tải được slot của ngày đã chọn.'))
      .finally(() => setSlotLoading(false))
  }, [service, date])

  const selectedPackage = useMemo(
    () => service?.packages.find((item) => item.id === selectedPackageId),
    [service?.packages, selectedPackageId],
  )
  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedSlotId),
    [selectedSlotId, slots],
  )

  const openSlots = slots.filter((slot) => slot.status === 'OPEN')
  const apiMode = Boolean(service)
  const title = service?.name || photoset?.title || photographer?.name || 'Dịch vụ chụp ảnh'
  const studioName = service?.studioName || photographer?.name || 'Studio'
  const totalPrice = selectedPackage?.price ?? photoset?.packageDetails.standard.price ?? photographer?.startingPrice ?? 0

  function canContinue(step: number) {
    if (step === 1) return !apiMode || Boolean(selectedPackageId)
    if (step === 2) return apiMode ? Boolean(date && selectedSlotId) : Boolean(date)
    if (step === 3) return apiMode ? shootingLocation.trim().length > 0 : true
    return true
  }

  function canEnterStep(step: number) {
    if (step <= 1) return true
    for (let current = 1; current < step; current += 1) {
      if (!canContinue(current)) return false
    }
    return true
  }

  function handleStepChange(step: number) {
    setActiveStep(step)
    setError('')
  }

  async function handleSubmit() {
    setError('')
    setSubmitting(true)
    try {
      if (apiMode) {
        if (!selectedPackageId || !selectedSlotId) throw new Error('Vui lòng chọn gói và khung giờ chụp.')
        if (!shootingLocation.trim()) throw new Error('Vui lòng nhập địa điểm chụp.')

        const booking = await createBooking({
          packageId: selectedPackageId,
          slotId: selectedSlotId,
          shootingLocation: shootingLocation.trim(),
          shootingLat: shootingCoordinate.lat,
          shootingLng: shootingCoordinate.lng,
          note: note.trim() || undefined,
        })

        if (paymentMethod === 'PAYOS') {
          const payosRes = await payosCreatePaymentUrl(booking.id)
          if (payosRes?.paymentUrl) {
            window.location.href = payosRes.paymentUrl
            return
          }
          throw new Error('Không thể tạo link thanh toán VietQR.')
        }

        if (paymentMethod === 'VNPAY') {
          const vnpayRes = await vnpayCreatePaymentUrl(booking.id)
          if (vnpayRes?.paymentUrl) {
            window.location.href = vnpayRes.paymentUrl
            return
          }
          throw new Error('Không thể tạo link thanh toán VNPay.')
        }

        await payBooking({ bookingId: booking.id, methodName: paymentMethod })
        setSuccessCode(booking.bookingCode)
        toast.push({
          type: 'success',
          title: 'Đặt lịch thành công',
          message: 'Thanh toán giả lập đã được ghi nhận, chờ Studio xác nhận.',
        })
      } else {
        if (!photographer || !date) throw new Error('Vui lòng chọn ngày chụp.')
        await actions.createBooking({
          photographerId: photographer.id,
          date,
          packageTier: 'STANDARD',
          totalPrice,
          cardNumber: '4242424242424242',
          expiry: '12/30',
          cvc: '123',
        })
        setSuccessCode('DEMO')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo booking.')
    } finally {
      setSubmitting(false)
    }
  }

  function closeSuccess() {
    onClose()
    nav('/customer/bookings')
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            className="relative max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {successCode ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Check className="h-8 w-8" />
                </div>
                <h2 className="mt-6 text-2xl font-black text-slate-950">Booking đã được tạo</h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Mã booking: <span className="font-black text-slate-950">{successCode}</span>
                </p>
                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500">
                  Slot đã được giữ sau thanh toán. Studio sẽ xác nhận lịch ở bước tiếp theo.
                </p>
                <button
                  type="button"
                  onClick={closeSuccess}
                  className="mt-8 h-12 rounded-2xl bg-slate-950 px-7 text-xs font-black uppercase tracking-widest text-white"
                >
                  Xem booking của tôi
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-indigo-600">Đặt lịch chụp</div>
                    <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{studioName}</p>
                  </div>
                  <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-[72vh] overflow-y-auto bg-slate-50/40">
                  <Stepper
                    initialStep={1}
                    onStepChange={handleStepChange}
                    onFinalStepCompleted={handleSubmit}
                    backButtonText="Quay lại"
                    nextButtonText="Tiếp tục"
                    finalButtonText="Tạo booking & thanh toán"
                    disableStepIndicators={false}
                    canGoNext={canContinue}
                    canEnterStep={canEnterStep}
                    loading={submitting}
                  >
                    <Step>
                      <div className="space-y-5">
                        <StepHeading
                          index={activeStep}
                          title="Chọn gói chụp"
                          description="Chọn gói phù hợp trước khi giữ lịch. Bạn có thể quay lại chỉnh bất cứ lúc nào."
                        />
                        {service ? (
                          <div className="grid gap-3">
                            {service.packages.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setSelectedPackageId(item.id)}
                                className={`rounded-2xl border p-4 text-left transition-all duration-500 ${
                                  selectedPackageId === item.id
                                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div className="font-black text-slate-950">{item.name}</div>
                                    {item.description && <div className="mt-1 text-sm text-slate-500">{item.description}</div>}
                                  </div>
                                  <div className="shrink-0 text-sm font-black text-indigo-600">{formatVnd(item.price)}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <div className="text-sm font-black text-slate-950">{title}</div>
                            <p className="mt-2 text-sm font-semibold text-slate-500">Gói mặc định sẽ được dùng cho booking demo này.</p>
                          </div>
                        )}
                      </div>
                    </Step>

                    <Step>
                      <div className="space-y-5">
                        <StepHeading
                          index={activeStep}
                          title="Chọn ngày và khung giờ"
                          description="Các ngày kín lịch sẽ bị khóa. Sau khi chọn ngày, hệ thống sẽ tải slot còn trống."
                        />
                        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                          <Panel icon={<Calendar className="h-4 w-4" />} title="Ngày chụp">
                            <BookingCalendar value={date} onChange={setDate} busyDates={busyDates} />
                          </Panel>

                          <Panel icon={<Clock className="h-4 w-4" />} title="Khung giờ">
                            {!apiMode ? (
                              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm font-bold text-slate-500">
                                Chọn ngày chụp ở lịch bên cạnh để tiếp tục.
                              </div>
                            ) : !date ? (
                              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm font-bold text-slate-500">
                                Chọn ngày chụp trước để xem giờ trống.
                              </div>
                            ) : slotLoading ? (
                              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm font-bold text-slate-500">
                                Đang tải slot...
                              </div>
                            ) : openSlots.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm font-bold text-slate-500">
                                Ngày này chưa có slot trống.
                              </div>
                            ) : (
                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                {openSlots.map((slot) => (
                                  <button
                                    key={slot.id}
                                    type="button"
                                    onClick={() => setSelectedSlotId(slot.id)}
                                    className={`rounded-2xl border px-4 py-3 text-sm font-black transition-all duration-500 ${
                                      selectedSlotId === slot.id
                                        ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                                    }`}
                                  >
                                    {slot.startTime} - {slot.endTime}
                                  </button>
                                ))}
                              </div>
                            )}
                          </Panel>
                        </div>
                      </div>
                    </Step>

                    <Step>
                      <div className="space-y-5">
                        <StepHeading
                          index={activeStep}
                          title="Thông tin buổi chụp"
                          description="Nhập địa điểm, concept hoặc các yêu cầu đặc biệt để studio chuẩn bị tốt hơn."
                        />
                        <Panel icon={<MapPin className="h-4 w-4" />} title="Địa điểm và ghi chú">
                          <div className="space-y-3">
                            <div ref={suggestionRef} className="relative">
                              <input
                                value={shootingLocation}
                                onChange={(event) => handleLocationInputChange(event.target.value)}
                                onFocus={() => {
                                  if (suggestions.length > 0) setShowSuggestions(true)
                                }}
                                placeholder="Ví dụ: Bãi biển Mỹ Khê, Đà Nẵng"
                                className="h-12 w-full rounded-2xl border border-slate-200 px-4 pr-24 text-sm font-bold outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                              />
                              {searching && (
                                <div className="absolute right-4 top-3.5 text-xs font-bold text-indigo-500 animate-pulse">
                                  Đang tìm...
                                </div>
                              )}
                              {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                                  {suggestions.map((item, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => handleSelectSuggestion(item)}
                                      className="block w-full rounded-xl px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                    >
                                      {item.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <LocationPickerMap value={shootingCoordinate} onChange={handleMapLocationChange} className="h-64 w-full" />
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
                              Tọa độ đã chọn: <span className="text-slate-900">{shootingCoordinate.lat.toFixed(5)}, {shootingCoordinate.lng.toFixed(5)}</span>
                            </div>
                            <textarea
                              value={note}
                              onChange={(event) => setNote(event.target.value)}
                              rows={4}
                              placeholder="Concept, trang phục, yêu cầu đặc biệt..."
                              className="w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                            />
                          </div>
                        </Panel>
                      </div>
                    </Step>

                    <Step>
                      <div className="space-y-5">
                        <StepHeading
                          index={activeStep}
                          title="Xác nhận và thanh toán"
                          description="Kiểm tra lại thông tin booking rồi chọn phương thức thanh toán phù hợp."
                        />
                        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <div className="text-xs font-black uppercase tracking-widest text-slate-400">Tóm tắt</div>
                            <div className="mt-3 space-y-3 text-sm">
                              <SummaryRow label="Studio" value={studioName} />
                              <SummaryRow label="Gói" value={selectedPackage?.name || title} />
                              <SummaryRow label="Ngày" value={date || 'Chưa chọn'} />
                              <SummaryRow label="Giờ" value={selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : apiMode ? 'Chưa chọn' : 'Theo ngày đã chọn'} />
                              <SummaryRow label="Địa điểm" value={shootingLocation || 'Chưa nhập'} />
                              <SummaryRow label="Tọa độ" value={`${shootingCoordinate.lat.toFixed(5)}, ${shootingCoordinate.lng.toFixed(5)}`} />
                            </div>
                            <div className="mt-5 border-t border-slate-200 pt-4">
                              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Tổng tạm tính</div>
                              <div className="mt-1 text-2xl font-black text-slate-950">{formatVnd(totalPrice)}</div>
                            </div>
                          </div>

                          <Panel icon={<CreditCard className="h-4 w-4" />} title="Phương thức thanh toán">
                            <div className="grid gap-2">
                              {(['PAYOS'] as PaymentMethod[]).map((method) => (
                                <button
                                  key={method}
                                  type="button"
                                  onClick={() => setPaymentMethod(method)}
                                  className={`rounded-xl border px-3 py-3 text-left text-xs font-black transition-all duration-500 ${
                                    paymentMethod === method
                                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  {method === 'PAYOS' && 'Quét VietQR qua payOS (Napas 24/7)'}
                                  {method === 'VNPAY' && 'Thanh toán online qua VNPay'}
                                  {method === 'BANK_TRANSFER' && 'Chuyển khoản giả lập'}
                                  {method === 'CASH' && 'Tiền mặt tại Studio giả lập'}
                                </button>
                              ))}
                            </div>
                            <PaymentNote method={paymentMethod} />
                          </Panel>
                        </div>
                      </div>
                    </Step>
                  </Stepper>

                  {error && (
                    <div className="px-6 pb-6">
                      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs font-bold text-rose-700">{error}</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function StepHeading({ index, title, description }: { index: number; title: string; description: string }) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Bước {index}/4</div>
      <h3 className="mt-1 text-xl font-black text-slate-950">{title}</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{description}</p>
    </div>
  )
}

function Panel({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-950">
        <span className="text-indigo-600">{icon}</span>
        {title}
      </div>
      {children}
    </section>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 pb-2 last:border-b-0 last:pb-0">
      <span className="shrink-0 font-bold text-slate-400">{label}</span>
      <span className="text-right font-black text-slate-800">{value}</span>
    </div>
  )
}

function PaymentNote({ method }: { method: PaymentMethod }) {
  if (method === 'PAYOS') {
    return (
      <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs font-semibold leading-5 text-indigo-800">
        Hệ thống sẽ chuyển hướng bạn đến cổng thanh toán payOS để quét mã VietQR.
      </div>
    )
  }

  if (method === 'VNPAY') {
    return (
      <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-800">
        Hệ thống sẽ chuyển hướng bạn đến cổng thanh toán VNPay Sandbox.
      </div>
    )
  }

  if (method === 'BANK_TRANSFER') {
    return (
      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-500">
        Nội dung chuyển khoản: <span className="font-black text-slate-950">GO BOOKING</span>. Nút hoàn tất sẽ giả lập giao dịch thành công cho MVP.
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-500">
      Bạn sẽ thanh toán tiền mặt trực tiếp tại studio khi đến chụp. Slot sẽ được giữ theo luồng booking hiện tại.
    </div>
  )
}

function getInitialShootingCoordinate(service?: ServiceDetail): MapCoordinate {
  if (hasCoordinate(service)) {
    return { lat: service.lat, lng: service.lng }
  }

  return DA_NANG_CENTER
}

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' VND'
}
