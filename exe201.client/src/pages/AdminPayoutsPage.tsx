import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Search, 
  ArrowUpRight, 
  FileText, 
  RefreshCw, 
  CreditCard,
  User,
  Info,
  DollarSign
} from 'lucide-react'
import { getPayoutRequests, approvePayout, rejectPayout, type PayoutRequestItem } from '../services/adminPayoutApi'
import { useToast } from '../components/Toast'

const BANK_NAMES: Record<string, string> = {
  VCB: 'Vietcombank',
  CTG: 'VietinBank',
  BID: 'BIDV',
  TCB: 'Techcombank',
  MB: 'MBBank',
  ACB: 'ACB',
  VPB: 'VPBank',
  VIB: 'VIB',
  TPB: 'TPBank',
  STB: 'Sacombank',
  HDB: 'HDBank',
  SHB: 'SHB',
  ICB: 'Industrial & Commercial Bank',
};

export default function AdminPayoutsPage() {
  const toast = useToast()
  
  const [payouts, setPayouts] = useState<PayoutRequestItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'FAILED'>('PENDING')
  
  // Modal states
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequestItem | null>(null)
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadPayouts()
  }, [])

  async function loadPayouts() {
    setLoading(true)
    try {
      const data = await getPayoutRequests()
      setPayouts(data)
    } catch (err: any) {
      toast.push({
        type: 'danger',
        title: 'Lỗi tải danh sách',
        message: err.response?.data?.message || 'Không thể tải danh sách yêu cầu rút tiền.'
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove() {
    if (!selectedPayout) return
    setActionLoading(true)
    try {
      const res = await approvePayout(selectedPayout.payoutId)
      toast.push({
        type: 'success',
        title: 'Duyệt thành công',
        message: res.message || 'Yêu cầu chuyển tiền đã được phê duyệt và giải ngân qua PayOS.'
      })
      setIsApproveOpen(false)
      setSelectedPayout(null)
      loadPayouts()
    } catch (err: any) {
      toast.push({
        type: 'danger',
        title: 'Chuyển tiền thất bại',
        message: err.response?.data?.message || 'Lỗi kết nối API PayOS. Giao dịch đã được hoàn trả về ví người dùng.'
      })
      setIsApproveOpen(false)
      setSelectedPayout(null)
      loadPayouts()
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    if (!selectedPayout || !rejectReason.trim()) return
    setActionLoading(true)
    try {
      const res = await rejectPayout(selectedPayout.payoutId, rejectReason)
      toast.push({
        type: 'success',
        title: 'Đã từ chối',
        message: res.message || 'Yêu cầu rút tiền đã bị từ chối. Tiền đã được hoàn trả về ví.'
      })
      setIsRejectOpen(false)
      setRejectReason('')
      setSelectedPayout(null)
      loadPayouts()
    } catch (err: any) {
      toast.push({
        type: 'danger',
        title: 'Từ chối thất bại',
        message: err.response?.data?.message || 'Không thể từ chối yêu cầu rút tiền.'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const filteredPayouts = payouts.filter(p => {
    // Tab filter
    if (activeTab !== 'ALL' && p.status !== activeTab) return false
    
    // Search filter
    const matchesSearch = 
      p.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.accountNumber.includes(searchTerm) ||
      p.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.referenceId.toLowerCase().includes(searchTerm.toLowerCase())
      
    return matchesSearch
  })

  const formatVnd = (num: number) => new Intl.NumberFormat('vi-VN').format(num) + ' VND'
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('vi-VN')

  const getStatusBadge = (status: PayoutRequestItem['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 border border-amber-200 shadow-sm animate-pulse">
            <Clock className="h-3 w-3" /> Chờ duyệt
          </span>
        )
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 border border-emerald-200 shadow-sm">
            <CheckCircle2 className="h-3 w-3" /> Thành công
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 border border-rose-200 shadow-sm">
            <XCircle className="h-3 w-3" /> Bị từ chối
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500 border border-slate-200 shadow-sm">
            <AlertCircle className="h-3 w-3" /> Thất bại
          </span>
        )
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Title Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Quản Lý Duyệt Rút Tiền (Payouts)</h1>
          <p className="mt-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Kiểm duyệt và chuyển tiền tự động bằng cổng thanh toán PayOS / NAPAS
          </p>
        </div>
        <button
          onClick={loadPayouts}
          disabled={loading}
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white border border-slate-200 px-4 text-xs font-black uppercase text-slate-700 hover:bg-slate-50 shadow-sm transition-all active:scale-[0.97]"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Tải lại
        </button>
      </div>

      {/* Stats Quick Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        {[
          {
            title: 'Chờ duyệt',
            value: payouts.filter(p => p.status === 'PENDING').length,
            desc: 'Yêu cầu rút tiền chưa xử lý',
            color: 'from-amber-500 to-orange-600',
            bg: 'bg-amber-500/10',
            icon: Clock
          },
          {
            title: 'Đã giải ngân qua PayOS',
            value: payouts.filter(p => p.status === 'APPROVED').length,
            desc: 'Giao dịch chuyển tiền thành công',
            color: 'from-emerald-500 to-teal-600',
            bg: 'bg-emerald-500/10',
            icon: CheckCircle2
          },
          {
            title: 'Tổng số tiền đang chờ',
            value: formatVnd(payouts.filter(p => p.status === 'PENDING').reduce((acc, p) => acc + p.amount, 0)),
            desc: 'Tổng quỹ ký giữ chờ phê duyệt',
            color: 'from-indigo-500 to-violet-600',
            bg: 'bg-indigo-500/10',
            icon: DollarSign
          }
        ].map((stat, i) => (
          <div key={i} className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${stat.bg} text-slate-900`}>
              <stat.icon className="h-6 w-6 text-slate-700" />
            </div>
            <div>
              <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{stat.title}</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{stat.value}</div>
              <div className="mt-1 text-[11px] font-semibold text-slate-500">{stat.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        {/* Navigation Tab selection */}
        <div className="flex flex-wrap gap-1 rounded-2xl bg-slate-100 p-1 self-start">
          {([
            ['ALL', 'Tất cả'],
            ['PENDING', 'Chờ duyệt'],
            ['APPROVED', 'Thành công'],
            ['REJECTED', 'Từ chối'],
            ['FAILED', 'Thất bại']
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {label} ({payouts.filter(p => tab === 'ALL' || p.status === tab).length})
            </button>
          ))}
        </div>

        {/* Search bar input */}
        <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all w-full md:max-w-xs shadow-inner">
          <div className="pl-4 text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, STK, mã đối soát..."
            className="h-10 w-full bg-transparent px-3 text-xs font-semibold text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Payouts Table Data Grid */}
      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-xl shadow-indigo-950/[0.02]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</p>
          </div>
        ) : filteredPayouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="rounded-full bg-slate-50 p-4 border border-slate-100 text-slate-400 mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-700">Không tìm thấy yêu cầu rút tiền</h3>
            <p className="mt-1.5 text-xs text-slate-400 max-w-sm">Hiện chưa có yêu cầu rút tiền nào trùng khớp với bộ lọc tìm kiếm của bạn.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-500 uppercase">Đối tượng rút</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-500 uppercase">Số tiền rút</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-500 uppercase">Tài khoản thụ hưởng</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-500 uppercase">Thông tin bổ sung</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-500 uppercase">Ngày yêu cầu</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black tracking-widest text-slate-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayouts.map((p) => (
                  <tr key={p.payoutId} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{p.ownerName}</div>
                          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            {p.ownerType === 'STUDIO' ? 'Studio Partner' : 'Khách hàng'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-indigo-600">{formatVnd(p.amount)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-xs font-bold text-slate-800 uppercase tracking-tight">{p.accountName}</div>
                        <div className="text-xs font-bold text-slate-900 mt-0.5">{p.accountNumber}</div>
                        <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          {BANK_NAMES[p.bankCode] || p.bankCode} ({p.bankCode})
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[200px]">
                        <div className="text-xs text-slate-600 line-clamp-1">{p.description || 'Không có mô tả'}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">REF: {p.referenceId}</div>
                        {p.transactionCode && (
                          <div className="text-[10px] text-emerald-600 font-mono mt-0.5">PAYOS: {p.transactionCode}</div>
                        )}
                        {p.failureReason && (
                          <div className="text-[10px] text-rose-500 font-bold mt-0.5 leading-tight flex items-start gap-1">
                            <Info className="h-3 w-3 shrink-0 mt-0.5" />
                            {p.failureReason}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500">{formatDate(p.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedPayout(p)
                              setIsApproveOpen(true)
                            }}
                            className="inline-flex h-8 items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase tracking-wider text-white px-3 shadow-md shadow-indigo-600/10 cursor-pointer active:scale-95 transition-all"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            Duyệt rút
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPayout(p)
                              setIsRejectOpen(true)
                            }}
                            className="inline-flex h-8 items-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider text-rose-600 px-3 shadow-sm cursor-pointer active:scale-95 transition-all"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* APPROVAL CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {isApproveOpen && selectedPayout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-100 bg-white p-6 shadow-2xl"
            >
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-4">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Xác nhận chuyển tiền qua PayOS?</h3>
                <p className="mt-2 text-xs text-slate-400">
                  Lưu ý: Hệ thống sẽ gọi API chuyển tiền thật Napas của PayOS. Hãy xác minh kỹ thông tin tài khoản thụ hưởng.
                </p>
              </div>

              {/* Payout specs table */}
              <div className="my-5 rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 space-y-3.5 text-left text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Người thụ hưởng:</span>
                  <span className="text-slate-900">{selectedPayout.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ngân hàng:</span>
                  <span className="text-slate-900">
                    {BANK_NAMES[selectedPayout.bankCode] || selectedPayout.bankCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số tài khoản:</span>
                  <span className="text-slate-900 font-bold">{selectedPayout.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tên thụ hưởng (KHÓA CỨNG):</span>
                  <span className="text-slate-900 font-bold uppercase">{selectedPayout.accountName}</span>
                </div>
                <div className="h-px bg-slate-200/60 my-1" />
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400">Số tiền rút thực tế:</span>
                  <span className="text-sm font-black text-indigo-600">{formatVnd(selectedPayout.amount)}</span>
                </div>
              </div>

              {/* Actions buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex-1 inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-indigo-600/10 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-[0.97]"
                >
                  {actionLoading ? 'Đang chuyển tiền...' : '🚀 Xác nhận & Chi tiền'}
                </button>
                <button
                  onClick={() => {
                    setIsApproveOpen(false)
                    setSelectedPayout(null)
                  }}
                  disabled={actionLoading}
                  className="rounded-2xl border border-slate-200 px-4 h-11 text-xs font-black uppercase text-slate-500 hover:bg-slate-50 cursor-pointer disabled:bg-slate-50 transition-all active:scale-[0.97]"
                >
                  Hủy
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REJECTION REASON DIALOG MODAL */}
      <AnimatePresence>
        {isRejectOpen && selectedPayout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-100 bg-white p-6 shadow-2xl text-left"
            >
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 mb-4">
                  <XCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Từ chối yêu cầu rút tiền?</h3>
                <p className="mt-2 text-xs text-slate-400">
                  Số tiền cọc khóa tạm thời <strong className="text-indigo-600 font-bold">{formatVnd(selectedPayout.amount)}</strong> sẽ được tự động **hoàn trả 100% về ví ảo** của người dùng.
                </p>
              </div>

              {/* Textarea input reason */}
              <div className="my-5 space-y-1">
                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Lý do từ chối rút tiền</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết (ví dụ: Tài khoản bị nghi ngờ gian lận, sai lệch thông tin cá nhân...)"
                  rows={3}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all resize-none shadow-inner"
                />
              </div>

              {/* Actions buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="flex-1 inline-flex h-11 items-center justify-center rounded-2xl bg-rose-600 hover:bg-rose-500 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-rose-600/10 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-[0.97]"
                >
                  {actionLoading ? 'Đang xử lý từ chối...' : 'Từ chối & Hoàn tiền ví'}
                </button>
                <button
                  onClick={() => {
                    setIsRejectOpen(false)
                    setRejectReason('')
                    setSelectedPayout(null)
                  }}
                  disabled={actionLoading}
                  className="rounded-2xl border border-slate-200 px-4 h-11 text-xs font-black uppercase text-slate-500 hover:bg-slate-50 cursor-pointer disabled:bg-slate-50 transition-all active:scale-[0.97]"
                >
                  Hủy
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
