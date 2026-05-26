import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { getStudioSettlements, type SettlementItem, type SettlementStatus } from '../../../services/settlementApi'
import { getStudioCommissionSetting, getStudioCommissions, getStudioRevenue, type StudioCommission, type StudioCommissionSetting, type StudioRevenue } from '../../../services/studioRevenueApi'
import { formatDateTime, formatMonth, formatVnd } from '../format'
import { EmptyState, SectionPanel } from './Panel'

export default function FinanceManager() {
  const [revenue, setRevenue] = useState<StudioRevenue | null>(null)
  const [commissions, setCommissions] = useState<StudioCommission[]>([])
  const [settlements, setSettlements] = useState<SettlementItem[]>([])
  const [setting, setSetting] = useState<StudioCommissionSetting | null>(null)
  const [status, setStatus] = useState<SettlementStatus>('ALL')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const [revenueData, commissionData, settlementData, settingData] = await Promise.allSettled([
      getStudioRevenue(),
      getStudioCommissions({ sortBy: 'newest' }),
      getStudioSettlements({ status }),
      getStudioCommissionSetting(),
    ])
    if (revenueData.status === 'fulfilled') setRevenue(revenueData.value)
    if (commissionData.status === 'fulfilled') setCommissions(commissionData.value)
    if (settlementData.status === 'fulfilled') setSettlements(settlementData.value)
    if (settingData.status === 'fulfilled') setSetting(settingData.value)
    setLoading(false)
  }

  useEffect(() => { load() }, [status])

  const settlementTotals = useMemo(() => ({
    ready: settlements.filter((item) => item.status === 'READY').reduce((sum, item) => sum + item.studioAmount, 0),
    paid: settlements.filter((item) => item.status === 'PAID').reduce((sum, item) => sum + item.studioAmount, 0),
  }), [settlements])

  return (
    <div className="space-y-6">
      <SectionPanel title="Finance" subtitle="Revenue, admin settlement status, commission history, and platform fee settings from the backend API." actions={<button type="button" onClick={load} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black uppercase text-slate-700"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button>}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Metric label="Gross revenue" value={revenue ? formatVnd(revenue.grossRevenue) : 'No data'} />
          <Metric label="Commission" value={revenue ? formatVnd(revenue.commissionDeducted) : 'No data'} tone="rose" />
          <Metric label="Net revenue" value={revenue ? formatVnd(revenue.netRevenue) : 'No data'} tone="emerald" />
          <Metric label="Ready settlement" value={formatVnd(settlementTotals.ready)} tone="indigo" />
          <Metric label="Settled by admin" value={formatVnd(settlementTotals.paid)} tone="emerald" />
        </div>
      </SectionPanel>

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
