import { Link } from 'react-router-dom'
import type { ServiceSummary } from '../../../services/catalogTypes'
import { toggleStudioService } from '../../../services/serviceApi'
import { formatVnd } from '../format'

export default function RecentServices({
  services,
  onManage,
  onCreate,
  onChanged,
}: {
  services: ServiceSummary[]
  onManage: () => void
  onCreate: () => void
  onChanged: () => void
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">Recent services</h2>
          <p className="text-sm font-medium text-slate-500">Latest public offerings and active status.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCreate} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black uppercase text-white">Create</button>
          <button type="button" onClick={onManage} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase text-slate-700">Manage</button>
        </div>
      </div>
      {services.length === 0 ? <Empty text="No service yet." /> : (
        <div className="space-y-3">
          {services.slice(0, 5).map((service) => (
            <div key={service.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
              <Link to={`/photosets/${service.id}`} className="min-w-0">
                <div className="truncate font-black text-slate-950">{service.name}</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">{service.categoryName} / {formatVnd(service.minPrice)}</div>
              </Link>
              <button
                type="button"
                onClick={() => toggleStudioService(service.id, !service.isActive).then(onChanged)}
                className={`rounded-xl px-3 py-2 text-xs font-black uppercase ${service.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
              >
                {service.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">{text}</div>
}

