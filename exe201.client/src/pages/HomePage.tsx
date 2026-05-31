import { Camera, CheckCircle2, ChevronDown, Search, Shield, Sparkles, Star, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

const pageEase = [0.22, 1, 0.36, 1] as const
const revealTransition = { duration: 0.85, ease: pageEase }
const cardRevealTransition = { duration: 0.78, ease: pageEase }

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
      <section className="relative bg-white py-6 md:py-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1.3fr_0.7fr] xl:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[var(--color-slate)] shadow-sm ring-1 ring-[var(--color-border)]">
              <Sparkles className="h-4 w-4 text-[var(--color-azure)]" />
              Marketplace đặt lịch studio tại Đà Nẵng
            </div>

            <div>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...revealTransition, delay: 0.12 }}
                className="max-w-3xl text-[38px] font-black uppercase leading-[1.04] text-[var(--color-ink)] sm:text-[48px] lg:text-[60px]"
              >
                Tìm Studio Phù Hợp Cho Từng Khoảnh Khắc
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...revealTransition, delay: 0.28 }}
                className="mt-6 max-w-2xl text-base font-medium leading-7 text-[var(--color-graphite)] sm:text-lg"
              >
                Tìm kiếm, so sánh portfolio, chọn gói chụp và gửi yêu cầu booking cho studio bạn tin tưởng.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...revealTransition, delay: 0.42 }}
              className="rounded-[28px] border border-[var(--color-border)] bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.06)]"
            >
              <div className="grid gap-3 lg:grid-cols-[minmax(270px,1.7fr)_minmax(190px,1.1fr)_minmax(120px,0.6fr)_auto] lg:items-center">
                <label className="flex h-12 items-center gap-2 rounded-full bg-[var(--color-fog)] px-3">
                  <Search className="h-4 w-4 shrink-0 text-[var(--color-graphite)]" />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Tìm dịch vụ, studio..."
                    className="min-w-0 w-full bg-transparent text-[13px] font-medium text-[var(--color-ink)] outline-none placeholder:text-slate-400"
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
            </motion.div>

          </div>

          <HeroBanner image={FALLBACK_IMAGES[3]} />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {BENEFITS.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...cardRevealTransition, delay: index * 0.16 }}
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
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ ...revealTransition, delay: 0.08 }}
          className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
        >
          <div>
            <div className="text-sm font-semibold uppercase text-[var(--color-azure)]">Dịch vụ nổi bật</div>
            <h2 className="mt-2 text-4xl font-bold">Khám phá studio được khách hàng tin chọn</h2>
            <p className="mt-3 max-w-2xl text-[var(--color-graphite)]">
              Xem portfolio, gói chụp, giá và đánh giá trước khi gửi yêu cầu booking.
            </p>
          </div>
        </motion.div>

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
              {visibleFeaturedServices.map((service, index) => (
                <ServiceCard key={service.id} service={service} index={index} onClick={() => navigate(`/photosets/${service.id}`)} />
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

function HeroBanner({ image }: { image: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, ease: pageEase, delay: 0.28 }}
      className="relative h-[480px] w-full overflow-hidden rounded-[28px] shadow-lg group"
    >
      <SafeImage
        src={image || FALLBACK_IMAGES[0]}
        fallback={FALLBACK_IMAGES[0]}
        alt="Creative Studio Banner"
        className="h-full w-full object-cover transition-transform duration-10000 ease-out group-hover:scale-105"
      />
      {/* Premium Glass Card Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute bottom-6 left-6 right-6 rounded-[24px] border border-white/20 bg-white/10 p-5 text-white backdrop-blur-xl transition-all duration-700 hover:bg-white/15">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Gợi ý từ GO!</span>
        </div>
        <h3 className="mt-2 text-base font-bold leading-snug">
          Chọn gói chụp phù hợp nhất và gửi yêu cầu đặt lịch nhanh chóng đến Studio tin cậy.
        </h3>
      </div>
    </motion.div>
  )
}

function ServiceCard({ service, index, onClick }: { service: ServiceSummary; index: number; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ ...cardRevealTransition, delay: Math.min(index, 5) * 0.1 }}
      className="group flex h-full min-h-[560px] flex-col overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white text-left shadow-sm transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]"
    >
      <div className="aspect-[4/3] shrink-0 overflow-hidden bg-slate-100">
        <SafeImage src={service.thumbnailUrl || FALLBACK_IMAGES[0]} fallback={FALLBACK_IMAGES[0]} alt={service.name} className="h-full w-full object-cover transition duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105" />
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
    </motion.button>
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
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="flex h-12 w-full items-center justify-between gap-2 rounded-full bg-[var(--color-fog)] px-3 text-left text-[13px] font-semibold text-[var(--color-ink)] transition-colors hover:bg-slate-100"
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-slate-400 transition-transform"
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transitionDuration: '360ms',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-1 shadow-xl origin-top"
          >
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="block w-full rounded-xl px-3 py-2 text-left text-[13px] font-medium text-slate-600 hover:bg-[var(--color-fog)] transition-colors duration-200"
            >
              {placeholder}
            </button>
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={`block w-full rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors duration-200 ${
                  option.value === value ? 'bg-blue-50 text-[var(--color-azure)]' : 'text-slate-700 hover:bg-[var(--color-fog)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function formatVnd(value?: number) {
  if (!value) return 'Liên hệ'
  return new Intl.NumberFormat('vi-VN').format(value) + ' vnd'
}
