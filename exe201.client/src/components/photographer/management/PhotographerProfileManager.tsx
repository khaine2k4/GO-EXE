import { useState } from 'react'
import type React from 'react'
import { useAppStore } from '../../../store/AppStore'
import { SectionPanel } from './Panel'

export default function PhotographerProfileManager() {
  const { state } = useAppStore()
  const current = state.currentUser
  const [form, setForm] = useState({
    name: current?.studioName || current?.name || '',
    bio: current?.bio || '',
    location: [current?.city, current?.district].filter(Boolean).join(', '),
    avatarUrl: current?.logoUrl || current?.avatarUrl || '',
    coverUrl: current?.coverUrl || '',
  })

  function submit(event: React.FormEvent) {
    event.preventDefault()
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <SectionPanel title="Studio profile" subtitle="Manage the public studio identity used across the marketplace.">
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Input label="Studio name" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <Input label="City / location" value={form.location} onChange={(value) => setForm((prev) => ({ ...prev, location: value }))} />
          <Input label="Logo / avatar URL" value={form.avatarUrl} onChange={(value) => setForm((prev) => ({ ...prev, avatarUrl: value }))} />
          <Input label="Cover URL" value={form.coverUrl} onChange={(value) => setForm((prev) => ({ ...prev, coverUrl: value }))} />
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">Bio / description</span>
            <textarea value={form.bio} onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))} className="min-h-32 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:border-indigo-400" />
          </label>
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 md:col-span-2">
            Profile is currently read from backend auth data. A real studio profile update API is needed before enabling save.
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
