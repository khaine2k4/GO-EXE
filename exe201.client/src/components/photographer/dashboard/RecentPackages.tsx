import { Edit, Trash2 } from 'lucide-react'
import type { PackageItem } from '../../../services/catalogTypes'
import { deleteStudioPackage } from '../../../services/packageApi'
import { formatVnd } from '../format'

export default function RecentPackages({
  packages,
  onCreate,
  onManage,
  onEdit,
  onChanged,
}: {
  packages: PackageItem[]
  onCreate: () => void
  onManage: () => void
  onEdit: (item: PackageItem) => void
  onChanged: () => void
}) {
  async function remove(id: number) {
    if (!confirm('Delete this package?')) return
    await deleteStudioPackage(id)
    onChanged()
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">Recent packages</h2>
          <p className="text-sm font-medium text-slate-500">Pricing and package availability.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCreate} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black uppercase text-white">Create</button>
          <button type="button" onClick={onManage} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase text-slate-700">Manage</button>
        </div>
      </div>
      {packages.length === 0 ? <Empty text="No package yet." /> : (
        <div className="space-y-3">
          {packages.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
              <div className="min-w-0">
                <div className="truncate font-black text-slate-950">{item.name}</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">{formatVnd(item.price)} / {item.isActive ? 'Active' : 'Inactive'}</div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => onEdit(item)} className="rounded-xl border border-slate-200 p-2 text-slate-600"><Edit className="h-4 w-4" /></button>
                <button type="button" onClick={() => remove(item.id)} className="rounded-xl border border-rose-100 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button>
              </div>
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

