import { useEffect, useState } from 'react'
import { Edit, Plus, Trash2 } from 'lucide-react'
import { createStudioPackage, deleteStudioPackage, getStudioPackages, updateStudioPackage } from '../services/packageApi'
import { getStudioServices } from '../services/serviceApi'
import type { PackageItem, ServiceSummary } from '../services/catalogTypes'

const emptyForm = { id: 0, serviceId: '', packageName: '', description: '', price: '1000000', durationHours: '1', maxPhotos: '20', inclusions: '', sortOrder: '0', isActive: true }

export default function PhotographerPackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [packageData, serviceData] = await Promise.all([getStudioPackages(), getStudioServices()])
      setPackages(packageData)
      setServices(serviceData)
    } catch {
      setError('Khong the tai packages.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.serviceId || !form.packageName) return
    const payload = {
      serviceId: Number(form.serviceId),
      packageName: form.packageName,
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
    await load()
  }

  async function remove(id: number) {
    if (!confirm('Xoa package nay?')) return
    await deleteStudioPackage(id)
    await load()
  }

  return (
    <div className="space-y-8 pb-20">
      <Header title="Package management" subtitle="Tao/sua/xoa package va thiet lap gia bang API that." />
      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <select value={form.serviceId} onChange={(e) => setForm((p) => ({ ...p, serviceId: e.target.value }))} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold">
            <option value="">Chon service</option>
            {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
          </select>
          <input value={form.packageName} onChange={(e) => setForm((p) => ({ ...p, packageName: e.target.value }))} placeholder="Ten package" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold" />
          <input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="Gia" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold" />
          <input type="number" value={form.durationHours} onChange={(e) => setForm((p) => ({ ...p, durationHours: e.target.value }))} placeholder="So gio" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold" />
          <input type="number" value={form.maxPhotos} onChange={(e) => setForm((p) => ({ ...p, maxPhotos: e.target.value }))} placeholder="So anh" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold" />
          <input type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Sort" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold" />
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Mo ta" className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold" />
          <textarea value={form.inclusions} onChange={(e) => setForm((p) => ({ ...p, inclusions: e.target.value }))} placeholder="Bao gom" className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold" />
          <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} /> Active</label>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-xs font-black uppercase tracking-widest text-white"><Plus className="h-4 w-4" /> {form.id ? 'Cap nhat' : 'Tao package'}</button>
          {form.id !== 0 && <button type="button" onClick={() => setForm(emptyForm)} className="h-11 rounded-xl border border-slate-200 px-5 text-xs font-black uppercase tracking-widest">Huy</button>}
        </div>
      </form>

      {loading ? <StateBox text="Dang tai..." /> : error ? <StateBox text={error} /> : packages.length === 0 ? <StateBox text="Chua co package." /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {packages.map((item) => (
            <div key={item.id} className="grid gap-3 border-b border-slate-100 p-4 last:border-0 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h3 className="font-black text-slate-950">{item.name}</h3>
                <p className="text-sm font-semibold text-slate-500">Service #{item.serviceId} / {new Intl.NumberFormat('vi-VN').format(item.price)} VND / {item.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setForm({ id: item.id, serviceId: String(item.serviceId), packageName: item.name, description: item.description || '', price: String(item.price), durationHours: String(item.durationHours || ''), maxPhotos: String(item.maxPhotos || ''), inclusions: item.inclusions || '', sortOrder: String(item.sortOrder), isActive: item.isActive })} className="rounded-xl border border-slate-200 p-2 text-slate-600"><Edit className="h-4 w-4" /></button>
                <button onClick={() => remove(item.id)} className="rounded-xl border border-rose-100 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100"><h1 className="text-3xl font-black text-slate-950">{title}</h1><p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p></div>
}

function StateBox({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-500">{text}</div>
}
