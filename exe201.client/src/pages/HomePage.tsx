import { Camera, CheckCircle2, Search, Shield, Sparkles, Star, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getCategories } from '../services/categoryApi'
import { getServices } from '../services/serviceApi'
import type { Category, ServiceSummary } from '../services/catalogTypes'

const BENEFITS = [
  { icon: CheckCircle2, title: 'Studio đã duyệt', desc: 'Hồ sơ có thông tin liên hệ, dịch vụ và portfolio rõ ràng.' },
  { icon: Camera, title: 'Ảnh thật dễ so sánh', desc: 'Xem phong cách chụp trước khi gửi yêu cầu đặt lịch.' },
  { icon: Shield, title: 'Gói chụp minh bạch', desc: 'Giá, đánh giá và quy trình xác nhận hiển thị rõ.' },
]

const QUICK_FILTERS = ['Cưới', 'Chân dung', 'Sự kiện', 'Sản phẩm', 'Đà Nẵng', 'Dưới 1 triệu']

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=900&q=80',
]

export default function HomePage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleServiceCount, setVisibleServiceCount] = useState(6)

  useEffect(() => {
    Promise.allSettled([getCategories(), getServices()])
      .then(([categoryResult, serviceResult]) => {
        if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value)
        if (serviceResult.status === 'fulfilled') setServices(serviceResult.value)
      })
      .finally(() => setLoading(false))
  }, [])

  const featuredServices = useMemo(() => {
    const norm = keyword.trim().toLowerCase()
    return services
      .filter((service) => !norm || `${service.name} ${service.studioName} ${service.city} ${service.categoryName}`.toLowerCase().includes(norm))
  }, [keyword, services])

  const visibleFeaturedServices = featuredServices.slice(0, visibleServiceCount)

  const heroImages = useMemo(() => {
    const apiImages = services.map((service) => service.thumbnailUrl).filter(Boolean) as string[]
    return [...apiImages, ...FALLBACK_IMAGES].slice(0, 4)
  }, [services])

  function submitSearch() {
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('keyword', keyword.trim())
    if (categoryId) params.set('categoryId', categoryId)
    if (maxPrice) params.set('maxPrice', maxPrice)
    navigate(`/photosets${params.toString() ? `?${params.toString()}` : ''}`)
  }

  function applyQuickFilter(value: string) {
    if (value === 'Đà Nẵng') {
      setKeyword('Đà Nẵng')
      return
    }
    if (value === 'Dưới 1 triệu') {
      setMaxPrice('1000000')
      return
    }
    setKeyword(value)
  }

  return (
    <div className="space-y-20 pb-16">
      <section className="relative overflow-hidden bg-white py-6 md:py-10">
        <div className="grid items-center gap-10 xl:grid-cols-[1fr_0.9fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[var(--color-slate)] shadow-sm ring-1 ring-[var(--color-border)]">
              <Sparkles className="h-4 w-4 text-[var(--color-azure)]" />
              Marketplace đặt lịch studio tại Đà Nẵng
            </div>

            <div>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl text-[38px] font-black uppercase leading-[1.04] text-[var(--color-ink)] sm:text-[48px] lg:text-[60px]"
              >
                Tìm Studio Phù Hợp Cho Từng Khoảnh Khắc
              </motion.h1>
              <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-[var(--color-graphite)] sm:text-lg">
                Tìm kiếm, so sánh portfolio, chọn gói chụp và gửi yêu cầu booking cho studio bạn tin tưởng.
              </p>
            </div>

            <div className="rounded-[28px] border border-[var(--color-border)] bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
              <div className="grid gap-3 lg:grid-cols-[minmax(230px,1.45fr)_minmax(160px,0.85fr)_minmax(140px,0.7fr)_auto] lg:items-center">
                <label className="flex h-12 items-center gap-3 rounded-full bg-[var(--color-fog)] px-4">
                  <Search className="h-5 w-5 shrink-0 text-[var(--color-graphite)]" />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Tìm studio, dịch vụ, phong cách hoặc khu vực"
                    className="min-w-0 w-full bg-transparent text-sm font-medium text-[var(--color-ink)] outline-none placeholder:text-slate-400"
                  />
                </label>
                <Dropdown
                  value={categoryId}
                  placeholder="Tất cả danh mục"
                  options={categories.map((category) => ({ value: String(category.id), label: category.name }))}
                  onChange={setCategoryId}
                />
                <Dropdown
                  value={maxPrice}
                  placeholder="Khoảng giá"
                  options={[
                    { value: '1000000', label: 'Dưới 1 triệu' },
                    { value: '3000000', label: 'Dưới 3 triệu' },
                    { value: '5000000', label: 'Dưới 5 triệu' },
                  ]}
                  onChange={setMaxPrice}
                />
                <button type="button" onClick={submitSearch} className="primary-pill h-12 w-12 text-sm font-semibold" aria-label="Tìm kiếm">
                  <Search className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 px-1">
                {QUICK_FILTERS.map((item) => (
                  <button key={item} type="button" onClick={() => applyQuickFilter(item)} className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-slate)] hover:border-[var(--color-azure)] hover:text-[var(--color-azure)]">
                    {item}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <HeroCollage images={heroImages} />
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-3 md:grid-cols-3">
        {BENEFITS.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="surface-card p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-fog)] text-[var(--color-azure)]">
              <step.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-bold">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-graphite)]">{step.desc}</p>
          </motion.div>
        ))}
      </section>

      <section className="space-y-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="text-sm font-semibold uppercase text-[var(--color-azure)]">Dịch vụ nổi bật</div>
            <h2 className="mt-2 text-4xl font-bold">Khám phá studio được khách hàng tin chọn</h2>
            <p className="mt-3 max-w-2xl text-[var(--color-graphite)]">
              Xem portfolio, gói chụp, giá và đánh giá trước khi gửi yêu cầu booking.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="surface-card p-12 text-center text-sm font-medium text-[var(--color-graphite)]">Đang tải dịch vụ nổi bật...</div>
        ) : featuredServices.length === 0 ? (
          <div className="surface-card border-dashed py-20 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <div className="mt-4 font-semibold text-[var(--color-graphite)]">Không tìm thấy dịch vụ phù hợp.</div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleFeaturedServices.map((service) => (
                <ServiceCard key={service.id} service={service} onClick={() => navigate(`/photosets/${service.id}`)} />
              ))}
            </div>
            {visibleServiceCount < featuredServices.length && (
              <div className="pt-2 text-center">
                <button type="button" onClick={() => setVisibleServiceCount((count) => count + 6)} className="secondary-pill h-11 px-6 text-sm font-bold">
                  Xem thêm
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="overflow-hidden rounded-[28px] bg-[var(--color-azure)] p-8 text-white sm:p-10">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="text-sm font-semibold uppercase text-white/80">Dành cho studio</div>
            <h2 className="mt-3 max-w-3xl text-3xl font-bold text-white sm:text-4xl">
              Quản lý dịch vụ, gói chụp, portfolio, booking và doanh thu trong một dashboard rõ ràng.
            </h2>
          </div>
          <Link to="/register" className="inline-flex h-14 items-center justify-center rounded-full bg-[var(--color-orange)] px-8 text-base font-black text-white transition hover:bg-[var(--color-orange-dark)]">
            Đăng ký Studio
          </Link>
        </div>
      </section>
    </div>
  )
}

function HeroCollage({ images }: { images: string[] }) {
  return (
    <div className="grid min-h-[480px] grid-cols-[1.15fr_0.85fr] grid-rows-6 gap-4">
      <SafeImage src={images[0]} fallback={FALLBACK_IMAGES[0]} alt="Wedding photography service" className="row-span-6 h-full w-full rounded-[28px] object-cover" />
      <SafeImage src={images[1]} fallback={FALLBACK_IMAGES[1]} alt="Portrait studio session" className="row-span-2 h-full w-full rounded-[28px] object-cover" />
      <SafeImage src={images[2]} fallback={FALLBACK_IMAGES[2]} alt="Event photography booking" className="row-span-2 h-full w-full rounded-[28px] object-cover" />
      <div className="relative row-span-2 overflow-hidden rounded-[28px] bg-black">
        <SafeImage src={images[3]} fallback={FALLBACK_IMAGES[3]} alt="Product photography studio" className="h-full w-full object-cover opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 rounded-[20px] border border-white/20 bg-white/15 p-4 text-white backdrop-blur-xl">
          <div className="text-xs font-semibold uppercase text-white/75">Gói được đặt nhiều nhất</div>
          <div className="mt-1 text-base font-semibold leading-snug text-white">Chọn gói phù hợp và chờ studio xác nhận lịch chụp.</div>
        </div>
      </div>
    </div>
  )
}

function ServiceCard({ service, onClick }: { service: ServiceSummary; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group flex h-full min-h-[560px] flex-col overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]">
      <div className="aspect-[4/3] shrink-0 overflow-hidden bg-slate-100">
        <SafeImage src={service.thumbnailUrl || FALLBACK_IMAGES[0]} fallback={FALLBACK_IMAGES[0]} alt={service.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col space-y-4 p-5">
        <div className="flex min-h-[72px] items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-xl font-semibold text-[var(--color-ink)]">{service.name}</h3>
            <p className="mt-1 text-sm font-medium text-[var(--color-graphite)]">{service.studioName}</p>
          </div>
          <span className="max-w-[130px] shrink-0 rounded-full bg-[var(--color-fog)] px-3 py-1 text-center text-xs font-semibold leading-4 text-[var(--color-slate)]">{service.categoryName}</span>
        </div>
        <p className="line-clamp-3 min-h-[66px] text-sm text-[var(--color-graphite)]">{service.description || 'Xem portfolio, gói chụp và thông tin đặt lịch của dịch vụ này.'}</p>
        <div className="flex items-center justify-between border-t border-[var(--color-soft-border)] pt-4">
          <PriceBlock value={service.minPrice} compact />
          <span className="inline-flex items-center gap-1 text-sm font-bold text-[var(--color-orange)]">
            <Star className="h-4 w-4 fill-[var(--color-orange)] text-[var(--color-orange)]" /> {service.rating?.toFixed?.(1) ?? service.rating} ({service.reviewCount})
          </span>
        </div>
      </div>
    </button>
  )
}

function SafeImage({ src, fallback, alt, className }: { src: string; fallback: string; alt: string; className: string }) {
  return <img src={src || fallback} alt={alt} className={className} loading="lazy" onError={(event) => { event.currentTarget.src = fallback }} />
}

function PriceBlock({ value, compact = false }: { value?: number; compact?: boolean }) {
  if (!value) return <span className="text-2xl font-semibold text-[var(--color-azure)]">Liên hệ</span>
  return (
    <span className={`price-block ${compact ? 'price-block-card' : ''}`}>
      <span className="price-block-label">Từ</span>
      <span className="price-block-value">{formatVnd(value)}</span>
    </span>
  )
}

function Dropdown({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string
  placeholder: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((state) => !state)} className="flex h-12 w-full items-center justify-between gap-3 rounded-full bg-[var(--color-fog)] px-4 text-left text-sm font-medium text-[var(--color-ink)]">
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <span className="text-xs text-slate-500">⌄</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-1 shadow-xl">
          <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-[var(--color-fog)]">
            {placeholder}
          </button>
          {options.map((option) => (
            <button key={option.value} type="button" onClick={() => { onChange(option.value); setOpen(false) }} className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium ${option.value === value ? 'bg-blue-50 text-[var(--color-azure)]' : 'text-slate-700 hover:bg-[var(--color-fog)]'}`}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function formatVnd(value?: number) {
  if (!value) return 'Liên hệ'
  return new Intl.NumberFormat('vi-VN').format(value) + ' vnd'
}
