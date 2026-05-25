import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, HelpCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface CustomDialogProps {
  isOpen: boolean
  title: string
  message: string
  type?: 'confirm' | 'prompt'
  placeholder?: string
  defaultValue?: string
  confirmText?: string
  cancelText?: string
  onConfirm: (inputValue?: string) => void
  onCancel: () => void
}

export default function CustomDialog({
  isOpen,
  title,
  message,
  type = 'confirm',
  placeholder = 'Nhập lý do...',
  defaultValue = '',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
}: CustomDialogProps) {
  const [inputValue, setInputValue] = useState(defaultValue)

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue)
    }
  }, [isOpen, defaultValue])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (type === 'prompt' && !inputValue.trim()) return
    onConfirm(type === 'prompt' ? inputValue.trim() : undefined)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                {type === 'prompt' ? <AlertCircle className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{message}</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {type === 'prompt' && (
                <textarea
                  autoFocus
                  required
                  placeholder={placeholder}
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                />
              )}

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  {cancelText}
                </button>
                <button
                  type="submit"
                  disabled={type === 'prompt' && !inputValue.trim()}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {confirmText}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
