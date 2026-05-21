import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/AppStore'
import { useToast } from '../components/Toast'
import api from '../api/axios'
import loginBanner from '../assets/login_banner.png'
import { GoogleLogin } from '@react-oauth/google'

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
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            actions.setCurrentUser({
                id: String(user.id),
                name: user.name,
                email: user.email,
                role: user.role,
                password: '',
                createdAt: new Date().toISOString(),
                status: user.status,
                avatarUrl: user.avatarUrl,
                studioName: user.studioName,
                logoUrl: user.logoUrl,
                bio: user.bio,
                city: user.city,
                district: user.district,
                coverUrl: user.coverUrl,
                studioStatus: user.studioStatus,
            });
            
            toast.push({ type: 'success', title: `Chào mừng, ${user.name}!`, message: '' });
            
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

    async function handleGoogleSuccess(credential: string) {
        setError('')
        setLoading(true)
        try {
            const response = await api.post('/auth/google-login', { credential })
            setLoading(false)
            const { token, user } = response.data

            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))

            actions.setCurrentUser({
                id: String(user.id),
                name: user.name,
                email: user.email,
                role: user.role,
                password: '',
                createdAt: new Date().toISOString(),
                status: user.status,
                avatarUrl: user.avatarUrl,
                studioName: user.studioName,
                logoUrl: user.logoUrl,
                bio: user.bio,
                city: user.city,
                district: user.district,
                coverUrl: user.coverUrl,
                studioStatus: user.studioStatus,
            })

            toast.push({ type: 'success', title: `Chào mừng, ${user.name}!`, message: 'Đăng nhập bằng Google thành công!' })

            if (user.role === 'ADMIN') nav('/admin/users')
            else if (user.role === 'STUDIO_OWNER') nav('/photographer/dashboard')
            else nav('/')
        } catch (err: any) {
            setLoading(false)
            setError(err.response?.data || 'Đăng nhập Google thất bại. Vui lòng thử lại.')
        }
    }


    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/50 to-violet-50/60 px-4 py-12">
            {/* Ambient Animated Gradients */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -left-[10%] -top-[10%] h-[600px] w-[600px] rounded-full bg-indigo-500/12 blur-[130px] animate-blob-slow" />
                <div className="absolute -right-[10%] -bottom-[10%] h-[700px] w-[700px] rounded-full bg-violet-400/12 blur-[150px] animate-blob-reverse" />
                <div className="absolute left-[20%] top-[30%] h-[400px] w-[400px] rounded-full bg-pink-400/8 blur-[100px] animate-blob-slow" />
                {/* Modern Decorative Lens Flare rings */}
                <div className="absolute right-[15%] top-[10%] h-[300px] w-[300px] rounded-full border border-indigo-500/5 bg-transparent opacity-60" style={{ boxShadow: 'inset 0 0 60px rgba(99, 102, 241, 0.02)' }} />
                <div className="absolute left-[10%] bottom-[15%] h-[450px] w-[450px] rounded-full border border-pink-500/5 bg-transparent opacity-40" style={{ boxShadow: '0 0 100px rgba(244, 63, 94, 0.01)' }} />
                <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #4f46e5 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-5xl"
            >
                <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/70 shadow-2xl shadow-indigo-950/5 backdrop-blur-2xl grid md:grid-cols-12 min-h-[600px]">
                    {/* Left Panel: Photo Showcase (Hidden on Mobile) */}
                    <div className="hidden md:flex md:col-span-5 relative flex-col justify-between overflow-hidden bg-slate-900 p-10 border-r border-slate-100">
                        <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity">
                            <img src={loginBanner} alt="Creative Studio" className="h-full w-full object-cover transition-transform duration-10000 hover:scale-110" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-950/90 z-10" />

                        {/* Top corner branding */}
                        <div className="relative z-20 flex items-center gap-3">
                            <img
                                src="https://t4.ftcdn.net/jpg/04/96/47/13/360_F_496471319_DbtjoUvKqyy2e9OfgBnK5mm2AXhKpa9m.jpg"
                                alt="Logo"
                                className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-indigo-600/10"
                            />
                            <div>
                                <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">PhotoMarket</span>
                                <span className="block text-[9px] font-black tracking-widest text-indigo-400 uppercase">Workspace</span>
                            </div>
                        </div>

                        {/* Bottom dynamic quote */}
                        <div className="relative z-20 mt-auto">
                            <h2 className="text-2xl font-bold tracking-tight text-white leading-tight font-sans">
                                Khai phóng <br />
                                sức sáng tạo nghệ thuật.
                            </h2>
                            <p className="mt-3 text-xs text-slate-400 leading-relaxed max-w-xs font-medium">
                                Nền tảng kết nối các Studio & Nhiếp ảnh gia chuyên nghiệp hàng đầu với khách hàng trên toàn quốc.
                            </p>
                            <div className="mt-6 flex items-center gap-2">
                                <span className="h-1.5 w-8 rounded-full bg-indigo-500" />
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Glass Form */}
                    <div className="col-span-12 md:col-span-7 flex flex-col justify-center p-8 sm:p-12 bg-white/40">
                        <div className="max-w-md w-full mx-auto">
                            <div className="text-center md:text-left mb-8">
                                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Mừng bạn trở lại</h1>
                                <p className="mt-2 text-xs font-bold text-slate-400 tracking-wider uppercase">Đăng nhập tài khoản PhotoMarket</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Địa chỉ Email</label>
                                    <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all focus-ring-premium">
                                        <div className="pl-4 text-slate-400">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@example.com"
                                            required
                                            className="h-12 w-full bg-transparent px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Mật khẩu</label>
                                    </div>
                                    <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all focus-ring-premium">
                                        <div className="pl-4 text-slate-400">
                                            <Lock className="h-5 w-5" />
                                        </div>
                                        <input
                                            type={showPw ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="h-12 w-full bg-transparent px-3 pr-12 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPw(!showPw)}
                                            className="absolute right-4 text-slate-400 transition-colors hover:text-slate-600"
                                        >
                                            {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -4 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        className="rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3 text-xs font-semibold text-rose-600 leading-relaxed shadow-inner"
                                    >
                                        ⚠️ {error}
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`group relative flex h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] cursor-pointer ${
                                        loading 
                                        ? 'bg-slate-200 text-slate-400' 
                                        : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 hover:shadow-indigo-600/30'
                                    }`}
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-3">
                                        {loading ? (
                                            <> <Spinner /> Đang xác minh...</>
                                        ) : (
                                            <><LogIn className="h-4 w-4" /> Đăng nhập ngay</>
                                        )}
                                    </div>
                                </button>
                            </form>

                            {/* Google Login Divider */}
                            <div className="mt-6 flex items-center gap-4">
                                <span className="h-px flex-1 bg-slate-100" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">hoặc</span>
                                <span className="h-px flex-1 bg-slate-100" />
                            </div>

                            {/* Google Login Button */}
                            <div className="mt-4 flex justify-center">
                                <GoogleLogin
                                    onSuccess={(credentialResponse) => {
                                        if (credentialResponse.credential) {
                                            handleGoogleSuccess(credentialResponse.credential)
                                        }
                                    }}
                                    onError={() => setError('Đăng nhập Google thất bại.')}
                                    text="signin_with"
                                    shape="rectangular"
                                    theme="outline"
                                    size="large"
                                    locale="vi"
                                    width="380"
                                />
                            </div>

                            <div className="mt-6 text-center md:text-left border-t border-slate-100 pt-6">
                                <p className="text-[13px] font-medium text-slate-500">
                                    Chưa có tài khoản Workspace?{' '}
                                    <Link to="/register" className="ml-1 text-[11px] font-bold uppercase tracking-widest text-indigo-600 transition-colors hover:text-indigo-500 hover:underline">
                                        Đăng ký tại đây
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

function Spinner() {
    return (
        <svg className="h-4 w-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    )
}
