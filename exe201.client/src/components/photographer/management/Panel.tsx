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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Backdrop with a smooth glassmorphic overlay */}
      <button 
        type="button" 
        aria-label="Close panel" 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" 
      />
      
      {/* Premium Dialog Modal */}
      <aside className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-2xl flex flex-col z-10 transition-all duration-300 animate-in fade-in zoom-in-95 slide-in-from-bottom-8">
        {/* Sticky Header with subtle separator */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 p-6 backdrop-blur">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">{title}</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded-2xl border border-slate-200 p-2 text-slate-400 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 active:scale-90 shadow-sm"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Scrollable Form Body */}
        <div className="p-6 md:p-8 overflow-y-auto min-h-0 flex-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {children}
        </div>
      </aside>
    </div>
  )
}

export function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm font-bold text-slate-400">{text}</div>
}

