import { ArrowRight, Search, Star, Camera, Users, Shield } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/AppStore'
import PhotoCard from '../components/PhotoCard'

const HOW_IT_WORKS = [
  { icon: <Search className="h-6 w-6" />, step: '01', title: 'Tìm kiếm', desc: 'Khám phá hàng trăm nhiếp ảnh gia uy tín theo phong cách, địa điểm.' },
  { icon: <Camera className="h-6 w-6" />, step: '02', title: 'Đặt lịch', desc: 'Chọn ngày, gói chụp ảnh và thanh toán cọc 30% để giữ lịch.' },
  { icon: <Shield className="h-6 w-6" />, step: '03', title: 'Nhận ảnh', desc: 'Xem preview trước, thanh toán còn lại và tải ảnh gốc chất lượng cao.' },
]

export default function HomePage() {
  const { state } = useAppStore()
  const [q, setQ] = useState('')
  const nav = useNavigate()

  const featured = useMemo(() => {
    const norm = q.trim().toLowerCase()
    const list = state.photographers.filter((p) => p.status === 'APPROVED')
    if (!norm) return list.slice(0, 6)
    return list
      .filter((p) => (p.name + ' ' + p.location + ' ' + p.tags.join(' ')).toLowerCase().includes(norm))
      .slice(0, 6)
  }, [q, state.photographers])

  const totalApproved = state.photographers.filter((p) => p.status === 'APPROVED').length
  const totalBookings = state.bookings.length
  const avgRating =
    state.photographers.filter((p) => p.status === 'APPROVED').reduce((s, p) => s + p.rating, 0) / (totalApproved || 1)

  return (
    <div className="space-y-32 pb-32 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* ── Ultra-Premium Hero ── */}
      <section className="relative overflow-hidden rounded-[64px] bg-slate-950 px-6 py-28 md:px-20 md:py-36 flex flex-col items-center text-center text-white shadow-3xl shadow-slate-900/50">
        {/* Refined Background Elements - Purple Focus */}
        <div className="absolute inset-0 z-0">
          <div className="absolute -left-24 -top-24 h-[500px] w-[500px] rounded-full bg-violet-600/30 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute -right-24 -bottom-24 h-[600px] w-[600px] rounded-full bg-fuchsia-600/20 blur-[140px] animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10 w-full max-w-4xl space-y-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <div className="inline-flex items-center gap-3 rounded-2xl bg-white/5 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-violet-300 ring-1 ring-white/10 backdrop-blur-2xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              {totalApproved} verified artists online
            </div>

            <h1 className="mt-12 text-6xl font-black leading-[1.05] tracking-tight text-white md:text-8xl">
              Đỉnh cao của<br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">Nghệ thuật Hình ảnh</span>
            </h1>

            <p className="mt-10 mx-auto max-w-2xl text-[17px] font-medium leading-relaxed text-slate-400/90">
              Nền tảng kết nối tinh hoa nhiếp ảnh gia toàn quốc. Trải nghiệm quy trình làm việc chuyên nghiệp,
              minh bạch qua hệ thống bảo chứng Escrow hiện đại.
            </p>

            {/* Minimalist SaaS Search Bar */}
            <div className="mt-16 flex w-full max-w-2xl flex-col gap-4 sm:flex-row mx-auto">
              <div className="group flex h-18 flex-1 items-center gap-4 rounded-3xl bg-white/5 px-7 shadow-2xl backdrop-blur-3xl ring-1 ring-white/10 transition-all focus-within:ring-white/30 focus-within:bg-white/10">
                <Search className="h-6 w-6 shrink-0 text-violet-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm theo phong cách, địa điểm hoặc nghệ sĩ..."
                  className="h-full w-full bg-transparent text-[15px] font-bold text-white outline-none placeholder:text-slate-600"
                />
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  to="/gallery"
                  className="inline-flex h-18 items-center justify-center gap-3 rounded-3xl bg-white px-10 text-[11px] font-black uppercase tracking-[0.2em] text-slate-950 shadow-2xl transition-all hover:bg-slate-50 hover:scale-[1.02] active:scale-95"
                >
                  KHÁM PHÁ NGAY <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/photosets"
                  className="inline-flex h-18 items-center justify-center gap-3 rounded-3xl bg-white/10 px-10 text-[11px] font-black uppercase tracking-[0.2em] text-white ring-1 ring-white/20 shadow-2xl backdrop-blur transition-all hover:bg-white/20 hover:scale-[1.02] active:scale-95"
                >
                  XEM GÓI CHỤP
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Designer Stats Block */}
          <div className="grid grid-cols-3 gap-12 border-t border-white/5 pt-16">
            <HeroStat label="Active Creators" value={String(totalApproved)} />
            <HeroStat label="Successful Shoots" value={String(totalBookings)} />
            <HeroStat label="Master Rating" value={avgRating.toFixed(1) + '★'} />
          </div>
        </div>
      </section>

      {/* ── Professional Workflow Section ── */}
      <section className="px-4 max-w-7xl mx-auto">
        <div className="text-center mb-24 max-w-2xl mx-auto">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-600 mb-4">PLATFORM ECOSYSTEM</div>
          <h2 className="text-4xl font-black text-slate-900 md:text-5xl tracking-tight leading-tight">Quy trình vận hành<br />chuẩn mực quốc tế</h2>
          <p className="mt-6 text-slate-500 font-medium text-lg leading-relaxed">Chúng tôi tối ưu từng bước để đảm bảo sự hài lòng tuyệt đối cho cả khách hàng và nhiếp ảnh gia.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {HOW_IT_WORKS.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex flex-col rounded-[40px] border border-slate-100 bg-white p-10 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2"
            >
              <div className="mb-8 flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] bg-slate-900 text-white shadow-2xl shadow-slate-900/10 group-hover:bg-violet-600 group-hover:shadow-violet-600/20 transition-all duration-500">
                {item.icon}
              </div>
              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 mb-4">{item.step}</div>
              <div className="text-2xl font-black text-slate-900 mb-4">{item.title}</div>
              <p className="text-[15px] leading-relaxed font-medium text-slate-500/90">{item.desc}</p>

              {/* Decorative accent */}
              <div className="absolute bottom-10 right-10 h-10 w-10 opacity-0 group-hover:opacity-10 transition-opacity duration-500">
                <Camera className="h-full w-full rotate-12" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Featured Artists Grid ── */}
      <section className="px-4 max-w-7xl mx-auto space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-12">
          <div className="max-w-xl">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-600 mb-4">CURATED TALENTS</div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Nghệ sĩ tiêu biểu nhất</h2>
            <p className="mt-4 text-slate-500 font-medium">Hồ sơ được chọn lọc kỹ lưỡng dựa trên rating và portfolio cá nhân.</p>
          </div>
          <Link to="/gallery" className="group inline-flex h-16 items-center gap-3 rounded-2xl bg-slate-900 px-8 text-[11px] font-black uppercase tracking-widest text-white hover:bg-violet-600 transition-all shadow-xl shadow-slate-900/10">
            XEM TẤT CẢ TÁC PHẨM <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-[48px] border-2 border-dashed border-slate-100 py-32 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-200 mb-6">
              <Users className="h-10 w-10" />
            </div>
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Hiện chưa có dữ liệu phù hợp</div>
          </div>
        ) : (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <PhotoCard
                  imageUrl={p.portfolio[0]?.url ?? p.coverUrl}
                  photographerName={p.name}
                  location={p.location}
                  startingPriceVnd={p.startingPrice}
                  rating={p.rating}
                  reviewCount={p.reviewCount}
                  tags={p.tags}
                  isTopRated={p.rating >= 4.9}
                  onClick={() => nav(`/photographers/${p.id}`)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── High-Impact CTA Block ── */}
      <section className="px-4 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-[64px] bg-violet-600 px-8 py-24 md:py-32 text-center text-white shadow-3xl shadow-violet-200/40">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-[100px]" />
          <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-fuchsia-400/20 blur-[100px]" />

          <div className="relative z-10 mx-auto max-w-4xl space-y-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[32px] bg-white shadow-2xl text-violet-600">
              <Star className="h-10 w-10" />
            </div>
            <h2 className="text-4xl font-black md:text-7xl tracking-tighter leading-[1.1]">Bắt đầu kiến tạo<br />di sản hình ảnh của bạn</h2>
            <p className="mt-10 mx-auto max-w-2xl text-[19px] font-medium text-violet-50/80 leading-relaxed">
              Tham gia cộng đồng với hơn 500+ nghệ sĩ hàng đầu. Quản lý sự nghiệp nhiếp ảnh
              một cách thông minh và chuyên nghiệp nhất.
            </p>
            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={() => nav('/photographer/dashboard')}
                className="flex h-18 w-full sm:w-auto items-center justify-center gap-4 rounded-3xl bg-white px-12 text-[11px] font-black uppercase tracking-widest text-violet-700 shadow-2xl transition-all hover:bg-slate-50 hover:scale-[1.05] active:scale-95"
              >
                <Camera className="h-5 w-5" /> TRỞ THÀNH PARTNER
              </button>
              <Link to="/register"
                className="flex h-18 w-full sm:w-auto items-center justify-center rounded-3xl border-2 border-white/20 px-12 text-[11px] font-black uppercase tracking-widest text-white backdrop-blur-md hover:bg-white/10 transition-all hover:border-white/40">
                ĐĂNG KÝ NGAY ✨
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center group">
      <span className="text-4xl font-black text-white tracking-tighter group-hover:scale-110 transition-transform duration-500">{value}</span>
      <span className="mt-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-violet-400 transition-colors">{label}</span>
    </div>
  )
}
