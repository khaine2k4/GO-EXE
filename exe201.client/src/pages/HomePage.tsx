import { ArrowRight, Camera, CheckCircle2, Search, Shield, Sparkles, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import PhotoCard from '../components/PhotoCard'
import api from '../api/axios'
import heroImage from '../assets/hero.png'

const STEPS = [
  {
    icon: <Search className="h-5 w-5" />,
    title: 'Tìm photographer',
    desc: 'Lọc theo phong cách, địa điểm, rating và portfolio thực tế.',
  },
  {
    icon: <Camera className="h-5 w-5" />,
    title: 'Đặt lịch chụp',
    desc: 'Chọn gói, ngày chụp và thanh toán giữ lịch trong vài bước.',
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: 'Nhận ảnh an toàn',
    desc: 'Ảnh được giao qua workspace, tiền giữ bằng escrow mock.',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const [homeData, setHomeData] = useState<{
    stats: { approvedStudiosCount: number; totalBookingsCount: number; avgRating: number };
    featuredStudios: Array<{ id: number; name: string; city: string; rating: number; reviewCount: number; coverUrl: string }>;
  } | null>(null);

  useEffect(() => {
    api.get('/public/home-data')
      .then(res => setHomeData(res.data))
      .catch(err => console.error('Failed to fetch home data:', err));
  }, []);

  const featured = useMemo(() => {
    const norm = query.trim().toLowerCase()
    const list = Array.isArray(homeData) ? homeData : (homeData?.featuredStudios ?? [])
    return norm
      ? list.filter((p) =>
        `${p.name} ${p.city}`.toLowerCase().includes(norm)
      )
      : list
  }, [homeData, query])

  return (
    <div className="space-y-16 pb-16">
      <section className="grid items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex min-h-[560px] flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">
              <Sparkles className="h-4 w-4" />
              Marketplace nhiếp ảnh chuyên nghiệp
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-6xl"
            >
              Đặt lịch chụp ảnh với photographer phù hợp nhất.
            </motion.h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              PhotoMarket giúp khách hàng tìm gói chụp, đặt lịch, quản lý ảnh giao và theo dõi thanh toán trong cùng một workspace.
            </p>

            <div className="mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:flex-row">
              <div className="flex min-h-12 flex-1 items-center gap-3 px-4">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm theo phong cách, địa điểm..."
                  className="h-12 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              <Link
                to="/gallery"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-indigo-600"
              >
                Khám phá
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <Stat value={String(homeData?.stats?.approvedStudiosCount ?? 0)} label="Photographer" />
            <Stat value={String(homeData?.stats?.totalBookingsCount ?? 0)} label="Booking" />
            <Stat value={(homeData?.stats?.avgRating ?? 0).toFixed(1)} label="Rating trung bình" />
          </div>
        </div>

        <div className="relative min-h-[560px] overflow-hidden rounded-3xl bg-slate-950 shadow-sm">
          <img src={heroImage} alt="PhotoMarket workspace" className="h-full w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/15 bg-white/10 p-5 text-white backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm font-bold text-white/75">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Escrow flow, booking, delivery, dispute
            </div>
            <div className="mt-3 text-2xl font-black">Một workspace cho toàn bộ quy trình chụp ảnh.</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">{step.icon}</div>
            <h2 className="mt-5 text-xl font-black text-slate-950">{step.title}</h2>
            <p className="mt-3 leading-7 text-slate-600">{step.desc}</p>
          </motion.div>
        ))}
      </section>

      <section className="space-y-8">
        <div className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.18em] text-indigo-600">Đề xuất hôm nay</div>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Photographer nổi bật</h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Danh sách được lọc từ các hồ sơ đã duyệt, ưu tiên portfolio rõ ràng và rating cao.
            </p>
          </div>
          <Link to="/gallery" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700">
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <div className="mt-4 font-bold text-slate-500">Chưa có photographer phù hợp.</div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((studio) => (
              <PhotoCard
                key={studio.id}
                imageUrl={studio.coverUrl || 'https://images.unsplash.com/photo-1542038783-0601e1c2f64a?w=800'}
                photographerName={studio.name}
                location={studio.city || 'N/A'}
                startingPriceVnd={1000000} // Mock giá tạm thời
                rating={studio.rating}
                reviewCount={studio.reviewCount}
                tags={['Professional', 'Verified']} // Mock tags tạm thời
                isTopRated={studio.rating >= 4.9}
                onClick={() => navigate(`/photographers/${studio.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl bg-slate-950 p-8 text-white sm:p-10">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-300">Dành cho photographer</div>
            <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
              Tạo portfolio, quản lý booking và theo dõi doanh thu trong cùng một nơi.
            </h2>
          </div>
          <Link
            to="/register"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-black text-slate-950 transition hover:bg-indigo-50"
          >
            Đăng ký partner
          </Link>
        </div>
      </section>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <div className="text-3xl font-black text-slate-950">{value}</div>
      <div className="mt-1 text-sm font-semibold text-slate-500">{label}</div>
    </div>
  )
}
