import type React from 'react'
import { X } from 'lucide-react'

export function SectionPanel({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          {subtitle && <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

export function Drawer({
  title,
  open,
  onClose,
  children,
}: {
  title: string
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close panel" onClick={onClose} className="absolute inset-0 bg-slate-950/30" />
      <aside className="relative h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 p-5 backdrop-blur">
          <h3 className="text-lg font-black text-slate-950">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </aside>
    </div>
  )
}

export function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm font-bold text-slate-400">{text}</div>
}

