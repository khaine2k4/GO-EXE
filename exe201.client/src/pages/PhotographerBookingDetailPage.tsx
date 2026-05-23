import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  ImageIcon,
  UploadCloud,
  XCircle,
  MessageCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import {
  completeBooking,
  confirmBooking,
  getBooking,
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

function formatDateTime(dateTimeStr?: string) {
  if (!dateTimeStr) return '-'
  return new Date(dateTimeStr).toLocaleString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'CHỜ THANH TOÁN',
  PENDING_CONFIRMATION: 'CHỜ XÁC NHẬN',
  CONFIRMED: 'ĐÃ XÁC NHẬN',
  IN_PROGRESS: 'ĐANG THỰC HIỆN',
  COMPLETED: 'HOÀN THÀNH',
  CANCELLED: 'ĐÃ HỦY',
  REJECTED: 'TỪ CHỐI',
}

const STATUS_COLOR: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-600 ring-amber-100',
  PENDING_CONFIRMATION: 'bg-blue-50 text-blue-600 ring-blue-100',
  CONFIRMED: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  IN_PROGRESS: 'bg-yellow-50 text-yellow-600 ring-yellow-100',
  COMPLETED: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  CANCELLED: 'bg-slate-50 text-slate-400 ring-slate-100',
  REJECTED: 'bg-rose-50 text-rose-600 ring-rose-100',
}

const DELIVERY_IMGS_POOL = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1600&auto=format&fit=crop&q=80',
]

export default function PhotographerBookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const toast = useToast()

  const [booking, setBooking] = useState<BookingDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [stagedImages, setStagedImages] = useState<string[]>([])

  const loadBooking = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await getBooking(id)
      setBooking(data)
      // If it was completed, simulate some delivered images
      if (data.status === 'COMPLETED') {
        setStagedImages([
          DELIVERY_IMGS_POOL[0],
          DELIVERY_IMGS_POOL[1],
          DELIVERY_IMGS_POOL[2],
        ])
      }
    } catch {
      toast.push({
        type: 'error',
        title: 'Lỗi tải dữ liệu',
        message: 'Không tìm thấy booking hoặc có lỗi kết nối.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBooking()
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="mt-4 text-sm font-bold uppercase tracking-wider">Đang tải chi tiết hợp đồng...</p>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <XCircle className="h-12 w-12 text-rose-300" />
        <div className="mt-4 text-xl font-black tracking-tight text-slate-900 uppercase">
          Không tìm thấy hợp đồng
        </div>
        <button
          onClick={() => nav('/photographer/bookings')}
          className="mt-6 text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-all"
        >
          ← QUAY LẠI DANH SÁCH
        </button>
      </div>
    )
  }

  const currentBooking = booking
  const canConfirm = currentBooking.status === 'PENDING_CONFIRMATION'
  const canStart = currentBooking.status === 'CONFIRMED'
  const canComplete = currentBooking.status === 'IN_PROGRESS'

  async function handleConfirmJob() {
    setActionLoading(true)
    try {
      await confirmBooking(currentBooking.id)
      toast.push({
        type: 'success',
        title: 'Thành công 📸',
        message: 'Bạn đã xác nhận nhận job chụp ảnh này!',
      })
      await loadBooking()
    } catch {
      toast.push({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể xác nhận job này.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRejectJob() {
    const reason = prompt('Nhập lý do từ chối (không bắt buộc):')
    if (reason === null) return // Cancelled prompt
    setActionLoading(true)
    try {
      await rejectBooking(currentBooking.id, reason || undefined)
      toast.push({
        type: 'success',
        title: 'Từ chối thành công',
        message: 'Lịch chụp đã được từ chối.',
      })
      await loadBooking()
    } catch {
      toast.push({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể từ chối lịch chụp.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  async function handleStartJob() {
    setActionLoading(true)
    try {
      await markInProgress(currentBooking.id)
      toast.push({
        type: 'success',
        title: 'Bắt đầu chụp ✨',
        message: 'Lịch chụp đã bắt đầu. Chúc bạn có buổi chụp tuyệt vời!',
      })
      await loadBooking()
    } catch {
      toast.push({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể cập nhật sang đang thực hiện.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCompleteJob() {
    if (stagedImages.length === 0) {
      toast.push({
        type: 'error',
        title: 'Thiếu Album Giao Ảnh',
        message: 'Vui lòng upload ít nhất 1 ảnh sản phẩm mẫu trước khi hoàn thành.',
      })
      return
    }

    setActionLoading(true)
    try {
      await completeBooking(currentBooking.id)
      toast.push({
        type: 'success',
        title: 'Hoàn thành Job! 🎉',
        message: 'Hợp đồng đã hoàn tất. Doanh thu của bạn đã được quyết toán!',
      })
      await loadBooking()
    } catch {
      toast.push({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể hoàn thành lịch chụp này.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAddMockImage() {
    setUploadingImage(true)
    await new Promise((r) => setTimeout(r, 500))
    const randomImg = DELIVERY_IMGS_POOL[stagedImages.length % DELIVERY_IMGS_POOL.length]
    setStagedImages((prev) => [...prev, randomImg])
    setUploadingImage(false)
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <button
        onClick={() => nav('/photographer/bookings')}
        className="mb-8 inline-flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> QUAY LẠI DANH SÁCH
      </button>

      {/* Premium Header */}
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-2">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Chi tiết Hợp đồng</h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full ring-1 ring-inset px-3.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                STATUS_COLOR[booking.status] ?? STATUS_COLOR.PENDING_PAYMENT
              }`}
            >
              {STATUS_LABEL[booking.status] ?? booking.status}
            </span>
          </div>
          <p className="mt-2 text-[14px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            MÃ BOOKING <span className="text-slate-900 font-mono">#{booking.bookingCode}</span> · KHÁCH: <span className="text-slate-900">{booking.customerName}</span>
          </p>
        </div>

        {/* Dynamic Actions */}
        <div className="flex gap-3 flex-wrap">
          {canConfirm && (
            <>
              <button
                onClick={handleConfirmJob}
                disabled={actionLoading}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 px-6 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Xác nhận Nhận Job
              </button>
              <button
                onClick={handleRejectJob}
                disabled={actionLoading}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-6 text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Từ chối
              </button>
            </>
          )}
          {canStart && (
            <button
              onClick={handleStartJob}
              disabled={actionLoading}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-8 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-600/10 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              Bắt đầu chụp (In Progress)
            </button>
          )}
          {canComplete && (
            <button
              onClick={handleCompleteJob}
              disabled={actionLoading}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-8 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-emerald-600/10 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              Giao ảnh & Hoàn thành Job
            </button>
          )}
        </div>
      </div>

      {/* Info Banners */}
      {booking.status === 'PENDING_CONFIRMATION' && (
        <StatusBanner
          type="warning"
          title="Hợp đồng đang chờ bạn xác nhận ⏳"
          message="Khách hàng đã đặt cọc trực tuyến. Vui lòng xác nhận lịch hẹn này để nhận công việc hoặc từ chối để hoàn tiền tự động."
        />
      )}
      {booking.status === 'PENDING_PAYMENT' && (
        <StatusBanner
          type="warning"
          title="Đang chờ khách hàng thanh toán giữ slot 💳"
          message="Giao dịch nháp đã được tạo. Khách có tối đa 15 phút để hoàn tất thanh toán trước khi slot tự động bị thu hồi."
        />
      )}
      {booking.status === 'REJECTED' && (
        <StatusBanner
          type="error"
          title="Hợp đồng đã bị từ chối ❌"
          message="Studio đã từ chối lịch chụp này. Giao dịch thanh toán được hệ thống chuyển sang hàng chờ hoàn tiền."
        />
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px] items-start">
        {/* Left Area */}
        <div className="space-y-10">
          {/* Photo Workspace Delivery */}
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/30 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm text-slate-900">
                  <ImageIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-tight">Album Giao Sản Phẩm (Demo)</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {stagedImages.length} files trong album
                  </p>
                </div>
              </div>

              {(booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED') && (
                <button
                  onClick={handleAddMockImage}
                  disabled={uploadingImage}
                  className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all shadow-sm active:scale-95 disabled:opacity-55"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  {uploadingImage ? 'Đang tải...' : 'Upload File Mới'}
                </button>
              )}
            </div>

            <div className="p-6 md:p-8">
              {stagedImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-[28px] border-2 border-dashed border-slate-100 bg-slate-50/30 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-slate-200" />
                  <p className="mt-4 text-[14px] font-black text-slate-400 uppercase tracking-widest">
                    Chưa có ảnh nào được đăng tải
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-400 max-w-xs mx-auto">
                    Trong trạng thái ĐANG THỰC HIỆN, bạn có thể tải lên các file sản phẩm xem trước cho khách hàng.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {stagedImages.map((url, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group shadow-sm bg-slate-50"
                      >
                        <img
                          src={url}
                          className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                          alt="Delivered product"
                        />
                        {booking.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => setStagedImages((prev) => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-slate-900/90 text-white flex items-center justify-center hover:bg-rose-600 transition"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[20px] border border-indigo-100 bg-indigo-50/30 p-5 flex gap-3 text-xs text-indigo-800 leading-relaxed font-semibold">
                    <span>💡</span>
                    <p>
                      <span className="font-black">Giao sản phẩm:</span> Dữ liệu hình ảnh được demo trực quan. Bấm Hoàn thành để lưu kết quả và giải ngân quỹ Escrow.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Real payments block info */}
          {booking.latestPayment && (
            <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
              <div className="border-b border-slate-100 bg-slate-50/30 px-8 py-5 flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                  Thông tin thanh toán
                </h2>
                <span className="inline-flex rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-black uppercase text-indigo-700">
                  {booking.latestPayment.status}
                </span>
              </div>
              <div className="p-6 md:p-8 grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mã thanh toán</span>
                  <p className="mt-1 font-mono font-bold text-slate-800">#{booking.latestPayment.paymentCode}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cổng thanh toán / Provider</span>
                  <p className="mt-1 font-semibold text-slate-800">
                    {booking.latestPayment.methodName} ({booking.latestPayment.paymentProvider || 'PhotoMarket Escrow'})
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số tiền đã đóng</span>
                  <p className="mt-1 font-black text-slate-950">{formatVnd(Number(booking.latestPayment.amount))}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mã tham chiếu / Transaction</span>
                  <p className="mt-1 font-mono text-slate-700">{booking.latestPayment.transactionCode || 'Chưa cập nhật'}</p>
                </div>
                {booking.latestPayment.paidAt && (
                  <div className="sm:col-span-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thời gian đóng tiền</span>
                    <p className="mt-1 font-semibold text-slate-700">{formatDateTime(booking.latestPayment.paidAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-8 sticky top-8">
          {/* Detail Parameters */}
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white p-2 shadow-sm ring-1 ring-slate-100">
            <div className="bg-slate-50/50 p-6 md:p-8 rounded-[28px] space-y-6">
              <div>
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Khách hàng</div>
                <div className="text-[17px] font-black tracking-tight text-slate-900">{booking.customerName}</div>
                <button
                  onClick={() => nav(`/chat?studioId=${booking.studioId}&customerId=${booking.customerId}&bookingId=${booking.id}`)}
                  className="mt-3 flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 text-[11px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-100 transition-all active:scale-[0.98]"
                >
                  <MessageCircle className="h-4.5 w-4.5" /> NHẮN TIN VỚI KHÁCH HÀNG
                </button>
              </div>

              <div className="h-px bg-slate-200 mx-2" />

              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Thông số giao dịch
              </div>

              <div className="space-y-4">
                <DetailRow label="Gói dịch vụ" value={booking.packageName} />
                <DetailRow label="Ngày chụp" value={formatDate(booking.shootingDate)} />
                <DetailRow label="Giờ chụp" value={`${booking.startTime} - ${booking.endTime}`} />
                <DetailRow label="Địa điểm" value={booking.shootingLocation || 'Tại Studio'} />
                {booking.note && (
                  <div className="px-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 block">
                      Ghi chú của khách
                    </span>
                    <p className="mt-1 text-xs text-slate-600 bg-white border border-slate-100 rounded-xl p-3 leading-relaxed">
                      {booking.note}
                    </p>
                  </div>
                )}

                <div className="h-px bg-slate-200 mx-2" />

                <DetailRow label="Tạm tính" value={formatVnd(Number(booking.totalPrice))} />
                <DetailRow label="Phí Commission" value={formatVnd(Number(booking.commissionAmount))} />
                
                <div className="flex items-center justify-between px-2 pt-2 border-t border-dashed border-slate-200">
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">THỰC NHẬN</span>
                  <span className="text-lg font-black text-indigo-700">{formatVnd(Number(booking.studioRevenue))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Timeline progress map */}
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Trình tự hợp đồng</h3>
            <div className="relative pl-3 space-y-6">
              <div className="absolute left-[9px] top-2 bottom-4 w-px bg-slate-100" />
              <TimelineStep
                label="Đặt lịch & Giữ chỗ"
                desc="Draft booking được giữ chỗ thành công"
                done={true}
              />
              <TimelineStep
                label="Đã đặt cọc"
                desc="Tiền đang treo ở cổng Escrow"
                done={booking.status !== 'PENDING_PAYMENT'}
                active={booking.status === 'PENDING_PAYMENT'}
              />
              <TimelineStep
                label="Studio xác nhận"
                desc="Chấp nhận hoặc Từ chối lịch chụp"
                done={
                  booking.status !== 'PENDING_PAYMENT' &&
                  booking.status !== 'PENDING_CONFIRMATION' &&
                  booking.status !== 'REJECTED'
                }
                active={booking.status === 'PENDING_CONFIRMATION'}
                err={booking.status === 'REJECTED'}
              />
              <TimelineStep
                label="Đang chụp ảnh"
                desc="Job chụp đang được thực hiện"
                done={booking.status === 'COMPLETED'}
                active={booking.status === 'IN_PROGRESS'}
              />
              <TimelineStep
                label="Hoàn tất quyết toán"
                desc="Chuyển khoản doanh thu cho Studio"
                done={booking.status === 'COMPLETED'}
                active={booking.status === 'COMPLETED'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBanner({
  type,
  title,
  message,
}: {
  type: 'warning' | 'error'
  title: string
  message: string
}) {
  const isWarning = type === 'warning'
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-8 rounded-3xl border p-6 md:p-8 shadow-sm ${
        isWarning ? 'border-amber-100 bg-amber-50/40' : 'border-rose-100 bg-rose-50'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
            isWarning ? 'bg-white text-amber-600' : 'bg-white text-rose-600'
          }`}
        >
          {isWarning ? <Clock className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
        </div>
        <div>
          <h3 className={`text-base font-black leading-tight ${isWarning ? 'text-amber-900' : 'text-rose-900'}`}>
            {title}
          </h3>
          <p className={`mt-2 text-xs font-semibold leading-relaxed max-w-3xl ${
            isWarning ? 'text-amber-700/80' : 'text-rose-700/80'
          }`}>
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-2">
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-xs font-black text-slate-800 text-right max-w-[180px] truncate">{value}</span>
    </div>
  )
}

function TimelineStep({
  label,
  desc,
  done,
  active,
  err,
}: {
  label: string
  desc: string
  done: boolean
  active?: boolean
  err?: boolean
}) {
  let circleClass = 'bg-slate-100 text-slate-400'
  let labelClass = 'text-slate-400 font-semibold'

  if (err) {
    circleClass = 'bg-rose-500 text-white'
    labelClass = 'text-rose-700 font-black'
  } else if (active) {
    circleClass = 'bg-white border-2 border-indigo-500 text-indigo-600 ring-4 ring-indigo-50'
    labelClass = 'text-indigo-700 font-black'
  } else if (done) {
    circleClass = 'bg-indigo-600 text-white'
    labelClass = 'text-slate-900 font-bold'
  }

  return (
    <div className="flex gap-3 items-start text-xs">
      <div
        className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] ${circleClass}`}
      >
        {err ? '×' : done && !active ? '✓' : '•'}
      </div>
      <div>
        <div className={labelClass}>{label}</div>
        <div className="mt-0.5 text-[10px] text-slate-400 font-semibold leading-snug">{desc}</div>
      </div>
    </div>
  )
}
