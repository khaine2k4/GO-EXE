import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import { ChevronDown, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react'
import { useToast } from '../components/Toast'
import { getAdminCommissions, type AdminCommissionItem } from '../services/adminRevenueApi'

function formatVnd(value?: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value ?? 0)} VND`
}

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}

export default function AdminCommissionsPage() {
  const toast = useToast()
  const [items, setItems] = useState<AdminCommissionItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const params = useMemo(() => {
    const query: Record<string, string> = { sortBy }
    if (searchTerm.trim()) query.search = searchTerm.trim()
    if (from) query.from = from
    if (to) query.to = to
    return query
  }, [from, searchTerm, sortBy, to])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems(await getAdminCommissions(params))
    } catch {
      setError('Khong tai duoc danh sach commission.')
      toast.push({ type: 'error', title: 'Tai commission that bai' })
    } finally {
      setLoading(false)
    }
  }, [params, toast])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchData, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [fetchData])

  function clearFilters() {
    setSearchTerm('')
    setFrom('')
    setTo('')
    setSortBy('newest')
  }

  return (
    <div className="space-y-5 pb-12">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 p-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="relative min-w-[280px] xl:w-[420px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tim booking, studio, customer, service..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <DateInput label="From" value={from} onChange={setFrom} />
            <DateInput label="To" value={to} onChange={setTo} />
            <SelectBox
              icon={<SlidersHorizontal className="h-4 w-4" />}
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'newest', label: 'Moi nhat' },
                { value: 'oldest', label: 'Cu nhat' },
                { value: 'commission_desc', label: 'Commission cao' },
                { value: 'commission_asc', label: 'Commission thap' },
                { value: 'gross_desc', label: 'Gross cao' },
                { value: 'gross_asc', label: 'Gross thap' },
              ]}
            />
            <button type="button" onClick={fetchData} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

        {loading ? <TableSkeleton columns={11} /> : items.length === 0 ? <EmptyState text="Khong co commission phu hop." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-5 py-3">Studio</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3 text-right">Gross</th>
                  <th className="px-5 py-3 text-right">Rate</th>
                  <th className="px-5 py-3 text-right">Commission</th>
                  <th className="px-5 py-3 text-right">Studio Revenue</th>
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Dates</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.bookingId} className="border-b border-slate-100 hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="font-mono text-xs font-semibold text-slate-600">#{item.bookingCode}</div>
                      <div className="mt-1 text-xs text-slate-400">ID {item.bookingId}</div>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-900">{item.studioName}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{item.customerName}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{item.serviceName}</td>
                    <td className="px-5 py-4 text-right text-sm font-medium text-slate-900">{formatVnd(item.grossAmount)}</td>
                    <td className="px-5 py-4 text-right text-sm text-slate-600">{item.commissionPercent}%</td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-indigo-700">{formatVnd(item.commissionAmount)}</td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-emerald-700">{formatVnd(item.studioRevenue)}</td>
                    <td className="px-5 py-4"><Badge value={item.bookingStatus} tone="emerald" /></td>
                    <td className="px-5 py-4"><Badge value={item.paymentStatus} tone="indigo" /></td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-slate-500">Completed: {formatDate(item.completedAt)}</div>
                      <div className="mt-1 text-xs text-slate-500">Paid: {formatDate(item.paidAt)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
          <span>Hien thi {items.length} commission records</span>
          {(searchTerm || from || to || sortBy !== 'newest') && (
            <button type="button" onClick={clearFilters} className="font-medium text-indigo-600 hover:text-indigo-700">
              Xoa bo loc
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" />
    </label>
  )
}

function SelectBox({ icon, value, onChange, options }: { icon: React.ReactNode; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="relative inline-flex h-10 items-center">
      <span className="pointer-events-none absolute left-3 text-slate-400">{icon}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-400" />
    </label>
  )
}

function Badge({ value, tone }: { value: string; tone: 'emerald' | 'indigo' }) {
  const color = tone === 'emerald' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-indigo-200 bg-indigo-50 text-indigo-700'
  return <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${color}`}>{value}</span>
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
