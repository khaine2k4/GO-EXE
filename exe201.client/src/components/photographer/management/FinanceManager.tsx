import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Banknote, AlertCircle, Wallet, ArrowUpRight, TrendingUp } from 'lucide-react'
import { getStudioSettlements, type SettlementItem, type SettlementStatus } from '../../../services/settlementApi'
import { getStudioCommissionSetting, getStudioCommissions, getStudioRevenue, type StudioCommission, type StudioCommissionSetting, type StudioRevenue } from '../../../services/studioRevenueApi'
import { getStudioWallet, createWithdrawal, getMyWithdrawals, type WalletDetail, type PayoutRequestItem } from '../../../services/walletApi'
import { formatDateTime, formatMonth, formatVnd } from '../format'
import { EmptyState, SectionPanel } from './Panel'
import { useAppStore } from '../../../store/AppStore'
import { useToast } from '../../../components/Toast'

const SETTLEMENT_LABEL: Record<string, string> = {
  ALL: 'Tất cả trạng thái',
  READY: 'Chờ đối soát',
  PENDING: 'Đang xử lý',
  PAID: 'Đã chi trả',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
}

const SETTLEMENT_BADGE: Record<string, string> = {
  READY: 'bg-blue-50 text-blue-700 border border-blue-200/50',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200/50',
  PAID: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
  FAILED: 'bg-rose-50 text-rose-700 border border-rose-200/50',
  CANCELLED: 'bg-slate-50 text-slate-500 border border-slate-200',
}

const TX_LABEL: Record<string, string> = {
  CREDIT_EARNING: 'Thu nhập đơn',
  CREDIT_REFUND: 'Hoàn tiền',
  DEBIT_WITHDRAWAL: 'Rút tiền',
}

const TX_BADGE: Record<string, string> = {
  CREDIT_EARNING: 'bg-emerald-50 text-emerald-700 border border-emerald-200/40',
  CREDIT_REFUND: 'bg-indigo-50 text-indigo-700 border border-indigo-200/40',
  DEBIT_WITHDRAWAL: 'bg-rose-50 text-rose-700 border border-rose-200/40',
}

const WITHDRAWAL_LABEL: Record<string, string> = {
  PENDING: 'Đang chờ duyệt',
  APPROVED: 'Đã duyệt chi',
  REJECTED: 'Từ chối',
}

export default function FinanceManager() {
  const { state } = useAppStore()
  const currentUser = state.currentUser
  const toast = useToast()

  const [revenue, setRevenue] = useState<StudioRevenue | null>(null)
  const [commissions, setCommissions] = useState<StudioCommission[]>([])
  const [settlements, setSettlements] = useState<SettlementItem[]>([])
  const [setting, setSetting] = useState<StudioCommissionSetting | null>(null)
  const [wallet, setWallet] = useState<WalletDetail | null>(null)
  const [status, setStatus] = useState<SettlementStatus>('ALL')
  const [loading, setLoading] = useState(true)
  const [walletError, setWalletError] = useState(false)

  // Withdraw requests state
  const [withdrawals, setWithdrawals] = useState<PayoutRequestItem[]>([])
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false)

  // Withdrawal form states
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [bankCode, setBankCode] = useState('VCB')
  const [accountNumber, setAccountNumber] = useState('')
  const [withdrawDesc, setWithdrawDesc] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)

  // Paginated states
  const [settlementsPage, setSettlementsPage] = useState(1)
  const [txPage, setTxPage] = useState(1)
  const [commissionPage, setCommissionPage] = useState(1)

  // Diacritic stripper
  function removeSign4VietnameseString(str: string): string {
    if (!str) return ''
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, (char) => (char === 'đ' ? 'd' : 'D'))
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase()
  }

  async function load() {
    setLoading(true)
    setWithdrawalsLoading(true)
    setWalletError(false)
    const [revenueData, commissionData, settlementData, settingData, walletData, withdrawalsData] = await Promise.allSettled([
      getStudioRevenue(),
      getStudioCommissions({ sortBy: 'newest' }),
      getStudioSettlements({ status }),
      getStudioCommissionSetting(),
      getStudioWallet(),
      getMyWithdrawals(),
    ])
    if (revenueData.status === 'fulfilled') setRevenue(revenueData.value)
    if (commissionData.status === 'fulfilled') setCommissions(commissionData.value)
    if (settlementData.status === 'fulfilled') setSettlements(settlementData.value)
    if (settingData.status === 'fulfilled') setSetting(settingData.value)
    if (walletData.status === 'fulfilled') setWallet(walletData.value)
    else setWalletError(true)
    if (withdrawalsData.status === 'fulfilled') setWithdrawals(withdrawalsData.value)
    setLoading(false)
    setWithdrawalsLoading(false)
  }

  useEffect(() => { load() }, [status])

  async function handleCreateWithdrawal(e: React.FormEvent) {
    e.preventDefault()
    if (!accountNumber || accountNumber.length < 8) {
      toast.push({
        type: 'error',
        title: 'Lỗi nhập liệu',
        message: 'Vui lòng nhập số tài khoản ngân hàng hợp lệ (8-16 chữ số).'
      })
      return
    }

    const amt = Number(withdrawAmount)
    if (isNaN(amt) || amt < 10000) {
      toast.push({
        type: 'error',
        title: 'Số tiền không hợp lệ',
        message: 'Số tiền rút tối thiểu là 10,000 VND.'
      })
      return
    }

    if (wallet && amt > wallet.balance) {
      toast.push({
        type: 'error',
        title: 'Số dư không đủ',
        message: 'Số dư trong ví của bạn không đủ để thực hiện giao dịch này.'
      })
      return
    }

    setWithdrawLoading(true)
    try {
      const sanitizedName = removeSign4VietnameseString(currentUser?.name || '')
      await createWithdrawal(
        amt,
        bankCode,
        accountNumber,
        withdrawDesc.trim() || `Studio rut tien ve tai khoan ${bankCode}`
      )
      toast.push({
        type: 'success',
        title: 'Yêu cầu đã gửi',
        message: `Yêu cầu rút ${formatVnd(amt)} đến ${sanitizedName} đã được gửi thành công!`
      })
      setWithdrawAmount('')
      setAccountNumber('')
      setWithdrawDesc('')
      // Delay nhỏ để toast hiển thị trước, sau đó mới refresh
      await new Promise(r => setTimeout(r, 600))
      const walletData = await getStudioWallet()
      setWallet(walletData)
      const withdrawalsData = await getMyWithdrawals()
      setWithdrawals(withdrawalsData)
    } catch (err: any) {
      console.error("Lỗi rút tiền:", err)
      const errMsg = err.response?.data || 'Đã xảy ra lỗi khi tạo yêu cầu rút tiền.'
      toast.push({
        type: 'error',
        title: 'Rút tiền thất bại',
        message: typeof errMsg === 'string' ? errMsg : 'Rút tiền thất bại. Vui lòng thử lại.'
      })
    } finally {
      setWithdrawLoading(false)
    }
  }

  const settlementTotals = useMemo(() => ({
    ready: settlements.filter((item) => item.status === 'READY').reduce((sum, item) => sum + item.studioAmount, 0),
    paid: settlements.filter((item) => item.status === 'PAID').reduce((sum, item) => sum + item.studioAmount, 0),
  }), [settlements])

  // Pagination calculations
  const settlementsTotalPages = Math.ceil(settlements.length / 5)
  const paginatedSettlements = useMemo(() => settlements.slice((settlementsPage - 1) * 5, settlementsPage * 5), [settlements, settlementsPage])

  const txList = wallet?.transactions ?? []
  const txTotalPages = Math.ceil(txList.length / 5)
  const paginatedTx = useMemo(() => txList.slice((txPage - 1) * 5, txPage * 5), [txList, txPage])

  const commissionTotalPages = Math.ceil(commissions.length / 5)
  const paginatedCommissions = useMemo(() => commissions.slice((commissionPage - 1) * 5, commissionPage * 5), [commissions, commissionPage])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Overview stats panel */}
      <SectionPanel
        title="Quản lý tài chính"
        subtitle="Quản lý số dư ví, doanh thu tổng, chiết khấu và theo dõi lịch sử đối soát từ Admin."
        actions={
          <button type="button" onClick={load} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        }
      >
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Metric label="Số dư ví khả dụng" value={wallet ? formatVnd(wallet.balance) : 'Chưa có ví'} tone="emerald" sub="Sẵn sàng để rút" />
          <Metric label="Tổng doanh thu" value={revenue ? formatVnd(revenue.grossRevenue) : '0 VND'} tone="slate" sub="Doanh thu thô" />
          <Metric label="Phí nền tảng" value={revenue ? formatVnd(revenue.commissionDeducted) : '0 VND'} tone="rose" sub="Chiết khấu giữ lại" />
          <Metric label="Thực nhận tổng" value={revenue ? formatVnd(revenue.netRevenue) : '0 VND'} tone="indigo" sub="Sau khi trừ phí" />
          <Metric label="Đã đối soát" value={formatVnd(settlementTotals.paid)} tone="emerald" sub="Chuyển vào số dư ví" />
        </div>
      </SectionPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Payout/Withdrawal Form */}
        <SectionPanel title="Yêu cầu rút tiền (PayOS)" subtitle="Gửi lệnh rút tiền trực tiếp về tài khoản ngân hàng của bạn.">
          <div className="rounded-2xl bg-amber-50/50 border border-amber-200/50 p-4 text-[11px] font-semibold text-amber-800 leading-relaxed space-y-1 mb-4">
            <div className="flex items-center gap-1 font-bold uppercase tracking-wider text-amber-900">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Chế độ bảo mật cao
            </div>
            <p>
              Tên thụ hưởng nhận tiền phải trùng khớp 100% với tên hồ sơ pháp lý đã xác minh của bạn nhằm mục đích phòng chống gian lận.
            </p>
          </div>

          {walletError && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-[11px] font-semibold text-rose-700 mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Không thể kết nối ví. Vui lòng làm mới trang hoặc liên hệ hỗ trợ.
            </div>
          )}

          <form onSubmit={handleCreateWithdrawal} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Chọn Ngân Hàng</span>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 transition"
                >
                  <option value="VCB">Vietcombank (VCB)</option>
                  <option value="CTG">VietinBank (CTG)</option>
                  <option value="BID">BIDV (BID)</option>
                  <option value="TCB">Techcombank (TCB)</option>
                  <option value="MB">MBBank (MB)</option>
                  <option value="ACB">ACB (ACB)</option>
                  <option value="VPB">VPBank (VPB)</option>
                  <option value="VIB">VIB (VIB)</option>
                  <option value="TPB">TPBank (TPB)</option>
                  <option value="STB">Sacombank (STB)</option>
                  <option value="HDB">HDBank (HDB)</option>
                  <option value="ICB">Industrial & Commercial Bank (ICB)</option>
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Số Tài Khoản Nhận</span>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập số tài khoản ngân hàng"
                  required
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/20 px-3 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Tên Thụ Hưởng (Đã Khóa)</span>
                <input
                  type="text"
                  value={removeSign4VietnameseString(currentUser?.name || '')}
                  disabled
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-400 cursor-not-allowed select-none"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Số Tiền Rút (VND)</span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Tối thiểu 10,000 VND"
                  min="10000"
                  max={wallet?.balance || 0}
                  required
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/20 px-3 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition"
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Nội Dung Rút Tiền (Tùy Chọn)</span>
              <input
                type="text"
                value={withdrawDesc}
                onChange={(e) => setWithdrawDesc(e.target.value)}
                placeholder="Ví dụ: Rút tiền doanh thu tuần..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/20 px-3 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition"
              />
            </label>

            <button
              type="submit"
              disabled={withdrawLoading || !wallet || wallet.balance < 10000}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/10"
            >
              <Banknote className="h-4 w-4" />
              {withdrawLoading ? 'Đang gửi lệnh rút...' : 'Rút tiền qua PayOS'}
            </button>
          </form>
        </SectionPanel>

        {/* PayOS Payout Request History list */}
        <SectionPanel title="Lịch sử rút tiền" subtitle="Theo dõi tiến độ chuyển tiền trực tiếp từ ví về tài khoản ngân hàng.">
          {withdrawalsLoading ? (
            <div className="text-center py-10 text-slate-400 font-semibold text-xs animate-pulse">Đang tải lịch sử rút tiền...</div>
          ) : withdrawals.length === 0 ? (
            <EmptyState text="Chưa thực hiện lệnh rút tiền nào." />
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {withdrawals.map((item) => (
                <div key={item.payoutId} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-2 hover:shadow transition">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <div className="text-xs font-extrabold text-slate-950 flex items-center gap-1.5">
                        Ngân hàng: {item.bankCode} <span className="font-mono text-[9px] text-slate-400 font-normal">#{item.payoutId}</span>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-500">
                        TK: {item.accountNumber} - {item.accountName}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                      item.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {WITHDRAWAL_LABEL[item.status] ?? item.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-50 pt-2 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold">{item.description || 'Lệnh rút tiền về ngân hàng'}</p>
                      {item.failureReason && (
                        <p className="text-[9px] font-bold text-rose-600 mt-0.5">Lý do thất bại: {item.failureReason}</p>
                      )}
                      <p className="text-[9px] text-slate-400 mt-0.5">{formatDateTime(item.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-rose-600">-{formatVnd(item.amount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionPanel title="Biến động doanh thu">
          {!revenue ? <EmptyState text="Chưa có dữ liệu biến động doanh thu." /> : revenue.monthlyRevenue.length === 0 ? <EmptyState text="Chưa có dữ liệu biến động doanh thu." /> : (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-3 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                <span>Tháng</span>
                <span className="text-right">Doanh thu thô</span>
                <span className="text-right">Phí nền tảng</span>
                <span className="text-right">Thực nhận</span>
              </div>
              {revenue.monthlyRevenue.slice(0, 8).map((item) => (
                <div key={`${item.year}-${item.month}`} className="grid grid-cols-4 gap-3 rounded-xl border border-slate-100 p-3 text-xs bg-white hover:bg-slate-50/20 transition-colors">
                  <span className="font-extrabold text-slate-900">{formatMonth(item.year, item.month)}</span>
                  <span className="text-right font-semibold text-slate-600">{formatVnd(item.grossRevenue)}</span>
                  <span className="text-right font-semibold text-rose-600">-{formatVnd(item.commissionDeducted)}</span>
                  <span className="text-right font-black text-emerald-700">{formatVnd(item.netRevenue)}</span>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>

        <SectionPanel title="Thiết lập chiết khấu">
          {setting ? (
            <div className="rounded-3xl bg-indigo-50/50 border border-indigo-100 p-6 flex flex-col justify-between min-h-[180px]">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" /> Chiết khấu nền tảng hiện tại
                </p>
                <p className="mt-3 text-4xl font-black text-slate-950">{setting.commissionPercent}%</p>
                <p className="mt-2 text-xs font-semibold text-slate-600 leading-relaxed">{setting.note}</p>
              </div>
              <p className="mt-4 text-[10px] font-semibold text-slate-400 border-t border-indigo-100 pt-3">
                Cập nhật lần cuối: {formatDateTime(setting.updatedAt)}
              </p>
            </div>
          ) : <EmptyState text="Chưa thiết lập chiết khấu." />}
        </SectionPanel>
      </div>

      {/* Admin Settlements with Top Right Pagination */}
      <SectionPanel
        title="Đối soát hệ thống"
        subtitle="Danh sách các đơn đặt lịch chụp ảnh hoàn thành đang chờ hoặc đã được chi trả từ Admin."
        actions={
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as SettlementStatus)
                setSettlementsPage(1)
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black uppercase tracking-wider text-slate-700 outline-none focus:border-indigo-500"
            >
              {['ALL', 'READY', 'PENDING', 'PAID', 'FAILED', 'CANCELLED'].map((item) => (
                <option key={item} value={item}>{SETTLEMENT_LABEL[item] ?? item}</option>
              ))}
            </select>
            
            {settlementsTotalPages > 1 && (
              <PaginationControls currentPage={settlementsPage} totalPages={settlementsTotalPages} onChange={setSettlementsPage} />
            )}
          </div>
        }
      >
        {settlements.length === 0 ? <EmptyState text="Không có lịch sử đối soát phù hợp." /> : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
              <table className="w-full min-w-[880px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="pl-6 pr-3 py-4">Mã Booking</th>
                    <th className="px-3 py-4">Tên khách</th>
                    <th className="px-3 py-4 text-right">Doanh thu thô</th>
                    <th className="px-3 py-4 text-right">Phí nền tảng</th>
                    <th className="px-3 py-4 text-right">Thực nhận ví</th>
                    <th className="pl-3 pr-6 py-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedSettlements.map((item) => (
                    <tr key={item.settlementId} className="hover:bg-slate-50/30 transition-colors">
                      <td className="pl-6 pr-3 py-4 font-mono text-xs font-extrabold text-slate-600">#{item.bookingCode}</td>
                      <td className="px-3 py-4 text-sm font-extrabold text-slate-900">{item.customerName}</td>
                      <td className="px-3 py-4 text-right text-xs font-semibold text-slate-700">{formatVnd(item.grossAmount)}</td>
                      <td className="px-3 py-4 text-right text-xs font-semibold text-rose-600">-{formatVnd(item.platformFeeAmount)}</td>
                      <td className="px-3 py-4 text-right text-sm font-black text-emerald-700">{formatVnd(item.studioAmount)}</td>
                      <td className="pl-3 pr-6 py-4">
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                          SETTLEMENT_BADGE[item.status] ?? 'bg-slate-100 text-slate-600'
                        }`}>
                          {SETTLEMENT_LABEL[item.status] ?? item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {settlements.length > 0 && (
              <div className="flex items-center justify-between mt-3 px-3">
                <div className="text-xs font-bold text-slate-500">
                  Hiển thị <span className="text-slate-900 font-extrabold">{Math.min(settlements.length, (settlementsPage - 1) * 5 + 1)}-{Math.min(settlements.length, settlementsPage * 5)}</span> trong tổng số <span className="text-slate-900 font-extrabold">{settlements.length}</span> đơn đối soát
                </div>
              </div>
            )}
          </>
        )}
      </SectionPanel>

      {/* Wallet Transactions with Top Right Pagination */}
      <SectionPanel
        title="Lịch sử giao dịch ví"
        subtitle="Nhật ký chi tiết các biến động số dư trong ví điện tử của Studio."
        actions={
          txTotalPages > 1 ? (
            <PaginationControls currentPage={txPage} totalPages={txTotalPages} onChange={setTxPage} />
          ) : undefined
        }
      >
        {!wallet || txList.length === 0 ? <EmptyState text="Chưa thực hiện giao dịch ví nào." /> : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
              <table className="w-full min-w-[880px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="pl-6 pr-3 py-4">Mã giao dịch</th>
                    <th className="px-3 py-4">Phân loại</th>
                    <th className="px-3 py-4 text-right">Số tiền biến động</th>
                    <th className="px-3 py-4 text-right">Số dư ví sau GD</th>
                    <th className="px-3 py-4">Đơn đặt</th>
                    <th className="px-3 py-4">Nội dung chi tiết</th>
                    <th className="pl-3 pr-6 py-4">Thời gian tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedTx.map((tx) => (
                    <tr key={tx.txId} className="hover:bg-slate-50/30 transition-colors">
                      <td className="pl-6 pr-3 py-4 font-mono text-xs font-extrabold text-slate-600">#{tx.txId}</td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                          TX_BADGE[tx.txType] ?? 'bg-slate-100 text-slate-600'
                        }`}>
                          {TX_LABEL[tx.txType] ?? tx.txType}
                        </span>
                      </td>
                      <td className={`px-3 py-4 text-right text-sm font-black whitespace-nowrap ${
                        tx.txType.startsWith('CREDIT') ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {tx.txType.startsWith('CREDIT') ? '+' : '-'}{formatVnd(tx.amount)}
                      </td>
                      <td className="px-3 py-4 text-right text-xs font-extrabold text-slate-700 whitespace-nowrap">{formatVnd(tx.balanceAfter)}</td>
                      <td className="px-3 py-4 font-mono text-xs font-semibold text-slate-400">{tx.bookingId ? `#${tx.bookingId}` : '-'}</td>
                      <td className="px-3 py-4 text-xs font-semibold text-slate-500 max-w-[200px] truncate" title={tx.description}>{tx.description || '-'}</td>
                      <td className="pl-3 pr-6 py-4 text-[10px] font-semibold text-slate-400 whitespace-nowrap">{formatDateTime(tx.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {txList.length > 0 && (
              <div className="flex items-center justify-between mt-3 px-3">
                <div className="text-xs font-bold text-slate-500">
                  Hiển thị <span className="text-slate-900 font-extrabold">{Math.min(txList.length, (txPage - 1) * 5 + 1)}-{Math.min(txList.length, txPage * 5)}</span> trong tổng số <span className="text-slate-900 font-extrabold">{txList.length}</span> giao dịch ví
                </div>
              </div>
            )}
          </>
        )}
      </SectionPanel>

      {/* Commission history with Top Right Pagination */}
      <SectionPanel
        title="Lịch sử chiết khấu & Thực nhận"
        subtitle="Chi tiết khấu trừ phí nền tảng và thực nhận trên từng hóa đơn đơn hàng của Studio."
        actions={
          commissionTotalPages > 1 ? (
            <PaginationControls currentPage={commissionPage} totalPages={commissionTotalPages} onChange={setCommissionPage} />
          ) : undefined
        }
      >
        {commissions.length === 0 ? <EmptyState text="Chưa phát sinh giao dịch chiết khấu nào." /> : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
              <table className="w-full min-w-[900px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="pl-6 pr-3 py-4">Mã Booking</th>
                    <th className="px-3 py-4">Tên khách hàng</th>
                    <th className="px-3 py-4">Dịch vụ chụp</th>
                    <th className="px-3 py-4 text-right">Doanh thu thô</th>
                    <th className="px-3 py-4 text-right">Phí khấu trừ</th>
                    <th className="px-3 py-4 text-right">Ví thực nhận</th>
                    <th className="pl-3 pr-6 py-4">Trạng thái thanh toán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedCommissions.map((item) => (
                    <tr key={item.bookingId} className="hover:bg-slate-50/30 transition-colors">
                      <td className="pl-6 pr-3 py-4 font-mono text-xs font-extrabold text-slate-600">#{item.bookingCode}</td>
                      <td className="px-3 py-4 text-sm font-extrabold text-slate-900 whitespace-nowrap">{item.customerName}</td>
                      <td className="px-3 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">{item.serviceName}</td>
                      <td className="px-3 py-4 text-right text-xs font-semibold text-slate-700">{formatVnd(item.grossAmount)}</td>
                      <td className="px-3 py-4 text-right text-xs font-semibold text-rose-600">-{formatVnd(item.commissionAmount)}</td>
                      <td className="px-3 py-4 text-right text-sm font-black text-emerald-700">{formatVnd(item.netRevenue)}</td>
                      <td className="pl-3 pr-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                          item.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/40' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.paymentStatus === 'PAID' ? 'Đã thanh toán' : item.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {commissions.length > 0 && (
              <div className="flex items-center justify-between mt-3 px-3">
                <div className="text-xs font-bold text-slate-500">
                  Hiển thị <span className="text-slate-900 font-extrabold">{Math.min(commissions.length, (commissionPage - 1) * 5 + 1)}-{Math.min(commissions.length, commissionPage * 5)}</span> trong tổng số <span className="text-slate-900 font-extrabold">{commissions.length}</span> đơn chiết khấu
                </div>
              </div>
            )}
          </>
        )}
      </SectionPanel>
    </div>
  )
}

function Metric({ label, value, tone = 'slate', sub }: { label: string; value: string; tone?: 'slate' | 'emerald' | 'rose' | 'indigo'; sub?: string }) {
  const color = {
    slate: 'text-slate-950',
    emerald: 'text-emerald-700',
    rose: 'text-rose-700',
    indigo: 'text-indigo-700'
  }[tone]

  const bg = {
    slate: 'bg-slate-50/30 border-slate-100',
    emerald: 'bg-emerald-50/20 border-emerald-100/50',
    rose: 'bg-rose-50/20 border-rose-100/50',
    indigo: 'bg-indigo-50/20 border-indigo-100/50'
  }[tone]

  return (
    <div className={`rounded-2xl border p-4 transition-all hover:shadow-sm ${bg}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-2 truncate text-base font-extrabold ${color}`}>{value}</p>
      {sub && <p className="text-[9px] text-slate-400 font-semibold mt-1">{sub}</p>}
    </div>
  )
}

function PaginationControls({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number
  totalPages: number
  onChange: (page: number) => void
}) {
  return (
    <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50 shrink-0 select-none">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onChange(Math.max(1, currentPage - 1))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600 hover:text-slate-900 hover:shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200/30 text-sm active:scale-95"
      >
        &lsaquo;
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onChange(page)}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-black transition active:scale-95 ${
            currentPage === page
              ? 'bg-slate-950 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100/50 border border-slate-200/30'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600 hover:text-slate-900 hover:shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200/30 text-sm active:scale-95"
      >
        &rsaquo;
      </button>
    </div>
  )
}
