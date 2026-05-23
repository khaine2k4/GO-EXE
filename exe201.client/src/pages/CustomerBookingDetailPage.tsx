import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ImageIcon, CheckCircle, AlertTriangle, RotateCcw, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/AppStore'
import WatermarkImage from '../components/WatermarkImage'
import StatusTimeline from '../components/StatusTimeline'
import { useToast } from '../components/Toast'

function formatVnd(v: number) { return new Intl.NumberFormat('vi-VN').format(v) + ' ₫' }
function formatDate(iso: string) { return new Date(iso).toLocaleDateString('vi-VN', { dateStyle: 'medium' }) }

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

export default function CustomerBookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { state, actions } = useAppStore()
  const nav = useNavigate()
  const toast = useToast()

  const [disputeOpen, setDisputeOpen] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const booking = state.bookings.find((b) => b.id === id)
  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <div className="text-lg font-black tracking-tight text-slate-900">Không tìm thấy booking</div>
        <button onClick={() => nav('/customer/bookings')} className="mt-4 text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors">← QUAY LẠI DANH SÁCH</button>
      </div>
    )
  }

  const photographer = state.photographers.find((p) => p.id === booking.photographerId)
  const payment = state.payments.find((p) => p.bookingId === booking.id)

  const canConfirm = booking.status === 'DELIVERED'
  const canDispute = booking.status === 'DELIVERED'
  const canCancel = booking.status === 'PENDING'

  async function handleConfirm() {
    if (!booking) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 700))
    actions.confirmCompletion(booking.id)
    toast.push({ type: 'success', title: 'Hoàn thành tuyệt vời! 🔥', message: 'Tất cả ảnh đã được mở khóa. Link tải xuống độ phân giải cao đã sẵn sàng.' })
    setLoading(false)
  }

  async function handleDispute() {
    if (!booking || !disputeReason.trim()) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    actions.createDispute(booking.id, disputeReason)
    toast.push({ type: 'info', title: 'Đã gửi khiếu nại', message: 'Admin đang xem xét yêu cầu của bạn. Vui lòng chờ phản hồi qua email.' })
    setDisputeOpen(false)
    setDisputeReason('')
    setLoading(false)
  }

  async function handleCancel() {
    if (!booking) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    actions.cancelBooking(booking.id)
    toast.push({ type: 'info', title: 'Đã hủy thành công', message: 'Tiền bảo lãnh sẽ được hoàn trả sớm nhất.' })
    setCancelOpen(false)
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <button onClick={() => nav('/customer/bookings')} className="mb-8 inline-flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-4 w-4" /> QUAY LẠI
      </button>

      {/* Premium Header */}
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-2">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Chi tiết Booking</h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full ring-1 ring-inset px-3.5 py-1 text-[10px] font-black uppercase tracking-widest ${STATUS_COLOR[booking.status]}`}>
              {STATUS_LABEL[booking.status]}
            </span>
          </div>
          <p className="mt-2 text-[14px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            REFERENCE <span className="text-slate-300">#{booking.id}</span> • TẠO NGÀY {formatDate(booking.createdAt)}
          </p>
        </div>

        {/* Dynamic Actions */}
        <div className="flex gap-3 flex-wrap">
          {canCancel && (
            <button onClick={() => setCancelOpen(true)}
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]">
              <RotateCcw className="h-4 w-4" /> HỦY ĐẶT LỊCH
            </button>
          )}
          {canDispute && (
            <button onClick={() => setDisputeOpen(true)}
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-rose-100 bg-white px-6 text-[11px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-all active:scale-[0.98]">
              <AlertTriangle className="h-4 w-4" /> KHIẾU NẠI CHẤT LƯỢNG
            </button>
          )}
          {canConfirm && (
            <button onClick={handleConfirm} disabled={loading}
              className={`inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-900 px-8 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98] ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}>
              <CheckCircle className="h-4 w-4" />
              {loading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN HOÀN THÀNH'}
            </button>
          )}
        </div>
      </div>

      {/* Status Info Banner (Conditional) */}
      <AnimatePresence mode="wait">
        <StatusBanner status={booking.status} disputeReason={booking.disputeReason} />
      </AnimatePresence>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px] items-start">
        {/* Main Content Area */}
        <div className="space-y-10">
          {/* Photo Grid Container */}
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/30 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm text-slate-900">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-tight">Album Ảnh Giao</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{booking.images.length} FILES</p>
                </div>
              </div>

              <div className="flex">
                {booking.status === 'DELIVERED' && <Badge label="🔍 XEM TRƯỚC (LOW-RES)" color="amber" />}
                {booking.status === 'COMPLETED' && <Badge label="✅ ĐÃ MỞ KHÓA (GỐC)" color="emerald" />}
              </div>
            </div>

            <div className="p-6 md:p-8">
              {booking.images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 rounded-[28px] border-2 border-dashed border-slate-100 bg-slate-50/30 text-center">
                  <ImageIcon className="mb-4 h-12 w-12 text-slate-200" />
                  <p className="text-[15px] font-black text-slate-400 uppercase tracking-widest">Nhiếp ảnh gia chưa giao file</p>
                  <p className="mt-2 text-xs font-bold text-slate-300">Vui lòng chờ hoặc liên hệ để biết thêm chi tiết.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {booking.images.map((img, i) => (
                    <WatermarkImage key={i} src={img.url} isLocked={img.isLocked} className="aspect-square rounded-2xl overflow-hidden shadow-sm" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
            <div className="border-b border-slate-100 bg-slate-50/30 px-8 py-5">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Lịch sử giao dịch</h2>
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
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">Thông tin chi tiết</div>

              {photographer && (
                <div className="mb-8 border-b border-slate-100/50 pb-6">
                  <div className="flex items-center gap-4">
                    <img src={photographer.avatarUrl} alt={photographer.name} className="h-16 w-16 rounded-2xl object-cover ring-4 ring-white shadow-sm" />
                    <div>
                      <div className="text-[17px] font-black tracking-tight text-slate-900">{photographer.name}</div>
                      <div className="mt-0.5 text-xs font-bold text-slate-400 flex items-center gap-1">📍 {photographer.location}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => nav(`/chat?studioId=${photographer.id}&bookingId=${booking.id}`)}
                    className="mt-4 flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 text-[11px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-100 transition-all active:scale-[0.98]"
                  >
                    <MessageCircle className="h-4.5 w-4.5" /> NHẮN TIN VỚI STUDIO
                  </button>
                </div>
              )}

              <div className="space-y-6">
                <DetailRow label="Gói dịch vụ" value={booking.packageTier} />
                <DetailRow label="Ngày chụp" value={formatDate(booking.date)} />
                <div className="h-px bg-slate-100 mx-2" />

                <div className="flex items-center justify-between px-2">
                  <span className="text-[13px] font-black text-slate-900">TỔNG THANH TOÁN</span>
                  <span className="text-xl font-black text-indigo-700">{formatVnd(booking.totalPrice)}</span>
                </div>

                {payment && (
                  <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widst">
                      <span className="text-slate-400">TRẠNG THÁI TIỀN</span>
                      <EscrowBadge status={payment.status} />
                    </div>
                    <p className="mt-1 text-[10px] font-bold text-slate-400 leading-relaxed italic">
                      Tiền được bảo lãnh an toàn bởi PhotoMarket Escrow cho đến khi bạn xác nhận hài lòng.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BookingModals
        disputeOpen={disputeOpen} setDisputeOpen={setDisputeOpen}
        cancelOpen={cancelOpen} setCancelOpen={setCancelOpen}
        disputeReason={disputeReason} setDisputeReason={setDisputeReason}
        loading={loading} handleDispute={handleDispute} handleCancel={handleCancel}
      />
    </div>
  )
}

function StatusBanner({ status, disputeReason }: { status: string, disputeReason?: string }) {
  if (status === 'DELIVERED') {
    return (
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-[28px] border border-indigo-100 bg-indigo-50/50 p-6 md:p-8 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-[17px] font-black text-indigo-900 leading-tight">Yêu cầu xác nhận đơn hàng! 🔥</h3>
            <p className="mt-2 text-[14px] font-medium text-indigo-700/80 leading-relaxed max-w-2xl">
              Photographer đã bàn giao ảnh. Vui lòng duyệt album bên dưới. Nếu hài lòng, hãy bấm <strong>"Xác nhận hoàn thành"</strong> để nhận ngay link tải toàn bộ Ảnh Gốc.
            </p>
          </div>
        </div>
      </motion.div>
    )
  }
  if (status === 'DISPUTED') {
    return (
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-[28px] border border-rose-100 bg-rose-50 p-6 md:p-8">
        <div className="flex items-start gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-[17px] font-black text-rose-900 leading-tight">Hồ sơ khiếu nại đang xử lý</h3>
            <p className="mt-2 text-[14px] font-medium text-rose-700/80 leading-relaxed">
              Admin đang xem xét khiếu nại của bạn. Lý do: <em className="font-bold underline">"{disputeReason}"</em>. Chúng tôi sẽ sớm liên hệ.
            </p>
          </div>
        </div>
      </motion.div>
    )
  }
  if (status === 'COMPLETED') {
    return (
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-[28px] border border-emerald-100 bg-emerald-50/50 p-6 md:p-8">
        <div className="flex items-start gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-[17px] font-black text-emerald-900 leading-tight">Giao dịch đã hoàn tất! 🎉</h3>
            <p className="mt-2 text-[14px] font-medium text-emerald-700/80">
              Tiền đã được release an toàn. Bạn hiện có thể tải xuống tất cả ảnh chất lượng cao.
            </p>
          </div>
        </div>
      </motion.div>
    )
  }
  return null
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-2">
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-[15px] font-black text-slate-800">{value}</span>
    </div>
  )
}

function Badge({ label, color }: { label: string, color: 'amber' | 'emerald' }) {
  return (
    <span className={`inline-flex items-center rounded-xl bg-white px-3 py-1.5 text-[10px] font-black shadow-sm ring-1 ring-inset ${color === 'amber' ? 'text-amber-600 ring-amber-100' : 'text-emerald-600 ring-emerald-100'}`}>
      {label}
    </span>
  )
}

function EscrowBadge({ status }: { status: string }) {
  if (status === 'holding') return <span className="text-amber-600 font-bold">🔒 HOLDING</span>
  if (status === 'released') return <span className="text-emerald-600 font-bold">✅ RELEASED</span>
  return <span className="text-slate-400 font-bold">↩ REFUNDED</span>
}

function BookingModals({
  disputeOpen, setDisputeOpen,
  cancelOpen, setCancelOpen,
  disputeReason, setDisputeReason,
  loading, handleDispute, handleCancel
}: any) {
  return (
    <>
      <AnimatePresence>
        {disputeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Khiếu nại chất lượng</h2>
              <p className="mt-3 text-[14px] font-medium text-slate-500 mb-8 border-b border-slate-100 pb-6">Vui lòng mô tả vấn đề gặp phải. Admin sẽ thực hiện trọng tài Escrow trong vòng 24h.</p>

              <textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Ví dụ: Ảnh mờ, không đúng số lượng đã cam kết..."
                rows={4}
                className="w-full resize-none rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm font-bold outline-none ring-indigo-500/10 transition focus:border-indigo-400 focus:ring-4 placeholder:text-slate-300" />

              <div className="mt-8 flex gap-3">
                <button onClick={() => setDisputeOpen(false)} className="flex-1 rounded-2xl border border-slate-100 h-14 text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors">Đóng</button>
                <button onClick={handleDispute} disabled={loading || !disputeReason.trim()}
                  className="flex-1 rounded-2xl bg-rose-600 h-14 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-rose-600/20 transition-all hover:bg-rose-700 active:scale-[0.98]">
                  {loading ? 'ĐANG GỬI...' : 'GỬI YÊU CẦU'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cancelOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-6">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Hủy lịch chụp?</h2>
              <p className="mt-4 text-[14px] font-medium text-slate-500 leading-relaxed">Tiền bảo lãnh Escrow sẽ được hoàn trả đầy đủ vào tài khoản của bạn sau 3-5 ngày làm việc.</p>

              <div className="mt-10 flex gap-3 border-t border-slate-100 pt-8">
                <button onClick={() => setCancelOpen(false)} className="flex-1 rounded-2xl border border-slate-100 h-14 text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors">Đóng</button>
                <button onClick={handleCancel} disabled={loading}
                  className="flex-1 rounded-2xl bg-rose-600 h-14 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-rose-600/20 transition-all hover:bg-rose-700 active:scale-[0.98]">
                  {loading ? 'HỦY...' : 'XÁC NHẬN HỦY'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
