import { AnimatePresence, motion } from 'framer-motion'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Eye, EyeOff, Filter, RefreshCw, Search, ShieldAlert, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { useToast } from '../components/Toast'
import {
  deleteAdminService,
  getAdminServices,
  hideAdminService,
  type AdminServiceItem,
  type AdminServiceStatus,
  unhideAdminService,
} from '../services/adminServiceApi'

type HiddenFilter = 'ALL' | 'VISIBLE' | 'HIDDEN'
type PendingAction = {
  type: 'hide' | 'unhide' | 'delete'
  service: AdminServiceItem
}

const statusOptions: { value: AdminServiceStatus; label: string }[] = [
  { value: 'ALL', label: 'Tat ca trang thai' },
  { value: 'ACTIVE', label: 'Dang hoat dong' },
  { value: 'INACTIVE', label: 'Ngung hoat dong' },
]

const hiddenOptions: { value: HiddenFilter; label: string }[] = [
  { value: 'ALL', label: 'Tat ca hien thi' },
  { value: 'VISIBLE', label: 'Dang hien thi' },
  { value: 'HIDDEN', label: 'Da an' },
]

function formatVnd(value?: number) {
  if (value == null) return 'Chua co gia'
  return `${new Intl.NumberFormat('vi-VN').format(value)} VND`
}

function formatPriceRange(service: AdminServiceItem) {
  if (service.minPrice == null && service.maxPrice == null) return 'Chua co package'
  if (service.minPrice === service.maxPrice) return formatVnd(service.minPrice)
  return `${formatVnd(service.minPrice)} - ${formatVnd(service.maxPrice)}`
}

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('vi-VN', { dateStyle: 'short' })
}

export default function AdminServicesPage() {
  const toast = useToast()
  const [services, setServices] = useState<AdminServiceItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState<AdminServiceStatus>('ALL')
  const [hiddenFilter, setHiddenFilter] = useState<HiddenFilter>('ALL')
  const [sortBy, setSortBy] = useState('newest')
  const [loading, setLoading] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [reasonText, setReasonText] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const params = useMemo(() => {
    const query: Record<string, string | boolean> = { sortBy }
    if (searchTerm.trim()) query.search = searchTerm.trim()
    if (status !== 'ALL') query.status = status
    if (hiddenFilter === 'VISIBLE') query.isHidden = false
    if (hiddenFilter === 'HIDDEN') query.isHidden = true
    return query
  }, [hiddenFilter, searchTerm, sortBy, status])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setServices(await getAdminServices(params))
    } catch {
      setError('Khong tai duoc danh sach dich vu tu API admin.')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchData, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [fetchData])

  async function runModerationAction() {
    if (!pendingAction) return

    const actionKey = `${pendingAction.type}-${pendingAction.service.serviceId}`
    setActionId(actionKey)
    setError('')

    try {
      if (pendingAction.type === 'hide') {
        await hideAdminService(pendingAction.service.serviceId, reasonText.trim() || undefined)
        toast.push({ type: 'success', title: 'Da an service', message: pendingAction.service.serviceName })
      } else if (pendingAction.type === 'unhide') {
        await unhideAdminService(pendingAction.service.serviceId)
        toast.push({ type: 'success', title: 'Da bo an service', message: pendingAction.service.serviceName })
      } else {
        await deleteAdminService(pendingAction.service.serviceId, reasonText.trim() || undefined)
        toast.push({ type: 'success', title: 'Da an noi dung khong phu hop', message: pendingAction.service.serviceName })
      }

      setPendingAction(null)
      setReasonText('')
      await fetchData()
    } catch {
      setError('Thao tac that bai. Vui long thu lai.')
      toast.push({ type: 'error', title: 'Thao tac that bai' })
    } finally {
      setActionId(null)
    }
  }

  function clearFilters() {
    setSearchTerm('')
    setStatus('ALL')
    setHiddenFilter('ALL')
    setSortBy('newest')
  }

  const stats = {
    total: services.length,
    active: services.filter((item) => item.isActive).length,
    hidden: services.filter((item) => item.isHidden).length,
    inactive: services.filter((item) => !item.isActive).length,
  }

  return (
    <div className="space-y-5 pb-12">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Tong dich vu" value={stats.total} />
        <Metric label="Dang hoat dong" value={stats.active} tone="emerald" />
        <Metric label="Da an vi pham" value={stats.hidden} tone="rose" />
        <Metric label="Ngung hoat dong" value={stats.inactive} tone="amber" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-[280px] xl:w-[380px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tim service hoac studio..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <SelectBox icon={<Filter className="h-4 w-4" />} value={status} onChange={(value) => setStatus(value as AdminServiceStatus)} options={statusOptions} />
            <SelectBox icon={<ShieldAlert className="h-4 w-4" />} value={hiddenFilter} onChange={(value) => setHiddenFilter(value as HiddenFilter)} options={hiddenOptions} />
            <SelectBox
              icon={<SlidersHorizontal className="h-4 w-4" />}
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'newest', label: 'Moi nhat' },
                { value: 'oldest', label: 'Cu nhat' },
                { value: 'name', label: 'Ten service' },
                { value: 'studio', label: 'Ten studio' },
                { value: 'category', label: 'Danh muc' },
                { value: 'hidden', label: 'Da an truoc' },
              ]}
            />
            <button type="button" onClick={fetchData} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Lam moi
            </button>
          </div>
        </div>

        {error && <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

        <ServiceTable services={services} loading={loading} actionId={actionId} onAction={setPendingAction} />

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
          <span>Hien thi {services.length} dich vu</span>
          {(searchTerm || status !== 'ALL' || hiddenFilter !== 'ALL') && (
            <button type="button" onClick={clearFilters} className="font-medium text-indigo-600 hover:text-indigo-700">
              Xoa bo loc
            </button>
          )}
        </div>
      </section>

      <AnimatePresence>
        {pendingAction && (
          <ConfirmModal
            action={pendingAction}
            reason={reasonText}
            setReason={setReasonText}
            loading={actionId === `${pendingAction.type}-${pendingAction.service.serviceId}`}
            onClose={() => {
              setPendingAction(null)
              setReasonText('')
            }}
            onSubmit={runModerationAction}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ServiceTable({ services, loading, actionId, onAction }: { services: AdminServiceItem[]; loading: boolean; actionId: string | null; onAction: (action: PendingAction) => void }) {
  if (loading) return <TableSkeleton columns={8} />
  if (services.length === 0) return <EmptyState text="Khong co dich vu phu hop." />

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px]">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
            <th className="px-5 py-3">Service</th>
            <th className="px-5 py-3">Studio</th>
            <th className="px-5 py-3">Category</th>
            <th className="px-5 py-3">Gia</th>
            <th className="px-5 py-3 text-center">Active</th>
            <th className="px-5 py-3 text-center">Hidden</th>
            <th className="px-5 py-3">Ngay tao</th>
            <th className="px-5 py-3 text-right">Thao tac</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service.serviceId} className="border-b border-slate-100 transition hover:bg-slate-50/70">
              <td className="px-5 py-4">
                <div className="text-sm font-semibold text-slate-950">{service.serviceName}</div>
                <div className="mt-1 text-xs text-slate-500">#{service.serviceId} · {service.packageCount} package</div>
              </td>
              <td className="px-5 py-4">
                <div className="text-sm font-medium text-slate-800">{service.studioName}</div>
                <div className="mt-1 text-xs text-slate-500">{service.city || 'Chua co khu vuc'}</div>
              </td>
              <td className="px-5 py-4 text-sm text-slate-600">{service.categoryName}</td>
              <td className="px-5 py-4 text-sm font-medium text-slate-800">{formatPriceRange(service)}</td>
              <td className="px-5 py-4 text-center">
                <StatusBadge active={service.isActive} />
              </td>
              <td className="px-5 py-4 text-center">
                <HiddenBadge service={service} />
              </td>
              <td className="px-5 py-4">
                <div className="text-sm text-slate-600">{formatDate(service.createdAt)}</div>
                {service.hiddenAt && <div className="mt-1 text-xs text-rose-600">An: {formatDate(service.hiddenAt)}</div>}
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  {service.isHidden ? (
                    <button
                      type="button"
                      onClick={() => onAction({ type: 'unhide', service })}
                      disabled={actionId === `unhide-${service.serviceId}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      <Eye className="h-4 w-4" />
                      Bo an
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAction({ type: 'hide', service })}
                      disabled={actionId === `hide-${service.serviceId}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
                    >
                      <EyeOff className="h-4 w-4" />
                      An
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onAction({ type: 'delete', service })}
                    disabled={actionId === `delete-${service.serviceId}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ConfirmModal({ action, reason, setReason, loading, onClose, onSubmit }: { action: PendingAction; reason: string; setReason: (value: string) => void; loading: boolean; onClose: () => void; onSubmit: () => void }) {
  const isUnhide = action.type === 'unhide'
  const title = action.type === 'delete' ? 'An noi dung khong phu hop' : isUnhide ? 'Bo an service' : 'An service vi pham'
  const submitLabel = action.type === 'delete' ? 'Xac nhan remove' : isUnhide ? 'Xac nhan bo an' : 'Xac nhan an'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{action.service.serviceName} · {action.service.studioName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isUnhide && (
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            autoFocus
            placeholder="Ly do xu ly service nay..."
            className="mt-5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-500/10"
          />
        )}

        {isUnhide && <p className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">Service se duoc bo an nhung van giu inactive de studio tu bat lai khi can.</p>}

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Huy
          </button>
          <button type="button" onClick={onSubmit} disabled={loading} className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400">
            {loading ? 'Dang xu ly...' : submitLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function Metric({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'slate' | 'amber' | 'emerald' | 'rose' }) {
  const toneClass = {
    slate: 'text-slate-950',
    amber: 'text-amber-700',
    emerald: 'text-emerald-700',
    rose: 'text-rose-700',
  }[tone]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-2 text-xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  )
}

function SelectBox({ icon, value, onChange, options }: { icon: React.ReactNode; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="relative inline-flex h-10 items-center">
      <span className="pointer-events-none absolute left-3 text-slate-400">{icon}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-400" />
    </label>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Active</span>
  ) : (
    <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">Inactive</span>
  )
}

function HiddenBadge({ service }: { service: AdminServiceItem }) {
  return service.isHidden ? (
    <span className="inline-flex rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">Hidden</span>
  ) : (
    <span className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Visible</span>
  )
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="p-5">
      {Array.from({ length: 6 }).map((_, row) => (
        <div key={row} className="grid gap-4 border-b border-slate-100 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, col) => <div key={col} className="h-4 rounded-full bg-slate-100" />)}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-6 py-16 text-center text-sm text-slate-500">{text}</div>
}
