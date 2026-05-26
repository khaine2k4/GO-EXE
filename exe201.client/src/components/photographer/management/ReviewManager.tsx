import { Star } from 'lucide-react'
import type { ReviewItem } from '../../../services/catalogTypes'
import { formatDate } from '../format'
import { EmptyState, SectionPanel } from './Panel'

export default function ReviewManager({
  rating,
  totalReviews,
  reviews,
}: {
  rating: number
  totalReviews: number
  reviews: ReviewItem[]
}) {
  const distribution = [5, 4, 3, 2, 1].map((score) => ({
    score,
    count: reviews.filter((review) => Math.round(review.rating) === score).length,
  }))

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <SectionPanel title="Rating summary" subtitle="Customer review performance for this studio.">
        <div className="rounded-2xl bg-amber-50 p-6 text-amber-900">
          <div className="flex items-center gap-3">
            <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
            <span className="text-5xl font-black">{rating.toFixed(1)}</span>
          </div>
          <p className="mt-3 text-sm font-black uppercase tracking-widest">from {totalReviews} reviews</p>
        </div>
        <div className="mt-5 space-y-3">
          {distribution.map((item) => {
            const width = totalReviews ? `${Math.round((item.count / totalReviews) * 100)}%` : '0%'
            return (
              <div key={item.score} className="grid grid-cols-[42px_1fr_32px] items-center gap-3 text-sm font-bold text-slate-600">
                <span>{item.score} star</span>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-amber-400" style={{ width }} />
                </div>
                <span className="text-right">{item.count}</span>
              </div>
            )
          })}
        </div>
      </SectionPanel>

      <SectionPanel title="Reviews" subtitle="Recent visible customer feedback.">
        {reviews.length === 0 ? <EmptyState text="No review yet." /> : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-950">{review.customerName}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{formatDate(review.createdAt)}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-black text-amber-700">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {review.rating}/5
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{review.comment || 'No comment.'}</p>
              </article>
            ))}
          </div>
        )}
      </SectionPanel>
    </div>
  )
}

