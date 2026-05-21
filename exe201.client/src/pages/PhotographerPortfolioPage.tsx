import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { createStudioPortfolio, deleteStudioPortfolio, getStudioPortfolios } from '../services/portfolioApi'
import { getStudioServices } from '../services/serviceApi'
import type { PortfolioItem, ServiceSummary } from '../services/catalogTypes'

export default function PhotographerPortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [form, setForm] = useState({ serviceId: '', imageUrl: '', caption: '', sortOrder: '0' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [portfolioData, serviceData] = await Promise.all([getStudioPortfolios(), getStudioServices()])
      setItems(portfolioData)
      setServices(serviceData)
    } catch {
      setError('Khong the tai portfolio.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.imageUrl) return
    setSaving(true)
    try {
      await createStudioPortfolio({
        serviceId: form.serviceId ? Number(form.serviceId) : undefined,
        imageUrl: form.imageUrl,
        caption: form.caption,
        sortOrder: Number(form.sortOrder) || 0,
      })
      setForm({ serviceId: '', imageUrl: '', caption: '', sortOrder: '0' })
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: number) {
    if (!confirm('Xoa anh portfolio nay?')) return
    await deleteStudioPortfolio(id)
    await load()
  }

  return (
    <div className="space-y-8 pb-20">
      <Header title="Portfolio management" subtitle="Upload/delete anh portfolio bang API that." />
      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-[1fr_2fr_1fr_1fr_auto]">
        <select value={form.serviceId} onChange={(e) => setForm((prev) => ({ ...prev, serviceId: e.target.value }))} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold">
          <option value="">Khong gan service</option>
          {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
        </select>
        <input value={form.imageUrl} onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))} placeholder="Image URL" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold" />
        <input value={form.caption} onChange={(e) => setForm((prev) => ({ ...prev, caption: e.target.value }))} placeholder="Caption" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold" />
        <input type="number" value={form.sortOrder} onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))} placeholder="Sort" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold" />
        <button disabled={saving} className="h-11 rounded-xl bg-indigo-600 px-5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">Them</button>
      </form>

      {loading ? <StateBox text="Dang tai..." /> : error ? <StateBox text={error} /> : items.length === 0 ? <StateBox text="Chua co portfolio." /> : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img src={item.imageUrl} alt={item.caption || ''} className="aspect-square w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-slate-950/70 p-3 text-white opacity-0 transition group-hover:opacity-100">
                <span className="truncate text-xs font-bold">{item.caption || 'Portfolio'}</span>
                <button onClick={() => remove(item.id)} className="rounded-lg bg-white p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button>
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
