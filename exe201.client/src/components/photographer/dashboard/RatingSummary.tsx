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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">Rating & reviews</h2>
          <p className="text-sm font-medium text-slate-500">Recent customer feedback.</p>
        </div>
        <button type="button" onClick={onManage} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase text-slate-700">Details</button>
      </div>
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-amber-800">
        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
        <span className="text-2xl font-black">{rating.toFixed(1)}</span>
        <span className="text-sm font-bold">from {totalReviews} reviews</span>
      </div>
      {reviews.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400">No review yet.</div> : (
        <div className="space-y-3">
          {reviews.slice(0, 3).map((review) => (
            <div key={review.id} className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-slate-950">{review.customerName}</span>
                <span className="text-sm font-black text-amber-600">{review.rating}/5</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{review.comment || 'No comment.'}</p>
              <p className="mt-2 text-xs font-semibold text-slate-400">{formatDate(review.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

