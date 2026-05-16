import { useAppStore } from '../store/AppStore'
import { Camera, UploadCloud, Image as ImageIcon, Settings, X, CheckCircle, Wallet, Package, FolderPlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useToast } from '../components/Toast'
import type { Photoset, Album } from '../types'

function formatVnd(v: number) {
  return new Intl.NumberFormat('vi-VN').format(v) + ' ₫'
}

function uid() {
  return Math.random().toString(36).slice(2, 7)
}

const MOCK_UPLOADS = [
  'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80'
]

export default function PhotographerPortfolioPage() {
  const { state, actions } = useAppStore()
  const toast = useToast()

  const [editOpen, setEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [createPackageOpen, setCreatePackageOpen] = useState(false)
  const [createAlbumOpen, setCreateAlbumOpen] = useState(false)
  const [packageForm, setPackageForm] = useState({ title: '', price: '1000000', coverUrl: MOCK_UPLOADS[0], description: '', tags: '' })
  const [albumForm, setAlbumForm] = useState({ title: '', coverUrl: MOCK_UPLOADS[0], photosetId: '' })

  const photographer = state.photographers.find((p) => p.id === state.currentUser?.id)

  const [formData, setFormData] = useState({
    bio: photographer?.bio ?? '',
    location: photographer?.location ?? '',
    tags: photographer?.tags.join(', ') ?? '',
    startingPrice: String(photographer?.startingPrice ?? 1000000)
  })

  if (!photographer) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <div className="text-xl font-black uppercase tracking-widest">Photographer Profile Not Found</div>
      </div>
    )
  }

  const myBookings = state.bookings.filter((b) => b.photographerId === photographer.id)
  const completed = myBookings.filter((b) => b.status === 'COMPLETED').length
  const earnings = state.transactions
    .filter((tx) => {
      const b = myBookings.find((b) => b.id === tx.bookingId)
      return b && tx.type === 'RELEASE'
    })
    .reduce((s, tx) => s + tx.amount, 0)

  async function handleSaveProfile() {
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    actions.updatePhotographer({
      bio: formData.bio,
      location: formData.location,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      startingPrice: Number(formData.startingPrice) || 0
    })
    toast.push({ type: 'success', title: 'Hồ sơ đã cập nhật ✨', message: 'Thông tin của bạn đã được hiển thị công khai.' })
    setEditOpen(false)
    setLoading(false)
  }

  async function handleUploadMock() {
    setUploading(true)
    await new Promise(r => setTimeout(r, 800))
    const randomImg = MOCK_UPLOADS[Math.floor(Math.random() * MOCK_UPLOADS.length)]

    actions.updatePhotographer({
      portfolio: [
        { id: `NEW_${uid()}`, url: randomImg, title: 'Studio Masterpiece' },
        ...photographer!.portfolio
      ]
    })
    toast.push({ type: 'success', title: 'Upload thành công! 📸', message: 'Tác phẩm mới đã được thêm vào bộ sưu tập.' })
    setUploading(false)
  }

  function handleCreatePackage() {
    if (!photographer) return
    const price = Number(packageForm.price) || 0
    const tags = packageForm.tags.split(',').map(t => t.trim()).filter(Boolean)
    const photoset: Photoset = {
      id: `ps-${uid()}`,
      title: packageForm.title || 'Gói mới',
      price,
      currency: 'đ',
      coverImage: packageForm.coverUrl,
      coverAspectRatio: 1.5,
      images: [packageForm.coverUrl, ...MOCK_UPLOADS.slice(0, 3)],
      tags: tags.length ? tags : ['Portrait'],
      description: packageForm.description || 'Gói chụp ảnh chuyên nghiệp.',
      features: ['Ảnh chỉnh sửa', '2 giờ chụp', '2 lần đổi trang phục'],
      photographer: {
        id: photographer.id,
        name: photographer.name,
        avatar: photographer.avatarUrl,
        rating: photographer.rating,
        reviewCount: photographer.reviewCount,
        location: photographer.location,
        bio: photographer.bio,
      },
      packageDetails: {
        standard: { price, features: ['Ảnh chỉnh sửa', '2 giờ chụp'] },
      },
      addOns: [],
      policies: ['Hủy trước 48h: hoàn 100%'],
      albums: [], // Studio thêm album sau bằng ảnh từ Portfolio Showcase
    }
    actions.createPhotoset(photoset)
    toast.push({ type: 'success', title: 'Đã tạo gói! 📦', message: 'Gói của bạn sẽ hiện ở Bộ sưu tập / Khám phá.' })
    setCreatePackageOpen(false)
    setPackageForm({ title: '', price: String(photographer.startingPrice), coverUrl: MOCK_UPLOADS[0], description: '', tags: '' })
  }

  function handleCreateAlbum() {
    if (!photographer) return
    const albumId = `alb-${uid()}`
    const portfolioImages = photographer.portfolio.slice(0, 6).map((p, i) => ({
      id: `${albumId}-img-${i}`,
      url: p.url,
      title: p.title,
    }))
    const images = portfolioImages.length > 0 ? portfolioImages : MOCK_UPLOADS.slice(0, 4).map((url, i) => ({ id: `${albumId}-img-${i}`, url, title: `Ảnh ${i + 1}` }))
    const coverUrl = albumForm.coverUrl || (photographer.portfolio[0]?.url ?? MOCK_UPLOADS[0])
    const album: Album = {
      id: albumId,
      photographerId: photographer.id,
      title: albumForm.title || 'Album mới',
      coverUrl,
      images,
      createdAt: new Date().toISOString(),
      photosetId: albumForm.photosetId || undefined,
    }
    actions.createAlbum(album)
    toast.push({ type: 'success', title: 'Đã tạo album! 🖼️', message: 'Album xuất hiện ở Bộ sưu tập, gắn với gói chụp ảnh đã chọn.' })
    setCreateAlbumOpen(false)
    setAlbumForm({ title: '', coverUrl: MOCK_UPLOADS[0], photosetId: '' })
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Premium Cover & Profile Header */}
      <div className="relative mb-12 overflow-hidden rounded-[40px] bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
        <div className="relative h-48 md:h-72 w-full overflow-hidden bg-slate-900">
          <img src={photographer.coverUrl} alt="cover" className="h-full w-full object-cover opacity-60 transition-transform duration-700 hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        </div>

        <div className="relative -mt-20 px-6 pb-8 md:px-12 md:pb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div className="relative h-32 w-32 md:h-44 md:w-44 shrink-0 overflow-hidden rounded-[40px] border-8 border-white bg-white shadow-2xl shadow-slate-900/10">
                <img src={photographer.avatarUrl} alt={photographer.name} className="h-full w-full object-cover" />
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">{photographer.name}</h1>
                  <span className="hidden sm:inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 ring-1 ring-inset ring-indigo-200">
                    VERIFIED STUDIO
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  {photographer.location} <span className="text-slate-200">/</span> {photographer.tags.join(' · ')}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setFormData({
                  bio: photographer.bio,
                  location: photographer.location,
                  tags: photographer.tags.join(', '),
                  startingPrice: String(photographer.startingPrice)
                })
                setEditOpen(true)
              }}
              className="inline-flex h-12 items-center justify-center gap-2.5 rounded-2xl bg-slate-900 px-8 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95"
            >
              <Settings className="h-4 w-4" /> <span className="hidden sm:inline">CHỈNH SỬA HỒ SƠ</span><span className="sm:hidden">SỬA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4 px-2">
        {[
          { label: 'TỔNG TÁC PHẨM', value: photographer.portfolio.length, icon: ImageIcon, color: 'text-indigo-600' },
          { label: 'JOB HOÀN THÀNH', value: completed, icon: CheckCircle, color: 'text-emerald-600' },
          { label: 'GIÁ KHỞI ĐIỂM', value: formatVnd(photographer.startingPrice), icon: Camera, color: 'text-slate-900' },
          { label: 'TỔNG DOANH THU', value: formatVnd(earnings), icon: Wallet, color: 'text-indigo-600' },
        ].map((s, idx) => (
          <div key={idx} className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-200/40">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <s.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{s.label}</div>
            <div className={`text-xl font-black tracking-tight ${s.color} truncate`}>{s.value}</div>
            <div className="absolute -right-2 -bottom-2 h-16 w-16 rotate-12 bg-slate-50 transition-transform group-hover:scale-110 opacity-20" />
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px] items-start px-2">
        <div className="space-y-10">
          {/* Portfolio Grid Workspace */}
          <div className="overflow-hidden rounded-[40px] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/30 px-8 py-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 leading-tight">Bộ sưu tập Tác phẩm</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Hiển thị cho khách hàng trên trang công khai · Tạo gói/album để hiện ở Khám phá
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCreatePackageOpen(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-6 text-[10px] font-black uppercase tracking-widest text-indigo-700 transition-all shadow-sm hover:bg-indigo-100 active:scale-95"
                >
                  <Package className="h-4 w-4" /> TẠO GÓI
                </button>
                <button
                  onClick={() => setCreateAlbumOpen(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-all shadow-sm hover:bg-slate-50 active:scale-95"
                >
                  <FolderPlus className="h-4 w-4" /> TẠO ALBUM
                </button>
                <button
                  onClick={handleUploadMock}
                  disabled={uploading}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-6 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 ${uploading ? 'bg-slate-50 border-slate-200 text-slate-300' : 'bg-white border-slate-200 text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/50 shadow-indigo-100/20'}`}
                >
                  <UploadCloud className="h-4 w-4" /> {uploading ? 'ĐANG TẢI...' : 'THÊM ẢNH MỚI'}
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8">
              {photographer.portfolio.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 rounded-[32px] border-2 border-dashed border-slate-100 bg-slate-50/30 text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <ImageIcon className="h-8 w-8 text-slate-200" />
                  </div>
                  <h3 className="text-[15px] font-black text-slate-900 uppercase tracking-widest">Workspace còn trống</h3>
                  <p className="mt-2 text-xs font-bold text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Portfolio là gương mặt thương hiệu. Hãy tải lên những tấm ảnh đẹp nhất để bắt đầu nhận job.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {photographer.portfolio.map((photo, i) => (
                      <motion.div
                        key={photo.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: i * 0.05 }}
                        className="group relative aspect-square overflow-hidden rounded-[24px] bg-slate-100 shadow-sm ring-1 ring-slate-200/50"
                      >
                        <img src={photo.url} alt={photo.title} className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1" />

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 z-10 bg-slate-950/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
                          <button
                            onClick={() => {
                              actions.updatePhotographer({
                                portfolio: photographer.portfolio.filter(p => p.id !== photo.id)
                              })
                              toast.push({ type: 'success', title: 'Đã gỡ bỏ', message: 'Tác phẩm đã được xóa khỏi portfolio.' })
                            }}
                            className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white text-rose-600 shadow-2xl transition-transform hover:scale-110 active:scale-90"
                          >
                            <X className="h-5 w-5" />
                          </button>
                          {photo.title && <span className="text-[10px] font-black uppercase tracking-widest text-white">{photo.title}</span>}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Space */}
        <div className="space-y-8 sticky top-8">
          {/* Brief Bio Card */}
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm ring-1 ring-slate-100">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Giới thiệu Studio</h3>
            <p className="text-[14px] leading-relaxed text-slate-600 font-medium">
              {photographer.bio || <span className="text-slate-400 italic">Hãy giới thiệu thêm về phong cách và kinh nghiệm của bạn để tạo niềm tin cho khách hàng.</span>}
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {photographer.tags.map((t) => (
                <span key={t} className="inline-flex rounded-xl bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 ring-1 ring-inset ring-slate-100 transition-colors hover:bg-slate-900 hover:text-white">{t}</span>
              ))}
            </div>
          </div>

          {/* Price Table Card */}
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white p-2 shadow-sm ring-1 ring-slate-100">
            <div className="bg-slate-50/50 p-6 md:p-8 rounded-[28px]">
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm text-slate-900">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Bảng giá tham chiếu</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Giá gốc: {formatVnd(photographer.startingPrice)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <PriceRow label="Gói Standard" value={formatVnd(photographer.startingPrice)} desc="Cơ bản, chụp 2h" />
                <PriceRow label="Gói Premium" value={formatVnd(Math.round(photographer.startingPrice * 1.6))} desc="Tiêu chuẩn, 4-6h" highlight />
                <PriceRow label="Gói Deluxe" value={formatVnd(Math.round(photographer.startingPrice * 2.75))} desc="Full-day Studio" />
              </div>

              <button
                onClick={() => setEditOpen(true)}
                className="mt-8 flex w-full h-12 items-center justify-center rounded-2xl bg-slate-900 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800"
              >
                CẬP NHẬT BIỂU GIÁ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal - Modern Premium UI */}
      <AnimatePresence>
        {editOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl" />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl overflow-hidden rounded-[40px] border border-white/20 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-50 px-10 py-6">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">Thiết lập Hồ sơ</h2>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cập nhật danh tính số cho Studio của bạn</p>
                </div>
                <button onClick={() => setEditOpen(false)} className="rounded-2xl p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto px-10 py-8 space-y-8 scrollbar-hide">
                <div className="grid gap-8 md:grid-cols-2">
                  <Field label="Giá khởi điểm (VNĐ)" description="Base price cho gói Standard">
                    <input type="number" value={formData.startingPrice} onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                      className="h-14 w-full rounded-2xl bg-slate-50 px-5 text-sm font-bold border-none outline-none ring-2 ring-transparent transition-all focus:bg-white focus:ring-slate-900" />
                  </Field>
                  <Field label="Khu vực hoạt động" description="Thành phố hoặc vùng miền">
                    <input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="h-14 w-full rounded-2xl bg-slate-50 px-5 text-sm font-bold border-none outline-none ring-2 ring-transparent transition-all focus:bg-white focus:ring-slate-900" />
                  </Field>
                </div>

                <Field label="Phong cách (Tags)" description="Phân cách bằng dấu phẩy">
                  <input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="Wedding, Portrait..."
                    className="h-14 w-full rounded-2xl bg-slate-50 px-5 text-sm font-bold border-none outline-none ring-2 ring-transparent transition-all focus:bg-white focus:ring-slate-900" />
                </Field>

                <Field label="Giới thiệu Studio (Bio)" description="Thể hiện bản sắc riêng của bạn">
                  <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={5}
                    className="w-full rounded-2xl bg-slate-50 p-5 text-sm font-medium border-none outline-none ring-2 ring-transparent transition-all focus:bg-white focus:ring-slate-900 leading-relaxed" />
                </Field>
              </div>

              <div className="border-t border-slate-50 bg-slate-50/50 px-10 py-8 flex gap-4">
                <button onClick={() => setEditOpen(false)}
                  className="flex-1 rounded-2xl border border-slate-100 h-14 text-[11px] font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-white active:scale-95">
                  Hủy bỏ
                </button>
                <button onClick={handleSaveProfile} disabled={loading}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl h-14 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] ${loading ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  {loading ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Tạo gói */}
      <AnimatePresence>
        {createPackageOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCreatePackageOpen(false)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl">
              <h3 className="text-xl font-black text-slate-900 mb-6">Tạo gói chụp</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Gói sẽ hiện ở Bộ sưu tập / Khám phá</p>
              <div className="space-y-4">
                <input placeholder="Tên gói" value={packageForm.title} onChange={e => setPackageForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="number" placeholder="Giá (VNĐ)" value={packageForm.price} onChange={e => setPackageForm(f => ({ ...f, price: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" />
                <input placeholder="URL ảnh bìa" value={packageForm.coverUrl} onChange={e => setPackageForm(f => ({ ...f, coverUrl: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" />
                <textarea placeholder="Mô tả" value={packageForm.description} onChange={e => setPackageForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" />
                <input placeholder="Tags (cách nhau bởi dấu phẩy)" value={packageForm.tags} onChange={e => setPackageForm(f => ({ ...f, tags: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setCreatePackageOpen(false)} className="flex-1 rounded-xl border border-slate-200 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">Hủy</button>
                <button onClick={handleCreatePackage} className="flex-1 rounded-xl bg-indigo-600 py-3 text-[11px] font-black uppercase tracking-widest text-white hover:bg-indigo-700">Tạo gói</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Tạo album */}
      <AnimatePresence>
        {createAlbumOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCreateAlbumOpen(false)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl">
              <h3 className="text-xl font-black text-slate-900 mb-6">Tạo album</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Ảnh trong album lấy từ Portfolio Showcase. Chọn gói chụp ảnh để album hiện ở Bộ sưu tập.</p>
              <div className="space-y-4">
                <input placeholder="Tên album" value={albumForm.title} onChange={e => setAlbumForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" />
                <input placeholder="URL ảnh bìa" value={albumForm.coverUrl} onChange={e => setAlbumForm(f => ({ ...f, coverUrl: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" />
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Gói chụp ảnh liên kết</label>
                  <select value={albumForm.photosetId} onChange={e => setAlbumForm(f => ({ ...f, photosetId: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="">— Không liên kết —</option>
                    {state.photosets.filter(ps => ps.photographer.id === photographer.id).map(ps => (
                      <option key={ps.id} value={ps.id}>{ps.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setCreateAlbumOpen(false)} className="flex-1 rounded-xl border border-slate-200 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">Hủy</button>
                <button onClick={handleCreateAlbum} className="flex-1 rounded-xl bg-indigo-600 py-3 text-[11px] font-black uppercase tracking-widest text-white hover:bg-indigo-700">Tạo album</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Field({ label, description, children }: { label: string, description: string, children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-black uppercase tracking-widest text-slate-900">{label}</label>
      {children}
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{description}</p>
    </div>
  )
}

function PriceRow({ label, value, desc, highlight }: { label: string, value: string, desc: string, highlight?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-[20px] p-4 transition-all ${highlight ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' : 'bg-white border border-slate-100 text-slate-900'}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-[11px] font-black uppercase tracking-widest ${highlight ? 'text-indigo-100' : 'text-slate-400'}`}>{label}</div>
          <div className="text-[13px] font-black mt-0.5">{value}</div>
        </div>
        <div className={`text-[9px] font-black uppercase tracking-[0.15em] opacity-60 text-right`}>{desc}</div>
      </div>
      {highlight && <div className="absolute -right-2 -top-2 h-10 w-10 rotate-12 bg-white/10" />}
    </div>
  )
}
