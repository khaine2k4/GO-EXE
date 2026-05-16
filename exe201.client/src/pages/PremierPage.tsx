import { motion } from 'framer-motion'
import { Crown, Star, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from 'lucide-react'

const features = [
  {
    icon: <Crown className="h-6 w-6 text-yellow-500" />,
    title: 'Huy hiệu Độc quyền',
    description: 'Nổi bật trong mắt khách hàng với huy hiệu Premier chuyên nghiệp và uy tín.',
  },
  {
    icon: <Star className="h-6 w-6 text-indigo-500" />,
    title: 'Hiển thị Ưu tiên',
    description: 'Luôn xuất hiện ở đầu kết quả tìm kiếm, tăng 300% cơ hội nhận booking mới.',
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />,
    title: 'Bảo vệ Thanh toán',
    description: 'An tâm tuyệt đối với chính sách cọc an toàn, xử lý nợ đọng tự động 24/7.',
  },
  {
    icon: <Zap className="h-6 w-6 text-rose-500" />,
    title: 'Hỗ trợ Nhanh chóng',
    description: 'Đội ngũ chuyên viên túc trực riêng để xử lý khiếu nại của bạn trong 5 phút.',
  },
]

export default function PremierPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-16 py-8">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-20 text-center shadow-2xl shadow-indigo-500/10 sm:px-16 sm:py-24"
      >
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1554048665-8c3ba5e63013?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
        
        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-semibold tracking-wide text-indigo-300 backdrop-blur-md">
            <Crown className="h-4 w-4" />
            PhotoMarket Thiết Kế Riêng Cho Bạn
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tight text-white sm:text-6xl lg:leading-[1.1]">
            Nâng Tầm Trải Nghiệm Cùng <span className="bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 bg-clip-text text-transparent">Premier</span>
          </h1>
          <p className="mb-10 text-lg font-medium text-slate-300">
            Khẳng định đẳng cấp, gia tăng doanh thu và tận hưởng những đặc quyền chưa từng có dành riêng cho nhiếp ảnh gia và khách hàng VIP.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-400 px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-900 shadow-xl shadow-yellow-500/20 transition-all hover:scale-105 active:scale-95 sm:w-auto">
              Nâng cấp ngay
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button className="w-full rounded-2xl border-2 border-slate-700 bg-slate-800/50 px-8 py-4 text-sm font-black uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-slate-700 active:scale-95 sm:w-auto">
              Tìm hiểu thêm
            </button>
          </div>
        </div>
      </motion.section>

      {/* Features Grid */}
      <section className="space-y-10">
        <div className="text-center">
          <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">Tại sao chọn Premier?</h2>
          <p className="mt-4 text-slate-500">Giới hạn số lượng tham gia để đảm bảo chất lượng phục vụ tốt nhất.</p>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/10"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 transition-colors group-hover:bg-indigo-50 group-hover:ring-indigo-100">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Mock */}
      <section className="mx-auto max-w-3xl rounded-[2.5rem] border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white px-8 py-16 text-center ring-4 ring-white sm:px-16">
        <Crown className="mx-auto mb-6 h-12 w-12 text-indigo-500" />
        <h2 className="mb-4 text-3xl font-black text-slate-900">Gói Premier Plus</h2>
        <div className="mb-8 flex items-baseline justify-center gap-1">
          <span className="text-5xl font-black text-slate-900">499.000</span>
          <span className="text-lg font-bold text-slate-500">₫ / tháng</span>
        </div>
        <ul className="mb-10 space-y-4 text-left">
          {['Tất cả quyền lợi Premier', 'Miễn phí xử lý tranh chấp & khiếu nại', 'Hỗ trợ marketing trang cá nhân', 'Lưu trữ album dung lượng không giới hạn'].map((text, i) => (
            <li key={i} className="flex flex-row items-center gap-3 align-middle">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-500" />
              <span className="font-medium text-slate-700">{text}</span>
            </li>
          ))}
        </ul>
        <button className="w-full rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95">
          Đăng ký dùng thử 7 ngày
        </button>
      </section>
    </div>
  )
}
