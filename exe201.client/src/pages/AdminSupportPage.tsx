import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, MessageSquare, HelpCircle, CheckCircle, AlertTriangle, AlertCircle, Clock } from 'lucide-react'

type Tab = 'risks' | 'disputes' | 'faq'

const DISPUTES = [
  { id: 'DP-001', booking: 'BK-1054', customer: 'Nguyễn Văn A', ph: 'Studio X', reason: 'Khách hàng không hài lòng với tone màu ảnh bàn giao.', status: 'pending', date: '2026-03-16' },
  { id: 'DP-002', booking: 'BK-0992', customer: 'Trần Thị B', ph: 'Focus Art', reason: 'Thợ ảnh trễ hẹn 2 tiếng so với lịch.', status: 'resolved', date: '2026-03-15' },
]

const RISKS = [
  { id: 'R-101', type: 'high', title: 'Nghi vấn thao túng đánh giá', desc: 'Có 5 lượt đánh giá 5-sao từ cùng một IP cho Photographer PH-092.', target: 'PH-092' },
  { id: 'R-102', type: 'medium', title: 'Tỷ lệ hủy lịch cao bất thường', desc: 'Khách hàng KH-110 hủy 4 lịch liên tiếp trong tuần.', target: 'KH-110' },
]

const FAQS = [
  { q: 'Làm sao để nhận cọc từ khách hàng?', a: 'Hệ thống PhotoMarket đang giữ cọc (Escrow). Sau khi hệ thống xác nhận ảnh đã bàn giao, tiền sẽ về ví của bạn trong vòng 48h.', sender: 'Photographer', time: '10:30' },
  { q: 'Thợ ảnh không đến, tôi làm sao để hoàn tiền?', a: 'Vui lòng nhấn nút "Khiếu nại booking" trong chi tiết đơn. Admin sẽ đối soát tin nhắn và xác nhận hoàn 100% tiền cọc cho bạn.', sender: 'Customer', time: '09:15' },
]

export default function AdminSupportPage() {
  const [activeTab, setActiveTab] = useState<Tab>('disputes')

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Admin Assistant</h1>
        <p className="mt-2 text-slate-500">Quản lý rủi ro hệ thống, xử lý khiếu nại (disputes), và giải đáp thắc mắc giữa Khách hàng & Thợ chụp.</p>
      </div>

      {/* Simple Stats mock */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-100 p-2.5 text-rose-600"><AlertTriangle className="h-5 w-5" /></div>
            <div className="text-sm font-bold text-rose-900">Rủi ro cần duyệt</div>
          </div>
          <p className="mt-3 text-2xl font-black text-rose-700">2<span className="text-base font-medium text-rose-600/60 ml-1">cảnh báo</span></p>
        </div>
        
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-2.5 text-amber-600"><ShieldAlert className="h-5 w-5" /></div>
            <div className="text-sm font-bold text-amber-900">Tranh chấp / Khiếu nại</div>
          </div>
          <p className="mt-3 text-2xl font-black text-amber-700">1<span className="text-base font-medium text-amber-600/60 ml-1">đang mở</span></p>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-600"><MessageSquare className="h-5 w-5" /></div>
            <div className="text-sm font-bold text-indigo-900">Hỗ trợ / FAQ</div>
          </div>
          <p className="mt-3 text-2xl font-black text-indigo-700">15<span className="text-base font-medium text-indigo-600/60 ml-1">yêu cầu mới</span></p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex w-full overflow-x-auto rounded-2xl bg-white p-1 ring-1 ring-slate-200">
        {[
          { id: 'disputes', lbl: 'Xử lý Tranh chấp', ic: <ShieldAlert className="h-4 w-4" /> },
          { id: 'risks', lbl: 'Quản lý Rủi ro', ic: <AlertTriangle className="h-4 w-4" /> },
          { id: 'faq', lbl: 'Hệ thống FAQ', ic: <HelpCircle className="h-4 w-4" /> }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as Tab)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 px-4 text-[13px] font-bold transition-all whitespace-nowrap ${
              activeTab === t.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {t.ic} {t.lbl}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          {activeTab === 'disputes' && (
            <div className="divide-y divide-slate-100">
              <div className="px-6 py-4 flex flex-row items-center justify-between bg-slate-50/50 rounded-t-3xl">
                <h2 className="font-bold text-slate-800">Danh sách Khiếu nại (Disputes)</h2>
                <span className="text-xs text-slate-500 font-medium">Tìm thấy {DISPUTES.length} trường hợp</span>
              </div>
              {DISPUTES.map((d) => (
                <div key={d.id} className="p-6 flex flex-col md:flex-row gap-6 md:items-start justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-900">{d.id}</span>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        d.status === 'pending' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {d.status === 'pending' ? 'Đang mở' : 'Đã giải quyết'}
                      </span>
                      <span className="text-xs font-medium text-slate-400"><Clock className="inline h-3 w-3 mr-1 mb-0.5" />{d.date}</span>
                    </div>
                    <div className="text-[13px] font-medium text-slate-700">Booking <span className="text-indigo-600 font-bold">{d.booking}</span> • Khách: <b>{d.customer}</b> vs Thợ: <b>{d.ph}</b></div>
                    <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-600">
                      <b>Lý do: </b> {d.reason}
                    </div>
                  </div>
                  {d.status === 'pending' ? (
                    <div className="flex shrink-0 gap-2">
                      <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50">Xem bằng chứng</button>
                      <button className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 shadow-indigo-600/20">Xử lý (Hoàn tiền)</button>
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-1.5 text-emerald-600 text-sm font-bold">
                      <CheckCircle className="h-5 w-5" />
                      Hoàn tất
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'risks' && (
            <div className="divide-y divide-slate-100">
              <div className="px-6 py-4 bg-slate-50/50 rounded-t-3xl">
                <h2 className="font-bold text-slate-800">Cảnh báo Rủi ro Hệ thống</h2>
              </div>
              {RISKS.map((r) => (
                <div key={r.id} className="flex gap-4 p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="mt-1">
                    {r.type === 'high' ? <AlertCircle className="h-6 w-6 text-rose-500" /> : <AlertTriangle className="h-6 w-6 text-amber-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-slate-900">{r.title}</h3>
                      <span className={`rounded px-2 gap-1 py-0.5 text-[10px] font-bold uppercase tracking-widest ${r.type === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.type === 'high' ? 'High Risk' : 'Medium Risk'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{r.desc}</p>
                    <div className="flex gap-2">
                      <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors">Kiểm tra {r.target}</button>
                      <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">Đánh dấu an toàn</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="p-6">
              <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="font-bold text-slate-800">Hỗ trợ Assistant / Chat Log</h2>
                <button className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 bg-white shadow-sm hover:bg-slate-50">Tạo nội dung FAQ mới</button>
              </div>
              <div className="space-y-4">
                {FAQS.map((f, i) => (
                  <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded uppercase tracking-wider">{f.sender}</span>
                      <span className="text-xs text-slate-400">{f.time}</span>
                    </div>
                    <div className="mb-3 font-bold text-slate-900">Q: {f.q}</div>
                    <div className="flex gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black tracking-widest text-white mt-0.5">ADMIN</div>
                      <p className="text-sm text-slate-600">A: {f.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
