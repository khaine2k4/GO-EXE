import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, MessageCircle, Star, X } from 'lucide-react'
import { getStudioDetail } from '../services/studioApi'
import type { ServiceSummary, StudioDetail } from '../services/catalogTypes'
import { logAnalyticsEvent } from '../services/analyticsApi'

function formatVnd(value?: number) {
  if (!value) return 'Liên hệ'
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ'
}

export default function PhotographerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [studio, setStudio] = useState<StudioDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAllServices, setShowAllServices] = useState(false)
  const [showAllTags, setShowAllTags] = useState(false)
  const [portfolioVisible, setPortfolioVisible] = useState(12)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getStudioDetail(id)
      .then((data) => {
        setStudio(data)
        logAnalyticsEvent('VIEW_STUDIO', window.location.pathname, data.id).catch(() => {})
      })
      .catch(() => setError('Không tải được hồ sơ studio.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <StateBox text="Đang tải studio..." />
  if (error || !studio) return <StateBox text={error || 'Không tìm thấy studio.'} />

  const visibleServices = studio.services.slice(0, 4)
  const hiddenServices = studio.services.slice(3)
  const visiblePortfolio = studio.portfolio.slice(0, portfolioVisible)
  const quickTags = [
    ...Array.from(new Set(studio.services.map((service) => service.categoryName).filter(Boolean))).slice(0, 3),
    studio.city,
  ].filter(Boolean)
  const visibleTags = showAllTags ? quickTags : quickTags.slice(0, 2)
  const hasMoreTags = quickTags.length > 2
  const profileStats = [
    { value: `${studio.services.length}`, label: 'Dịch vụ' },
    { value: `${studio.portfolio.length}`, label: 'Ảnh portfolio' },
    { value: Number(studio.rating ?? 0).toFixed(1), label: 'Đánh giá' },
  ]

  return (
    <div className="space-y-8 pb-20">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-graphite)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </button>

      <section className="relative">
        <div className="relative h-80 overflow-hidden rounded-[28px] bg-slate-100 md:h-[420px]">
          {studio.coverUrl ? <img src={studio.coverUrl} alt={studio.name} className="h-full w-full object-cover" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </div>

        <div className="mx-auto -mt-16 max-w-5xl px-4">
          <div className="relative rounded-[28px] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 gap-5">
                <img
                  src={studio.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(studio.name)}`}
                  alt={studio.name}
                  className="h-24 w-24 shrink-0 rounded-full border-4 border-white bg-white object-cover shadow-md"
                />

                <div className="min-w-0 flex-1">
                  <div className="inline-flex max-w-full items-start gap-2">
                    <h1 className="min-w-0 text-3xl font-black leading-tight md:text-[42px]">{studio.name}</h1>
                    <span title="Studio đã xác minh" className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-azure)] text-white shadow-sm">
                      <BadgeCheck className="h-4 w-4" />
                    </span>
                  </div>

                  <p className="mt-2 max-w-2xl text-base font-semibold text-[var(--color-graphite)]">
                    {[studio.addressLine, studio.district, studio.city].filter(Boolean).join(', ') || 'Studio đang cập nhật địa chỉ'}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(visibleTags.length > 0 ? visibleTags : ['Studio chuyên nghiệp']).map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                        {tag}
                      </span>
                    ))}
                    {hasMoreTags && !showAllTags && (
                      <button type="button" onClick={() => setShowAllTags(true)} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700 transition hover:bg-slate-200">
                        ...
                      </button>
                    )}
                    {hasMoreTags && showAllTags && (
                      <button type="button" onClick={() => setShowAllTags(false)} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600 transition hover:bg-slate-200">
                        Thu gọn
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
                <p className="inline-flex h-11 min-w-[150px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-orange-50 px-4 text-sm font-bold leading-none text-[var(--color-orange)]">
                  <Star className="h-4 w-4 shrink-0 fill-[var(--color-orange)] text-[var(--color-orange)]" />
                  <span>{Number(studio.rating ?? 0).toFixed(1)} ({studio.reviewCount} đánh giá)</span>
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/chat?studioId=${studio.id}`)}
                  className="primary-pill h-11 gap-2 px-5 text-sm font-semibold"
                >
                  <MessageCircle className="h-4 w-4" /> Nhắn tin
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-100 pt-5">
              {profileStats.map((item) => (
                <div key={item.label}>
                  <p className="text-xl font-black text-slate-950">{item.value}</p>
                  <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(320px,4fr)]">
        <main className="space-y-8">
          <Section title="Giới thiệu">
            <p className="leading-7 text-[var(--color-graphite)]">{studio.description || 'Studio chưa cập nhật mô tả.'}</p>
          </Section>

          <Section title="Dịch vụ">
            {studio.services.length === 0 ? <Empty text="Studio chưa có dịch vụ công khai." /> : (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleServices.map((service, index) => (
                  index === 3 && hiddenServices.length > 1 ? (
                    <button
                      key="more-services"
                      type="button"
                      onClick={() => setShowAllServices(true)}
                      title={hiddenServices.map((item) => item.name).join(', ')}
                      className="rounded-[24px] border border-[var(--color-border)] bg-white p-5 text-left transition hover:border-[var(--color-azure)] hover:shadow-[var(--shadow-card)]"
                    >
                      <div className="text-3xl font-black text-[var(--color-azure)]">...</div>
                      <p className="mt-2 text-sm font-semibold text-[var(--color-graphite)]">Xem tất cả {studio.services.length} dịch vụ</p>
                    </button>
                  ) : (
                    <ServiceCard key={service.id} service={service} />
                  )
                ))}
              </div>
            )}
          </Section>

          <Section title="Portfolio">
            {studio.portfolio.length === 0 ? <Empty text="Studio chưa có ảnh portfolio." /> : (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {visiblePortfolio.map((item) => <img key={item.id} src={item.imageUrl} alt={item.caption || studio.name} className="aspect-square w-full rounded-[20px] object-cover" />)}
                </div>
                {portfolioVisible < studio.portfolio.length && (
                  <div className="pt-4 text-center">
                    <button type="button" onClick={() => setPortfolioVisible((count) => count + 12)} className="secondary-pill h-10 px-5 text-sm font-bold">
                      Xem thêm ảnh
                    </button>
                  </div>
                )}
              </>
            )}
          </Section>
        </main>

        <aside className="lg:sticky lg:top-[88px] lg:self-start">
          <Section title="Đánh giá">
            {studio.reviews.length === 0 ? <Empty text="Chưa có đánh giá." /> : (
              <div className="space-y-3">
                {studio.reviews.map((review) => (
                  <div key={review.id} className="rounded-[20px] bg-[var(--color-fog)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-[var(--color-ink)]">{review.customerName}</span>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-[var(--color-orange)]"><Star className="h-4 w-4 fill-current" /> {review.rating}</span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-graphite)]">{review.comment || 'Khách hàng chưa để lại nhận xét.'}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </aside>
      </div>

      {showAllServices && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] p-5">
              <h2 className="text-xl font-black text-[var(--color-ink)]">Tất cả dịch vụ</h2>
              <button type="button" onClick={() => setShowAllServices(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-fog)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid max-h-[70vh] gap-4 overflow-y-auto p-5 md:grid-cols-2">
              {studio.services.map((service) => <ServiceCard key={service.id} service={service} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ServiceCard({ service }: { service: ServiceSummary }) {
  return (
    <Link to={`/photosets/${service.id}`} className="rounded-[24px] border border-[var(--color-border)] bg-white p-5 transition hover:border-[var(--color-azure)] hover:shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-[var(--color-ink)]">{service.name}</h3>
          <p className="mt-1 text-sm font-medium text-[var(--color-graphite)]">{service.categoryName}</p>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-[var(--color-orange)]">
          <Star className="h-4 w-4 fill-[var(--color-orange)] text-[var(--color-orange)]" /> {service.rating}
        </span>
      </div>
      <p className="mt-4 text-lg font-black text-[var(--color-azure)]">Từ {formatVnd(service.minPrice)}</p>
    </Link>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-[24px] border border-[var(--color-border)] bg-white p-6"><h2 className="mb-4 text-2xl font-bold">{title}</h2>{children}</section>
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-[20px] border border-dashed border-[var(--color-border)] p-6 text-center text-sm font-medium text-[var(--color-graphite)]">{text}</div>
}

function StateBox({ text }: { text: string }) {
  return <div className="surface-card border-dashed p-12 text-center text-sm font-medium text-[var(--color-graphite)]">{text}</div>
}
