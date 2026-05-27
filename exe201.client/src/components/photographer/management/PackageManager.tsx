import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { Edit, Plus, Search, Trash2 } from 'lucide-react'
import { createStudioPackage, deleteStudioPackage, getStudioPackages, updateStudioPackage } from '../../../services/packageApi'
import { getStudioServices } from '../../../services/serviceApi'
import type { PackageItem, ServiceSummary } from '../../../services/catalogTypes'
import { formatVnd } from '../format'
import { Drawer, EmptyState, SectionPanel } from './Panel'
import CustomDialog from '../../CustomDialog'

const emptyForm = { id: 0, serviceId: '', packageName: '', description: '', price: '1000000', durationHours: '1', maxPhotos: '20', inclusions: '', sortOrder: '0', isActive: true }

export default function PackageManager({ initialCreate = false, initialEdit, onChanged }: { initialCreate?: boolean; initialEdit?: PackageItem | null; onChanged?: () => void }) {
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [form, setForm] = useState(emptyForm)
  const [drawerOpen, setDrawerOpen] = useState(initialCreate)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    const [packageData, serviceData] = await Promise.all([getStudioPackages(), getStudioServices()])
    setPackages(packageData)
    setServices(serviceData)
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (initialCreate) openCreate() }, [initialCreate])
  useEffect(() => { if (initialEdit) openEdit(initialEdit) }, [initialEdit])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return packages.filter((item) => !term || `${item.name} ${item.description} ${item.inclusions}`.toLowerCase().includes(term))
  }, [packages, search])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.serviceId || !form.packageName.trim()) return
    const payload = {
      serviceId: Number(form.serviceId),
      packageName: form.packageName.trim(),
      description: form.description,
      price: Number(form.price),
      durationHours: Number(form.durationHours) || undefined,
      maxPhotos: Number(form.maxPhotos) || undefined,
      inclusions: form.inclusions,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    }
    if (form.id) await updateStudioPackage(form.id, payload)
    else await createStudioPackage(payload)
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
      await deleteStudioPackage(id)
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

  function openEdit(item: PackageItem) {
    setForm({ id: item.id, serviceId: String(item.serviceId), packageName: item.name, description: item.description || '', price: String(item.price), durationHours: String(item.durationHours || ''), maxPhotos: String(item.maxPhotos || ''), inclusions: item.inclusions || '', sortOrder: String(item.sortOrder), isActive: item.isActive })
    setDrawerOpen(true)
  }

  return (
    <>
      <SectionPanel title="Gói dịch vụ" subtitle="Quản lý gói dịch vụ, giá cả, thời lượng, các dịch vụ đính kèm và trạng thái." actions={<button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-black uppercase text-white"><Plus className="h-4 w-4" />Tạo gói mới</button>}>
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm gói dịch vụ..." className="h-11 min-w-0 flex-1 outline-none" />
        </div>
        {loading ? <EmptyState text="Đang tải các gói dịch vụ..." /> : filtered.length === 0 ? <EmptyState text="Không tìm thấy gói dịch vụ nào." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left">
              <thead><tr className="border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400"><th className="py-3">Gói dịch vụ</th><th>Dịch vụ</th><th>Giá tiền</th><th>Thời lượng</th><th>Trạng thái</th><th className="text-right">Thao tác</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4"><div className="font-black text-slate-950">{item.name}</div><div className="line-clamp-1 text-xs text-slate-500">{item.inclusions || item.description}</div></td>
                    <td className="text-sm font-semibold text-slate-600">{services.find((service) => service.id === item.serviceId)?.name ?? `#${item.serviceId}`}</td>
                    <td className="text-sm font-black text-indigo-600">{formatVnd(item.price)}</td>
                    <td className="text-sm font-semibold text-slate-600">{item.durationHours || '-'}h / {item.maxPhotos || '-'} ảnh</td>
                    <td><span className={`rounded-xl px-3 py-2 text-xs font-black uppercase ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{item.isActive ? 'Hoạt động' : 'Tạm ngưng'}</span></td>
                    <td className="text-right"><button type="button" onClick={() => openEdit(item)} className="mr-2 rounded-xl border border-slate-200 p-2 text-slate-600"><Edit className="h-4 w-4" /></button><button type="button" onClick={() => setDeleteId(item.id)} className="rounded-xl border border-rose-100 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionPanel>

      <Drawer title={form.id ? 'Chỉnh sửa gói chụp' : 'Tạo gói chụp mới'} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <Select label="Dịch vụ đính kèm" value={form.serviceId} onChange={(value) => setForm((prev) => ({ ...prev, serviceId: value }))} options={services.map((item) => ({ value: String(item.id), label: item.name }))} />
          <Input label="Tên gói chụp" value={form.packageName} onChange={(value) => setForm((prev) => ({ ...prev, packageName: value }))} />
          <Input label="Giá tiền" type="number" value={form.price} onChange={(value) => setForm((prev) => ({ ...prev, price: value }))} />
          <Input label="Thời lượng (giờ)" type="number" value={form.durationHours} onChange={(value) => setForm((prev) => ({ ...prev, durationHours: value }))} />
          <Input label="Số lượng ảnh tối đa" type="number" value={form.maxPhotos} onChange={(value) => setForm((prev) => ({ ...prev, maxPhotos: value }))} />
          <Input label="Thứ tự sắp xếp" type="number" value={form.sortOrder} onChange={(value) => setForm((prev) => ({ ...prev, sortOrder: value }))} />
          <Textarea label="Mô tả chi tiết" value={form.description} onChange={(value) => setForm((prev) => ({ ...prev, description: value }))} />
          <Textarea label="Dịch vụ bao gồm" value={form.inclusions} onChange={(value) => setForm((prev) => ({ ...prev, inclusions: value }))} />
          <button className="h-11 w-full rounded-xl bg-indigo-600 text-xs font-black uppercase tracking-widest text-white">{form.id ? 'Cập nhật gói chụp' : 'Tạo gói chụp mới'}</button>
        </form>
      </Drawer>

      <CustomDialog
        isOpen={deleteId !== null}
        title="Xác Nhận Xóa Gói Dịch Vụ"
        message="Bạn có chắc chắn muốn xóa gói dịch vụ này không? Hành động này không thể hoàn tác."
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
  return <label className="block"><span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:border-indigo-400" /></label>
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <label className="block"><span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-indigo-400"><option value="">Chọn dịch vụ</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}
