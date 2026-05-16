import { useAppStore } from '../store/AppStore'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Camera, CheckCircle, Clock } from 'lucide-react'

export default function AdminUsersPage() {
  const { state, actions } = useAppStore()
  const [tab, setTab] = useState<'photographers' | 'customers'>('photographers')

  const photographers = state.photographers
  const pendingCount = photographers.filter((p) => p.status === 'PENDING').length
  const customerCount = state.users.filter(u => u.role === 'USER').length

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Premium Header */}
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Người dùng</h1>
          <p className="mt-2 text-[15px] font-medium text-slate-500 max-w-xl leading-relaxed">
            Hệ thống quản trị trung tâm để kiểm soát hồ sơ nhiếp ảnh gia và tài khoản người dùng trên toàn nền tảng.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm">
          <StatBox label="Photographers" value={photographers.length} color="indigo" />
          <div className="h-8 w-px bg-slate-100" />
          <StatBox label="Khách hàng" value={customerCount} color="slate" />
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="mb-8 flex items-center justify-between overflow-hidden rounded-[24px] border border-amber-100 bg-amber-50/50 p-1 pl-6">
          <div className="flex items-center gap-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black text-amber-900">Yêu cầu phê duyệt mới</div>
              <div className="text-xs font-bold text-amber-700/70">Có {pendingCount} nhiếp ảnh gia đang chờ được xác minh hồ sơ</div>
            </div>
          </div>
          <button
            onClick={() => setTab('photographers')}
            className="flex h-12 items-center rounded-2xl bg-amber-100 px-6 text-xs font-black uppercase tracking-widest text-amber-900 transition hover:bg-amber-200"
          >
            XỬ LÝ NGAY
          </button>
        </div>
      )}

      {/* Modern Tabs */}
      <div className="mb-8 flex items-center gap-1.5 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm w-fit">
        {[
          { value: 'photographers', label: 'Photographers', count: photographers.length },
          { value: 'customers', label: 'Khách hàng', count: customerCount },
        ].map((t) => {
          const isActive = tab === t.value
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value as typeof tab)}
              className={`flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${isActive
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
            >
              {t.label}
              <span className={`rounded-lg px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      {tab === 'photographers' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {photographers.map((p, i) => {
            const bookingCount = state.bookings.filter((b) => b.photographerId === p.id).length
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group relative flex flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white p-2 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/40"
              >
                <div className="flex-1 p-6">
                  <div className="mb-6 flex items-start justify-between">
                    <img src={p.avatarUrl} alt={p.name} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-slate-50" />
                    <StatusBadge status={p.status} />
                  </div>

                  <div>
                    <h3 className="text-[17px] font-black tracking-tight text-slate-900">{p.name}</h3>
                    <p className="mt-1 text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Camera className="h-3 w-3" /> {p.location}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {p.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-tighter text-slate-400 border border-slate-100">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-100/50">
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rating</div>
                        <div className="mt-1 text-sm font-black text-slate-900">⭐ {p.rating.toFixed(1)}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-100/50">
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Jobs Done</div>
                        <div className="mt-1 text-sm font-black text-slate-900 underline decoration-indigo-200 decoration-2 underline-offset-4">{bookingCount} 📸</div>
                      </div>
                    </div>
                  </div>
                </div>

                {p.status === 'PENDING' ? (
                  <div className="p-2 pt-0">
                    <button
                      onClick={() => actions.approvePhotographer(p.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                    >
                      XÁC MINH HỒ SƠ
                    </button>
                  </div>
                ) : (
                  <div className="p-2 pt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-600 transition hover:bg-slate-200">
                      Quản lý tài khoản
                    </button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.users.filter((u) => u.role === 'USER').map((c, i) => {
            const bookingsCount = state.bookings.filter((b) => b.customerId === c.id).length;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:shadow-slate-200/30"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-base font-black text-indigo-600 ring-1 ring-indigo-100">
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-black text-slate-900 truncate tracking-tight">{c.name}</div>
                    <div className="text-[11px] font-bold text-slate-400 truncate tracking-tight">{c.email}</div>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-300">ID: {c.id.substring(0, 8)}</div>
                  <div className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                    {bookingsCount} BOOKINGS
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, color }: { label: string, value: number, color: 'indigo' | 'slate' }) {
  return (
    <div className="flex flex-col px-4">
      <span className={`text-2xl font-black ${color === 'indigo' ? 'text-indigo-600' : 'text-slate-900'}`}>{value}</span>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">
        <CheckCircle className="h-3 w-3" /> VERIFIED
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-600">
      <Clock className="h-3 w-3" /> PENDING
    </span>
  )
}
