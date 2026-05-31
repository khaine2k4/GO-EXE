import { useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import type { PackageItem } from '../../../services/catalogTypes'
import { deleteStudioPackage } from '../../../services/packageApi'
import { formatVnd } from '../format'
import CustomDialog from '../../CustomDialog'

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
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function handleConfirmDelete() {
    if (!deleteId) return
    const id = deleteId
    setDeleteId(null)
    try {
      await deleteStudioPackage(id)
      onChanged()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Gói dịch vụ gần đây</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">Quản lý giá cả, chi tiết cấu hình và tính khả dụng của gói chụp.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCreate} className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-indigo-700 transition active:scale-95 shadow-sm">Tạo mới</button>
          <button type="button" onClick={onManage} className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition active:scale-95">Quản lý</button>
        </div>
      </div>
      {packages.length === 0 ? <Empty text="Chưa có gói dịch vụ nào." /> : (
        <div className="space-y-3">
          {packages.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4 hover:bg-slate-50/30 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-extrabold text-slate-900 leading-snug">{item.name}</div>
                <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="font-extrabold text-indigo-600">{formatVnd(item.price)}</span>
                  <span>•</span>
                  <span className={`inline-flex items-center gap-1 font-bold ${item.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${item.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    {item.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button type="button" onClick={() => onEdit(item)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition duration-150 shadow-sm active:scale-90"><Edit className="h-4 w-4" /></button>
                <button type="button" onClick={() => setDeleteId(item.id)} className="rounded-xl border border-rose-100 p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition duration-150 shadow-sm active:scale-90"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CustomDialog
        isOpen={deleteId !== null}
        title="Xác Nhận Xóa Gói Dịch Vụ"
        message="Bạn có chắc chắn muốn xóa gói dịch vụ này không? Hành động này không thể hoàn tác."
        type="confirm"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </section>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm font-bold text-slate-400">{text}</div>
}
