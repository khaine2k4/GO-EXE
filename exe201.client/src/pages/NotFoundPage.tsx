import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="text-7xl font-black text-slate-100">404</div>
      <div className="mt-4 text-lg font-bold text-slate-900">Trang không tồn tại</div>
      <p className="mt-2 text-sm text-slate-500">Đường dẫn bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
      >
        Về trang chủ
      </Link>
    </div>
  )
}
