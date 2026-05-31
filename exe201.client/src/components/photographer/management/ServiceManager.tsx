import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { Edit, Plus, Search, Trash2 } from 'lucide-react'
import { getCategories } from '../../../services/categoryApi'
import { createStudioService, deleteStudioService, getStudioServices, toggleStudioService, updateStudioService } from '../../../services/serviceApi'
import type { Category, ServiceSummary } from '../../../services/catalogTypes'
import { formatVnd } from '../format'
import { Drawer, EmptyState, SectionPanel } from './Panel'
import CustomDialog from '../../CustomDialog'
import ImageUploader from '../../ImageUploader'

const emptyForm = { id: 0, categoryId: '', serviceName: '', description: '', thumbnailUrl: '', city: 'Da Nang', sortOrder: '0', isActive: true }

export default function ServiceManager({ refreshKey = 0, initialCreate = false, onChanged }: { refreshKey?: number; initialCreate?: boolean; onChanged?: () => void }) {
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState(emptyForm)
  const [drawerOpen, setDrawerOpen] = useState(initialCreate)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  async function load(isInitial = false) {
    if (isInitial || services.length === 0) {
      setLoading(true)
    }
    try {
      const [serviceData, categoryData] = await Promise.all([getStudioServices(), getCategories()])
      setServices(serviceData)
      setCategories(categoryData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(id: number, currentActive: boolean) {
    // Optimistic UI update to prevent any latency or layout shift
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !currentActive } : s))
    )

    try {
      await toggleStudioService(id, !currentActive)
      await load() // background update without loading screen
    } catch (err) {
      console.error(err)
      // Revert if error occurs
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: currentActive } : s))
      )
    }
  }

  useEffect(() => { load(true) }, [refreshKey])
  useEffect(() => { if (initialCreate) setDrawerOpen(true) }, [initialCreate])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return services.filter((item) => !term || `${item.name} ${item.categoryName} ${item.city}`.toLowerCase().includes(term))
  }, [search, services])

  // Reset pagination to first page on search filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage])

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
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 bg-white">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm dịch vụ, danh mục, thành phố..." className="h-11 min-w-0 flex-1 outline-none text-sm font-semibold text-slate-700 bg-transparent" />
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 hover:text-slate-900 hover:shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 border border-slate-200/50"
              >
                &lsaquo;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-xs font-black transition active:scale-95 ${
                    currentPage === page
                      ? 'bg-slate-950 text-white shadow-md shadow-slate-950/20'
                      : 'bg-white text-slate-600 hover:bg-slate-100/50 border border-slate-200/50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 hover:text-slate-900 hover:shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 border border-slate-200/50"
              >
                &rsaquo;
              </button>
            </div>
          )}
        </div>
        {loading ? <EmptyState text="Đang tải dịch vụ..." /> : filtered.length === 0 ? <EmptyState text="Không tìm thấy dịch vụ phù hợp." /> : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
            <table className="w-full min-w-[800px] table-auto text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="py-4 pl-6 pr-4 font-black">Dịch vụ</th>
                  <th className="py-4 px-4 font-black">Danh mục</th>
                  <th className="py-4 px-4 font-black">Thành phố</th>
                  <th className="py-4 px-4 font-black">Giá khởi điểm</th>
                  <th className="py-4 px-4 font-black text-center">Trạng thái</th>
                  <th className="py-4 pl-4 pr-6 font-black text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedServices.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-50/40 transition-colors duration-150">
                    <td className="py-4 pl-6 pr-4 max-w-[300px]">
                      <div className="font-extrabold text-slate-900 text-sm leading-snug">{service.name}</div>
                      <div className="line-clamp-1 text-xs text-slate-400 mt-1 font-medium">{service.description}</div>
                    </td>
                    <td className="py-4 px-4 text-sm font-bold text-slate-600">{service.categoryName}</td>
                    <td className="py-4 px-4 text-sm font-bold text-slate-500 whitespace-nowrap">{service.city || '-'}</td>
                    <td className="py-4 px-4 text-sm font-black text-indigo-600 whitespace-nowrap">{formatVnd(service.minPrice)}</td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggle(service.id, service.isActive)}
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 ${
                          service.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm shadow-emerald-100/20'
                            : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100/50'
                        }`}
                      >
                        <span className="relative flex h-1.5 w-1.5 mr-1.5">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${service.isActive ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${service.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        </span>
                        {service.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                      </button>
                    </td>
                    <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(service)}
                        className="mr-2 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition duration-150 shadow-sm active:scale-95"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(service.id)}
                        className="inline-flex items-center justify-center rounded-xl border border-rose-100 bg-white p-2.5 text-rose-500 hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50/50 transition duration-150 shadow-sm active:scale-95"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Info Footer */}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4 rounded-b-2xl">
                <div className="text-xs font-bold text-slate-500">
                  Hiển thị <span className="text-slate-900 font-extrabold">{Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filtered.length, currentPage * itemsPerPage)}</span> trong tổng số <span className="text-slate-900 font-extrabold">{filtered.length}</span> dịch vụ
                </div>
              </div>
            )}
          </div>
        )}
      </SectionPanel>

      <Drawer title={form.id ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <Select label="Danh mục" value={form.categoryId} onChange={(value) => setForm((prev) => ({ ...prev, categoryId: value }))} options={categories.map((item) => ({ value: String(item.id), label: item.name }))} />
          <Input label="Tên dịch vụ" value={form.serviceName} onChange={(value) => setForm((prev) => ({ ...prev, serviceName: value }))} />
          <Input label="Thành phố" value={form.city} onChange={(value) => setForm((prev) => ({ ...prev, city: value }))} />
          <ImageUploader
            label="Ảnh đại diện dịch vụ"
            folder="exe201/services"
            currentUrl={form.thumbnailUrl || undefined}
            onUploaded={(url) => setForm((prev) => ({ ...prev, thumbnailUrl: url }))}
          />
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
