import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Camera, Check, MapPin, Star } from 'lucide-react'
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
        setReviews(await getStudioReviews(data.studioId))
      })
      .catch(() => setError('Khong the tai chi tiet dich vu.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <StateBox text="Dang tai chi tiet dich vu..." />
  if (error || !service) return <StateBox text={error || 'Khong tim thay dich vu.'} />

  const images = [service.thumbnailUrl, ...service.images, ...service.portfolio.map((item) => item.imageUrl)].filter(Boolean) as string[]

  return (
    <div className="space-y-8 pb-20">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" /> Quay lai
      </button>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
        <div className="relative aspect-[16/7] bg-slate-100">
          {images[0] ? <img src={images[0]} alt={service.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400">No image</div>}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase backdrop-blur">{service.categoryName}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {service.rating} ({service.reviewCount})
              </span>
            </div>
            <h1 className="text-3xl font-black md:text-5xl">{service.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-white/85"><MapPin className="h-4 w-4" /> {service.city || service.addressLine || 'Da Nang'}</p>
          </div>
        </div>
        <div className="grid gap-8 p-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <Section title="Thong tin dich vu">
              <p className="leading-7 text-slate-600">{service.description || 'Studio chua cap nhat mo ta dich vu.'}</p>
            </Section>

            <Section title="Goi chup">
              {service.packages.length === 0 ? <Empty text="Chua co goi chup active." /> : (
                <div className="grid gap-4 md:grid-cols-2">
                  {service.packages.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-black text-slate-950">{item.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                        </div>
                        <span className="text-sm font-black text-indigo-600">{formatVnd(item.price)}</span>
                      </div>
                      <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-600">
                        {item.durationHours && <span><Check className="mr-2 inline h-4 w-4 text-emerald-600" />{item.durationHours} gio chup</span>}
                        {item.maxPhotos && <span><Check className="mr-2 inline h-4 w-4 text-emerald-600" />{item.maxPhotos} anh</span>}
                        {item.inclusions && <span><Check className="mr-2 inline h-4 w-4 text-emerald-600" />{item.inclusions}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Portfolio">
              {service.portfolio.length === 0 ? <Empty text="Chua co anh portfolio." /> : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {service.portfolio.map((item) => (
                    <img key={item.id} src={item.imageUrl} alt={item.caption || service.name} className="aspect-square rounded-2xl object-cover" />
                  ))}
                </div>
              )}
            </Section>

            <Section title="Danh gia">
              {reviews.length === 0 ? <Empty text="Chua co review." /> : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-950">{review.customerName}</span>
                        <span className="inline-flex items-center gap-1 text-sm font-black text-amber-500"><Star className="h-4 w-4 fill-current" /> {review.rating}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{review.comment || 'Khong co binh luan.'}</p>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-black text-slate-950">{service.studioName}</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">{service.addressLine || service.district || service.city}</p>
              <Link to={`/photographers/${service.studioId}`} className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-950 text-xs font-black uppercase tracking-widest text-white">
                Xem studio
              </Link>
              <button
                type="button"
                onClick={() => setBookingOpen(true)}
                disabled={service.packages.length === 0}
                className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-xs font-black uppercase tracking-widest text-white disabled:bg-slate-300"
              >
                <CalendarDays className="h-4 w-4" /> Đặt lịch
              </button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <Camera className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Gia tu</p>
                  <p className="text-xl font-black text-indigo-600">{service.minPrice ? formatVnd(service.minPrice) : 'Lien he'}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} service={service} />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-100 bg-white p-5"><h2 className="mb-4 text-xl font-black text-slate-950">{title}</h2>{children}</section>
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400">{text}</div>
}

function StateBox({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-500">{text}</div>
}
