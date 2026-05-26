import type { PortfolioItem } from '../../../services/catalogTypes'

export default function PortfolioPreview({
  items,
  onAdd,
  onManage,
}: {
  items: PortfolioItem[]
  onAdd: () => void
  onManage: () => void
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">Portfolio preview</h2>
          <p className="text-sm font-medium text-slate-500">A quick look at your studio visuals.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onAdd} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black uppercase text-white">Add photo</button>
          <button type="button" onClick={onManage} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase text-slate-700">Manage</button>
        </div>
      </div>
      {items.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">No portfolio photo yet.</div> : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.slice(0, 8).map((item) => (
            <img key={item.id} src={item.imageUrl} alt={item.caption || 'Portfolio'} className="aspect-square rounded-xl object-cover" />
          ))}
        </div>
      )}
    </section>
  )
}

