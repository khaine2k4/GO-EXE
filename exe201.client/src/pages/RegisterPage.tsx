import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, MapPin, Sparkles, BookOpen, Tag, MailCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../components/Toast'
import type { Role } from '../types'
import api from '../api/axios'

const TAGS_OPTIONS = ['Wedding', 'Portrait', 'Lifestyle', 'Street', 'Couple', 'Landscape', 'Travel', 'Fashion', 'Commercial', 'Documentary']

export default function RegisterPage() {
    const nav = useNavigate()
    const toast = useToast()

    const [role, setRole] = useState<Role>('USER')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [bio, setBio] = useState('')
    const [location, setLocation] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [startingPrice, setStartingPrice] = useState('1000000')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [registeredEmail, setRegisteredEmail] = useState('')

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
        if (password !== confirmPassword) { setError('Mật khẩu và xác nhận mật khẩu không khớp.'); return }
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

            // 2. Thiết lập trạng thái đăng ký thành công để hiển thị Modal kích hoạt email
            setRegisteredEmail(email);
            
            toast.push({
                type: 'success',
                title: 'Đăng ký thành công!',
                message: 'Vui lòng kiểm tra hòm thư để kích hoạt tài khoản của bạn.'
            });
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
        <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/50 to-violet-50/60 px-4 py-16 overflow-hidden">
            {/* Ambient Background Lights */}
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
                className="relative z-10 w-full max-w-2xl"
            >
                <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/70 shadow-2xl shadow-indigo-950/5 backdrop-blur-2xl">
                    <div className="px-8 pt-10 pb-6 text-center border-b border-slate-100 bg-white/40">
                        <img
                            src="https://t4.ftcdn.net/jpg/04/96/47/13/360_F_496471319_DbtjoUvKqyy2e9OfgBnK5mm2AXhKpa9m.jpg"
                            alt="Logo"
                            className="mx-auto h-14 w-14 rounded-2xl object-cover shadow-lg shadow-indigo-600/10"
                        />
                        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">Tạo tài khoản mới</h1>
                        <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Gia nhập cộng đồng PhotoMarket</p>
                    </div>

                    <div className="p-8 sm:p-10 bg-white/40">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Role selector */}
                            <div>
                                <label className="mb-3 block text-[10px] font-black tracking-widest text-slate-500 uppercase">BẠN ĐĂNG KÝ VỚI VAI TRÒ GÌ?</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {([['USER', 'Khách hàng', 'Tìm kiếm & Đặt lịch studio dễ dàng'], ['PHOTOGRAPHER', 'Nhiếp ảnh gia', 'Cung cấp dịch vụ chụp ảnh chuyên nghiệp']] as [Role, string, string][]).map(([r, label, desc]) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setRole(r)}
                                            className={`relative flex flex-col rounded-2xl border p-5 text-left transition-all active:scale-[0.98] cursor-pointer ${
                                                role === r
                                                ? 'border-indigo-500 bg-indigo-50/50 text-slate-950 shadow-xl shadow-indigo-950/5 ring-1 ring-indigo-500'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
                                            }`}
                                        >
                                            <div className="text-[14px] font-black tracking-tight">{label}</div>
                                            <div className={`mt-1 text-[11px] font-medium leading-relaxed ${role === r ? 'text-slate-600' : 'text-slate-400'}`}>{desc}</div>
                                            {role === r && (
                                                <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Base fields */}
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Họ và tên</label>
                                    <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all focus-ring-premium">
                                        <div className="pl-4 text-slate-400">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Nguyễn Văn A"
                                            required
                                            className="h-12 w-full bg-transparent px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                                        />
                                    </div>
                                    <p className="mt-1.5 text-[10px] font-bold text-amber-600 leading-relaxed px-1">
                                        ⚠️ Vui lòng nhập đúng **Họ tên thật** trùng khớp thẻ ngân hàng. Tên này sẽ được khóa cố định để đối soát rút tiền an toàn về sau.
                                    </p>
                                </div>

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
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Mật khẩu</label>
                                <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all focus-ring-premium">
                                    <div className="pl-4 text-slate-400">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="h-12 w-full bg-transparent px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Xác nhận mật khẩu</label>
                                <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all focus-ring-premium">
                                    <div className="pl-4 text-slate-400">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="h-12 w-full bg-transparent px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Photographer extra fields */}
                            {role === 'PHOTOGRAPHER' && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} 
                                    animate={{ opacity: 1, height: 'auto' }} 
                                    className="space-y-6 rounded-[24px] border border-slate-200/60 bg-white/40 p-6 overflow-hidden"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-px flex-1 bg-slate-200/60" />
                                        <div className="text-[10px] font-black tracking-widest text-indigo-600 uppercase">Thông tin Studio của bạn</div>
                                        <div className="h-px flex-1 bg-slate-200/60" />
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Thành phố hoạt động</label>
                                            <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all focus-ring-premium">
                                                <div className="pl-4 text-slate-400">
                                                    <MapPin className="h-5 w-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value)}
                                                    placeholder="Hồ Chí Minh"
                                                    className="h-12 w-full bg-transparent px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Giá khởi điểm (VNĐ)</label>
                                            <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all focus-ring-premium">
                                                <div className="pl-4 text-slate-400">
                                                    <Sparkles className="h-5 w-5" />
                                                </div>
                                                <input
                                                    type="number"
                                                    value={startingPrice}
                                                    onChange={(e) => setStartingPrice(e.target.value)}
                                                    placeholder="1000000"
                                                    min={0}
                                                    className="h-12 w-full bg-transparent px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Giới thiệu ngắn gọn</label>
                                        <div className="relative flex items-start rounded-2xl border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all focus-ring-premium">
                                            <div className="pl-4 pt-3.5 text-slate-400">
                                                <BookOpen className="h-5 w-5" />
                                            </div>
                                            <textarea
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                placeholder="Mô tả phong cách chụp và kinh nghiệm của studio..."
                                                rows={3}
                                                className="w-full bg-transparent px-3 py-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 resize-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-3 block text-[10px] font-black tracking-widest text-slate-500 uppercase">Phong cách chính</label>
                                        <div className="flex flex-wrap gap-2">
                                            {TAGS_OPTIONS.map((t) => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => toggleTag(t)}
                                                    className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                                        tags.includes(t)
                                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-md shadow-indigo-950/5'
                                                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800'
                                                    }`}
                                                >
                                                    <Tag className="h-3.5 w-3.5" />
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-[11px] font-semibold text-amber-800 leading-relaxed">
                                        <span className="text-sm">⏳</span>
                                        <span>Lưu ý: Đối với tài khoản đối tác Photographer, tài khoản của bạn sẽ được kích hoạt ngay sau khi <strong>Ban quản trị hệ thống phê duyệt</strong> hồ sơ.</span>
                                    </div>
                                </motion.div>
                            )}

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -4 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    className="rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3.5 text-xs font-semibold text-rose-600 leading-relaxed shadow-inner"
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
                                {loading ? (
                                    <> <Spinner /> Đang khởi tạo...</>
                                ) : (
                                    role === 'PHOTOGRAPHER' ? '🚀 Đăng ký Partner' : '✨ Hoàn tất đăng ký'
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center border-t border-slate-100 pt-6">
                            <p className="text-[13px] font-medium text-slate-500">
                                Đã có tài khoản Workspace?{' '}
                                <Link to="/login" className="ml-1 font-bold text-indigo-600 hover:text-indigo-500 transition-colors uppercase tracking-widest text-[11px] hover:underline">
                                    Đăng nhập ngay
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Inbox Verification Modal */}
            <AnimatePresence>
                {registeredEmail && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/95 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl text-center"
                        >
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-600/5 mb-6">
                                <MailCheck className="h-10 w-10 animate-bounce" />
                            </div>

                            <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">Kiểm tra hộp thư!</h3>
                            <p className="mt-2 text-xs font-bold text-indigo-600 tracking-wider uppercase">Đăng ký hoàn tất</p>
                            
                            <p className="mt-4 text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                                Một liên kết kích hoạt đã được gửi tới địa chỉ email: <strong className="text-slate-800">{registeredEmail}</strong>.<br/><br/>
                                Vui lòng mở hòm thư điện tử và nhấp vào liên kết để kích hoạt tài khoản của bạn trước khi đăng nhập.
                            </p>

                            <button
                                type="button"
                                onClick={() => nav('/login')}
                                className="mt-8 h-12 w-full rounded-2xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/10 hover:bg-indigo-500 transition-all active:scale-[0.98] cursor-pointer"
                            >
                                Đóng & Đăng nhập
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
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
