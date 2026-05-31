import type { StudioRevenue } from '../../../services/studioRevenueApi'
import { formatMonth, formatVnd } from '../format'

export default function RevenueSummary({
  revenue,
  pendingPayout,
  onManage,
}: {
  revenue: StudioRevenue | null
  pendingPayout: number
  onManage: () => void
}) {
  const latestMonths = revenue?.monthlyRevenue.slice(0, 4) ?? []
  const monthRevenue = latestMonths[0]?.netRevenue

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Báo cáo doanh thu</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">Doanh thu thực nhận, biến động hàng tháng và trạng thái đối soát.</p>
        </div>
        <button type="button" onClick={onManage} className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition active:scale-95 shadow-sm">Tài chính</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Thực nhận tổng" value={revenue ? formatVnd(revenue.netRevenue) : 'Chưa có dữ liệu'} tone="emerald" />
        <Metric label="Tháng này" value={monthRevenue !== undefined ? formatVnd(monthRevenue) : 'Chưa có dữ liệu'} tone="indigo" />
        <Metric label="Sẵn sàng đối soát" value={formatVnd(pendingPayout)} tone="slate" />
      </div>
      {latestMonths.length > 0 && (
        <div className="mt-4 space-y-2">
          {latestMonths.map((item) => (
            <div key={`${item.year}-${item.month}`} className="flex items-center justify-between rounded-xl bg-slate-50/50 px-4 py-2.5 text-xs border border-slate-100">
              <span className="font-bold text-slate-600">{formatMonth(item.year, item.month)}</span>
              <span className="font-black text-emerald-700">{formatVnd(item.netRevenue)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Metric({ label, value, tone = 'slate' }: { label: string; value: string; tone?: 'slate' | 'emerald' | 'indigo' }) {
  const color = tone === 'emerald' ? 'text-emerald-700' : tone === 'indigo' ? 'text-indigo-700' : 'text-slate-900'
  const bg = tone === 'emerald' ? 'bg-emerald-50/30 border-emerald-100/50' : tone === 'indigo' ? 'bg-indigo-50/30 border-indigo-100/50' : 'bg-slate-50/50 border-slate-100'
  return (
    <div className={`rounded-2xl border p-4 transition-all hover:shadow-sm ${bg}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-2 truncate text-base font-extrabold ${color}`}>{value}</p>
    </div>
  )
}
