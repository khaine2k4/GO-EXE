import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, UploadCloud, ImageIcon, CheckCircle, Clock, AlertTriangle, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/AppStore'
import WatermarkImage from '../components/WatermarkImage'
import StatusTimeline from '../components/StatusTimeline'
import { useToast } from '../components/Toast'

function formatVnd(v: number) { return new Intl.NumberFormat('vi-VN').format(v) + ' ₫' }
function formatDate(iso: string) { return new Date(iso).toLocaleDateString('vi-VN', { dateStyle: 'medium' }) }

// Full size standard images for delivery simulation
const DELIVERY_IMGS_POOL = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1600&auto=format&fit=crop&q=80'
]

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'CHỜ XÁC NHẬN', CONFIRMED: 'ĐÃ XÁC NHẬN', DELIVERED: 'ĐÃ GIAO ẢNH',
  COMPLETED: 'HOÀN THÀNH', DISPUTED: 'KHIẾU NẠI', REFUNDED: 'HOÀN TIỀN', CANCELLED: 'ĐÃ HỦY',
}
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-600 ring-amber-100',
  CONFIRMED: 'bg-blue-50 text-blue-600 ring-blue-100',
  DELIVERED: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  COMPLETED: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  DISPUTED: 'bg-rose-50 text-rose-600 ring-rose-100',
  REFUNDED: 'bg-slate-50 text-slate-500 ring-slate-100',
  CANCELLED: 'bg-slate-50 text-slate-400 ring-slate-100',
}

export default function PhotographerBookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { state, actions } = useAppStore()
  const nav = useNavigate()
  const toast = useToast()

  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [stagedImages, setStagedImages] = useState<string[]>([])

  const booking = state.bookings.find((b) => b.id === id)

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <div className="text-xl font-black tracking-tight text-slate-900 uppercase">Booking Not Found</div>
        <button onClick={() => nav('/photographer/dashboard')} className="mt-6 text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-all">← QUAY LẠI STUDIO</button>
      </div>
    )
  }

  const payment = state.payments.find(p => p.bookingId === booking.id)

  const canConfirm = booking.status === 'PENDING'
  const canDeliver = booking.status === 'CONFIRMED'
  const hasDelivered = booking.status === 'DELIVERED' || booking.status === 'COMPLETED'

  async function handleConfirmJob() {
    if (!booking) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    actions.confirmJob(booking.id)
    toast.push({ type: 'success', title: 'Job Confirmed! 📸', message: 'Bạn đã xác nhận nhận job. Hãy bắt đầu chuẩn bị!' })
    setLoading(false)
  }

  async function handleDeliver() {
    if (!booking) return
    if (stagedImages.length === 0) {
      toast.push({ type: 'error', title: 'Thiếu File', message: 'Hãy upload ít nhất 1 ảnh để giao sản phẩm.' })
      return
    }

    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    actions.deliverPhotos(booking.id, stagedImages)
    toast.push({ type: 'success', title: 'Giao hàng thành công! ✨', message: 'Khách hàng sẽ nhận được thông báo kiểm tra ảnh.' })
    setLoading(false)
  }

  async function handleAddMockImage() {
    setUploadingImage(true)
    await new Promise((r) => setTimeout(r, 600))
    const randomImg = DELIVERY_IMGS_POOL[Math.floor(Math.random() * DELIVERY_IMGS_POOL.length)]
    setStagedImages(prev => [...prev, randomImg])
    setUploadingImage(false)
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <button onClick={() => nav('/photographer/dashboard')} className="mb-8 inline-flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-4 w-4" /> QUAY LẠI STUDIO
      </button>

      {/* Premium Header */}
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-2">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Chi tiết Hợp đồng</h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full ring-1 ring-inset px-3.5 py-1 text-[10px] font-black uppercase tracking-widest ${STATUS_COLOR[booking.status]}`}>
              {STATUS_LABEL[booking.status]}
            </span>
          </div>
          <p className="mt-2 text-[14px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            CONTRACT <span className="text-slate-300">#{booking.id}</span> · KHÁCH HÀNG: <span className="text-slate-900">{booking.customerName}</span>
          </p>
        </div>

        {/* Dynamic Actions */}
        <div className="flex gap-3 flex-wrap">
          {canConfirm && (
            <button onClick={handleConfirmJob} disabled={loading}
              className={`inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-900 px-8 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98] ${loading ? 'opacity-50' : 'hover:bg-slate-800'}`}>
              <CheckCircle className="h-4 w-4" />
              {loading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN NHẬN JOB'}
            </button>
          )}
          {canDeliver && (
            <button onClick={handleDeliver} disabled={loading}
              className={`inline-flex h-12 items-center gap-2 rounded-2xl bg-indigo-600 px-8 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] ${loading ? 'opacity-50' : 'hover:bg-indigo-700'}`}>
              <UploadCloud className="h-4 w-4" />
              {loading ? 'ĐANG GIAO...' : 'GIAO ẢNH CHO KHÁCH'}
            </button>
          )}
        </div>
      </div>

      {/* Status Info Banners */}
      <AnimatePresence mode="wait">
        {booking.status === 'PENDING' && (
          <StatusBanner type="warning" title="Hợp đồng đang chờ xác nhận ⏳" message="Khách hàng đã thanh toán bảo lãnh vào Escrow. Hãy xác nhận để nhận job và cam kết ngày chụp." />
        )}
        {booking.status === 'DISPUTED' && (
          <StatusBanner type="error" title="Tranh chấp đang xử lý ⚠️" message={`Khách hàng đã gửi khiếu nại. Lý do: "${booking.disputeReason}". Admin sẽ liên hệ trạm trọng tài.`} />
        )}
      </AnimatePresence>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px] items-start">
        {/* Main Workspace Area */}
        <div className="space-y-10">
          {/* Photo Delivery Workspace */}
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/30 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm text-slate-900">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-tight">Album Giao Sản Phẩm</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {hasDelivered ? `${booking.images.length} FILES ĐÃ GIAO` : `${stagedImages.length} FILES CHỜ GIAO`}
                  </p>
                </div>
              </div>

              {canDeliver && (
                <button onClick={handleAddMockImage} disabled={uploadingImage}
                  className={`inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 ${uploadingImage ? 'text-slate-300' : 'text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50'}`}>
                  <UploadCloud className="h-3.5 w-3.5" />
                  {uploadingImage ? 'Đang tải...' : 'Upload File Mới'}
                </button>
              )}
            </div>

            <div className="p-6 md:p-8">
              {hasDelivered ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {booking.images.map((img, i) => (
                    <WatermarkImage key={i} src={img.url} isLocked={booking.status !== 'COMPLETED'} className="aspect-square rounded-2xl overflow-hidden shadow-sm" />
                  ))}
                </div>
              ) : stagedImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 rounded-[28px] border-2 border-dashed border-slate-100 bg-slate-50/30 text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <UploadCloud className="h-8 w-8 text-slate-100" />
                  </div>
                  <p className="text-[15px] font-black text-slate-400 uppercase tracking-widest">Không có file nào trong workspace</p>
                  {canDeliver && (
                    <p className="mt-2 text-xs font-bold text-slate-300 max-w-xs mx-auto">
                      Hãy tải lên các file gốc chất lượng cao. Hệ thống sẽ tự phủ Watermark khi gửi cho khách.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {stagedImages.map((url, i) => (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key={i}
                        className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group shadow-sm bg-slate-50">
                        <img src={url} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" alt="Staged" />
                        <button onClick={() => setStagedImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-2.5 right-2.5 h-8 w-8 rounded-xl bg-slate-900/90 text-white flex items-center justify-center shadow-xl hover:bg-rose-600 backdrop-blur-sm active:scale-90 transition-all">
                          <span className="text-xl font-bold leading-none mb-0.5">&times;</span>
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  <div className="rounded-[24px] border border-indigo-50 bg-indigo-50/50 p-6 flex gap-4 ring-1 ring-inset ring-white">
                    <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-bold text-indigo-800 leading-relaxed uppercase tracking-wider">
                      💡 <span className="font-black">Bảo vệ tác quyền:</span> Hệ thống tự động phủ Watermark lên ảnh xem trước. Khách chỉ nhận file gốc khi thanh toán được Release.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
            <div className="border-b border-slate-100 bg-slate-50/30 px-8 py-5">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Lịch sử sự kiện</h2>
            </div>
            <div className="p-8">
              <StatusTimeline bookingId={booking.id} />
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-8 sticky top-8">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white p-2 shadow-sm ring-1 ring-slate-100">
            <div className="bg-slate-50/50 p-6 md:p-8 rounded-[28px]">
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Khách hàng</div>
              <div className="mb-6 border-b border-slate-100/50 pb-6">
                <div className="text-[17px] font-black tracking-tight text-slate-900">{booking.customerName}</div>
                <button
                  onClick={() => {
                    const studio = state.photographers.find(p => p.id === state.currentUser?.id);
                    if (studio) {
                      nav(`/chat?studioId=${studio.id}&customerId=${booking.customerId}&bookingId=${booking.id}`);
                    }
                  }}
                  className="mt-3 flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 text-[11px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-100 transition-all active:scale-[0.98]"
                >
                  <MessageCircle className="h-4.5 w-4.5" /> NHẮN TIN VỚI KHÁCH HÀNG
                </button>
              </div>

              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">Thông số giao dịch</div>

              <div className="space-y-6">
                <DetailRow label="Dịch vụ" value={booking.packageTier} />
                <DetailRow label="Ngày chụp" value={formatDate(booking.date)} />
                <div className="h-px bg-slate-100 mx-2" />

                <div className="flex items-center justify-between px-2">
                  <span className="text-[13px] font-black text-slate-400">TỔNG THU</span>
                  <span className="text-lg font-black text-slate-900">{formatVnd(booking.totalPrice)}</span>
                </div>

                {payment && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2 text-indigo-600">
                      <span className="text-[11px] font-black uppercase tracking-widest">NET THỰC NHẬN</span>
                      <span className="text-xl font-black">{formatVnd(payment.netToPhotographer)}</span>
                    </div>

                    <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">TRẠNG THÁI QUỸ</span>
                        <EscrowBadge status={payment.status} />
                      </div>
                      <p className="mt-1 text-[9px] font-bold text-slate-300 uppercase leading-relaxed tracking-wider">
                        Tiền đang được giữ bởi hệ thống Escrow an toàn.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBanner({ type, title, message }: { type: 'warning' | 'error', title: string, message: string }) {
  const isWarning = type === 'warning'
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
      className={`mb-8 rounded-[28px] border p-6 md:p-8 shadow-sm ${isWarning ? 'border-amber-100 bg-amber-50/50' : 'border-rose-100 bg-rose-50'}`}>
      <div className="flex items-start gap-5">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${isWarning ? 'bg-white text-amber-600' : 'bg-white text-rose-600'}`}>
          {isWarning ? <Clock className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
        </div>
        <div className="flex-1">
          <h3 className={`text-[17px] font-black leading-tight ${isWarning ? 'text-amber-900' : 'text-rose-900'}`}>{title}</h3>
          <p className={`mt-2 text-[14px] font-medium leading-relaxed max-w-2xl ${isWarning ? 'text-amber-700/80' : 'text-rose-700/80'}`}>{message}</p>
        </div>
      </div>
    </motion.div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-2">
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-[15px] font-black text-slate-800">{value}</span>
    </div>
  )
}

function EscrowBadge({ status }: { status: string }) {
  if (status === 'holding') return <span className="text-amber-600 font-bold">🔒 TẠM GIỮ</span>
  if (status === 'released') return <span className="text-emerald-600 font-bold">✅ ĐÃ THANH TOÁN</span>
  return <span className="text-slate-400 font-bold">↩ ĐÃ HOÀN TIỀN</span>
}
