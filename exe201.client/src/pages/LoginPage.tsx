import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, Eye, EyeOff, LogIn } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/AppStore'
import { useToast } from '../components/Toast'
import api from '../api/axios'

export default function LoginPage() {
    const { actions } = useAppStore()
    const nav = useNavigate()
    const toast = useToast()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)
        
        try {
            const response = await api.post('/auth/login', {
                email,
                password
            });

            setLoading(false);
            const { token, user } = response.data;
            
            // Lưu token và thông tin user vào localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Cập nhật state trong store để RequireAuth cho phép qua
            actions.setCurrentUser({
                id: String(user.id),
                name: user.name,
                email: user.email,
                role: user.role,
                password: '', // Không lưu mật khẩu ở client
                createdAt: new Date().toISOString()
            });
            
            toast.push({ type: 'success', title: `Chào mừng, ${user.name}!`, message: '' });
            
            // Điều hướng dựa trên Role từ DB
            if (user.role === 'ADMIN') nav('/admin/users');
            else if (user.role === 'STUDIO_OWNER') nav('/photographer/dashboard');
            else nav('/');
            
        } catch (err: any) {
            setLoading(false);
            if (err.response && err.response.data) {
                setError(err.response.data);
            } else {
                setError('Email hoặc mật khẩu không đúng, hoặc không thể kết nối tới server.');
            }
        }
    }



    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-20">
            <div className="absolute inset-0 z-0">
                <div className="absolute left-[10%] top-[10%] h-64 w-64 rounded-full bg-indigo-200/40 blur-[100px]" />
                <div className="absolute bottom-[10%] right-[10%] h-96 w-96 rounded-full bg-blue-200/30 blur-[120px]" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="overflow-hidden rounded-[32px] border border-white/60 bg-white/80 shadow-2xl shadow-indigo-200/40 ring-1 ring-slate-200/50 backdrop-blur-2xl">
                    <div className="bg-white/50 px-8 pb-8 pt-10 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/20">
                            <Camera className="h-8 w-8" />
                        </div>
                        <h1 className="mt-8 text-3xl font-black tracking-tight text-slate-900">Mừng bạn trở lại</h1>
                        <p className="mt-2 text-[13px] font-bold uppercase tracking-widest text-slate-500">PhotoMarket Workspace</p>
                    </div>

                    <div className="p-8">


                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Field label="ĐỊA CHỈ EMAIL">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    required
                                    className="h-14 w-full rounded-2xl border border-slate-200/60 bg-white px-5 text-sm font-bold text-slate-900 outline-none ring-indigo-500/10 transition-all placeholder:text-slate-300 focus:border-indigo-500 focus:ring-4"
                                />
                            </Field>

                            <Field label="MẬT KHẨU">
                                <div className="relative">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="h-14 w-full rounded-2xl border border-slate-200/60 bg-white px-5 pr-12 text-sm font-bold text-slate-900 outline-none ring-indigo-500/10 transition-all placeholder:text-slate-300 focus:border-indigo-500 focus:ring-4"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(!showPw)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-900"
                                    >
                                        {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </Field>

                            {error && (
                                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-xs font-black uppercase leading-relaxed tracking-widest text-rose-600">
                                    {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] ${loading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800'}`}
                            >
                                <div className="relative z-10 flex items-center justify-center gap-3">
                                    {loading ? (
                                        <> <Spinner /> ĐANG XÁC MINH...</>
                                    ) : (
                                        <><LogIn className="h-4 w-4" /> ĐĂNG NHẬP NGAY</>
                                    )}
                                </div>
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-[13px] font-medium text-slate-500">
                                Chưa có tài khoản?{' '}
                                <Link to="/register" className="ml-2 text-[11px] font-black uppercase tracking-widest text-indigo-600 transition-colors hover:text-indigo-700 hover:underline">
                                    Tạo mới tại đây
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

function Spinner() {
    return (
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    )
}
