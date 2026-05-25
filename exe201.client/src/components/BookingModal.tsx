import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, Check, Clock, CreditCard, MapPin, Package, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BookingCalendar from './BookingCalendar'
import { useAppStore } from '../store/AppStore'
import { useToast } from './Toast'
import type { Photographer, Photoset } from '../types'
import type { ServiceDetail } from '../services/catalogTypes'
import { createBooking, getStudioSlots, payBooking, vnpayCreatePaymentUrl, type TimeSlotDto } from '../services/bookingApi'

type PaymentMethod = 'BANK_TRANSFER' | 'CASH' | 'VNPAY'

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
  const [note, setNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER')
  const [submitting, setSubmitting] = useState(false)
  const [successCode, setSuccessCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setDate('')
    setSlots([])
    setSelectedSlotId(null)
    setSelectedPackageId(service?.packages[0]?.id ?? null)
    setShootingLocation('')
    setNote('')
    setPaymentMethod('BANK_TRANSFER')
    setSubmitting(false)
    setSuccessCode('')
    setError('')
  }, [open, service?.id])

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

  const openSlots = slots.filter((slot) => slot.status === 'OPEN')
  const apiMode = Boolean(service)
  const title = service?.name || photoset?.title || photographer?.name || 'Dịch vụ chụp ảnh'
  const studioName = service?.studioName || photographer?.name || 'Studio'
  const totalPrice = selectedPackage?.price ?? photoset?.packageDetails.standard.price ?? photographer?.startingPrice ?? 0

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
          note: note.trim() || undefined,
        })
        if (paymentMethod === 'VNPAY') {
          const vnpayRes = await vnpayCreatePaymentUrl(booking.id)
          if (vnpayRes?.paymentUrl) {
            window.location.href = vnpayRes.paymentUrl
            return
          } else {
            throw new Error('Không thể tạo link thanh toán VNPay.')
          }
        } else {
          await payBooking({ bookingId: booking.id, methodName: paymentMethod })
          setSuccessCode(booking.bookingCode)
          toast.push({ type: 'success', title: 'Đặt lịch thành công', message: 'Thanh toán giả lập đã được ghi nhận, chờ Studio xác nhận.' })
        }
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
            className="relative max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
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
                  Slot đã được chuyển sang trạng thái BOOKED sau thanh toán giả lập. Studio sẽ xác nhận lịch ở bước tiếp theo.
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

                <div className="max-h-[72vh] overflow-y-auto px-6 py-6">
                  <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
                    <div className="space-y-6">
                      {service && (
                        <Panel icon={<Package className="h-4 w-4" />} title="Chọn gói chụp">
                          <div className="grid gap-3">
                            {service.packages.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setSelectedPackageId(item.id)}
                                className={`rounded-2xl border p-4 text-left transition ${selectedPackageId === item.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
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
                        </Panel>
                      )}

                      <Panel icon={<Calendar className="h-4 w-4" />} title="Chọn ngày chụp">
                        <BookingCalendar value={date} onChange={setDate} busyDates={[]} />
                      </Panel>

                      {service && (
                        <Panel icon={<Clock className="h-4 w-4" />} title="Chọn giờ chụp">
                          {!date ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400">Chon ngay chup truoc de xem gio trong.</div>
                          ) : slotLoading ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400">Đang tải slot...</div>
                          ) : openSlots.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400">Ngày này chưa có slot trống.</div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              {openSlots.map((slot) => (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => setSelectedSlotId(slot.id)}
                                  className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${selectedSlotId === slot.id ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'}`}
                                >
                                  {slot.startTime} - {slot.endTime}
                                </button>
                              ))}
                            </div>
                          )}
                        </Panel>
                      )}

                      <Panel icon={<MapPin className="h-4 w-4" />} title="Địa điểm và ghi chú">
                        <div className="space-y-3">
                          <input
                            value={shootingLocation}
                            onChange={(event) => setShootingLocation(event.target.value)}
                            placeholder="Ví dụ: Bãi biển Mỹ Khê, Đà Nẵng"
                            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-indigo-500"
                          />
                          <textarea
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            rows={3}
                            placeholder="Concept, trang phục, yêu cầu đặc biệt..."
                            className="w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm font-bold outline-none focus:border-indigo-500"
                          />
                        </div>
                      </Panel>
                    </div>

                    <aside className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <div className="text-xs font-black uppercase tracking-widest text-slate-400">Tổng tạm tính</div>
                        <div className="mt-2 text-2xl font-black text-slate-950">{formatVnd(totalPrice)}</div>
                        {selectedPackage && <div className="mt-1 text-sm font-semibold text-slate-500">{selectedPackage.name}</div>}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-950">
                          <CreditCard className="h-4 w-4 text-indigo-600" /> Chọn phương thức thanh toán
                        </div>
                        <div className="grid gap-2">
                          {(['VNPAY', 'BANK_TRANSFER', 'CASH'] as PaymentMethod[]).map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setPaymentMethod(method)}
                              className={`rounded-xl border px-3 py-3 text-left text-xs font-black transition ${paymentMethod === method ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                            >
                              {method === 'VNPAY' && '💳 Thanh toán Online qua VNPay'}
                              {method === 'BANK_TRANSFER' && '💸 Chuyển khoản (Giả lập)'}
                              {method === 'CASH' && '💵 Tiền mặt tại Studio (Giả lập)'}
                            </button>
                          ))}
                        </div>
                        {paymentMethod === 'VNPAY' && (
                          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-800 border border-emerald-100">
                            Hệ thống sẽ chuyển hướng bạn đến cổng thanh toán bảo mật của <span className="font-black text-emerald-950">VNPay Sandbox</span> để thực hiện thanh toán trực tuyến.
                          </div>
                        )}
                        {paymentMethod === 'BANK_TRANSFER' && (
                          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-500">
                            Nội dung chuyển khoản: <span className="font-black text-slate-950">GO BOOKING</span>. Nút bên dưới sẽ giả lập giao dịch thành công cho MVP.
                          </div>
                        )}
                        {paymentMethod === 'CASH' && (
                          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-500">
                            Bạn sẽ thanh toán tiền mặt trực tiếp tại studio khi đến chụp. Slot sẽ được giữ ở trạng thái <span className="font-black text-slate-950">HOLDING</span> trong 15 phút để chờ thanh toán/xác nhận.
                          </div>
                        )}
                      </div>

                      {error && (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs font-bold text-rose-700">{error}</div>
                      )}

                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || (apiMode && (!selectedPackageId || !selectedSlotId || !date))}
                        className="h-12 w-full rounded-2xl bg-slate-950 px-5 text-xs font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {submitting ? 'Đang xử lý...' : 'Tạo booking & thanh toán'}
                      </button>
                    </aside>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
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

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' VND'
}
