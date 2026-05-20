import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, ChevronDown, Filter, Lock, Mail, MapPin, RefreshCw, Search, SlidersHorizontal, Unlock, UserRound, X, XCircle } from 'lucide-react'
import api from '../api/axios'

type AdminTab = 'studios' | 'users'
type StudioStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'BANNED' | 'INACTIVE'
type UserStatus = 'ALL' | 'ACTIVE' | 'LOCKED' | 'UNVERIFIED'
type UserRole = 'ALL' | 'CUSTOMER' | 'STUDIO_OWNER' | 'ADMIN'

interface AdminUserDto {
  id: number
  name: string
  email: string
  role: string
  status: string
  phone?: string
  avatarUrl?: string
}

interface AdminStudioDto extends AdminUserDto {
  studioName?: string
  logoUrl?: string
  studioPhone?: string
  studioEmail?: string
  bio?: string
  city?: string
  district?: string
  addressLine?: string
  coverUrl?: string
}

const studioStatusOptions: { value: StudioStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả studio' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'BANNED', label: 'Bị ban' },
  { value: 'INACTIVE', label: 'Ngưng hoạt động' },
]

const userStatusOptions: { value: UserStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả user' },
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'LOCKED', label: 'Bị khóa' },
  { value: 'UNVERIFIED', label: 'Chưa xác minh' },
]

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'ALL', label: 'Tất cả role' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'STUDIO_OWNER', label: 'Studio owner' },
  { value: 'ADMIN', label: 'Admin' },
]

export default function AdminUsersPage() {
  const [tab, setTab] = useState<AdminTab>('studios')
  const [searchTerm, setSearchTerm] = useState('')
  const [studioStatus, setStudioStatus] = useState<StudioStatus>('ALL')
  const [userStatus, setUserStatus] = useState<UserStatus>('ALL')
  const [userRole, setUserRole] = useState<UserRole>('ALL')
  const [sortBy, setSortBy] = useState('name')
  const [studios, setStudios] = useState<AdminStudioDto[]>([])
  const [users, setUsers] = useState<AdminUserDto[]>([])
  const [allStudios, setAllStudios] = useState<AdminStudioDto[]>([])
  const [allUsers, setAllUsers] = useState<AdminUserDto[]>([])
  const [loading, setLoading] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [rejectingStudio, setRejectingStudio] = useState<AdminStudioDto | null>(null)
  const [reasonText, setReasonText] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const queryParams = useMemo(() => {
    const params: Record<string, string> = { sortBy }
    if (searchTerm.trim()) params.search = searchTerm.trim()
    if (tab === 'studios') {
      if (studioStatus !== 'ALL') params.status = studioStatus
    } else {
      if (userStatus !== 'ALL') params.status = userStatus
      if (userRole !== 'ALL') params.role = userRole
    }
    return params
  }, [searchTerm, sortBy, studioStatus, tab, userRole, userStatus])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (tab === 'studios') {
        const [filtered, totalStudios, totalUsers] = await Promise.all([
          api.get<AdminStudioDto[]>('/admin/studios', { params: queryParams }),
          api.get<AdminStudioDto[]>('/admin/studios'),
          api.get<AdminUserDto[]>('/admin/users'),
        ])
        setStudios(filtered.data)
        setAllStudios(totalStudios.data)
        setAllUsers(totalUsers.data)
      } else {
        const [filtered, totalUsers, totalStudios] = await Promise.all([
          api.get<AdminUserDto[]>('/admin/users', { params: queryParams }),
          api.get<AdminUserDto[]>('/admin/users'),
          api.get<AdminStudioDto[]>('/admin/studios'),
        ])
        setUsers(filtered.data)
        setAllUsers(totalUsers.data)
        setAllStudios(totalStudios.data)
      }
    } catch {
      setError('Không tải được dữ liệu user/studio từ API admin.')
    } finally {
      setLoading(false)
    }
  }, [queryParams, tab])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchData, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [fetchData])

  function switchTab(nextTab: AdminTab) {
    setTab(nextTab)
    setSearchTerm('')
    setSortBy('name')
    setError('')
  }

  async function runAction(id: string, action: () => Promise<unknown>) {
    setActionId(id)
    setError('')
    try {
      await action()
      await fetchData()
    } catch {
      setError('Thao tác thất bại. Kiểm tra quyền admin hoặc dữ liệu gửi lên API.')
    } finally {
      setActionId(null)
    }
  }

  const stats = {
    totalStudios: allStudios.length,
    pendingStudios: allStudios.filter((studio) => studio.status === 'PENDING').length,
    approvedStudios: allStudios.filter((studio) => studio.status === 'APPROVED').length,
    totalUsers: allUsers.length,
    lockedUsers: allUsers.filter((user) => user.status === 'LOCKED').length,
  }

  const rowsCount = tab === 'studios' ? studios.length : users.length

  function clearFilters() {
    setSearchTerm('')
    setStudioStatus('ALL')
    setUserStatus('ALL')
    setUserRole('ALL')
    setSortBy('name')
  }

  return (
    <div className="space-y-5 pb-12">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Tổng studio" value={stats.totalStudios} />
        <Metric label="Chờ duyệt" value={stats.pendingStudios} tone="amber" />
        <Metric label="Đã duyệt" value={stats.approvedStudios} tone="emerald" />
        <Metric label="Tổng user" value={stats.totalUsers} />
        <Metric label="Bị khóa" value={stats.lockedUsers} tone="rose" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex w-fit rounded-lg bg-slate-200/70 p-1">
              <TabButton active={tab === 'studios'} onClick={() => switchTab('studios')} label="Studio" count={stats.totalStudios} />
              <TabButton active={tab === 'users'} onClick={() => switchTab('users')} label="User" count={stats.totalUsers} />
            </div>

            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative min-w-[280px] xl:w-[360px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={tab === 'studios' ? 'Tìm studio, thành phố...' : 'Tìm tên hoặc email...'}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                />
                {searchTerm && (
                  <button type="button" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {tab === 'studios' ? (
                  <SelectBox icon={<Filter className="h-4 w-4" />} value={studioStatus} onChange={(value) => setStudioStatus(value as StudioStatus)} options={studioStatusOptions} />
                ) : (
                  <>
                    <SelectBox icon={<Filter className="h-4 w-4" />} value={userStatus} onChange={(value) => setUserStatus(value as UserStatus)} options={userStatusOptions} />
                    <SelectBox icon={<UserRound className="h-4 w-4" />} value={userRole} onChange={(value) => setUserRole(value as UserRole)} options={roleOptions} />
                  </>
                )}
                <SelectBox
                  icon={<SlidersHorizontal className="h-4 w-4" />}
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    { value: 'name', label: 'Theo tên' },
                    { value: 'email', label: 'Theo email' },
                    ...(tab === 'studios' ? [{ value: 'rating', label: 'Rating cao' }] : [{ value: 'status', label: 'Theo trạng thái' }]),
                  ]}
                />
                <button type="button" onClick={fetchData} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Làm mới
                </button>
              </div>
            </div>
          </div>

          {error && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
        </div>

        {tab === 'studios' ? (
          <StudioTable
            studios={studios}
            loading={loading}
            actionId={actionId}
            onApprove={(studio) => runAction(`approve-${studio.id}`, () => api.put(`/admin/studios/${studio.id}/approve`))}
            onReject={setRejectingStudio}
          />
        ) : (
          <UserTable
            users={users}
            loading={loading}
            actionId={actionId}
            onStatusChange={(user, nextStatus) => runAction(`status-${user.id}`, () => api.put(`/admin/users/${user.id}/status`, { status: nextStatus }))}
            onRoleChange={(user, roleName) => runAction(`role-${user.id}`, () => api.put(`/admin/users/${user.id}/role`, { roleName }))}
          />
        )}

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
          <span>Hiển thị {rowsCount} dòng</span>
          {(searchTerm || studioStatus !== 'ALL' || userStatus !== 'ALL' || userRole !== 'ALL') && (
            <button type="button" onClick={clearFilters} className="font-medium text-indigo-600 hover:text-indigo-700">
              Xóa bộ lọc
            </button>
          )}
        </div>
      </section>

      <AnimatePresence>
        {rejectingStudio && (
          <RejectModal
            studio={rejectingStudio}
            reason={reasonText}
            setReason={setReasonText}
            loading={actionId === `reject-${rejectingStudio.id}`}
            onClose={() => {
              setRejectingStudio(null)
              setReasonText('')
            }}
            onSubmit={() => {
              if (!reasonText.trim()) return
              runAction(`reject-${rejectingStudio.id}`, () => api.put(`/admin/studios/${rejectingStudio.id}/reject`, { rejectionReason: reasonText.trim() })).then(() => {
                setRejectingStudio(null)
                setReasonText('')
              })
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function Metric({ label, value, tone = 'slate' }: { label: string; value: number; tone?: 'slate' | 'amber' | 'emerald' | 'rose' }) {
  const toneClass = {
    slate: 'text-slate-950',
    amber: 'text-amber-700',
    emerald: 'text-emerald-700',
    rose: 'text-rose-700',
  }[tone]
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-2 text-xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  )
}

function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition ${active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-950'}`}>
      {label}
      <span className={`rounded-md px-1.5 py-0.5 text-xs ${active ? 'bg-slate-900 text-white' : 'bg-slate-300 text-slate-600'}`}>{count}</span>
    </button>
  )
}

function SelectBox({ icon, value, onChange, options }: { icon: React.ReactNode; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="relative inline-flex h-10 items-center">
      <span className="pointer-events-none absolute left-3 text-slate-400">{icon}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-400" />
    </label>
  )
}

function StudioTable({ studios, loading, actionId, onApprove, onReject }: { studios: AdminStudioDto[]; loading: boolean; actionId: string | null; onApprove: (studio: AdminStudioDto) => void; onReject: (studio: AdminStudioDto) => void }) {
  if (loading) return <TableSkeleton columns={5} />
  if (studios.length === 0) return <EmptyState text="Không có studio phù hợp." />

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[940px]">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
            <th className="px-5 py-3">Studio</th>
            <th className="px-5 py-3">Liên hệ</th>
            <th className="px-5 py-3">Khu vực</th>
            <th className="px-5 py-3">Trạng thái</th>
            <th className="px-5 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {studios.map((studio) => (
            <tr key={studio.id} className="border-b border-slate-100 transition hover:bg-slate-50/70">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar src={studio.logoUrl ?? studio.avatarUrl} name={studio.studioName ?? studio.name} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-950">{studio.studioName ?? studio.name}</div>
                    <div className="mt-1 line-clamp-1 max-w-xs text-xs text-slate-500">{studio.bio || 'Chưa có mô tả'}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="text-sm font-medium text-slate-800">{studio.name}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Mail className="h-3.5 w-3.5" />
                  {studio.studioEmail || studio.email}
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {[studio.city, studio.district].filter(Boolean).join(', ') || 'Chưa cập nhật'}
                </div>
              </td>
              <td className="px-5 py-4"><StatusBadge status={studio.status} /></td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  {studio.status === 'PENDING' ? (
                    <>
                      <button type="button" onClick={() => onApprove(studio)} disabled={actionId === `approve-${studio.id}`} className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60">
                        <CheckCircle2 className="h-4 w-4" />
                        Duyệt
                      </button>
                      <button type="button" onClick={() => onReject(studio)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-medium text-rose-700 hover:bg-rose-100">
                        <XCircle className="h-4 w-4" />
                        Từ chối
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">Không có thao tác</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UserTable({ users, loading, actionId, onStatusChange, onRoleChange }: { users: AdminUserDto[]; loading: boolean; actionId: string | null; onStatusChange: (user: AdminUserDto, status: 'ACTIVE' | 'LOCKED') => void; onRoleChange: (user: AdminUserDto, roleName: 'CUSTOMER' | 'STUDIO_OWNER' | 'ADMIN') => void }) {
  if (loading) return <TableSkeleton columns={5} />
  if (users.length === 0) return <EmptyState text="Không có user phù hợp." />

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
            <th className="px-5 py-3">Người dùng</th>
            <th className="px-5 py-3">Email</th>
            <th className="px-5 py-3">Role</th>
            <th className="px-5 py-3">Trạng thái</th>
            <th className="px-5 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-slate-100 transition hover:bg-slate-50/70">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar src={user.avatarUrl} name={user.name} />
                  <div>
                    <div className="text-sm font-medium text-slate-950">{user.name}</div>
                    <div className="mt-1 font-mono text-xs text-slate-400">#{user.id}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-slate-600">{user.email}</td>
              <td className="px-5 py-4">
                <select value={user.role} onChange={(event) => onRoleChange(user, event.target.value as 'CUSTOMER' | 'STUDIO_OWNER' | 'ADMIN')} disabled={actionId === `role-${user.id}`} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60">
                  <option value="CUSTOMER">Customer</option>
                  <option value="STUDIO_OWNER">Studio owner</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </td>
              <td className="px-5 py-4"><StatusBadge status={user.status} /></td>
              <td className="px-5 py-4">
                <div className="flex justify-end">
                  {user.status === 'LOCKED' ? (
                    <button type="button" onClick={() => onStatusChange(user, 'ACTIVE')} disabled={actionId === `status-${user.id}`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60">
                      <Unlock className="h-4 w-4" />
                      Mở khóa
                    </button>
                  ) : (
                    <button type="button" onClick={() => onStatusChange(user, 'LOCKED')} disabled={actionId === `status-${user.id}`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60">
                      <Lock className="h-4 w-4" />
                      Khóa
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Avatar({ src, name }: { src?: string; name: string }) {
  return src ? <img src={src} alt={name} className="h-10 w-10 rounded-xl border border-slate-200 object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-600">{name?.[0]?.toUpperCase() || '?'}</div>
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
    LOCKED: 'border-rose-200 bg-rose-50 text-rose-700',
    REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
    BANNED: 'border-slate-200 bg-slate-50 text-slate-600',
    INACTIVE: 'border-slate-200 bg-slate-50 text-slate-600',
    UNVERIFIED: 'border-blue-200 bg-blue-50 text-blue-700',
  }
  const label: Record<string, string> = {
    ACTIVE: 'Hoạt động',
    APPROVED: 'Đã duyệt',
    PENDING: 'Chờ duyệt',
    LOCKED: 'Bị khóa',
    REJECTED: 'Từ chối',
    BANNED: 'Bị ban',
    INACTIVE: 'Ngưng hoạt động',
    UNVERIFIED: 'Chưa xác minh',
  }
  return <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${config[status] ?? config.INACTIVE}`}>{label[status] ?? status}</span>
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="p-5">
      {Array.from({ length: 6 }).map((_, row) => (
        <div key={row} className="grid gap-4 border-b border-slate-100 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, col) => <div key={col} className="h-4 rounded-full bg-slate-100" />)}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-6 py-16 text-center text-sm text-slate-500">{text}</div>
}

function RejectModal({ studio, reason, setReason, loading, onClose, onSubmit }: { studio: AdminStudioDto; reason: string; setReason: (value: string) => void; loading: boolean; onClose: () => void; onSubmit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Từ chối studio</h2>
            <p className="mt-1 text-sm text-slate-500">{studio.studioName ?? studio.name}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={5} autoFocus placeholder="Nhập lý do từ chối..." className="mt-5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">Hủy</button>
          <button type="button" onClick={onSubmit} disabled={loading || !reason.trim()} className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400">
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
