import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { Edit, Plus, Search, Trash2 } from 'lucide-react'
import { createStudioPackage, deleteStudioPackage, getStudioPackages, updateStudioPackage } from '../../../services/packageApi'
import { getStudioServices } from '../../../services/serviceApi'
import type { PackageItem, ServiceSummary } from '../../../services/catalogTypes'
import { formatVnd } from '../format'
import { Drawer, EmptyState, SectionPanel } from './Panel'

const emptyForm = { id: 0, serviceId: '', packageName: '', description: '', price: '1000000', durationHours: '1', maxPhotos: '20', inclusions: '', sortOrder: '0', isActive: true }

export default function PackageManager({ initialCreate = false, initialEdit, onChanged }: { initialCreate?: boolean; initialEdit?: PackageItem | null; onChanged?: () => void }) {
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [form, setForm] = useState(emptyForm)
  const [drawerOpen, setDrawerOpen] = useState(initialCreate)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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

  async function remove(id: number) {
    if (!confirm('Delete this package?')) return
    await deleteStudioPackage(id)
    await load()
    onChanged?.()
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
      <SectionPanel title="Packages" subtitle="Manage service packages, price, duration, inclusions, and active status." actions={<button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-black uppercase text-white"><Plus className="h-4 w-4" />Create package</button>}>
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search package..." className="h-11 min-w-0 flex-1 outline-none" />
        </div>
        {loading ? <EmptyState text="Loading packages..." /> : filtered.length === 0 ? <EmptyState text="No matching package." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left">
              <thead><tr className="border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400"><th className="py-3">Package</th><th>Service</th><th>Price</th><th>Duration</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4"><div className="font-black text-slate-950">{item.name}</div><div className="line-clamp-1 text-xs text-slate-500">{item.inclusions || item.description}</div></td>
                    <td className="text-sm font-semibold text-slate-600">{services.find((service) => service.id === item.serviceId)?.name ?? `#${item.serviceId}`}</td>
                    <td className="text-sm font-black text-indigo-600">{formatVnd(item.price)}</td>
                    <td className="text-sm font-semibold text-slate-600">{item.durationHours || '-'}h / {item.maxPhotos || '-'} photos</td>
                    <td><span className={`rounded-xl px-3 py-2 text-xs font-black uppercase ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{item.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="text-right"><button type="button" onClick={() => openEdit(item)} className="mr-2 rounded-xl border border-slate-200 p-2 text-slate-600"><Edit className="h-4 w-4" /></button><button type="button" onClick={() => remove(item.id)} className="rounded-xl border border-rose-100 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionPanel>

      <Drawer title={form.id ? 'Edit package' : 'Create package'} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <Select label="Service" value={form.serviceId} onChange={(value) => setForm((prev) => ({ ...prev, serviceId: value }))} options={services.map((item) => ({ value: String(item.id), label: item.name }))} />
          <Input label="Package name" value={form.packageName} onChange={(value) => setForm((prev) => ({ ...prev, packageName: value }))} />
          <Input label="Price" type="number" value={form.price} onChange={(value) => setForm((prev) => ({ ...prev, price: value }))} />
          <Input label="Duration hours" type="number" value={form.durationHours} onChange={(value) => setForm((prev) => ({ ...prev, durationHours: value }))} />
          <Input label="Max photos" type="number" value={form.maxPhotos} onChange={(value) => setForm((prev) => ({ ...prev, maxPhotos: value }))} />
          <Input label="Sort order" type="number" value={form.sortOrder} onChange={(value) => setForm((prev) => ({ ...prev, sortOrder: value }))} />
          <Textarea label="Description" value={form.description} onChange={(value) => setForm((prev) => ({ ...prev, description: value }))} />
          <Textarea label="Inclusions" value={form.inclusions} onChange={(value) => setForm((prev) => ({ ...prev, inclusions: value }))} />
          <button className="h-11 w-full rounded-xl bg-indigo-600 text-xs font-black uppercase tracking-widest text-white">{form.id ? 'Update package' : 'Create package'}</button>
        </form>
      </Drawer>
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
  return <label className="block"><span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-indigo-400"><option value="">Select</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}
