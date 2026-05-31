import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, AlertCircle, ArrowLeft, MailCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../components/Toast'
import api from '../api/axios'

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token') || ''
    const email = searchParams.get('email') || ''

    const toast = useToast()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (!token || !email) {
            setError('Đường dẫn xác nhận không đầy đủ thông tin.')
            setLoading(false)
            return
        }

        async function triggerVerify() {
            try {
                const res = await api.post('/auth/verify-email', {
                    email,
                    token
                })
                setLoading(false)
                setSuccess(true)
                toast.push({
                    type: 'success',
                    title: 'Xác thực thành công!',
                    message: res.data.message || 'Tài khoản của bạn đã được kích hoạt.'
                })
            } catch (err: any) {
                setLoading(false)
                setError(err.response?.data || 'Đường dẫn kích hoạt không hợp lệ hoặc đã hết hạn.')
                toast.push({
                    type: 'error',
                    title: 'Xác thực thất bại',
                    message: 'Mã xác thực có thể đã hết hiệu lực.'
                })
            }
        }

        // Tự động gọi API kích hoạt sau khi page mount
        const timer = setTimeout(() => {
            triggerVerify()
        }, 1200) // tạo khoảng trễ nhỏ để trải nghiệm mượt mà hơn

        return () => clearTimeout(timer)
    }, [token, email])

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/50 to-violet-50/60 p-6 overflow-hidden">
            {/* Ambient Animated Gradients */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -left-[10%] -top-[10%] h-[600px] w-[600px] rounded-full bg-indigo-500/12 blur-[130px] animate-blob-slow" />
                <div className="absolute -right-[10%] -bottom-[10%] h-[700px] w-[700px] rounded-full bg-violet-400/12 blur-[150px] animate-blob-reverse" />
                <div className="absolute left-[20%] top-[30%] h-[400px] w-[400px] rounded-full bg-pink-400/8 blur-[100px] animate-blob-slow" />
                <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #4f46e5 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/80 p-8 text-center shadow-2xl shadow-indigo-950/5 backdrop-blur-2xl">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading-state"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="py-8 space-y-6"
                            >
                                <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600">
                                    <svg className="animate-spin h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                                        <MailCheck className="h-6 w-6 animate-pulse" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-900 font-sans">Đang xác thực tài khoản</h2>
                                    <p className="mt-2 text-xs font-bold text-slate-400 tracking-wider uppercase">Tài khoản: {email}</p>
                                    <p className="mt-4 text-xs font-medium text-slate-500 max-w-xs mx-auto leading-relaxed">
                                        Vui lòng chờ trong giây lát trong khi hệ thống xác nhận liên kết kích hoạt email của bạn...
                                    </p>
                                </div>
                            </motion.div>
                        ) : success ? (
                            <motion.div
                                key="success-state"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-8"
                            >
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-600/10">
                                    <CheckCircle2 className="h-10 w-10 animate-bounce" />
                                </div>
                                <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900 font-sans">Kích hoạt thành công!</h2>
                                <p className="mt-2 text-xs font-bold text-indigo-600 tracking-wider uppercase">Tài khoản đã hoạt động</p>
                                <p className="mt-3 text-xs text-slate-500 leading-relaxed max-w-xs mx-auto font-medium">
                                    Chúc mừng bạn! Địa chỉ email <strong>{email}</strong> đã được xác minh thành công. Bây giờ bạn đã có thể bắt đầu đăng nhập vào sàn GO! Marketplace.
                                </p>
                                <Link
                                    to="/login"
                                    className="mt-8 inline-flex w-full h-12 items-center justify-center rounded-2xl bg-indigo-600 text-xs font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    Đăng nhập ngay
                                </Link>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="error-state"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-8"
                            >
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-500 shadow-lg shadow-rose-600/10">
                                    <AlertCircle className="h-10 w-10 animate-pulse" />
                                </div>
                                <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900 font-sans">Kích hoạt thất bại</h2>
                                <p className="mt-2 text-xs font-bold text-rose-500 tracking-wider uppercase">Liên kết không hợp lệ</p>
                                <p className="mt-3 text-xs text-slate-500 leading-relaxed max-w-xs mx-auto font-medium">
                                    {error}
                                </p>
                                <Link
                                    to="/login"
                                    className="mt-8 inline-flex w-full h-12 items-center justify-center gap-2 rounded-2xl bg-slate-800 text-xs font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-slate-950/15 hover:bg-slate-700 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    <ArrowLeft className="h-4 w-4" /> Quay lại Đăng nhập
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}
