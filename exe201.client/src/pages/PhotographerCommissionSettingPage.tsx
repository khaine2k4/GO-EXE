import { useEffect, useState } from 'react'
import { Percent, RefreshCw, ShieldCheck } from 'lucide-react'
import { useToast } from '../components/Toast'
import { getStudioCommissionSetting, type StudioCommissionSetting } from '../services/studioRevenueApi'

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}

export default function PhotographerCommissionSettingPage() {
  const toast = useToast()
  const [setting, setSetting] = useState<StudioCommissionSetting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      setSetting(await getStudioCommissionSetting())
    } catch {
      setError('Không tải được cấu hình commission.')
      toast.push({ type: 'error', title: 'Tải commission setting thất bại' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) return <StateBox text="Đang tải commission setting..." />
  if (error || !setting) return <StateBox text={error || 'Không có commission setting.'} />

  return (
    <div className="space-y-6 pb-20">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Commission setting</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950">{setting.studioName}</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">{setting.note}</p>
          </div>
          <button type="button" onClick={fetchData} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Percent className="h-6 w-6" />
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-widest text-slate-400">Commission hiện tại</p>
          <div className="mt-2 text-5xl font-black tracking-tight text-slate-950">{setting.commissionPercent}%</div>
          <p className="mt-3 text-sm font-medium text-slate-500">Cập nhật lúc {formatDate(setting.updatedAt)}</p>
        </section>

        <section className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-amber-900">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0" />
            <div>
              <h2 className="text-base font-black text-amber-950">Chỉ xem trong MVP</h2>
              <p className="mt-2 text-sm font-semibold leading-6">
                Project hiện tại chưa có rule rõ ràng cho studio tự chỉnh commission. Commission là phí nền tảng, nên màn hình này chỉ hiển thị giá trị đang được hệ thống sử dụng.
              </p>
              <p className="mt-2 text-sm font-semibold leading-6">
                Booking cũ đã lưu snapshot commission riêng, nên thay đổi commission tương lai nếu được phê duyệt cũng không sửa lại booking cũ.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function StateBox({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-500">{text}</div>
}
