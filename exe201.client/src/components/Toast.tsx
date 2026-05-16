import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

type ToastItem = {
  id: string
  type: ToastType
  title: string
  message?: string
}

type ToastApi = {
  push: (t: Omit<ToastItem, 'id'>) => void
}

const ToastContext = createContext<ToastApi | null>(null)

function toId() { return Math.random().toString(16).slice(2, 8) }

const ICON_MAP: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-emerald-600" />,
  error: <XCircle className="h-4 w-4 text-rose-600" />,
  info: <Info className="h-4 w-4 text-blue-600" />,
}

const BORDER_MAP: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50',
  error: 'border-rose-200 bg-rose-50',
  info: 'border-blue-200 bg-blue-50',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = toId()
    setItems((prev) => [{ id, ...t }, ...prev].slice(0, 4))
    setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 3500)
  }, [])

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const api = useMemo<ToastApi>(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-[92vw] max-w-sm flex-col-reverse gap-2">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className={`flex items-start gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-sm ${BORDER_MAP[t.type]}`}
            >
              <div className="mt-0.5 shrink-0">{ICON_MAP[t.type]}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900">{t.title}</div>
                {t.message && <div className="mt-0.5 text-xs text-slate-600 leading-5">{t.message}</div>}
              </div>
              <button onClick={() => dismiss(t.id)} className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
