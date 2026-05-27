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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">Gói dịch vụ gần đây</h2>
          <p className="text-sm font-medium text-slate-500">Quản lý giá và tính khả dụng của gói chụp.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCreate} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black uppercase text-white">Tạo mới</button>
          <button type="button" onClick={onManage} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase text-slate-700">Quản lý</button>
        </div>
      </div>
      {packages.length === 0 ? <Empty text="Chưa có gói dịch vụ nào." /> : (
        <div className="space-y-3">
          {packages.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
              <div className="min-w-0">
                <div className="truncate font-black text-slate-950">{item.name}</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">{formatVnd(item.price)} / {item.isActive ? 'Hoạt động' : 'Tạm ngưng'}</div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => onEdit(item)} className="rounded-xl border border-slate-200 p-2 text-slate-600"><Edit className="h-4 w-4" /></button>
                <button type="button" onClick={() => setDeleteId(item.id)} className="rounded-xl border border-rose-100 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button>
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
  return <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">{text}</div>
}

