import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

type ReasonDialogProps = {
  open: boolean
  title: string
  description?: string
  label: string
  placeholder?: string
  defaultReason?: string
  confirmText: string
  loading?: boolean
  danger?: boolean
  onCancel: () => void
  onSubmit: (reason: string) => void
}

export default function ReasonDialog({
  open,
  title,
  description,
  label,
  placeholder,
  defaultReason = '',
  confirmText,
  loading = false,
  danger = false,
  onCancel,
  onSubmit,
}: ReasonDialogProps) {
  const [reason, setReason] = useState(defaultReason)

  useEffect(() => {
    if (open) setReason(defaultReason)
  }, [defaultReason, open])

  if (!open) return null

  const value = reason.trim() || defaultReason.trim()
  const accent = danger ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-[var(--color-azure)] bg-blue-50 border-blue-100'
  const confirmClass = danger
    ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/15'
    : 'bg-[var(--color-azure)] text-white hover:bg-sky-600 shadow-blue-600/15'

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <section className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/15">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${accent}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">{title}</h2>
              {description && <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{description}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-5 block">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            autoFocus
            placeholder={placeholder}
            className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--color-azure)] focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
        </label>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-xs font-black uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => onSubmit(value)}
            disabled={loading || !value}
            className={`inline-flex h-11 items-center justify-center rounded-2xl px-5 text-xs font-black uppercase tracking-wider shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </section>
    </div>
  )
}
