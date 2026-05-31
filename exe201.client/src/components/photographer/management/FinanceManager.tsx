import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Banknote, AlertCircle } from 'lucide-react'
import { getStudioSettlements, type SettlementItem, type SettlementStatus } from '../../../services/settlementApi'
import { getStudioCommissionSetting, getStudioCommissions, getStudioRevenue, type StudioCommission, type StudioCommissionSetting, type StudioRevenue } from '../../../services/studioRevenueApi'
import { getStudioWallet, createWithdrawal, getMyWithdrawals, type WalletDetail, type PayoutRequestItem } from '../../../services/walletApi'
import { formatDateTime, formatMonth, formatVnd } from '../format'
import { EmptyState, SectionPanel } from './Panel'
import { useAppStore } from '../../../store/AppStore'
import { useToast } from '../../../components/Toast'

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

  return (
    <div className="space-y-6">
      <SectionPanel title="Finance" subtitle="Wallet balance, revenue, admin settlement status, commission history, and platform fee settings from the backend API." actions={<button type="button" onClick={load} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black uppercase text-slate-700"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button>}>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <Metric label="Wallet Balance" value={wallet ? formatVnd(wallet.balance) : 'No data'} tone="emerald" />
          <Metric label="Gross revenue" value={revenue ? formatVnd(revenue.grossRevenue) : 'No data'} />
          <Metric label="Commission" value={revenue ? formatVnd(revenue.commissionDeducted) : 'No data'} tone="rose" />
          <Metric label="Net revenue" value={revenue ? formatVnd(revenue.netRevenue) : 'No data'} tone="emerald" />
          <Metric label="Settled by admin" value={formatVnd(settlementTotals.paid)} tone="emerald" />
        </div>
      </SectionPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Payout/Withdrawal Form */}
        <SectionPanel title="Rút Tiền (PayOS)" subtitle="Gửi yêu cầu chuyển tiền trực tiếp vào tài khoản ngân hàng. Tên thụ hưởng bị khóa theo tên hồ sơ pháp lý của bạn.">
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-[11px] font-semibold text-amber-800 leading-relaxed space-y-1 mb-4">
            <div className="flex items-center gap-1 font-bold uppercase tracking-wider text-amber-900">
              <AlertCircle className="h-4 w-4" />
              Chế Độ Bảo Mật Cao
            </div>
            <p>
              Tên thụ hưởng phải khớp 100% với tên hồ sơ pháp lý của bạn. Tên đã bị khóa để phòng chống gian lận.
            </p>
          </div>

          {walletError && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-[11px] font-semibold text-rose-700 mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Không thể tải thông tin ví. Vui lòng làm mới trang hoặc kiểm tra kết nối tới server.
            </div>
          )}

          <form onSubmit={handleCreateWithdrawal} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Chọn Ngân Hàng</span>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 transition"
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

              <label className="block space-y-1">
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Số Tài Khoản</span>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Số tài khoản ngân hàng"
                  required
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 transition"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Tên Tài Khoản (Đã Khóa)</span>
                <input
                  type="text"
                  value={removeSign4VietnameseString(currentUser?.name || '')}
                  disabled
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-400 cursor-not-allowed select-none"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Số Tiền Rút (VND)</span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Tối thiểu 10,000 VND"
                  min="10000"
                  max={wallet?.balance || 0}
                  required
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 transition"
                />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Nội Dung (Tùy Chọn)</span>
              <input
                type="text"
                value={withdrawDesc}
                onChange={(e) => setWithdrawDesc(e.target.value)}
                placeholder="Nội dung chuyển tiền"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 transition"
              />
            </label>

            <button
              type="submit"
              disabled={withdrawLoading || !wallet || wallet.balance < 10000}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-black uppercase text-white hover:bg-indigo-700 transition active:scale-95 disabled:opacity-50"
            >
              <Banknote className="h-4 w-4" />
              {withdrawLoading ? 'Đang gửi yêu cầu...' : 'Rút Tiền Qua PayOS'}
            </button>
          </form>
        </SectionPanel>

        {/* PayOS Payout Request History list */}
        <SectionPanel title="Withdrawal History (PayOS)" subtitle="Track the progress of your direct bank transfers.">
          {withdrawalsLoading ? (
            <div className="text-center py-8 text-slate-400 font-semibold text-xs">Loading withdrawal history...</div>
          ) : withdrawals.length === 0 ? (
            <EmptyState text="No payout requests found." />
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {withdrawals.map((item) => (
                <div key={item.payoutId} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-slate-900">
                        Bank: {item.bankCode} <span className="text-[10px] text-slate-400 font-normal ml-1">#{item.payoutId}</span>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-500">
                        Acc: {item.accountNumber} - {item.accountName}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase ${
                      item.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      item.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-50 pt-2 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">{item.description || 'Withdrawal'}</p>
                      {item.failureReason && (
                        <p className="text-[9px] font-bold text-rose-600 mt-0.5">Reason: {item.failureReason}</p>
                      )}
                      <p className="text-[9px] text-slate-400">{formatDateTime(item.createdAt)}</p>
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
        <SectionPanel title="Monthly revenue">
          {!revenue ? <EmptyState text="No revenue data from API." /> : revenue.monthlyRevenue.length === 0 ? <EmptyState text="No monthly revenue." /> : (
            <div className="space-y-2">
              {revenue.monthlyRevenue.slice(0, 8).map((item) => (
                <div key={`${item.year}-${item.month}`} className="grid grid-cols-4 gap-3 rounded-xl border border-slate-100 p-3 text-sm">
                  <span className="font-black text-slate-950">{formatMonth(item.year, item.month)}</span>
                  <span className="text-right font-semibold text-slate-600">{formatVnd(item.grossRevenue)}</span>
                  <span className="text-right font-semibold text-rose-700">{formatVnd(item.commissionDeducted)}</span>
                  <span className="text-right font-black text-emerald-700">{formatVnd(item.netRevenue)}</span>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>

        <SectionPanel title="Commission setting">
          {setting ? (
            <div className="rounded-2xl bg-indigo-50 p-6">
              <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Current commission</p>
              <p className="mt-3 text-5xl font-black text-slate-950">{setting.commissionPercent}%</p>
              <p className="mt-3 text-sm font-semibold text-slate-600">{setting.note}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">Updated {formatDateTime(setting.updatedAt)}</p>
            </div>
          ) : <EmptyState text="No commission setting." />}
        </SectionPanel>
      </div>

      <SectionPanel title="Admin settlements" actions={<select value={status} onChange={(event) => setStatus(event.target.value as SettlementStatus)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold">{['ALL', 'READY', 'PENDING', 'PAID', 'FAILED', 'CANCELLED'].map((item) => <option key={item} value={item}>{item}</option>)}</select>}>
        {settlements.length === 0 ? <EmptyState text="No settlement." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead><tr className="border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400"><th className="py-3">Booking</th><th>Customer</th><th className="text-right">Gross</th><th className="text-right">Fee</th><th className="text-right">Studio amount</th><th>Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{settlements.map((item) => <tr key={item.settlementId}><td className="py-4 font-mono text-xs font-black">#{item.bookingCode}</td><td className="text-sm font-semibold">{item.customerName}</td><td className="text-right text-sm">{formatVnd(item.grossAmount)}</td><td className="text-right text-sm text-rose-700">{formatVnd(item.platformFeeAmount)}</td><td className="text-right text-sm font-black text-emerald-700">{formatVnd(item.studioAmount)}</td><td><Badge value={item.status} /></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </SectionPanel>

      <SectionPanel title="Wallet Transactions" subtitle="Detailed transaction logs of your digital wallet.">
        {!wallet || wallet.transactions.length === 0 ? <EmptyState text="No wallet transactions." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400">
                  <th className="py-3">Transaction</th>
                  <th>Type</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Balance After</th>
                  <th>Booking</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wallet.transactions.map((tx) => (
                  <tr key={tx.txId}>
                    <td className="py-4 font-mono text-xs font-black">#{tx.txId}</td>
                    <td className="text-sm font-semibold">
                      <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-black uppercase ${tx.txType === 'CREDIT_EARNING' ? 'bg-emerald-50 text-emerald-700' :
                          tx.txType === 'CREDIT_REFUND' ? 'bg-indigo-50 text-indigo-700' :
                            'bg-rose-50 text-rose-700'
                        }`}>
                        {tx.txType}
                      </span>
                    </td>
                    <td className={`text-right text-sm font-black ${tx.txType.startsWith('CREDIT') ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                      {tx.txType.startsWith('CREDIT') ? '+' : '-'}{formatVnd(tx.amount)}
                    </td>
                    <td className="text-right text-sm font-semibold">{formatVnd(tx.balanceAfter)}</td>
                    <td className="font-mono text-xs font-semibold">{tx.bookingId ? `#${tx.bookingId}` : '-'}</td>
                    <td className="text-sm text-slate-600">{tx.description || '-'}</td>
                    <td className="text-xs text-slate-500">{formatDateTime(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionPanel>

      <SectionPanel title="Commission history">
        {commissions.length === 0 ? <EmptyState text="No commission history." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead><tr className="border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400"><th className="py-3">Booking</th><th>Customer</th><th>Service</th><th className="text-right">Gross</th><th className="text-right">Commission</th><th className="text-right">Net</th><th>Payment</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{commissions.slice(0, 20).map((item) => <tr key={item.bookingId}><td className="py-4 font-mono text-xs font-black">#{item.bookingCode}</td><td className="text-sm font-semibold">{item.customerName}</td><td className="text-sm">{item.serviceName}</td><td className="text-right text-sm">{formatVnd(item.grossAmount)}</td><td className="text-right text-sm text-rose-700">{formatVnd(item.commissionAmount)}</td><td className="text-right text-sm font-black text-emerald-700">{formatVnd(item.netRevenue)}</td><td><Badge value={item.paymentStatus} /></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </SectionPanel>
    </div>
  )
}

function Metric({ label, value, tone = 'slate' }: { label: string; value: string; tone?: 'slate' | 'emerald' | 'rose' | 'indigo' }) {
  const color = { slate: 'text-slate-950', emerald: 'text-emerald-700', rose: 'text-rose-700', indigo: 'text-indigo-700' }[tone]
  return <div className="rounded-2xl border border-slate-100 p-4"><p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p><p className={`mt-2 truncate text-xl font-black ${color}`}>{value}</p></div>
}

function Badge({ value }: { value: string }) {
  return <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black uppercase text-slate-600">{value}</span>
}
