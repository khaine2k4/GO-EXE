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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">Revenue summary</h2>
          <p className="text-sm font-medium text-slate-500">Net revenue, monthly movement, and admin settlement status.</p>
        </div>
        <button type="button" onClick={onManage} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase text-slate-700">Finance</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Net revenue" value={revenue ? formatVnd(revenue.netRevenue) : 'No data'} tone="emerald" />
        <Metric label="This month" value={monthRevenue !== undefined ? formatVnd(monthRevenue) : 'No data'} tone="indigo" />
        <Metric label="Ready settlement" value={formatVnd(pendingPayout)} />
      </div>
      {latestMonths.length > 0 && (
        <div className="mt-4 space-y-2">
          {latestMonths.map((item) => (
            <div key={`${item.year}-${item.month}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
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
  const color = tone === 'emerald' ? 'text-emerald-700' : tone === 'indigo' ? 'text-indigo-700' : 'text-slate-950'
  return <div className="rounded-xl border border-slate-100 p-4"><p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p><p className={`mt-2 truncate text-lg font-black ${color}`}>{value}</p></div>
}
