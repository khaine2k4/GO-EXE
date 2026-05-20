import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, ChevronDown, Filter, RefreshCw, Search, ShieldAlert, SlidersHorizontal, X } from 'lucide-react'
import api from '../api/axios'

type ReportStatus = 'ALL' | 'OPEN' | 'RESOLVED' | 'REJECTED'
type TargetType = 'ALL' | 'STUDIO' | 'BOOKING' | 'REVIEW' | 'USER' | 'SERVICE'

interface AdminReportDto {
  id: number
  typeName: string
  reporterName: string
  targetType: string
  targetId: number
  description?: string
  status: string
  handlerNote?: string
  createdAt: string
  resolvedAt?: string
}

const statusOptions: { value: ReportStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'OPEN', label: 'Đang mở' },
  { value: 'RESOLVED', label: 'Đã xử lý' },
  { value: 'REJECTED', label: 'Từ chối' },
]

const targetOptions: { value: TargetType; label: string }[] = [
  { value: 'ALL', label: 'Tất cả đối tượng' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'BOOKING', label: 'Booking' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'USER', label: 'User' },
  { value: 'SERVICE', label: 'Service' },
]

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN', { dateStyle: 'short' })
}

export default function AdminSupportPage() {
  const [reports, setReports] = useState<AdminReportDto[]>([])
  const [allReports, setAllReports] = useState<AdminReportDto[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState<ReportStatus>('ALL')
  const [targetType, setTargetType] = useState<TargetType>('ALL')
  const [sortBy, setSortBy] = useState('newest')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const params = useMemo(() => {
    const query: Record<string, string> = { sortBy }
    if (searchTerm.trim()) query.search = searchTerm.trim()
    if (status !== 'ALL') query.status = status
    if (targetType !== 'ALL') query.targetType = targetType
    return query
  }, [searchTerm, sortBy, status, targetType])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [filtered, total] = await Promise.all([
        api.get<AdminReportDto[]>('/admin/reports', { params }),
        api.get<AdminReportDto[]>('/admin/reports'),
      ])
      setReports(filtered.data)
      setAllReports(total.data)
    } catch {
      setError('Không tải được report từ API admin.')
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

  async function resolveReport(report: AdminReportDto, nextStatus: 'RESOLVED' | 'REJECTED') {
    setActionId(report.id)
    setError('')
    try {
      await api.put(`/admin/reports/${report.id}/resolve`, {
        status: nextStatus,
        handlerNote: nextStatus === 'RESOLVED' ? 'Admin đã xử lý report.' : 'Admin từ chối report.',
      })
      await fetchData()
    } catch {
      setError('Xử lý report thất bại.')
    } finally {
      setActionId(null)
    }
  }

  const stats = {
    total: allReports.length,
    open: allReports.filter((report) => report.status === 'OPEN').length,
    resolved: allReports.filter((report) => report.status === 'RESOLVED').length,
    rejected: allReports.filter((report) => report.status === 'REJECTED').length,
  }

  function clearFilters() {
    setSearchTerm('')
    setStatus('ALL')
    setTargetType('ALL')
    setSortBy('newest')
  }

  return (
    <div className="space-y-5 pb-12">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Tổng report" value={stats.total} />
        <Metric label="Đang mở" value={stats.open} tone="rose" />
        <Metric label="Đã xử lý" value={stats.resolved} tone="emerald" />
        <Metric label="Từ chối" value={stats.rejected} tone="slate" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-[280px] xl:w-[360px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm người report, loại, nội dung..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <SelectBox icon={<Filter className="h-4 w-4" />} value={status} onChange={(value) => setStatus(value as ReportStatus)} options={statusOptions} />
            <SelectBox icon={<ShieldAlert className="h-4 w-4" />} value={targetType} onChange={(value) => setTargetType(value as TargetType)} options={targetOptions} />
            <SelectBox
              icon={<SlidersHorizontal className="h-4 w-4" />}
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'newest', label: 'Mới nhất' },
                { value: 'oldest', label: 'Cũ nhất' },
                { value: 'status', label: 'Theo trạng thái' },
                { value: 'type', label: 'Theo loại report' },
              ]}
            />
            <button type="button" onClick={fetchData} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        {error && <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                <th className="px-5 py-3">Report</th>
                <th className="px-5 py-3">Người gửi</th>
                <th className="px-5 py-3">Đối tượng</th>
                <th className="px-5 py-3">Nội dung</th>
                <th className="px-5 py-3 text-center">Trạng thái</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-slate-100 transition hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <div className="font-mono text-xs font-medium text-slate-500">#{report.id}</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">{report.typeName}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatDate(report.createdAt)}</div>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-800">{report.reporterName}</td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-slate-900">{report.targetType}</div>
                    <div className="mt-1 text-xs text-slate-500">#{report.targetId}</div>
                  </td>
                  <td className="max-w-md px-5 py-4 text-sm text-slate-600">
                    <div className="line-clamp-2">{report.description || 'Không có mô tả'}</div>
                    {report.handlerNote && <div className="mt-2 text-xs text-slate-400">Admin: {report.handlerNote}</div>}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      {report.status === 'OPEN' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => resolveReport(report, 'RESOLVED')}
                            disabled={actionId === report.id}
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Xử lý
                          </button>
                          <button
                            type="button"
                            onClick={() => resolveReport(report, 'REJECTED')}
                            disabled={actionId === report.id}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                          >
                            Từ chối
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">Đã đóng</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && reports.length === 0 && (
            <div className="px-6 py-16 text-center text-sm text-slate-500">Không có report phù hợp.</div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
          <span>Hiển thị {reports.length} report</span>
          {(searchTerm || status !== 'ALL' || targetType !== 'ALL') && (
            <button type="button" onClick={clearFilters} className="font-medium text-indigo-600 hover:text-indigo-700">
              Xóa bộ lọc
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'slate' | 'rose' | 'emerald' }) {
  const toneClass = {
    slate: 'text-slate-950',
    rose: 'text-rose-700',
    emerald: 'text-emerald-700',
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

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    OPEN: 'border-rose-200 bg-rose-50 text-rose-700',
    RESOLVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    REJECTED: 'border-slate-200 bg-slate-50 text-slate-600',
  }
  const label: Record<string, string> = {
    OPEN: 'Đang mở',
    RESOLVED: 'Đã xử lý',
    REJECTED: 'Từ chối',
  }

  return <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${config[status] ?? config.OPEN}`}>{label[status] ?? status}</span>
}
