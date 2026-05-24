import { useEffect, useState } from 'react'
import { Edit, Plus, Trash2 } from 'lucide-react'
import { createCategory, deleteCategory, getAdminCategories, updateCategory } from '../services/adminCategoryApi'
import type { Category } from '../services/catalogTypes'
import CustomDialog from '../components/CustomDialog'

const emptyForm = { id: 0, categoryName: '', description: '', iconUrl: '', sortOrder: '0', isActive: true }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null)

  async function load() {
    setLoading(true)
    try {
      setCategories(await getAdminCategories())
    } catch {
      setError('Không thể tải categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.categoryName) return
    const payload = { categoryName: form.categoryName, description: form.description, iconUrl: form.iconUrl, sortOrder: Number(form.sortOrder) || 0, isActive: form.isActive }
    if (form.id) await updateCategory(form.id, payload)
    else await createCategory(payload)
    setForm(emptyForm)
    await load()
  }

  function remove(id: number) {
    setDialog({
      title: 'Vô hiệu hóa danh mục',
      message: 'Bạn có chắc chắn muốn vô hiệu hóa danh mục này không?',
      onConfirm: async () => {
        await deleteCategory(id)
        await load()
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h1 className="text-2xl font-black text-slate-950">Quản lý category</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">ADMIN CRUD categories qua /api/admin/categories.</p>
      </div>
      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input value={form.categoryName} onChange={(e) => setForm((p) => ({ ...p, categoryName: e.target.value }))} placeholder="Tên category" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold" />
          <input value={form.iconUrl} onChange={(e) => setForm((p) => ({ ...p, iconUrl: e.target.value }))} placeholder="Icon URL" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold" />
          <input type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Thứ tự" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold" />
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Mô tả" className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold md:col-span-2" />
          <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} /> Đang hoạt động</label>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-xs font-black uppercase tracking-widest text-white"><Plus className="h-4 w-4" /> {form.id ? 'Cập nhật' : 'Tạo category'}</button>
          {form.id !== 0 && <button type="button" onClick={() => setForm(emptyForm)} className="h-11 rounded-xl border border-slate-200 px-5 text-xs font-black uppercase tracking-widest">Hủy</button>}
        </div>
      </form>

      {loading ? <StateBox text="Đang tải..." /> : error ? <StateBox text={error} /> : categories.length === 0 ? <StateBox text="Chưa có category." /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {categories.map((category) => (
            <div key={category.id} className="grid gap-3 border-b border-slate-100 p-4 last:border-0 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h3 className="font-black text-slate-950">{category.name}</h3>
                <p className="text-sm font-semibold text-slate-500">Thứ tự {category.sortOrder} / {category.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setForm({ id: category.id, categoryName: category.name, description: category.description || '', iconUrl: category.iconUrl || '', sortOrder: String(category.sortOrder), isActive: category.isActive })} className="rounded-xl border border-slate-200 p-2 text-slate-600"><Edit className="h-4 w-4" /></button>
                <button onClick={() => remove(category.id)} className="rounded-xl border border-rose-100 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <CustomDialog
        isOpen={!!dialog}
        title={dialog?.title || ''}
        message={dialog?.message || ''}
        onConfirm={() => {
          dialog?.onConfirm()
          setDialog(null)
        }}
        onCancel={() => setDialog(null)}
      />
    </div>
  )
}

function StateBox({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-500">{text}</div>
}
