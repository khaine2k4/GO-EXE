import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Eye, EyeOff, Filter, MessageSquare, RefreshCw, Search, Star, X } from 'lucide-react'
import api from '../api/axios'

interface AdminReviewDto {
  id: number
  customerName: string
  studioName: string
  rating: number
  comment?: string
  isHidden: boolean
  hiddenNote?: string
  createdAt: string
}

type ReviewStatusFilter = 'ALL' | 'VISIBLE' | 'HIDDEN'

const statusOptions: { value: ReviewStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả đánh giá' },
  { value: 'VISIBLE', label: 'Review hiển thị' },
  { value: 'HIDDEN', label: 'Review đã ẩn' },
]

export default function AdminReviewsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReviewStatusFilter>('ALL')
  const [reviews, setReviews] = useState<AdminReviewDto[]>([])
  const [loading, setLoading] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [hidingReview, setHidingReview] = useState<AdminReviewDto | null>(null)
  const [noteText, setNoteText] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {}
    if (searchTerm.trim()) params.search = searchTerm.trim()
    if (statusFilter === 'VISIBLE') params.isHidden = 'false'
    if (statusFilter === 'HIDDEN') params.isHidden = 'true'
    return params
  }, [searchTerm, statusFilter])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get<AdminReviewDto[]>('/admin/reviews', { params: queryParams })
      setReviews(response.data)
    } catch {
      setError('Không tải được danh sách đánh giá từ API.')
    } finally {
      setLoading(false)
    }
  }, [queryParams])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchData, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [fetchData])

  async function runAction(id: string, action: () => Promise<unknown>) {
    setActionId(id)
    setError('')
    try {
      await action()
      await fetchData()
    } catch {
      setError('Thao tác thất bại. Vui lòng thử lại.')
    } finally {
      setActionId(null)
    }
  }

  function clearFilters() {
    setSearchTerm('')
    setStatusFilter('ALL')
  }

  const stats = {
    total: reviews.length,
    visible: reviews.filter((r) => !r.isHidden).length,
    hidden: reviews.filter((r) => r.isHidden).length,
    avgRating: reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0',
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Tổng số đánh giá" value={stats.total} icon={<MessageSquare className="h-5 w-5 text-indigo-500" />} />
        <Metric label="Review hiển thị" value={stats.visible} tone="emerald" />
        <Metric label="Review đã ẩn spam" value={stats.hidden} tone="rose" />
        <Metric label="Điểm đánh giá TB" value={stats.avgRating + ' ★'} tone="amber" />
      </div>

      {/* Main Table Section */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">Danh sách đánh giá</h2>
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {reviews.length} đánh giá
              </span>
            </div>

            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              {/* Search Bar */}
              <div className="relative min-w-[280px] xl:w-[360px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm theo tên khách, studio, nội dung..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                />
                {searchTerm && (
                  <button type="button" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Status Filter & Refresh */}
              <div className="flex flex-wrap gap-2">
                <SelectBox
                  icon={<Filter className="h-4 w-4" />}
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value as ReviewStatusFilter)}
                  options={statusOptions}
                />
                <button
                  type="button"
                  onClick={fetchData}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Làm mới
                </button>
              </div>
            </div>
          </div>

          {error && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
        </div>

        {/* Table representation */}
        <ReviewTable
          reviews={reviews}
          loading={loading}
          actionId={actionId}
          onHide={setHidingReview}
          onShow={(review) =>
            runAction(`show-${review.id}`, () =>
              api.put(`/admin/reviews/${review.id}/hide`, { isHidden: false, hiddenNote: '' })
            )
          }
        />

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
          <span>Hiển thị {reviews.length} kết quả</span>
          {(searchTerm || statusFilter !== 'ALL') && (
            <button type="button" onClick={clearFilters} className="font-medium text-indigo-600 hover:text-indigo-700">
              Xóa bộ lọc
            </button>
          )}
        </div>
      </section>

      {/* Spam Hide Modal */}
      <AnimatePresence>
        {hidingReview && (
          <HideNoteModal
            review={hidingReview}
            note={noteText}
            setNote={setNoteText}
            loading={actionId === `hide-${hidingReview.id}`}
            onClose={() => {
              setHidingReview(null)
              setNoteText('')
            }}
            onSubmit={() => {
              if (!noteText.trim()) return
              runAction(`hide-${hidingReview.id}`, () =>
                api.put(`/admin/reviews/${hidingReview.id}/hide`, {
                  isHidden: true,
                  hiddenNote: noteText.trim(),
                })
              ).then(() => {
                setHidingReview(null)
                setNoteText('')
              })
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function Metric({ label, value, tone = 'slate', icon }: { label: string; value: number | string; tone?: 'slate' | 'amber' | 'emerald' | 'rose'; icon?: React.ReactNode }) {
  const toneClass = {
    slate: 'text-slate-950',
    amber: 'text-amber-700 bg-amber-50/50 border-amber-100',
    emerald: 'text-emerald-700 bg-emerald-50/50 border-emerald-100',
    rose: 'text-rose-700 bg-rose-50/50 border-rose-100',
  }[tone]

  return (
    <div className={`rounded-2xl border p-4 shadow-sm bg-white border-slate-200`}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        {icon}
      </div>
      <div className={`mt-2.5 text-xl font-bold tracking-tight ${toneClass.split(' ')[0]}`}>{value}</div>
    </div>
  )
}

function SelectBox({ icon, value, onChange, options }: { icon: React.ReactNode; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="relative inline-flex h-10 items-center">
      <span className="pointer-events-none absolute left-3 text-slate-400">{icon}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
      >
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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${index < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
        />
      ))}
    </div>
  )
}

function ReviewTable({
  reviews,
  loading,
  actionId,
  onHide,
  onShow,
}: {
  reviews: AdminReviewDto[]
  loading: boolean
  actionId: string | null
  onHide: (review: AdminReviewDto) => void
  onShow: (review: AdminReviewDto) => void
}) {
  if (loading) return <TableSkeleton columns={6} />
  if (reviews.length === 0) return <EmptyState text="Không tìm thấy đánh giá nào." />

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px]">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 bg-slate-50/20">
            <th className="px-5 py-3">Khách hàng</th>
            <th className="px-5 py-3">Studio được đánh giá</th>
            <th className="px-5 py-3">Số sao</th>
            <th className="px-5 py-3 max-w-sm">Nội dung đánh giá</th>
            <th className="px-5 py-3">Trạng thái</th>
            <th className="px-5 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review.id} className="border-b border-slate-100 transition hover:bg-slate-50/40">
              <td className="px-5 py-4">
                <div className="text-sm font-medium text-slate-900">{review.customerName}</div>
                <div className="mt-0.5 text-xs text-slate-400">ID Review: #{review.id}</div>
              </td>
              <td className="px-5 py-4">
                <div className="text-sm font-medium text-slate-800">{review.studioName}</div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </td>
              <td className="px-5 py-4">
                <StarRating rating={review.rating} />
              </td>
              <td className="px-5 py-4 max-w-sm">
                <div className="text-sm text-slate-700 break-words line-clamp-3">{review.comment || '(Không có nội dung)'}</div>
                {review.isHidden && review.hiddenNote && (
                  <div className="mt-1 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2 font-medium break-words">
                    Lý do ẩn: {review.hiddenNote}
                  </div>
                )}
              </td>
              <td className="px-5 py-4">
                {review.isHidden ? (
                  <span className="inline-flex rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                    Spam/Đã ẩn
                  </span>
                ) : (
                  <span className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    Hiển thị
                  </span>
                )}
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end">
                  {review.isHidden ? (
                    <button
                      type="button"
                      onClick={() => onShow(review)}
                      disabled={actionId === `show-${review.id}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      <Eye className="h-4 w-4" />
                      Hiện review
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onHide(review)}
                      disabled={actionId === `hide-${review.id}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
                    >
                      <EyeOff className="h-4 w-4" />
                      Ẩn review spam
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

function HideNoteModal({
  review,
  note,
  setNote,
  loading,
  onClose,
  onSubmit,
}: {
  review: AdminReviewDto
  note: string
  setNote: (value: string) => void
  loading: boolean
  onClose: () => void
  onSubmit: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Ẩn review spam</h2>
            <p className="mt-1 text-sm text-slate-500">Khách: {review.customerName} - Studio: {review.studioName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={5}
          autoFocus
          placeholder="Lý do ẩn đánh giá này (ví dụ: Spam, bình luận tục tĩu, quảng cáo trái phép...)..."
          className="mt-5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-500/10"
        />
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !note.trim()}
            className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400"
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận Ẩn'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
