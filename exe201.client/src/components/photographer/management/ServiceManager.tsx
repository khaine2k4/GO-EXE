import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { Edit, Plus, Search, Trash2 } from 'lucide-react'
import { getCategories } from '../../../services/categoryApi'
import { createStudioService, deleteStudioService, getStudioServices, toggleStudioService, updateStudioService } from '../../../services/serviceApi'
import type { Category, ServiceSummary } from '../../../services/catalogTypes'
import { formatVnd } from '../format'
import { Drawer, EmptyState, SectionPanel } from './Panel'
import CustomDialog from '../../CustomDialog'

const emptyForm = { id: 0, categoryId: '', serviceName: '', description: '', thumbnailUrl: '', city: 'Da Nang', sortOrder: '0', isActive: true }

export default function ServiceManager({ refreshKey = 0, initialCreate = false, onChanged }: { refreshKey?: number; initialCreate?: boolean; onChanged?: () => void }) {
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState(emptyForm)
  const [drawerOpen, setDrawerOpen] = useState(initialCreate)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    const [serviceData, categoryData] = await Promise.all([getStudioServices(), getCategories()])
    setServices(serviceData)
    setCategories(categoryData)
    setLoading(false)
  }

  useEffect(() => { load() }, [refreshKey])
  useEffect(() => { if (initialCreate) setDrawerOpen(true) }, [initialCreate])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return services.filter((item) => !term || `${item.name} ${item.categoryName} ${item.city}`.toLowerCase().includes(term))
  }, [search, services])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.categoryId || !form.serviceName.trim()) return
    const payload = {
      categoryId: Number(form.categoryId),
      serviceName: form.serviceName.trim(),
      description: form.description,
      thumbnailUrl: form.thumbnailUrl,
      city: form.city,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    }
    if (form.id) await updateStudioService(form.id, payload)
    else await createStudioService(payload)
    setForm(emptyForm)
    setDrawerOpen(false)
    await load()
    onChanged?.()
  }

  async function handleConfirmDelete() {
    if (!deleteId) return
    const id = deleteId
    setDeleteId(null)
    try {
      await deleteStudioService(id)
      await load()
      onChanged?.()
    } catch (err) {
      console.error(err)
    }
  }

  function openCreate() {
    setForm(emptyForm)
    setDrawerOpen(true)
  }

  function openEdit(service: ServiceSummary) {
    setForm({ id: service.id, categoryId: String(service.categoryId), serviceName: service.name, description: service.description || '', thumbnailUrl: service.thumbnailUrl || '', city: service.city || '', sortOrder: '0', isActive: service.isActive })
    setDrawerOpen(true)
  }

  return (
    <>
      <SectionPanel
        title="Dịch vụ"
        subtitle="Tạo mới, chỉnh sửa, ẩn/hiển thị và tìm kiếm các dịch vụ của studio."
        actions={<button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black uppercase text-white"><Plus className="h-4 w-4" />Thêm dịch vụ</button>}
      >
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm dịch vụ, danh mục, thành phố..." className="h-11 min-w-0 flex-1 outline-none" />
        </div>
        {loading ? <EmptyState text="Đang tải dịch vụ..." /> : filtered.length === 0 ? <EmptyState text="Không tìm thấy dịch vụ phù hợp." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead><tr className="border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400"><th className="py-3">Dịch vụ</th><th>Danh mục</th><th>Thành phố</th><th>Giá khởi điểm</th><th>Trạng thái</th><th className="text-right">Thao tác</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((service) => (
                  <tr key={service.id}>
                    <td className="py-4"><div className="font-black text-slate-950">{service.name}</div><div className="line-clamp-1 text-xs text-slate-500">{service.description}</div></td>
                    <td className="text-sm font-semibold text-slate-600">{service.categoryName}</td>
                    <td className="text-sm font-semibold text-slate-600">{service.city || '-'}</td>
                    <td className="text-sm font-black text-indigo-600">{formatVnd(service.minPrice)}</td>
                    <td><button type="button" onClick={() => toggleStudioService(service.id, !service.isActive).then(() => load().then(onChanged))} className={`rounded-xl px-3 py-2 text-xs font-black uppercase ${service.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{service.isActive ? 'Hoạt động' : 'Tạm ngưng'}</button></td>
                    <td className="text-right"><button type="button" onClick={() => openEdit(service)} className="mr-2 rounded-xl border border-slate-200 p-2 text-slate-600"><Edit className="h-4 w-4" /></button><button type="button" onClick={() => setDeleteId(service.id)} className="rounded-xl border border-rose-100 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionPanel>

      <Drawer title={form.id ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <Select label="Danh mục" value={form.categoryId} onChange={(value) => setForm((prev) => ({ ...prev, categoryId: value }))} options={categories.map((item) => ({ value: String(item.id), label: item.name }))} />
          <Input label="Tên dịch vụ" value={form.serviceName} onChange={(value) => setForm((prev) => ({ ...prev, serviceName: value }))} />
          <Input label="Thành phố" value={form.city} onChange={(value) => setForm((prev) => ({ ...prev, city: value }))} />
          <Input label="Ảnh đại diện (URL)" value={form.thumbnailUrl} onChange={(value) => setForm((prev) => ({ ...prev, thumbnailUrl: value }))} />
          <Input label="Thứ tự sắp xếp" type="number" value={form.sortOrder} onChange={(value) => setForm((prev) => ({ ...prev, sortOrder: value }))} />
          <Textarea label="Mô tả chi tiết" value={form.description} onChange={(value) => setForm((prev) => ({ ...prev, description: value }))} />
          <button className="h-11 w-full rounded-xl bg-indigo-600 text-xs font-black uppercase tracking-widest text-white">{form.id ? 'Cập nhật dịch vụ' : 'Tạo dịch vụ mới'}</button>
        </form>
      </Drawer>

      <CustomDialog
        isOpen={deleteId !== null}
        title="Xác Nhận Xóa Dịch Vụ"
        message="Bạn có chắc chắn muốn xóa dịch vụ này không? Hành động này sẽ ẩn hoặc loại bỏ dịch vụ khỏi Studio của bạn."
        type="confirm"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  )
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="block"><span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-indigo-400" /></label>
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-28 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:border-indigo-400" /></label>
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <label className="block"><span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-indigo-400"><option value="">Chọn danh mục</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}
