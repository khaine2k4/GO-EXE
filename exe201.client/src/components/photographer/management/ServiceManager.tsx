import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { Edit, Plus, Search, Trash2 } from 'lucide-react'
import { getCategories } from '../../../services/categoryApi'
import { createStudioService, deleteStudioService, getStudioServices, toggleStudioService, updateStudioService } from '../../../services/serviceApi'
import type { Category, ServiceSummary } from '../../../services/catalogTypes'
import { formatVnd } from '../format'
import { Drawer, EmptyState, SectionPanel } from './Panel'

const emptyForm = { id: 0, categoryId: '', serviceName: '', description: '', thumbnailUrl: '', city: 'Da Nang', sortOrder: '0', isActive: true }

export default function ServiceManager({ refreshKey = 0, initialCreate = false, onChanged }: { refreshKey?: number; initialCreate?: boolean; onChanged?: () => void }) {
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState(emptyForm)
  const [drawerOpen, setDrawerOpen] = useState(initialCreate)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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

  async function remove(id: number) {
    if (!confirm('Delete or hide this service?')) return
    await deleteStudioService(id)
    await load()
    onChanged?.()
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
        title="Services"
        subtitle="Create, edit, hide, and search studio services."
        actions={<button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black uppercase text-white"><Plus className="h-4 w-4" />Create service</button>}
      >
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search service, category, city..." className="h-11 min-w-0 flex-1 outline-none" />
        </div>
        {loading ? <EmptyState text="Loading services..." /> : filtered.length === 0 ? <EmptyState text="No matching service." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead><tr className="border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400"><th className="py-3">Service</th><th>Category</th><th>City</th><th>Price</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((service) => (
                  <tr key={service.id}>
                    <td className="py-4"><div className="font-black text-slate-950">{service.name}</div><div className="line-clamp-1 text-xs text-slate-500">{service.description}</div></td>
                    <td className="text-sm font-semibold text-slate-600">{service.categoryName}</td>
                    <td className="text-sm font-semibold text-slate-600">{service.city || '-'}</td>
                    <td className="text-sm font-black text-indigo-600">{formatVnd(service.minPrice)}</td>
                    <td><button type="button" onClick={() => toggleStudioService(service.id, !service.isActive).then(() => load().then(onChanged))} className={`rounded-xl px-3 py-2 text-xs font-black uppercase ${service.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{service.isActive ? 'Active' : 'Inactive'}</button></td>
                    <td className="text-right"><button type="button" onClick={() => openEdit(service)} className="mr-2 rounded-xl border border-slate-200 p-2 text-slate-600"><Edit className="h-4 w-4" /></button><button type="button" onClick={() => remove(service.id)} className="rounded-xl border border-rose-100 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionPanel>

      <Drawer title={form.id ? 'Edit service' : 'Create service'} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <Select label="Category" value={form.categoryId} onChange={(value) => setForm((prev) => ({ ...prev, categoryId: value }))} options={categories.map((item) => ({ value: String(item.id), label: item.name }))} />
          <Input label="Name" value={form.serviceName} onChange={(value) => setForm((prev) => ({ ...prev, serviceName: value }))} />
          <Input label="City" value={form.city} onChange={(value) => setForm((prev) => ({ ...prev, city: value }))} />
          <Input label="Thumbnail URL" value={form.thumbnailUrl} onChange={(value) => setForm((prev) => ({ ...prev, thumbnailUrl: value }))} />
          <Input label="Sort order" type="number" value={form.sortOrder} onChange={(value) => setForm((prev) => ({ ...prev, sortOrder: value }))} />
          <Textarea label="Description" value={form.description} onChange={(value) => setForm((prev) => ({ ...prev, description: value }))} />
          <button className="h-11 w-full rounded-xl bg-indigo-600 text-xs font-black uppercase tracking-widest text-white">{form.id ? 'Update service' : 'Create service'}</button>
        </form>
      </Drawer>
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
  return <label className="block"><span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-indigo-400"><option value="">Select</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}
