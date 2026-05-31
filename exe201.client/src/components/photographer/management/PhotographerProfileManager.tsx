import { useState } from 'react'
import type React from 'react'
import { useAppStore } from '../../../store/AppStore'
import { SectionPanel } from './Panel'
import ImageUploader from '../../ImageUploader'
import api from '../../../api/axios'
import { useToast } from '../../Toast'
import { Save, Loader2 } from 'lucide-react'

export default function PhotographerProfileManager() {
  const { state, actions } = useAppStore()
  const current = state.currentUser
  const toast = useToast()
  
  const [form, setForm] = useState({
    name: current?.studioName || current?.name || '',
    bio: current?.bio || '',
    location: [current?.city, current?.district].filter(Boolean).join(', '),
    avatarUrl: current?.logoUrl || current?.avatarUrl || '',
    coverUrl: current?.coverUrl || '',
  })

  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    try {
      const parts = form.location.split(',').map((s) => s.trim())
      const city = parts[0] || ''
      const district = parts[1] || ''

      const res = await api.put('/auth/profile', {
        name: current?.name || '',
        phone: current?.phone || '',
        avatarUrl: current?.avatarUrl || '',
        gender: current?.gender || 'MALE',
        dob: current?.dob || null,
        studioName: form.name,
        logoUrl: form.avatarUrl,
        studioPhone: current?.studioPhone || current?.phone || '',
        studioEmail: current?.studioEmail || current?.email || '',
        bio: form.bio,
        city: city,
        district: district,
        addressLine: current?.addressLine || '',
        coverUrl: form.coverUrl,
      })

      const updatedUser = res.data

      // Update user in global store
      actions.setCurrentUser({
        ...current!,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatarUrl,
        status: updatedUser.status,
        studioName: updatedUser.studioName,
        logoUrl: updatedUser.logoUrl,
        bio: updatedUser.bio,
        city: updatedUser.city,
        district: updatedUser.district,
        coverUrl: updatedUser.coverUrl,
      })

      // Update user in localStorage
      const localUserData = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem('user', JSON.stringify({
        ...localUserData,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatarUrl,
      }))

      toast.push({
        type: 'success',
        title: 'Thành công',
        message: 'Hồ sơ Studio đã được cập nhật thành công!',
      })
    } catch (err: any) {
      console.error('Lỗi khi cập nhật hồ sơ studio:', err)
      toast.push({
        type: 'error',
        title: 'Thất bại',
        message: err.response?.data || 'Không thể cập nhật hồ sơ Studio. Vui lòng thử lại.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <SectionPanel title="Studio profile" subtitle="Quản lý hồ sơ studio công khai trên marketplace.">
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Input label="Tên studio" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <Input label="Thành phố / Khu vực" value={form.location} onChange={(value) => setForm((prev) => ({ ...prev, location: value }))} />
          <ImageUploader
            label="Logo / Avatar"
            folder="exe201/studios/logos"
            currentUrl={form.avatarUrl || undefined}
            onUploaded={(url) => setForm((prev) => ({ ...prev, avatarUrl: url }))}
          />
          <ImageUploader
            label="Ảnh bìa (Cover)"
            folder="exe201/studios/covers"
            currentUrl={form.coverUrl || undefined}
            onUploaded={(url) => setForm((prev) => ({ ...prev, coverUrl: url }))}
          />
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">Mô tả studio</span>
            <textarea value={form.bio} onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))} className="min-h-32 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:border-indigo-400" />
          </label>
          
          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </SectionPanel>

      <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-36 bg-slate-100">
          {form.coverUrl && <img src={form.coverUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="-mt-10 p-5">
          <img src={form.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(form.name || 'Studio')}`} alt={form.name} className="h-20 w-20 rounded-full border-4 border-white bg-white object-cover" />
          <h3 className="mt-4 text-xl font-black text-slate-950">{form.name || 'Studio name'}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{form.location || 'Location'}</p>
          <p className="mt-4 text-sm leading-6 text-slate-600">{form.bio || 'Studio description preview.'}</p>
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-black uppercase tracking-widest text-slate-500">
            Profile source: backend authenticated user
          </div>
        </div>
      </aside>
    </div>
  )
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-indigo-400" /></label>
}

