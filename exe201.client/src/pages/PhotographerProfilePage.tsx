import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Star } from 'lucide-react'
import { getStudioDetail } from '../services/studioApi'
import type { StudioDetail } from '../services/catalogTypes'

function formatVnd(value?: number) {
  if (!value) return 'Lien he'
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
      .catch(() => setError('Khong the tai thong tin studio.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <StateBox text="Dang tai studio..." />
  if (error || !studio) return <StateBox text={error || 'Khong tim thay studio.'} />

  return (
    <div className="space-y-8 pb-20">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" /> Quay lai
      </button>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
        <div className="relative h-72 bg-slate-100">
          {studio.coverUrl && <img src={studio.coverUrl} alt={studio.name} className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
          <div className="absolute bottom-6 left-6 flex items-end gap-5 text-white">
            <img src={studio.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(studio.name)}`} alt={studio.name} className="h-24 w-24 rounded-3xl border-4 border-white bg-white object-cover" />
            <div>
              <h1 className="text-4xl font-black">{studio.name}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-white/85"><MapPin className="h-4 w-4" /> {[studio.addressLine, studio.district, studio.city].filter(Boolean).join(', ')}</p>
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-black backdrop-blur"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {studio.rating} ({studio.reviewCount} reviews)</p>
            </div>
          </div>
        </div>
        <div className="grid gap-8 p-6 lg:grid-cols-[1fr_360px]">
          <main className="space-y-8">
            <Section title="Gioi thieu">
              <p className="leading-7 text-slate-600">{studio.description || 'Studio chua cap nhat mo ta.'}</p>
            </Section>
            <Section title="Dich vu">
              {studio.services.length === 0 ? <Empty text="Chua co dich vu public." /> : (
                <div className="grid gap-4 md:grid-cols-2">
                  {studio.services.map((service) => (
                    <Link key={service.id} to={`/photosets/${service.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200">
                      <h3 className="font-black text-slate-950">{service.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{service.categoryName}</p>
                      <p className="mt-3 text-sm font-black text-indigo-600">Tu {formatVnd(service.minPrice)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </Section>
            <Section title="Portfolio">
              {studio.portfolio.length === 0 ? <Empty text="Chua co portfolio." /> : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {studio.portfolio.map((item) => <img key={item.id} src={item.imageUrl} alt={item.caption || studio.name} className="aspect-square rounded-2xl object-cover" />)}
                </div>
              )}
            </Section>
          </main>
          <aside>
            <Section title="Reviews">
              {studio.reviews.length === 0 ? <Empty text="Chua co review." /> : (
                <div className="space-y-3">
                  {studio.reviews.map((review) => (
                    <div key={review.id} className="rounded-2xl bg-slate-50 p-4">
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
          </aside>
        </div>
      </div>
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
