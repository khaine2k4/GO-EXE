import { useAppStore } from '../store/AppStore'
import { useToast } from '../components/Toast'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, ArrowDownToLine, ShieldCheck, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react'

function formatVnd(v: number) { return new Intl.NumberFormat('vi-VN').format(v) + ' ₫' }
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function PhotographerWalletPage() {
  const { state, actions } = useAppStore()
  const toast = useToast()

  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const myBookings = state.bookings.filter(b => b.photographerId === state.currentUser?.id)
  const myBookingIds = myBookings.map(b => b.id)

  const myTxs = state.transactions.filter(tx =>
    (tx.type === 'RELEASE' && myBookingIds.includes(tx.bookingId)) ||
    (tx.type === 'WITHDRAW')
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const totalEarnings = myTxs.filter(tx => tx.type === 'RELEASE').reduce((sum, tx) => sum + tx.amount, 0)
  const totalWithdrawn = myTxs.filter(tx => tx.type === 'WITHDRAW').reduce((sum, tx) => sum + tx.amount, 0)

  const balance = totalEarnings - totalWithdrawn

  const holdingAmount = state.payments
    .filter(p => p.status === 'holding' && myBookingIds.includes(p.bookingId))
    .reduce((sum, p) => sum + p.netToPhotographer, 0)

  async function handleWithdraw() {
    const amount = Number(withdrawAmount)
    if (!amount || amount < 50000) {
      toast.push({ type: 'error', title: 'Lỗi', message: 'Số tiền rút tối thiểu 50.000đ' })
      return
    }
    if (amount > balance) {
      toast.push({ type: 'error', title: 'Lỗi', message: 'Số dư không đủ' })
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    actions.withdraw(amount)
    toast.push({ type: 'success', title: 'Rút tiền thành công ✨', message: 'Yêu cầu rút tiền đang được xử lý.' })
    setWithdrawOpen(false)
    setWithdrawAmount('')
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="mb-10 px-2 text-center lg:text-left">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Quản lý Tài chính</h1>
        <p className="mt-2 text-[15px] font-medium text-slate-500">
          Theo dõi doanh thu, quản lý quỹ Escrow và thực hiện rút tiền về ngân hàng.
        </p>
      </div>

      {/* Main Balance Area */}
      <div className="mb-12 grid gap-6 lg:grid-cols-2 px-2">
        {/* Available Balance - Premium Main Card */}
        <div className="group relative overflow-hidden rounded-[40px] border border-slate-900 bg-slate-900 p-8 shadow-2xl shadow-slate-900/20 text-white transition-all hover:scale-[1.01]">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                <Wallet className="h-5 w-5 text-indigo-400" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">SỐ DƯ KHẢ DỤNG</span>
            </div>

            <div className="mt-10 mb-12">
              <div className="text-5xl font-black tracking-tighter">{formatVnd(balance)}</div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Được bảo chứng bởi hệ thống
              </div>
            </div>

            <button
              onClick={() => setWithdrawOpen(true)}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-white px-8 text-[11px] font-black uppercase tracking-widest text-slate-900 shadow-lg shadow-white/5 transition-all hover:bg-slate-50 active:scale-[0.98]"
            >
              <ArrowDownToLine className="h-4 w-4" /> Rút tiền về ngân hàng
            </button>
          </div>

          {/* Decorative Orb */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-[100px]" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-blue-500/10 blur-[60px]" />
        </div>

        {/* Pending Escrow - High Impact Info Card */}
        <div className="flex flex-col overflow-hidden rounded-[40px] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-xl hover:shadow-slate-200/40">
          <div className="flex flex-1 flex-col p-8 lg:p-10">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-inner">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-600 ring-1 ring-inset ring-amber-100">
                QUỸ ĐANG TẠM GIỮ (ESCROW)
              </span>
            </div>

            <div className="mt-8 flex-1">
              <div className="text-4xl font-black tracking-tight text-slate-900">{formatVnd(holdingAmount)}</div>
              <p className="mt-3 text-[13px] font-medium leading-relaxed text-slate-500 max-w-sm">
                Khoản thanh toán khách đã cọc cho các job đang thực hiện. Tiền sẽ được giải ngân ngay khi khách xác nhận nhận ảnh.
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-6">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">TỔNG THU NHẬP</span>
              <span className="text-xl font-black text-emerald-600">{formatVnd(totalEarnings)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="mx-2 space-y-6">
        <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase tracking-widest px-2">Nhật ký Giao dịch</h2>

        <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm ring-1 ring-slate-100">
          {myTxs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
              <Clock className="h-12 w-12 mb-4" />
              <p className="text-sm font-black uppercase tracking-widest">Chưa có giao dịch phát sinh</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {myTxs.map((tx, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  key={tx.id}
                  className="group flex items-center justify-between p-6 transition-all hover:bg-slate-50/50 sm:px-8"
                >
                  <div className="flex items-center gap-6">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-110 ${tx.type === 'RELEASE' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                      }`}>
                      {tx.type === 'RELEASE' ? <ArrowDownRight className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                    </div>
                    <div>
                      <div className="text-[15px] font-black text-slate-900">
                        {tx.type === 'RELEASE' ? 'Thu nhập dự án' : 'Rút tiền về ngân hàng'}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(tx.createdAt)}</span>
                        {tx.bookingId !== '—' && <span className="opacity-50">· REF: #{tx.bookingId.slice(0, 8)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-black tracking-tight ${tx.type === 'RELEASE' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.type === 'RELEASE' ? '+' : '-'}{formatVnd(tx.amount)}
                    </div>
                    {tx.note && <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-300">{tx.note}</div>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modern Withdraw Modal */}
      <AnimatePresence>
        {withdrawOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setWithdrawOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl" />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-[40px] border border-white/20 bg-white p-8 shadow-2xl"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Rút tiền mặt</h2>
                <p className="mt-2 text-[14px] font-medium text-slate-500">
                  Số dư khả dụng hiện tại: <span className="font-black text-indigo-600">{formatVnd(balance)}</span>
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-400">SỐ TIỀN CẦN RÚT (VNĐ)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    placeholder="VD: 500000"
                    className="h-16 w-full rounded-2xl border-none bg-slate-50 px-6 text-xl font-black outline-none ring-2 ring-transparent transition-all focus:bg-white focus:ring-slate-900"
                  />
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Miễn phí giao dịch. Tối thiểu 50.000đ.
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={() => setWithdrawOpen(false)}
                    className="flex-1 rounded-2xl border border-slate-100 h-14 text-[11px] font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-50 active:scale-95">
                    Hủy thao tác
                  </button>
                  <button onClick={handleWithdraw} disabled={loading}
                    className={`flex-1 rounded-2xl h-14 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] ${loading ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                    {loading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN RÚT'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
