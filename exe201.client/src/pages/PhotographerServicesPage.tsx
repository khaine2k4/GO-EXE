import { useEffect, useState } from 'react'
import { Edit, Plus, Trash2 } from 'lucide-react'
import { getCategories } from '../services/categoryApi'
import { createStudioService, deleteStudioService, getStudioServices, toggleStudioService, updateStudioService } from '../services/serviceApi'
import type { Category, ServiceSummary } from '../services/catalogTypes'

const emptyForm = { id: 0, categoryId: '', serviceName: '', description: '', thumbnailUrl: '', city: 'Da Nang', sortOrder: '0', isActive: true }

export default function PhotographerServicesPage() {
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [serviceData, categoryData] = await Promise.all([getStudioServices(), getCategories()])
      setServices(serviceData)
      setCategories(categoryData)
    } catch {
      setError('Khong the tai services.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.categoryId || !form.serviceName) return
    const payload = {
      categoryId: Number(form.categoryId),
      serviceName: form.serviceName,
      description: form.description,
      thumbnailUrl: form.thumbnailUrl,
      city: form.city,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    }
    if (form.id) await updateStudioService(form.id, payload)
    else await createStudioService(payload)
    setForm(emptyForm)
    await load()
  }

  async function remove(id: number) {
    if (!confirm('Xoa/an service nay?')) return
    await deleteStudioService(id)
    await load()
  }

  return (
    <div className="space-y-8 pb-20">
      <Header title="Service management" subtitle="CRUD service, toggle active/inactive bang API /api/studio/services." />
      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <select value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold">
            <option value="">Chon category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <input value={form.serviceName} onChange={(e) => setForm((p) => ({ ...p, serviceName: e.target.value }))} placeholder="Ten service" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold" />
          <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="City" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold" />
          <input value={form.thumbnailUrl} onChange={(e) => setForm((p) => ({ ...p, thumbnailUrl: e.target.value }))} placeholder="Thumbnail URL" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold" />
          <input type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))} placeholder="Sort" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold" />
          <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} /> Active</label>
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Mo ta" className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold md:col-span-2 xl:col-span-3" />
        </div>
        <div className="mt-4 flex gap-2">
          <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-xs font-black uppercase tracking-widest text-white"><Plus className="h-4 w-4" /> {form.id ? 'Cap nhat' : 'Tao service'}</button>
          {form.id !== 0 && <button type="button" onClick={() => setForm(emptyForm)} className="h-11 rounded-xl border border-slate-200 px-5 text-xs font-black uppercase tracking-widest">Huy</button>}
        </div>
      </form>

      {loading ? <StateBox text="Dang tai..." /> : error ? <StateBox text={error} /> : services.length === 0 ? <StateBox text="Chua co service." /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {services.map((service) => (
            <div key={service.id} className="grid gap-3 border-b border-slate-100 p-4 last:border-0 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h3 className="font-black text-slate-950">{service.name}</h3>
                <p className="text-sm font-semibold text-slate-500">{service.categoryName} / {service.city} / Tu {service.minPrice || 0} VND</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => toggleStudioService(service.id, !service.isActive).then(load)} className={`rounded-xl px-4 py-2 text-xs font-black uppercase ${service.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{service.isActive ? 'Active' : 'Inactive'}</button>
                <button onClick={() => setForm({ id: service.id, categoryId: String(service.categoryId), serviceName: service.name, description: service.description || '', thumbnailUrl: service.thumbnailUrl || '', city: service.city || '', sortOrder: '0', isActive: service.isActive })} className="rounded-xl border border-slate-200 p-2 text-slate-600"><Edit className="h-4 w-4" /></button>
                <button onClick={() => remove(service.id)} className="rounded-xl border border-rose-100 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button>
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
