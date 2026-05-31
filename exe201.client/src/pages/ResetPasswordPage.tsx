import React, { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, ArrowLeft, Shield, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../components/Toast'
import api from '../api/axios'
import loginBanner from '../assets/login_banner.png'

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token') || ''
    const email = searchParams.get('email') || ''

    const toast = useToast()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [showConfirmPw, setShowConfirmPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    // Password validation checks
    const isMinLength = password.length >= 6
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const isMatched = password !== '' && password === confirmPassword

    const isValid = isMinLength && hasLetter && hasNumber && isMatched

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!isValid) return

        setError('')
        setLoading(true)

        try {
            await api.post('/auth/reset-password', {
                email,
                token,
                newPassword: password
            })
            setLoading(false)
            setSuccess(true)
            toast.push({
                type: 'success',
                title: 'Đặt lại mật khẩu thành công!',
                message: 'Vui lòng đăng nhập với mật khẩu mới.'
            })
        } catch (err: any) {
            setLoading(false)
            setError(err.response?.data || 'Đường dẫn khôi phục không hợp lệ, hết hạn hoặc xảy ra lỗi.')
            toast.push({
                type: 'error',
                title: 'Khôi phục thất bại',
                message: 'Đường dẫn có thể đã hết hạn hoặc không chính xác.'
            })
        }
    }

    if (!token || !email) {
        return (
            <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/50 to-violet-50/60 p-6 overflow-hidden select-none">
                {/* Ambient Animated Gradients */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute -left-[10%] -top-[10%] h-[600px] w-[600px] rounded-full bg-indigo-500/12 blur-[130px] animate-blob-slow" />
                    <div className="absolute -right-[10%] -bottom-[10%] h-[700px] w-[700px] rounded-full bg-violet-400/12 blur-[150px] animate-blob-reverse" />
                    <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #4f46e5 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 w-full max-w-md rounded-[32px] border border-slate-200/80 bg-white/90 p-8 text-center shadow-2xl backdrop-blur-xl"
                >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                        <AlertCircle className="h-7 w-7" />
                    </div>
                    <h2 className="mt-6 text-xl font-extrabold tracking-tight text-slate-900 font-sans">Liên kết không hợp lệ</h2>
                    <p className="mt-3 text-xs leading-relaxed text-slate-500 font-medium">
                        Đường dẫn khôi phục mật khẩu thiếu thông tin Email hoặc Token xác thực. Vui lòng kiểm tra lại liên kết trong email hoặc gửi yêu cầu mới.
                    </p>
                    <Link
                        to="/login"
                        className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-xs font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4" /> Quay lại Đăng nhập
                    </Link>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/50 to-violet-50/60 p-6 overflow-hidden">
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
                                Bảo mật cao. <br />
                                Kết nối an toàn.
                            </h2>
                            <p className="mt-3 text-xs text-slate-400 leading-relaxed max-w-xs font-medium">
                                Sử dụng token mã hóa một lần tiêu chuẩn thế giới để bảo vệ tối đa dữ liệu nhiếp ảnh của bạn.
                            </p>
                            <div className="mt-6 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                                <span className="h-1.5 w-8 rounded-full bg-indigo-500" />
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Form Area */}
                    <div className="col-span-12 md:col-span-7 flex flex-col justify-center p-8 sm:p-12 bg-white/40">
                        <div className="max-w-md w-full mx-auto">
                            <AnimatePresence mode="wait">
                                {!success ? (
                                    <motion.div
                                        key="form-container"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                    >
                                        <div className="text-center md:text-left mb-8">
                                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Đặt lại mật khẩu</h1>
                                            <p className="mt-2 text-xs font-bold text-slate-400 tracking-wider uppercase">Tài khoản: {email}</p>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-5">
                                            {/* New Password */}
                                            <div className="space-y-1">
                                                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Mật khẩu mới</label>
                                                <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all focus-ring-premium">
                                                    <div className="pl-4 text-slate-400">
                                                        <Lock className="h-5 w-5" />
                                                    </div>
                                                    <input
                                                        type={showPw ? 'text' : 'password'}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="Mật khẩu mới"
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

                                            {/* Confirm Password */}
                                            <div className="space-y-1">
                                                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Xác nhận mật khẩu mới</label>
                                                <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all focus-ring-premium">
                                                    <div className="pl-4 text-slate-400">
                                                        <Lock className="h-5 w-5" />
                                                    </div>
                                                    <input
                                                        type={showConfirmPw ? 'text' : 'password'}
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        placeholder="Nhập lại mật khẩu mới"
                                                        required
                                                        className="h-12 w-full bg-transparent px-3 pr-12 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                                                        className="absolute right-4 text-slate-400 transition-colors hover:text-slate-600"
                                                    >
                                                        {showConfirmPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Password Validation Checklist */}
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2 text-slate-600 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Shield className={`h-4 w-4 ${isValid ? 'text-emerald-500' : 'text-indigo-500'}`} />
                                                    <span className="font-bold text-slate-700">Yêu cầu bảo mật mật khẩu:</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 mt-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Check className={`h-4 w-4 transition-all flex-shrink-0 ${isMinLength ? 'text-emerald-500 stroke-[3]' : 'text-slate-300'}`} />
                                                        <span className={`transition-all duration-300 ${isMinLength ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>Tối thiểu 6 ký tự</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className={`h-4 w-4 transition-all flex-shrink-0 ${hasLetter ? 'text-emerald-500 stroke-[3]' : 'text-slate-300'}`} />
                                                        <span className={`transition-all duration-300 ${hasLetter ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>Chứa chữ cái (a-z)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className={`h-4 w-4 transition-all flex-shrink-0 ${hasNumber ? 'text-emerald-500 stroke-[3]' : 'text-slate-300'}`} />
                                                        <span className={`transition-all duration-300 ${hasNumber ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>Chứa số (0-9)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className={`h-4 w-4 transition-all flex-shrink-0 ${isMatched ? 'text-emerald-500 stroke-[3]' : 'text-slate-300'}`} />
                                                        <span className={`transition-all duration-300 ${isMatched ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>Mật khẩu khớp nhau</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Error Message */}
                                            {error && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 border border-red-100"
                                                >
                                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                                    <span>{error}</span>
                                                </motion.div>
                                            )}

                                            {/* Submit Button */}
                                            <button
                                                type="submit"
                                                disabled={!isValid || loading}
                                                className="relative h-12 w-full select-none overflow-hidden rounded-2xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
                                            >
                                                {loading ? (
                                                    <span className="flex items-center gap-2">
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Đang thiết lập...
                                                    </span>
                                                ) : (
                                                    'Xác nhận đặt lại mật khẩu'
                                                )}
                                            </button>
                                        </form>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="success-container"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center"
                                    >
                                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                            <CheckCircle2 className="h-10 w-10 animate-bounce" />
                                        </div>
                                        <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">Thành công!</h2>
                                        <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-xs mx-auto font-medium">
                                            Mật khẩu mới của bạn đã được cập nhật thành công. Vui lòng đăng nhập để bắt đầu trải nghiệm cùng PhotoMarket.
                                        </p>
                                        <Link
                                            to="/login"
                                            className="mt-8 inline-flex w-full h-12 items-center justify-center rounded-2xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 cursor-pointer"
                                        >
                                            Đăng nhập ngay
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
