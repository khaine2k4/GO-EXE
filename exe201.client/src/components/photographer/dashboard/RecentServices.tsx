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
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Dịch vụ gần đây</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">Các dịch vụ chụp ảnh mới nhất và trạng thái hoạt động.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCreate} className="rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800 transition active:scale-95 shadow-sm">Tạo mới</button>
          <button type="button" onClick={onManage} className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition active:scale-95">Quản lý</button>
        </div>
      </div>
      {services.length === 0 ? <Empty text="Chưa có dịch vụ nào." /> : (
        <div className="space-y-3">
          {services.slice(0, 5).map((service) => (
            <div key={service.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4 hover:bg-slate-50/30 transition-colors">
              <Link to={`/photosets/${service.id}`} className="min-w-0 flex-1">
                <div className="truncate text-sm font-extrabold text-slate-900 leading-snug">{service.name}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <span>{service.categoryName}</span>
                  <span>•</span>
                  <span className="font-extrabold text-indigo-600">{formatVnd(service.minPrice)}</span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => toggleStudioService(service.id, !service.isActive).then(onChanged)}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 border ${
                  service.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-sm shadow-emerald-100/20'
                    : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100/50'
                }`}
              >
                <span className="relative flex h-1.5 w-1.5 mr-1.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${service.isActive ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${service.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                </span>
                {service.isActive ? 'Hoạt động' : 'Tạm ngưng'}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm font-bold text-slate-400">{text}</div>
}
