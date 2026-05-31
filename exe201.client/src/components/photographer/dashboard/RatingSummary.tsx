import { Star } from 'lucide-react'
import type { ReviewItem } from '../../../services/catalogTypes'
import { formatDate } from '../format'

export default function RatingSummary({
  rating,
  reviews,
  totalReviews,
  onManage,
}: {
  rating: number
  reviews: ReviewItem[]
  totalReviews: number
  onManage: () => void
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Đánh giá & Nhận xét</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">Ý kiến phản hồi gần đây nhất từ khách hàng của bạn.</p>
        </div>
        <button type="button" onClick={onManage} className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition active:scale-95 shadow-sm">Chi tiết</button>
      </div>
      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-amber-50/40 border border-amber-100/50 p-4 text-amber-900">
        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
        <span className="text-2xl font-black">{rating.toFixed(1)}</span>
        <span className="text-xs font-bold text-amber-700/80">từ {totalReviews} đánh giá</span>
      </div>
      {reviews.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">Chưa có đánh giá nào.</div> : (
        <div className="space-y-3">
          {reviews.slice(0, 3).map((review) => (
            <div key={review.id} className="rounded-2xl border border-slate-100 p-4 hover:bg-slate-50/30 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-sm text-slate-900">{review.customerName}</span>
                <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/30 flex items-center gap-1">
                  {review.rating}/5 <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-slate-600 leading-relaxed">{review.comment || 'Không có bình luận.'}</p>
              <p className="mt-2 text-[10px] font-semibold text-slate-400">{formatDate(review.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
