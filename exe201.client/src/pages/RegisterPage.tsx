import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/AppStore'
import { useToast } from '../components/Toast'
import type { Role } from '../types'
import api from '../api/axios'

const TAGS_OPTIONS = ['Wedding', 'Portrait', 'Lifestyle', 'Street', 'Couple', 'Landscape', 'Travel', 'Fashion', 'Commercial', 'Documentary']

export default function RegisterPage() {
    const { actions } = useAppStore()
    const nav = useNavigate()
    const toast = useToast()

    const [role, setRole] = useState<Role>('USER')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [bio, setBio] = useState('')
    const [location, setLocation] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [startingPrice, setStartingPrice] = useState('1000000')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    function toggleTag(t: string) {
        setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        if (!name.trim() || !email.trim() || !password.trim()) {
            setError('Vui lòng điền đầy đủ thông tin.')
            return
        }
        if (password.length < 6) { setError('Mật khẩu tối thiểu 6 ký tự.'); return }
        setLoading(true)
        
        try {
            // 1. Gọi API đăng ký
            await api.post('/auth/register', {
                name,
                email,
                password,
                role, // USER hoặc PHOTOGRAPHER
                bio: role === 'PHOTOGRAPHER' ? bio : null,
                location: role === 'PHOTOGRAPHER' ? location : null
            });

            // 2. Tự động đăng nhập sau khi đăng ký thành công để tạo trải nghiệm mượt mà
            const loginRes = await api.post('/auth/login', {
                email,
                password
            });

            const { token, user: loggedUser } = loginRes.data;

            // Lưu token và thông tin user vào localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(loggedUser));
            
            // Cập nhật state trong store
            actions.setCurrentUser({
                id: String(loggedUser.id),
                name: loggedUser.name,
                email: loggedUser.email,
                role: loggedUser.role,
                password: '',
                createdAt: new Date().toISOString()
            });

            toast.push({
                type: 'success',
                title: role === 'PHOTOGRAPHER' ? 'Đăng ký thành công! Đang chờ admin duyệt.' : `Chào mừng, ${loggedUser.name}!`,
                message: role === 'PHOTOGRAPHER' ? 'Hồ sơ Studio của bạn đang được xem xét.' : '',
            });

            if (loggedUser.role === 'STUDIO_OWNER') {
                nav('/photographer/dashboard');
            } else {
                nav('/');
            }
        } catch (err: any) {
            if (err.response && err.response.data) {
                setError(err.response.data);
            } else {
                setError('Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative flex min-h-screen items-start justify-center bg-slate-50 px-4 py-20 overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 z-0">
                <div className="absolute right-[5%] top-[5%] h-64 w-64 rounded-full bg-blue-200/40 blur-[100px]" />
                <div className="absolute left-[5%] bottom-[5%] h-96 w-96 rounded-full bg-indigo-200/30 blur-[120px]" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-xl"
            >
                <div className="overflow-hidden rounded-[40px] border border-white/60 bg-white/70 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl ring-1 ring-slate-200/50">
                    {/* Header */}
                    <div className="px-8 pt-12 pb-8 text-center bg-white/40">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-900 text-white shadow-xl shadow-slate-900/20">
                            <Camera className="h-8 w-8" />
                        </div>
                        <h1 className="mt-8 text-3xl font-black tracking-tight text-slate-900">Tạo tài khoản mới</h1>
                        <p className="mt-2 text-[13px] font-bold text-slate-500 uppercase tracking-widest">Gia nhập cộng đồng PhotoMarket</p>
                    </div>

                    <div className="p-10">
                        <form onSubmit={handleSubmit} className="space-y-10">
                            {/* Role selector */}
                            <div>
                                <label className="mb-4 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">BẠN LÀ AI?</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {([['USER', 'Khách hàng', 'Tìm và đặt lịch nghệ sĩ'], ['PHOTOGRAPHER', 'Nhiếp ảnh gia', 'Cung cấp dịch vụ chuyên nghiệp']] as [Role, string, string][]).map(([r, label, desc]) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setRole(r)}
                                            className={`relative flex flex-col rounded-[24px] border p-6 text-left transition-all active:scale-[0.98] ${role === r
                                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 ring-4 ring-indigo-500/10'
                                                : 'border-slate-100 bg-white text-slate-900 hover:border-slate-200 hover:bg-slate-50/50 shadow-sm'}`}
                                        >
                                            <div className="text-[15px] font-black uppercase tracking-tight">{label}</div>
                                            <div className={`mt-1.5 text-[11px] font-medium leading-relaxed ${role === r ? 'text-indigo-100' : 'text-slate-500'}`}>{desc}</div>
                                            {role === r && <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-white shadow-[0_0_10px_white]" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Base fields */}
                            <div className="grid gap-6 md:grid-cols-2">
                                <Field label="HỌ VÀ TÊN">
                                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" required
                                        className="h-14 w-full rounded-2xl border border-slate-200/60 bg-white px-5 text-sm font-bold text-slate-900 outline-none ring-indigo-500/10 transition-all focus:border-indigo-500 focus:ring-4 placeholder:text-slate-300" />
                                </Field>
                                <Field label="ĐỊA CHỈ EMAIL">
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required
                                        className="h-14 w-full rounded-2xl border border-slate-200/60 bg-white px-5 text-sm font-bold text-slate-900 outline-none ring-indigo-500/10 transition-all focus:border-indigo-500 focus:ring-4 placeholder:text-slate-300" />
                                </Field>
                            </div>

                            <Field label="MẬT KHẨU">
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                                    className="h-14 w-full rounded-2xl border border-slate-200/60 bg-white px-5 text-sm font-bold text-slate-900 outline-none ring-indigo-500/10 transition-all focus:border-indigo-500 focus:ring-4 placeholder:text-slate-300" />
                            </Field>

                            {/* Photographer extra fields */}
                            {role === 'PHOTOGRAPHER' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-8 rounded-[32px] border border-slate-100 bg-slate-50/50 p-8">
                                    <div className="flex items-center gap-3">
                                        <div className="h-px flex-1 bg-slate-200" />
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">THÔNG TIN STUDIO</div>
                                        <div className="h-px flex-1 bg-slate-200" />
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        <Field label="ĐỊA ĐIỂM">
                                            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="TP. Hồ Chí Minh"
                                                className="h-14 w-full rounded-2xl border border-slate-200/60 bg-white px-5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-4 ring-indigo-500/10 placeholder:text-slate-300" />
                                        </Field>
                                        <Field label="GIÁ KHỞI ĐIỂM (VNĐ)">
                                            <input type="number" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} placeholder="1000000" min={0}
                                                className="h-14 w-full rounded-2xl border border-slate-200/60 bg-white px-5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-4 ring-indigo-500/10 placeholder:text-slate-300" />
                                        </Field>
                                    </div>

                                    <Field label="GIỚI THIỆU NGẮN">
                                        <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Mô tả phong cách và kinh nghiệm của bạn…" rows={3}
                                            className="w-full rounded-2xl border border-slate-200/60 bg-white px-5 py-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-500 focus:ring-4 ring-indigo-500/10 resize-none placeholder:text-slate-300 shadow-sm" />
                                    </Field>

                                    <div>
                                        <label className="mb-4 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">PHONG CÁCH CHỦ ĐẠO</label>
                                        <div className="flex flex-wrap gap-2">
                                            {TAGS_OPTIONS.map((t) => (
                                                <button key={t} type="button" onClick={() => toggleTag(t)}
                                                    className={`rounded-xl border px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all ${tags.includes(t) ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:bg-white shadow-sm'}`}>
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-5 text-[11px] font-bold text-amber-700 leading-relaxed ring-1 ring-inset ring-amber-200/40">
                                        <span className="text-lg">⏳</span>
                                        <span>Lưu ý: Hồ sơ của bạn sẽ được <strong>Admin kiểm duyệt</strong> kỹ lưỡng trước khi hiển thị công khai trên Workspace.</span>
                                    </div>
                                </motion.div>
                            )}

                            {error && (
                                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-rose-600 leading-relaxed shadow-sm">
                                    {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`group relative flex h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] ${loading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800'}`}
                            >
                                {loading ? 'ĐANG KHỞI TẠO…' : (role === 'PHOTOGRAPHER' ? '🚀 ĐĂNG KÝ PARTNER NGAY' : '✨ HOÀN TẤT ĐĂNG KÝ')}
                            </button>
                        </form>

                        <div className="mt-12 text-center">
                            <p className="text-[13px] font-medium text-slate-500">
                                Đã có tài khoản Workspace?{' '}
                                <Link to="/login" className="font-black text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest text-[11px] ml-2">
                                    Đăng nhập ngay
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
            {children}
        </label>
    )
}
