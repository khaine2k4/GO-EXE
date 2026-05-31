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
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Hồ sơ năng lực</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">Xem nhanh các hình ảnh tác phẩm nổi bật của studio.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onAdd} className="rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800 transition active:scale-95 shadow-sm">Thêm ảnh</button>
          <button type="button" onClick={onManage} className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition active:scale-95">Quản lý</button>
        </div>
      </div>
      {items.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm font-bold text-slate-400">Chưa có hình ảnh nào trong hồ sơ.</div> : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.slice(0, 8).map((item) => (
            <img key={item.id} src={item.imageUrl} alt={item.caption || 'Hồ sơ studio'} className="aspect-square rounded-2xl object-cover hover:opacity-90 hover:scale-[1.02] active:scale-98 transition duration-200 shadow-sm border border-slate-100" />
          ))}
        </div>
      )}
    </section>
  )
}
