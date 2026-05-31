import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Camera,
  ChevronDown,
  CreditCard,
  Images,
  MapPin,
  Search,
  Shield,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Galaxy from '../components/Galaxy'
import { getCategories } from '../services/categoryApi'
import { getServices } from '../services/serviceApi'
import type { Category, ServiceSummary } from '../services/catalogTypes'
import { useAppStore } from '../store/AppStore'

const BENEFITS = [
  {
    icon: BadgeCheck,
    title: 'Studio đã duyệt',
    desc: 'Hồ sơ, portfolio, gói chụp và thông tin dịch vụ được trình bày rõ để khách dễ so sánh.',
  },
  {
    icon: Images,
    title: 'Ảnh thật dễ chọn',
    desc: 'Xem phong cách chụp, album mẫu và đánh giá trước khi gửi yêu cầu booking.',
  },
  {
    icon: Shield,
    title: 'Thanh toán minh bạch',
    desc: 'Quy trình đặt lịch, xác nhận, thanh toán và theo dõi booking nằm trong một hệ thống.',
  },
]

const PROCESS = [
  { icon: Search, title: 'Tìm studio', desc: 'Lọc theo dịch vụ, khu vực, ngân sách và phong cách chụp.' },
  { icon: CalendarDays, title: 'Chọn lịch', desc: 'Xem gói chụp, ngày trống và gửi yêu cầu booking.' },
  { icon: CreditCard, title: 'Thanh toán', desc: 'Hoàn tất thanh toán, chờ studio xác nhận và theo dõi tiến độ.' },
  { icon: Camera, title: 'Nhận ảnh', desc: 'Hoàn thành buổi chụp, đánh giá studio và lưu lại trải nghiệm.' },
]

const QUICK_FILTERS = ['Cưới', 'Chân dung', 'Sự kiện', 'Sản phẩm', 'Đà Nẵng', 'Dưới 1 triệu']

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=900&q=80',
]

const FALLBACK_SERVICES: ServiceSummary[] = [
  {
    id: -1,
    studioId: -1,
    studioName: 'GO! Wedding Studio',
    categoryId: -1,
    categoryName: 'Cưới',
    name: 'Gói ảnh cưới ngoại cảnh Đà Nẵng',
    description: 'Concept tự nhiên, lịch chụp linh hoạt và bộ ảnh chỉnh màu đồng nhất cho cặp đôi.',
    thumbnailUrl: FALLBACK_IMAGES[0],
    city: 'Đà Nẵng',
    isActive: true,
    minPrice: 2500000,
    maxPrice: 5200000,
    rating: 4.9,
    reviewCount: 128,
  },
  {
    id: -2,
    studioId: -2,
    studioName: 'Portrait Lab',
    categoryId: -2,
    categoryName: 'Chân dung',
    name: 'Ảnh cá nhân và profile chuyên nghiệp',
    description: 'Phù hợp CV, thương hiệu cá nhân, mạng xã hội và profile doanh nghiệp.',
    thumbnailUrl: FALLBACK_IMAGES[1],
    city: 'Đà Nẵng',
    isActive: true,
    minPrice: 850000,
    maxPrice: 1800000,
    rating: 4.8,
    reviewCount: 96,
  },
  {
    id: -3,
    studioId: -3,
    studioName: 'Event Frame',
    categoryId: -3,
    categoryName: 'Sự kiện',
    name: 'Chụp sự kiện, khai trương và hội nghị',
    description: 'Ghi lại khoảnh khắc quan trọng, bàn giao ảnh nhanh và đầy đủ timeline.',
    thumbnailUrl: FALLBACK_IMAGES[3],
    city: 'Đà Nẵng',
    isActive: true,
    minPrice: 1800000,
    maxPrice: 4500000,
    rating: 4.7,
    reviewCount: 74,
  },
]

const pageEase = [0.22, 1, 0.36, 1] as const
const revealTransition = { duration: 0.85, ease: pageEase }
const cardRevealTransition = { duration: 0.72, ease: pageEase }

export default function HomePage() {
  const navigate = useNavigate()
  const { state } = useAppStore()
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleServiceCount, setVisibleServiceCount] = useState(6)
  const user = state.currentUser
  const role = String(user?.role ?? '')
  const isLoggedIn = Boolean(user)
  const isStudio = role === 'PHOTOGRAPHER' || role === 'STUDIO_OWNER'
  const isAdmin = role === 'ADMIN'
  const firstName = user?.name?.split(' ')[0] || user?.name || ''

  const heroBadge = isLoggedIn
    ? `Chào ${firstName}, hôm nay bạn muốn chụp gì?`
    : 'Marketplace đặt lịch studio tại Đà Nẵng'
  const heroTitle = isLoggedIn
    ? isStudio
      ? 'Quản lý studio và booking trong một nơi'
      : 'Bạn muốn đặt studio cho khoảnh khắc nào?'
    : 'Tìm studio phù hợp cho từng khoảnh khắc'
  const heroDescription = isLoggedIn
    ? isStudio
      ? 'Theo dõi yêu cầu booking, dịch vụ, portfolio và doanh thu studio từ dashboard của bạn.'
      : 'Tiếp tục tìm dịch vụ, xem lịch trống, gửi yêu cầu booking và theo dõi các lịch chụp của bạn.'
    : 'Xem portfolio, so sánh gói chụp, kiểm tra giá và gửi yêu cầu booking cho studio bạn tin tưởng trong cùng một nơi.'
  const primaryHref = isAdmin ? '/admin/dashboard' : isStudio ? '/photographer/dashboard' : '/photosets'
  const primaryLabel = isAdmin ? 'Mở Admin' : isStudio ? 'Mở Dashboard' : 'Tìm studio ngay'
  const secondaryHref = isLoggedIn
    ? isAdmin
      ? '/admin/users'
      : isStudio
        ? '/photosets'
        : '/customer/bookings'
    : '/register'
  const secondaryLabel = isLoggedIn
    ? isAdmin
      ? 'Quản lý user'
      : isStudio
        ? 'Xem marketplace'
        : 'Booking của tôi'
    : 'Đăng ký Studio'
  const bottomCtaEyebrow = isLoggedIn ? (isStudio ? 'Không gian studio' : 'Không gian của bạn') : 'Dành cho studio'
  const bottomCtaTitle = isLoggedIn
    ? isStudio
      ? 'Mở dashboard để quản lý lịch chụp, dịch vụ, portfolio và doanh thu studio.'
      : 'Theo dõi các booking, xem trạng thái thanh toán và tiếp tục tìm studio phù hợp.'
    : 'Quản lý dịch vụ, portfolio, lịch chụp, booking và doanh thu trong một dashboard rõ ràng.'
  const bottomCtaDescription = isLoggedIn
    ? isStudio
      ? 'Dashboard giúp bạn xử lý yêu cầu mới, cập nhật lịch làm việc và kiểm soát hoạt động studio rõ ràng hơn.'
      : 'Tất cả yêu cầu đặt lịch, thanh toán và lịch sử chụp của bạn được gom trong một nơi dễ theo dõi.'
    : 'Tạo hồ sơ studio, đăng gói chụp, nhận yêu cầu và theo dõi thanh toán mà không phải gom dữ liệu từ nhiều nơi.'

  useEffect(() => {
    Promise.allSettled([getCategories(), getServices()])
      .then(([categoryResult, serviceResult]) => {
        if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value)
        if (serviceResult.status === 'fulfilled') setServices(serviceResult.value)
      })
      .finally(() => setLoading(false))
  }, [])

  const serviceSource = services.length > 0 ? services : FALLBACK_SERVICES
  const featuredServices = useMemo(() => {
    const norm = keyword.trim().toLowerCase()
    return serviceSource.filter((service) => {
      const text = `${service.name} ${service.studioName} ${service.city} ${service.categoryName}`.toLowerCase()
      const matchesKeyword = !norm || text.includes(norm)
      const matchesCategory = !categoryId || String(service.categoryId) === categoryId
      const matchesPrice = !maxPrice || Number(service.minPrice || 0) <= Number(maxPrice)
      return matchesKeyword && matchesCategory && matchesPrice
    })
  }, [categoryId, keyword, maxPrice, serviceSource])

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
    <div className="space-y-16 pb-16">
      <section className="relative isolate -mx-4 overflow-hidden rounded-[32px] bg-slate-950 px-5 py-10 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:-mx-6 sm:px-8 sm:py-12 lg:min-h-[520px] lg:px-12">
        <Galaxy
          aria-hidden="true"
          className="absolute inset-0"
          density={1.25}
          focal={[0.5, 0.46]}
          glowIntensity={0.46}
          hueShift={198}
          mouseInteraction
          mouseRepulsion
          repulsionStrength={1.5}
          rotationSpeed={0.028}
          saturation={0.2}
          speed={0.68}
          starSpeed={0.34}
          style={{ transform: 'scale(1.16)', transformOrigin: 'center center' }}
          twinkleIntensity={0.52}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(2,6,23,0.34) 0%, rgba(2,6,23,0.06) 42%, rgba(2,6,23,0.48) 100%), radial-gradient(circle at 50% 52%, rgba(255,255,255,0.1), transparent 34%), linear-gradient(135deg, rgba(0,74,173,0.22), rgba(255,117,31,0.1) 62%, rgba(15,23,42,0.24))',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.24) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...revealTransition, delay: 0.08 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/84 backdrop-blur-xl"
          >
            <Sparkles className="h-4 w-4 text-[var(--color-orange)]" />
            {heroBadge}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...revealTransition, delay: 0.18 }}
            className="mt-5 max-w-5xl text-[38px] font-black uppercase leading-[1.02] text-white sm:text-[52px] lg:text-[64px]"
            style={{
              textShadow: '0 8px 36px rgba(2, 6, 23, 0.92), 0 2px 12px rgba(2, 6, 23, 0.72)',
            }}
          >
            {heroTitle}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...revealTransition, delay: 0.32 }}
            className="mt-4 max-w-2xl text-base font-medium leading-7 text-white/76 sm:text-lg"
          >
            {heroDescription}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...revealTransition, delay: 0.44 }}
            className="mt-6 flex flex-wrap justify-center gap-3"
          >
            <Link to={primaryHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-black text-slate-950 shadow-lg shadow-black/10 transition hover:bg-slate-100">
              {primaryLabel} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to={secondaryHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/22 bg-white/10 px-6 text-sm font-black text-white backdrop-blur-xl transition hover:bg-white/16">
              {secondaryLabel}
            </Link>
          </motion.div>

        </div>
      </section>

      <section className="relative z-20 -mx-4 -mt-12 space-y-5 sm:-mx-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...revealTransition, delay: 0.54 }}
          className="w-full rounded-[28px] border border-[var(--color-border)] bg-white p-3 text-left shadow-[0_20px_60px_rgba(15,23,42,0.14)]"
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.5fr)_minmax(180px,1fr)_minmax(150px,0.8fr)_auto] lg:items-center">
            <label className="flex h-12 items-center gap-2 rounded-full bg-[var(--color-fog)] px-4 text-slate-950">
              <Search className="h-4 w-4 shrink-0 text-[var(--color-azure)]" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') submitSearch()
                }}
                placeholder="Tìm dịch vụ, studio..."
                className="min-w-0 w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
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
            <button type="button" onClick={submitSearch} className="flex h-12 items-center justify-center rounded-full bg-[var(--color-orange)] px-6 text-sm font-black text-white transition hover:bg-[var(--color-orange-dark)]">
              Tìm kiếm
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 px-1">
            {QUICK_FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => applyQuickFilter(item)}
                className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-slate)] transition hover:border-[var(--color-azure)] hover:text-[var(--color-azure)]"
              >
                {item}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid w-full grid-cols-3 gap-3 text-left">
          {[
            ['120+', 'studio và dịch vụ'],
            ['4.8/5', 'đánh giá trung bình'],
            ['24h', 'theo dõi yêu cầu'],
          ].map(([value, label], index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...cardRevealTransition, delay: 0.64 + index * 0.08 }}
              className="rounded-[20px] border border-[var(--color-border)] bg-white p-4 shadow-sm"
            >
              <div className="text-2xl font-black text-[var(--color-ink)]">{value}</div>
              <div className="mt-1 text-xs font-semibold text-[var(--color-graphite)]">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="features" className="grid gap-5 md:grid-cols-3">
        {BENEFITS.map((item, index) => (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ ...cardRevealTransition, delay: index * 0.12 }}
            className="surface-card p-5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[var(--color-azure)]">
              <item.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-lg font-black text-[var(--color-ink)]">{item.title}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[var(--color-graphite)]">{item.desc}</p>
          </motion.article>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={revealTransition}
        >
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--color-azure)]">Quy trình booking</p>
          <h2 className="mt-3 max-w-xl text-4xl font-black leading-tight text-[var(--color-ink)]">
            Từ tìm kiếm đến thanh toán, mọi bước đều gọn trong một luồng.
          </h2>
          <p className="mt-4 max-w-lg text-base font-medium leading-7 text-[var(--color-graphite)]">
            GO! giúp khách đặt lịch nhanh hơn, còn studio quản lý yêu cầu, lịch chụp và doanh thu rõ ràng hơn.
          </p>
          <Link to="/register" className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-azure)] px-5 text-sm font-black text-white transition hover:bg-[var(--color-azure-dark)]">
            Bắt đầu với GO! <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {PROCESS.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ ...cardRevealTransition, delay: index * 0.1 }}
              className="rounded-[24px] border border-[var(--color-border)] bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-fog)] text-[var(--color-azure)]">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">0{index + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-black text-[var(--color-ink)]">{step.title}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-[var(--color-graphite)]">{step.desc}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="featured" className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={revealTransition}
          className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
        >
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--color-orange)]">Dịch vụ nổi bật</p>
            <h2 className="mt-2 text-4xl font-black leading-tight text-[var(--color-ink)]">Khám phá studio được khách hàng tin chọn</h2>
            <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-[var(--color-graphite)]">
              Xem nhanh portfolio, gói chụp, giá và đánh giá trước khi gửi yêu cầu booking.
            </p>
          </div>
          <Link to="/photosets" className="secondary-pill h-11 gap-2 px-5 text-sm font-black">
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {loading ? (
          <div className="surface-card p-12 text-center text-sm font-semibold text-[var(--color-graphite)]">Đang tải dịch vụ nổi bật...</div>
        ) : featuredServices.length === 0 ? (
          <div className="surface-card border-dashed py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <div className="mt-4 font-semibold text-[var(--color-graphite)]">Không tìm thấy dịch vụ phù hợp.</div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleFeaturedServices.map((service, index) => (
                <ServiceCard key={`${service.id}-${service.name}`} service={service} index={index} onClick={() => navigate(service.id > 0 ? `/photosets/${service.id}` : '/photosets')} />
              ))}
            </div>
            {visibleServiceCount < featuredServices.length && (
              <div className="pt-2 text-center">
                <button type="button" onClick={() => setVisibleServiceCount((count) => count + 6)} className="secondary-pill h-11 px-6 text-sm font-black">
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
            <p className="text-sm font-black uppercase tracking-[0.18em] text-white/72">{bottomCtaEyebrow}</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl">
              {bottomCtaTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-white/76">
              {bottomCtaDescription}
            </p>
          </div>
          <Link to={secondaryHref} className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[var(--color-orange)] px-7 text-sm font-black text-white transition hover:bg-[var(--color-orange-dark)]">
            {secondaryLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
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
      transition={{ ...cardRevealTransition, delay: Math.min(index, 5) * 0.08 }}
      className="group flex h-full min-h-[500px] flex-col overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white text-left shadow-sm transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]"
    >
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-slate-100">
        <SafeImage src={service.thumbnailUrl || FALLBACK_IMAGES[0]} fallback={FALLBACK_IMAGES[0]} alt={service.name} className="h-full w-full object-cover transition duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105" />
        <div className="absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1 text-xs font-black text-[var(--color-slate)] backdrop-blur">
          {service.categoryName}
        </div>
      </div>
      <div className="flex flex-1 flex-col space-y-4 p-5">
        <div className="min-h-[94px]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-azure)]">
            <MapPin className="h-3.5 w-3.5" />
            {service.city || 'Đà Nẵng'}
          </div>
          <h3 className="mt-2 line-clamp-2 text-xl font-black leading-tight text-[var(--color-ink)]">{service.name}</h3>
          <p className="mt-1 text-sm font-bold text-[var(--color-graphite)]">{service.studioName}</p>
        </div>
        <p className="line-clamp-3 min-h-[66px] text-sm font-medium leading-6 text-[var(--color-graphite)]">
          {service.description || 'Xem portfolio, gói chụp và thông tin đặt lịch của dịch vụ này.'}
        </p>
        <div className="mt-auto flex items-center justify-between gap-4 border-t border-[var(--color-soft-border)] pt-4">
          <PriceBlock value={service.minPrice} />
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5 text-sm font-black text-[var(--color-orange)]">
            <Star className="h-4 w-4 fill-[var(--color-orange)] text-[var(--color-orange)]" />
            {Number(service.rating ?? 0).toFixed(1)}
          </span>
        </div>
      </div>
    </motion.button>
  )
}

function SafeImage({ src, fallback, alt, className }: { src: string; fallback: string; alt: string; className: string }) {
  return <img src={src || fallback} alt={alt} className={className} loading="lazy" onError={(event) => { event.currentTarget.src = fallback }} />
}

function PriceBlock({ value }: { value?: number }) {
  if (!value) return <span className="text-xl font-black text-[var(--color-azure)]">Liên hệ</span>
  return (
    <span className="price-block price-block-card">
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
  tone = 'light',
}: {
  value: string
  placeholder: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
  tone?: 'light' | 'dark'
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)
  const dark = tone === 'dark'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className={`flex h-12 w-full items-center justify-between gap-2 rounded-full px-4 text-left text-sm font-black transition-colors ${
          dark ? 'bg-white/92 text-slate-950 hover:bg-white' : 'bg-[var(--color-fog)] text-[var(--color-ink)] hover:bg-slate-100'
        }`}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-slate-400 transition-transform"
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transitionDuration: '360ms',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-72 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-white p-1 text-slate-950 shadow-xl"
          >
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-[var(--color-fog)]"
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
                className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold ${
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
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ'
}
