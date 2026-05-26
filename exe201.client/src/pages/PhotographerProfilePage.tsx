import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Star, MessageCircle } from 'lucide-react'
import { getStudioDetail } from '../services/studioApi'
import type { StudioDetail } from '../services/catalogTypes'

function formatVnd(value?: number) {
  if (!value) return 'Contact'
  return new Intl.NumberFormat('vi-VN').format(value) + ' VND'
}

export default function PhotographerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [studio, setStudio] = useState<StudioDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getStudioDetail(id)
      .then(setStudio)
      .catch(() => setError('Could not load studio profile.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <StateBox text="Loading studio..." />
  if (error || !studio) return <StateBox text={error || 'Studio not found.'} />

  return (
    <div className="space-y-8 pb-20">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-graphite)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <section className="relative">
        <div className="relative h-80 overflow-hidden rounded-[28px] bg-slate-100 md:h-[420px]">
          {studio.coverUrl ? <img src={studio.coverUrl} alt={studio.name} className="h-full w-full object-cover" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
        </div>
        <div className="mx-auto -mt-16 max-w-5xl px-4">
          <div className="relative rounded-[28px] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)] md:flex md:items-end md:justify-between md:gap-6">
            <div className="flex items-end gap-5">
              <img src={studio.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(studio.name)}`} alt={studio.name} className="h-24 w-24 rounded-full border-4 border-white bg-white object-cover shadow-sm" />
              <div>
                <div className="mb-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Approved studio</div>
                <h1 className="text-4xl font-bold">{studio.name}</h1>
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-[var(--color-graphite)]">
                  <MapPin className="h-4 w-4" /> {[studio.addressLine, studio.district, studio.city].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row md:mt-0 md:items-end">
              <p className="inline-flex items-center justify-center gap-1 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {studio.rating} ({studio.reviewCount} reviews)
              </p>
              <button
                type="button"
                onClick={() => navigate(`/chat?studioId=${studio.id}`)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-azure)] px-5 text-sm font-medium text-white shadow-[0_8px_24px_rgba(0,113,227,0.16)] transition hover:bg-[var(--color-azure-dark)] active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" /> Nhắn tin
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <main className="space-y-8">
          <Section title="About">
            <p className="leading-7 text-[var(--color-graphite)]">{studio.description || 'Studio has not updated a description yet.'}</p>
          </Section>
          <Section title="Services">
            {studio.services.length === 0 ? <Empty text="No public service yet." /> : (
              <div className="grid gap-4 md:grid-cols-2">
                {studio.services.map((service) => (
                  <Link key={service.id} to={`/photosets/${service.id}`} className="rounded-[24px] border border-[var(--color-border)] bg-white p-5 transition hover:border-[var(--color-azure)] hover:shadow-[var(--shadow-card)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-[var(--color-ink)]">{service.name}</h3>
                        <p className="mt-1 text-sm font-medium text-[var(--color-graphite)]">{service.categoryName}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {service.rating}
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[var(--color-azure)]">From {formatVnd(service.minPrice)}</p>
                  </Link>
                ))}
              </div>
            )}
          </Section>
          <Section title="Portfolio">
            {studio.portfolio.length === 0 ? <Empty text="No portfolio images yet." /> : (
              <div className="columns-2 gap-3 md:columns-3">
                {studio.portfolio.map((item) => <img key={item.id} src={item.imageUrl} alt={item.caption || studio.name} className="mb-3 w-full rounded-[20px] object-cover" />)}
              </div>
            )}
          </Section>
        </main>
        <aside className="lg:sticky lg:top-[88px] lg:self-start">
          <Section title="Reviews">
            {studio.reviews.length === 0 ? <Empty text="No reviews yet." /> : (
              <div className="space-y-3">
                {studio.reviews.map((review) => (
                  <div key={review.id} className="rounded-[20px] bg-[var(--color-fog)] p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[var(--color-ink)]">{review.customerName}</span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500"><Star className="h-4 w-4 fill-current" /> {review.rating}</span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-graphite)]">{review.comment || 'No comment.'}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </aside>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-[24px] border border-[var(--color-border)] bg-white p-6"><h2 className="mb-4 text-2xl font-semibold">{title}</h2>{children}</section>
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-[20px] border border-dashed border-[var(--color-border)] p-6 text-center text-sm font-medium text-[var(--color-graphite)]">{text}</div>
}

function StateBox({ text }: { text: string }) {
  return <div className="surface-card border-dashed p-12 text-center text-sm font-medium text-[var(--color-graphite)]">{text}</div>
}
