import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Camera, CalendarDays, Check, MapPin, Star } from 'lucide-react'
import { getServiceDetail } from '../services/serviceApi'
import { getStudioReviews } from '../services/reviewApi'
import type { ReviewItem, ServiceDetail } from '../services/catalogTypes'
import BookingModal from '../components/BookingModal'

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + ' VND'
}

export default function PhotosetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [service, setService] = useState<ServiceDetail | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookingOpen, setBookingOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError('')
    getServiceDetail(id)
      .then(async (data) => {
        setService(data)
        setSelectedPackageId(data.packages[0]?.id ?? null)
        setReviews(await getStudioReviews(data.studioId))
      })
      .catch(() => setError('Could not load service detail.'))
      .finally(() => setLoading(false))
  }, [id])

  const selectedPackage = useMemo(
    () => service?.packages.find((item) => item.id === selectedPackageId) ?? null,
    [selectedPackageId, service?.packages]
  )

  if (loading) return <StateBox text="Loading service detail..." />
  if (error || !service) return <StateBox text={error || 'Service not found.'} />

  const images = [service.thumbnailUrl, ...service.images, ...service.portfolio.map((item) => item.imageUrl)].filter(Boolean) as string[]

  return (
    <div className="space-y-8 pb-20">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-graphite)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-3 overflow-hidden rounded-[28px] lg:grid-cols-[2fr_1fr]">
        <div className="relative aspect-[16/9] overflow-hidden rounded-[28px] bg-slate-100 lg:aspect-[16/8]">
          {images[0] ? <img src={images[0]} alt={service.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400">No image</div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">{service.categoryName}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {service.rating} ({service.reviewCount})
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white md:text-5xl">{service.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white/85"><MapPin className="h-4 w-4" /> {service.city || service.addressLine || 'Da Nang'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {(images.length ? images.slice(1, 3) : []).map((image, index) => (
            <img key={image + index} src={image} alt={service.name} className="aspect-[4/3] h-full w-full rounded-[24px] object-cover" />
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <Section title="Service Information">
            <p className="leading-7 text-[var(--color-graphite)]">{service.description || 'Studio has not updated this service description yet.'}</p>
          </Section>

          <Section title="Packages">
            {service.packages.length === 0 ? <Empty text="No active package yet." /> : (
              <div className="grid gap-4 md:grid-cols-2">
                {service.packages.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedPackageId(item.id)}
                    className={`rounded-[24px] border p-5 text-left transition ${selectedPackageId === item.id ? 'border-[var(--color-azure)] bg-blue-50/30 shadow-[var(--shadow-card)]' : 'border-[var(--color-border)] bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--color-ink)]">{item.name}</h3>
                        <p className="mt-1 text-sm text-[var(--color-graphite)]">{item.description}</p>
                      </div>
                      <span className="text-sm font-semibold text-[var(--color-azure)]">{formatVnd(item.price)}</span>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm font-medium text-[var(--color-slate)]">
                      {item.durationHours && <span><Check className="mr-2 inline h-4 w-4 text-emerald-600" />{item.durationHours} hours</span>}
                      {item.maxPhotos && <span><Check className="mr-2 inline h-4 w-4 text-emerald-600" />{item.maxPhotos} edited photos</span>}
                      {item.inclusions && <span><Check className="mr-2 inline h-4 w-4 text-emerald-600" />{item.inclusions}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Section>

          <Section title="Portfolio">
            {service.portfolio.length === 0 ? <Empty text="No portfolio images yet." /> : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {service.portfolio.map((item) => (
                  <img key={item.id} src={item.imageUrl} alt={item.caption || service.name} className="aspect-square rounded-[20px] object-cover" />
                ))}
              </div>
            )}
          </Section>

          <Section title="Reviews">
            {reviews.length === 0 ? <Empty text="No reviews yet." /> : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-[20px] border border-[var(--color-soft-border)] bg-[var(--color-fog)] p-4">
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
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[88px] lg:self-start">
          <div className="rounded-[28px] border border-[var(--color-border)] bg-white p-6 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
            <p className="text-xs font-semibold uppercase text-[var(--color-graphite)]">Price from</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-ink)]">{selectedPackage ? formatVnd(selectedPackage.price) : service.minPrice ? formatVnd(service.minPrice) : 'Contact'}</p>
            <div className="mt-5 rounded-[20px] bg-[var(--color-fog)] p-4">
              <h2 className="font-semibold text-[var(--color-ink)]">{service.studioName}</h2>
              <p className="mt-1 text-sm text-[var(--color-graphite)]">{service.addressLine || service.district || service.city}</p>
            </div>
            <button
              type="button"
              onClick={() => setBookingOpen(true)}
              disabled={!selectedPackage}
              className="primary-pill mt-5 h-12 w-full gap-2 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <CalendarDays className="h-4 w-4" /> {selectedPackage ? 'Request booking' : 'Select package'}
            </button>
            <Link to={`/photographers/${service.studioId}`} className="secondary-pill mt-3 h-11 w-full text-sm font-semibold">
              View studio
            </Link>
          </div>
          <div className="rounded-[24px] border border-[var(--color-border)] bg-white p-5">
            <div className="flex items-center gap-3">
              <Camera className="h-5 w-5 text-[var(--color-azure)]" />
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--color-graphite)]">Booking flow</p>
                <p className="text-sm font-medium text-[var(--color-slate)]">Request, studio confirmation, completion, review.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} service={service} />
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
