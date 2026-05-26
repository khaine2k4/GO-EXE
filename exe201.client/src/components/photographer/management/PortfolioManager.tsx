import { useEffect, useState } from 'react'
import type React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { createStudioPortfolio, deleteStudioPortfolio, getStudioPortfolios } from '../../../services/portfolioApi'
import { getStudioServices } from '../../../services/serviceApi'
import type { PortfolioItem, ServiceSummary } from '../../../services/catalogTypes'
import { Drawer, EmptyState, SectionPanel } from './Panel'
import CustomDialog from '../../CustomDialog'

const emptyForm = { serviceId: '', imageUrl: '', caption: '', sortOrder: '0' }

export default function PortfolioManager({ initialCreate = false, onChanged }: { initialCreate?: boolean; onChanged?: () => void }) {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [form, setForm] = useState(emptyForm)
  const [drawerOpen, setDrawerOpen] = useState(initialCreate)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    const [portfolioData, serviceData] = await Promise.all([getStudioPortfolios(), getStudioServices()])
    setItems(portfolioData)
    setServices(serviceData)
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (initialCreate) setDrawerOpen(true) }, [initialCreate])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.imageUrl.trim()) return
    setSaving(true)
    await createStudioPortfolio({
      serviceId: form.serviceId ? Number(form.serviceId) : undefined,
      imageUrl: form.imageUrl.trim(),
      caption: form.caption,
      sortOrder: Number(form.sortOrder) || 0,
    })
    setSaving(false)
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
      await deleteStudioPortfolio(id)
      await load()
      onChanged?.()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <SectionPanel title="Hồ sơ năng lực" subtitle="Thêm hình ảnh, đính kèm vào dịch vụ và sắp xếp các chú thích ảnh." actions={<button type="button" onClick={() => setDrawerOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black uppercase text-white"><Plus className="h-4 w-4" />Thêm hình ảnh</button>}>
        {loading ? <EmptyState text="Đang tải hồ sơ năng lực..." /> : items.length === 0 ? <EmptyState text="Chưa có hình ảnh nào trong hồ sơ năng lực." /> : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img src={item.imageUrl} alt={item.caption || 'Portfolio'} className="aspect-square w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-slate-950/75 p-3 text-white opacity-0 transition group-hover:opacity-100">
                  <span className="truncate text-xs font-bold">{item.caption || 'Portfolio'}</span>
                  <button type="button" onClick={() => setDeleteId(item.id)} className="rounded-lg bg-white p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionPanel>
      <Drawer title="Thêm ảnh vào hồ sơ năng lực" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <label className="block"><span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">Dịch vụ đính kèm</span><select value={form.serviceId} onChange={(event) => setForm((prev) => ({ ...prev, serviceId: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"><option value="">Không đính kèm dịch vụ</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
          <Input label="Đường dẫn hình ảnh (URL)" value={form.imageUrl} onChange={(value) => setForm((prev) => ({ ...prev, imageUrl: value }))} />
          <Input label="Chú thích ảnh" value={form.caption} onChange={(value) => setForm((prev) => ({ ...prev, caption: value }))} />
          <Input label="Thứ tự sắp xếp" type="number" value={form.sortOrder} onChange={(value) => setForm((prev) => ({ ...prev, sortOrder: value }))} />
          <button disabled={saving} className="h-11 w-full rounded-xl bg-indigo-600 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">Thêm hình ảnh</button>
        </form>
      </Drawer>

      <CustomDialog
        isOpen={deleteId !== null}
        title="Xác Nhận Xóa Ảnh Portfolio"
        message="Bạn có chắc chắn muốn xóa hình ảnh này khỏi hồ sơ năng lực không? Hành động này không thể hoàn tác."
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
