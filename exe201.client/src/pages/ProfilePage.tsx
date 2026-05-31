import { useState, useEffect } from 'react'
import ImageUploader from '../components/ImageUploader'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { User, Lock, MapPin, Building, Save, Plus, Home, Check, Banknote, RefreshCw, AlertCircle, ArrowUpRight, DollarSign } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/AppStore'
import { useToast } from '../components/Toast'
import api from '../api/axios'
import CustomDialog from '../components/CustomDialog'
import { getCustomerWallet, createWithdrawal, getMyWithdrawals, requestWithdrawalOtp, type WalletDetail, type PayoutRequestItem } from '../services/walletApi'

interface UserAddressDto {
    addressId: number
    userId: number
    city: string
    district: string
    ward: string
    addressLine: string
    isDefault: boolean
}

export default function ProfilePage() {
    const { state, actions } = useAppStore()
    const navigate = useNavigate()
    const toast = useToast()
    const [searchParams] = useSearchParams()
    const tabParam = searchParams.get('tab')

    const currentUser = state.currentUser

    // Tabs state
    const [activeTab, setActiveTab] = useState<'info' | 'addresses' | 'studio' | 'password' | 'wallet'>(
        (tabParam === 'wallet' || tabParam === 'addresses' || tabParam === 'studio' || tabParam === 'password')
            ? tabParam
            : 'info'
    )

    // Profile fields
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [gender, setGender] = useState('')
    const [dob, setDob] = useState('')

    // Studio fields
    const [studioName, setStudioName] = useState('')
    const [logoUrl, setLogoUrl] = useState('')
    const [studioPhone, setStudioPhone] = useState('')
    const [studioEmail, setStudioEmail] = useState('')
    const [bio, setBio] = useState('')
    const [city, setCity] = useState('')
    const [district, setDistrict] = useState('')
    const [addressLine, setAddressLine] = useState('')
    const [coverUrl, setCoverUrl] = useState('')

    // Address Book state
    const [addresses, setAddresses] = useState<UserAddressDto[]>([])
    const [addressModalOpen, setAddressModalOpen] = useState(false)
    const [editingAddressId, setEditingAddressId] = useState<number | null>(null)
    const [addrCity, setAddrCity] = useState('')
    const [addrDistrict, setAddrDistrict] = useState('')
    const [addrWard, setAddrWard] = useState('')
    const [addrLine, setAddrLine] = useState('')
    const [addrIsDefault, setAddrIsDefault] = useState(false)

    // Password fields
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // Loading & error
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [dialog, setDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null)

    // Wallet state
    const [wallet, setWallet] = useState<WalletDetail | null>(null)
    const [walletLoading, setWalletLoading] = useState(false)
    const [withdrawals, setWithdrawals] = useState<PayoutRequestItem[]>([])
    const [withdrawalsLoading, setWithdrawalsLoading] = useState(false)

    // Form withdrawal states
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [bankCode, setBankCode] = useState('VCB')
    const [accountNumber, setAccountNumber] = useState('')
    const [withdrawDesc, setWithdrawDesc] = useState('')
    const [withdrawLoading, setWithdrawLoading] = useState(false)

    // OTP States
    const [otpSent, setOtpSent] = useState(false)
    const [otpCode, setOtpCode] = useState('')
    const [otpLoading, setOtpLoading] = useState(false)
    const [countdown, setCountdown] = useState(0)

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    // Helper to sanitize accent/diacritics to uppercase unaccented name
    function removeSign4VietnameseString(str: string): string {
        if (!str) return ''
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[đĐ]/g, (char) => (char === 'đ' ? 'd' : 'D'))
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase()
    }

    const fetchWalletAndPayouts = () => {
        setWalletLoading(true)
        getCustomerWallet()
            .then(setWallet)
            .catch((err) => {
                console.error("Lỗi khi tải ví tiền:", err)
                toast.push({
                    type: 'error',
                    title: 'Lỗi',
                    message: 'Không thể tải thông tin ví tiền của bạn.'
                })
            })
            .finally(() => setWalletLoading(false))

        setWithdrawalsLoading(true)
        getMyWithdrawals()
            .then(setWithdrawals)
            .catch((err) => console.error("Lỗi khi tải lịch sử rút tiền:", err))
            .finally(() => setWithdrawalsLoading(false))
    }

    useEffect(() => {
        if (activeTab === 'wallet') {
            fetchWalletAndPayouts()
        }
    }, [activeTab])

    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab === 'wallet' || tab === 'addresses' || tab === 'studio' || tab === 'password') {
            setActiveTab(tab)
        } else if (tab === 'info') {
            setActiveTab('info')
        }
    }, [searchParams])

    // Load initial user details & addresses
    useEffect(() => {
        if (!currentUser) {
            navigate('/login')
            return
        }

        setLoading(true)
        api.get('/auth/me')
            .then((res) => {
                const data = res.data
                setName(data.name || '')
                setPhone(data.phone || '')
                setAvatarUrl(data.avatarUrl || '')
                setGender(data.gender || 'MALE')
                setDob(data.dob || '')

                if (data.role === 'STUDIO_OWNER' || data.role === 'PHOTOGRAPHER') {
                    setStudioName(data.studioName || '')
                    setLogoUrl(data.logoUrl || '')
                    setStudioPhone(data.studioPhone || '')
                    setStudioEmail(data.studioEmail || '')
                    setBio(data.bio || '')
                    setCity(data.city || '')
                    setDistrict(data.district || '')
                    setAddressLine(data.addressLine || '')
                    setCoverUrl(data.coverUrl || '')
                }
            })
            .catch((err) => {
                console.error('Lỗi khi tải thông tin cá nhân:', err)
                toast.push({
                    type: 'error',
                    title: 'Lỗi',
                    message: 'Không thể tải thông tin cá nhân từ server.',
                })
            })
            .finally(() => {
                setLoading(false)
            })

        // Tải danh sách sổ địa chỉ
        fetchAddresses()
    }, [currentUser])

    async function fetchAddresses() {
        try {
            const res = await api.get('/addresses')
            setAddresses(res.data)
        } catch (err) {
            console.error('Không thể tải sổ địa chỉ:', err)
        }
    }

    async function handleUpdateProfile(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        if (!name.trim()) {
            setError('Họ và tên không được để trống.')
            return
        }
        setLoading(true)

        try {
            const res = await api.put('/auth/profile', {
                name,
                phone,
                avatarUrl,
                gender,
                dob: dob || null,
                studioName: currentUser?.role === 'PHOTOGRAPHER' ? studioName : null,
                logoUrl: currentUser?.role === 'PHOTOGRAPHER' ? logoUrl : null,
                studioPhone: currentUser?.role === 'PHOTOGRAPHER' ? studioPhone : null,
                studioEmail: currentUser?.role === 'PHOTOGRAPHER' ? studioEmail : null,
                bio: currentUser?.role === 'PHOTOGRAPHER' ? bio : null,
                city: currentUser?.role === 'PHOTOGRAPHER' ? city : null,
                district: currentUser?.role === 'PHOTOGRAPHER' ? district : null,
                addressLine: currentUser?.role === 'PHOTOGRAPHER' ? addressLine : null,
                coverUrl: currentUser?.role === 'PHOTOGRAPHER' ? coverUrl : null
            })

            const updatedUser = res.data

            // Cập nhật lại user trong store
            actions.setCurrentUser({
                ...currentUser!,
                name: updatedUser.name,
                avatarUrl: updatedUser.avatarUrl,
                status: updatedUser.status,
                studioName: updatedUser.studioName,
                logoUrl: updatedUser.logoUrl,
                bio: updatedUser.bio,
                city: updatedUser.city,
                district: updatedUser.district,
                coverUrl: updatedUser.coverUrl,
            })

            // Cập nhật lại localStorage
            const localUserData = JSON.parse(localStorage.getItem('user') || '{}')
            localStorage.setItem('user', JSON.stringify({
                ...localUserData,
                name: updatedUser.name,
                avatarUrl: updatedUser.avatarUrl
            }))

            toast.push({
                type: 'success',
                title: 'Thành công',
                message: 'Thông tin hồ sơ đã được cập nhật thành công!',
            })
        } catch (err: any) {
            setError(err.response?.data || 'Cập nhật hồ sơ thất bại.')
        } finally {
            setLoading(false)
        }
    }

    async function handleRequestOtp() {
        if (!accountNumber || accountNumber.length < 8) {
            toast.push({
                type: 'error',
                title: 'Lỗi nhập liệu',
                message: 'Vui lòng nhập số tài khoản ngân hàng hợp lệ (từ 8 đến 16 số).'
            })
            return
        }

        const amt = Number(withdrawAmount)
        if (isNaN(amt) || amt < 10000) {
            toast.push({
                type: 'error',
                title: 'Số tiền không hợp lệ',
                message: 'Số tiền rút tối thiểu là 10,000 VND.'
            })
            return
        }

        if (wallet && amt > wallet.balance) {
            toast.push({
                type: 'error',
                title: 'Số dư không đủ',
                message: 'Số dư khả dụng trong ví không đủ để thực hiện giao dịch này.'
            })
            return
        }

        setOtpLoading(true)
        try {
            const res = await requestWithdrawalOtp()
            toast.push({
                type: 'success',
                title: 'Đã gửi mã OTP',
                message: res.message || 'Mã OTP đã được gửi đến email đăng ký của bạn.'
            })
            setOtpSent(true)
            setCountdown(60)
        } catch (err: any) {
            console.error("Lỗi gửi OTP:", err)
            const errMsg = err.response?.data || 'Không thể gửi mã OTP. Vui lòng thử lại.'
            toast.push({
                type: 'error',
                title: 'Gửi OTP thất bại',
                message: typeof errMsg === 'string' ? errMsg : 'Không thể gửi mã OTP. Vui lòng thử lại.'
            })
        } finally {
            setOtpLoading(false)
        }
    }

    async function handleCreateWithdrawal(e: React.FormEvent) {
        e.preventDefault()
        if (!accountNumber || accountNumber.length < 8) {
            toast.push({
                type: 'error',
                title: 'Lỗi nhập liệu',
                message: 'Vui lòng nhập số tài khoản ngân hàng hợp lệ (từ 8 đến 16 số).'
            })
            return
        }

        const amt = Number(withdrawAmount)
        if (isNaN(amt) || amt < 10000) {
            toast.push({
                type: 'error',
                title: 'Số tiền không hợp lệ',
                message: 'Số tiền rút tối thiểu là 10,000 VND.'
            })
            return
        }

        if (wallet && amt > wallet.balance) {
            toast.push({
                type: 'error',
                title: 'Số dư không đủ',
                message: 'Số dư khả dụng trong ví không đủ để thực hiện giao dịch này.'
            })
            return
        }

        if (!otpCode || otpCode.length < 6) {
            toast.push({
                type: 'error',
                title: 'Mã OTP không hợp lệ',
                message: 'Vui lòng nhập đầy đủ mã OTP 6 chữ số.'
            })
            return
        }

        setWithdrawLoading(true)
        try {
            const sanitizedName = removeSign4VietnameseString(name || currentUser?.name || '')
            await createWithdrawal(
                amt,
                bankCode,
                accountNumber,
                withdrawDesc.trim() || `Rut tien ve tai khoan ${bankCode}`,
                otpCode.trim()
            )
            toast.push({
                type: 'success',
                title: 'Gửi yêu cầu thành công',
                message: `Yêu cầu rút tiền ${new Intl.NumberFormat('vi-VN').format(amt)} VND về tài khoản ${sanitizedName} đã được gửi thành công!`
            })
            setWithdrawAmount('')
            setAccountNumber('')
            setWithdrawDesc('')
            setOtpCode('')
            setOtpSent(false)
            // Refresh data
            fetchWalletAndPayouts()
        } catch (err: any) {
            console.error("Lỗi rút tiền:", err)
            const errMsg = err.response?.data || 'Đã có lỗi xảy ra khi tạo yêu cầu rút tiền.'
            toast.push({
                type: 'error',
                title: 'Rút tiền thất bại',
                message: typeof errMsg === 'string' ? errMsg : 'Rút tiền thất bại. Vui lòng thử lại.'
            })
        } finally {
            setWithdrawLoading(false)
        }
    }

    // Địa chỉ handlers
    function openAddAddressModal() {
        setEditingAddressId(null)
        setAddrCity('')
        setAddrDistrict('')
        setAddrWard('')
        setAddrLine('')
        setAddrIsDefault(false)
        setAddressModalOpen(true)
    }

    function openEditAddressModal(addr: UserAddressDto) {
        setEditingAddressId(addr.addressId)
        setAddrCity(addr.city || '')
        setAddrDistrict(addr.district || '')
        setAddrWard(addr.ward || '')
        setAddrLine(addr.addressLine || '')
        setAddrIsDefault(addr.isDefault)
        setAddressModalOpen(true)
    }

    async function handleSaveAddress(e: React.FormEvent) {
        e.preventDefault()
        if (!addrCity.trim() || !addrDistrict.trim() || !addrWard.trim() || !addrLine.trim()) {
            toast.push({ type: 'error', title: 'Lỗi', message: 'Vui lòng điền đầy đủ các trường địa chỉ.' })
            return
        }

        setLoading(true)
        try {
            const payload = {
                city: addrCity,
                district: addrDistrict,
                ward: addrWard,
                addressLine: addrLine,
                isDefault: addrIsDefault
            }

            if (editingAddressId) {
                await api.put(`/addresses/${editingAddressId}`, payload)
                toast.push({ type: 'success', title: 'Thành công', message: 'Cập nhật địa chỉ thành công!' })
            } else {
                await api.post('/addresses', payload)
                toast.push({ type: 'success', title: 'Thành công', message: 'Thêm địa chỉ mới thành công!' })
            }

            setAddressModalOpen(false)
            fetchAddresses()
        } catch (err: any) {
            toast.push({ type: 'error', title: 'Thất bại', message: err.response?.data || 'Không thể lưu địa chỉ.' })
        } finally {
            setLoading(false)
        }
    }

    function handleDeleteAddress(addressId: number) {
        setDialog({
            title: 'Xóa địa chỉ',
            message: 'Bạn có chắc chắn muốn xóa địa chỉ này khỏi sổ địa chỉ không?',
            onConfirm: async () => {
                try {
                    await api.delete(`/addresses/${addressId}`)
                    toast.push({ type: 'success', title: 'Thành công', message: 'Đã xóa địa chỉ thành công.' })
                    fetchAddresses()
                } catch (err) {
                    toast.push({ type: 'error', title: 'Lỗi', message: 'Không thể xóa địa chỉ.' })
                }
            }
        })
    }

    async function handleSetDefaultAddress(addr: UserAddressDto) {
        try {
            await api.put(`/addresses/${addr.addressId}`, {
                city: addr.city,
                district: addr.district,
                ward: addr.ward,
                addressLine: addr.addressLine,
                isDefault: true
            })
            toast.push({ type: 'success', title: 'Thành công', message: 'Đã đặt địa chỉ mặc định.' })
            fetchAddresses()
        } catch (err) {
            toast.push({ type: 'error', title: 'Lỗi', message: 'Không thể thiết lập mặc định.' })
        }
    }

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Vui lòng điền đầy đủ các thông tin mật khẩu.')
            return
        }

        if (newPassword.length < 6) {
            setError('Mật khẩu mới phải tối thiểu 6 ký tự.')
            return
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu mới và mật khẩu xác nhận không khớp.')
            return
        }

        setLoading(true)

        try {
            await api.put('/auth/change-password', {
                currentPassword,
                newPassword
            })

            toast.push({
                type: 'success',
                title: 'Thành công',
                message: 'Đổi mật khẩu thành công!',
            })

            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err: any) {
            setError(err.response?.data || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.')
        } finally {
            setLoading(false)
        }
    }

    if (!currentUser) return null

    return (
        <div className="mx-auto max-w-4xl space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Avatar Card */}
            <div className="relative overflow-hidden rounded-[32px] bg-white border border-slate-100 p-8 shadow-xl shadow-slate-100/50">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative h-24 w-24 overflow-hidden rounded-3xl border-4 border-slate-50 bg-indigo-50 shadow-md">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center text-3xl font-black text-indigo-600">
                                {name ? name[0] : currentUser.name[0]}
                            </span>
                        )}
                    </div>
                    <div className="text-center sm:text-left space-y-1.5">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{name || currentUser.name}</h1>
                            <span className="inline-flex rounded-full bg-indigo-50 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-indigo-700">
                                {currentUser.role === 'PHOTOGRAPHER' ? 'STUDIO PARTNER' : currentUser.role === 'ADMIN' ? 'ADMINISTRATOR' : 'CUSTOMER'}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-slate-400">{currentUser.email}</p>
                    </div>
                </div>

                {/* Sub Navigation Tabs */}
                <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
                    <button
                        onClick={() => { setActiveTab('info'); setError('') }}
                        className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all ${
                            activeTab === 'info'
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        <User className="h-4 w-4" />
                        Thông tin cá nhân
                    </button>

                    <button
                        onClick={() => { setActiveTab('addresses'); setError('') }}
                        className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all ${
                            activeTab === 'addresses'
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        <MapPin className="h-4 w-4" />
                        Sổ địa chỉ ({addresses.length})
                    </button>

                    {currentUser.role === 'PHOTOGRAPHER' && (
                        <button
                            onClick={() => { setActiveTab('studio'); setError('') }}
                            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all ${
                                activeTab === 'studio'
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            <Building className="h-4 w-4" />
                            Hồ sơ Studio
                        </button>
                    )}

                    {currentUser.role !== 'PHOTOGRAPHER' && (
                        <button
                            onClick={() => { setActiveTab('wallet'); setError('') }}
                            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all ${
                                activeTab === 'wallet'
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            <span className="text-base">💳</span>
                            Ví tiền của tôi
                        </button>
                    )}

                    <button
                        onClick={() => { setActiveTab('password'); setError('') }}
                        className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all ${
                            activeTab === 'password'
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        <Lock className="h-4 w-4" />
                        Bảo mật tài khoản
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-xs font-bold text-rose-600 shadow-sm leading-relaxed">
                    ⚠️ {error}
                </div>
            )}

            {/* Content Tabs */}
            <div className="rounded-[32px] border border-slate-100 bg-white p-8 sm:p-10 shadow-xl shadow-slate-100/50">
                <AnimatePresence mode="wait">
                    {/* INFO TAB */}
                    {activeTab === 'info' && (
                        <motion.form
                            key="info"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={handleUpdateProfile}
                            className="space-y-8"
                        >
                            <h2 className="text-lg font-black text-slate-900 tracking-tight border-b border-slate-50 pb-4">
                                Thông Tin Cá Nhân Hợp Lệ
                            </h2>

                            <div className="grid gap-6 md:grid-cols-2">
                                <label className="block space-y-2">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                        Họ và tên <span className="text-rose-500">*</span>
                                    </span>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Nguyễn Văn A"
                                        required
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                    />
                                </label>

                                <label className="block space-y-2">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                        Số điện thoại
                                    </span>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="09XXXXXXXX"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                    />
                                </label>

                                <label className="block space-y-2">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                        Giới tính
                                    </span>
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                    >
                                        <option value="MALE">Nam</option>
                                        <option value="FEMALE">Nữ</option>
                                        <option value="OTHER">Khác</option>
                                    </select>
                                </label>

                                <label className="block space-y-2">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                        Ngày sinh
                                    </span>
                                    <input
                                        type="date"
                                        value={dob}
                                        onChange={(e) => setDob(e.target.value)}
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                    />
                                </label>
                            </div>

                            <ImageUploader
                                label="Ảnh đại diện (Avatar)"
                                folder="exe201/avatars"
                                currentUrl={avatarUrl || undefined}
                                onUploaded={(url) => setAvatarUrl(url)}
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </motion.form>
                    )}

                    {/* ADDRESSES TAB */}
                    {activeTab === 'addresses' && (
                        <motion.div
                            key="addresses"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                    Sổ Địa Chỉ Giao Nhận
                                </h2>
                                <button
                                    onClick={openAddAddressModal}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-100"
                                >
                                    <Plus className="h-4 w-4" />
                                    Thêm địa chỉ mới
                                </button>
                            </div>

                            {addresses.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
                                    <MapPin className="h-12 w-12 text-slate-300 stroke-[1.5]" />
                                    <p className="text-sm font-bold">Bạn chưa lưu địa chỉ nào.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {addresses.map((addr) => (
                                        <div
                                            key={addr.addressId}
                                            className={`relative rounded-[24px] border p-6 flex flex-col justify-between transition-all ${
                                                addr.isDefault
                                                    ? 'border-indigo-600 bg-indigo-50/20 shadow-lg shadow-indigo-50'
                                                    : 'border-slate-100 bg-white hover:border-slate-200'
                                            }`}
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Home className={`h-4 w-4 ${addr.isDefault ? 'text-indigo-600' : 'text-slate-400'}`} />
                                                    <span className="text-sm font-bold text-slate-800">
                                                        {addr.addressLine}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-semibold text-slate-500 pl-6 leading-relaxed">
                                                    {addr.ward}, {addr.district}, {addr.city}
                                                </p>
                                            </div>

                                            <div className="mt-6 flex items-center justify-between pl-6">
                                                {addr.isDefault ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                        <Check className="h-3 w-3 stroke-[3]" />
                                                        Mặc định
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSetDefaultAddress(addr)}
                                                        className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-indigo-600 transition"
                                                    >
                                                        Đặt mặc định
                                                    </button>
                                                )}

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openEditAddressModal(addr)}
                                                        className="text-xs font-bold text-slate-500 hover:text-slate-900"
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAddress(addr.addressId)}
                                                        className="text-xs font-bold text-rose-500 hover:text-rose-700"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Form Address Modal */}
                            {addressModalOpen && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                                    <div className="w-full max-w-lg rounded-[32px] border border-slate-100 bg-white p-8 shadow-2xl animate-in scale-in-95 duration-200">
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6">
                                            {editingAddressId ? 'Cập Nhật Địa Chỉ' : 'Thêm Địa Chỉ Mới'}
                                        </h3>
                                        <form onSubmit={handleSaveAddress} className="space-y-5">
                                            <label className="block space-y-2">
                                                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                                                    Địa chỉ cụ thể (Số nhà, Tên đường) <span className="text-rose-500">*</span>
                                                </span>
                                                <input
                                                    type="text"
                                                    value={addrLine}
                                                    onChange={(e) => setAddrLine(e.target.value)}
                                                    placeholder="Ví dụ: 123 Nguyễn Khang"
                                                    required
                                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                                />
                                            </label>

                                            <div className="grid grid-cols-3 gap-4">
                                                <label className="block space-y-2">
                                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                                                        Phường / Xã <span className="text-rose-500">*</span>
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={addrWard}
                                                        onChange={(e) => setAddrWard(e.target.value)}
                                                        placeholder="Trung Hòa"
                                                        required
                                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                                    />
                                                </label>

                                                <label className="block space-y-2">
                                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                                                        Quận / Huyện <span className="text-rose-500">*</span>
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={addrDistrict}
                                                        onChange={(e) => setAddrDistrict(e.target.value)}
                                                        placeholder="Cầu Giấy"
                                                        required
                                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                                    />
                                                </label>

                                                <label className="block space-y-2">
                                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                                                        Tỉnh / Thành <span className="text-rose-500">*</span>
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={addrCity}
                                                        onChange={(e) => setAddrCity(e.target.value)}
                                                        placeholder="Hà Nội"
                                                        required
                                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                                    />
                                                </label>
                                            </div>

                                            <label className="flex items-center gap-3 pt-2">
                                                <input
                                                    type="checkbox"
                                                    checked={addrIsDefault}
                                                    onChange={(e) => setAddrIsDefault(e.target.checked)}
                                                    className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-xs font-black uppercase tracking-wider text-slate-600 select-none">
                                                    Đặt làm địa chỉ mặc định
                                                </span>
                                            </label>

                                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                                <button
                                                    type="button"
                                                    onClick={() => setAddressModalOpen(false)}
                                                    className="rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition"
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="rounded-2xl bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800"
                                                >
                                                    Lưu địa chỉ
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* STUDIO TAB */}
                    {activeTab === 'studio' && currentUser.role === 'PHOTOGRAPHER' && (
                        <motion.form
                            key="studio"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={handleUpdateProfile}
                            className="space-y-8"
                        >
                            <h2 className="text-lg font-black text-slate-900 tracking-tight border-b border-slate-50 pb-4">
                                Thông Tin Studio Đối Tác
                            </h2>

                            <div className="grid gap-6 md:grid-cols-2">
                                <label className="block space-y-2">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                                        Tên Studio <span className="text-rose-500">*</span>
                                    </span>
                                    <input
                                        type="text"
                                        value={studioName}
                                        onChange={(e) => setStudioName(e.target.value)}
                                        placeholder="Ví dụ: L’Amour Studio"
                                        required
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                    />
                                </label>

                                <ImageUploader
                                    label="Logo Studio"
                                    folder="exe201/studios/logos"
                                    currentUrl={logoUrl || undefined}
                                    onUploaded={(url) => setLogoUrl(url)}
                                />

                                <label className="block space-y-2">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                                        Số điện thoại liên hệ Studio
                                    </span>
                                    <input
                                        type="tel"
                                        value={studioPhone}
                                        onChange={(e) => setStudioPhone(e.target.value)}
                                        placeholder="09XXXXXXXX"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                    />
                                </label>

                                <label className="block space-y-2">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                                        Email liên hệ Studio
                                    </span>
                                    <input
                                        type="email"
                                        value={studioEmail}
                                        onChange={(e) => setStudioEmail(e.target.value)}
                                        placeholder="studio@example.com"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                    />
                                </label>
                            </div>

                            <label className="block space-y-2">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                                    Giới thiệu Studio (Bio)
                                </span>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Giới thiệu về kinh nghiệm, phong cách nhiếp ảnh..."
                                    rows={4}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 outline-none focus:border-indigo-600 transition-colors resize-none"
                                />
                            </label>

                            <div className="grid gap-6 md:grid-cols-3">
                                <label className="block space-y-2">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                                        Tỉnh / Thành phố
                                    </span>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="Hà Nội"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                    />
                                </label>

                                <label className="block space-y-2">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                                        Quận / Huyện
                                    </span>
                                    <input
                                        type="text"
                                        value={district}
                                        onChange={(e) => setDistrict(e.target.value)}
                                        placeholder="Cầu Giấy"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                    />
                                </label>

                                <label className="block space-y-2">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                                        Địa chỉ cụ thể
                                    </span>
                                    <input
                                        type="text"
                                        value={addressLine}
                                        onChange={(e) => setAddressLine(e.target.value)}
                                        placeholder="123 Nguyễn Khang"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                    />
                                </label>
                            </div>

                            <ImageUploader
                                label="Ảnh bìa Studio (Cover)"
                                folder="exe201/studios/covers"
                                currentUrl={coverUrl || undefined}
                                onUploaded={(url) => setCoverUrl(url)}
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {loading ? 'Đang lưu...' : 'Lưu thông tin Studio'}
                            </button>
                        </motion.form>
                    )}

                    {/* PASSWORD TAB */}
                    {activeTab === 'password' && (
                        <motion.form
                            key="password"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={handleChangePassword}
                            className="space-y-8"
                        >
                            <h2 className="text-lg font-black text-slate-900 tracking-tight border-b border-slate-50 pb-4">
                                Bảo Mật Tài Khoản
                            </h2>

                            <div className="space-y-6 max-w-md">
                                <label className="block space-y-2">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                        Mật khẩu hiện tại <span className="text-rose-500">*</span>
                                    </span>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                    />
                                </label>

                                <label className="block space-y-2">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                        Mật khẩu mới <span className="text-rose-500">*</span>
                                    </span>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                    />
                                </label>

                                <label className="block space-y-2">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                        Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                                    </span>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                    />
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                            >
                                <Lock className="h-4 w-4" />
                                {loading ? 'Đang lưu...' : 'Thay đổi mật khẩu'}
                            </button>
                        </motion.form>
                    )}

                    {/* WALLET TAB */}
                    {activeTab === 'wallet' && (
                        <motion.div
                            key="wallet"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                                    <Banknote className="h-6 w-6 text-indigo-600" />
                                    Ví Tiền & Rút Tiền
                                </h2>
                                <button
                                    onClick={fetchWalletAndPayouts}
                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Làm mới ví
                                </button>
                            </div>

                            {walletLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                                    <div className="text-sm font-bold text-slate-500">Đang tải thông tin ví tiền...</div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Balance card */}
                                    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl shadow-indigo-950/10">
                                        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-60 w-60 rounded-full bg-indigo-500/10 blur-3xl" />
                                        <div className="absolute left-10 bottom-0 -ml-16 -mb-16 h-40 w-40 rounded-full bg-pink-500/5 blur-2xl" />

                                        <p className="text-xs font-black uppercase tracking-widest text-indigo-200/80 flex items-center gap-1.5">
                                            <DollarSign className="h-4 w-4" />
                                            SỐ DƯ KHẢ DỤNG
                                        </p>
                                        <p className="mt-3 text-4xl font-black tracking-tight">{wallet ? new Intl.NumberFormat('vi-VN').format(wallet.balance) + ' VND' : '0 VND'}</p>
                                        
                                        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-xs font-bold text-indigo-200/90 border-t border-white/10 pt-4">
                                            <div className="flex items-center gap-1.5">
                                                <span>Tổng hoàn tiền: </span>
                                                <span className="font-extrabold text-emerald-400">+{wallet ? new Intl.NumberFormat('vi-VN').format(wallet.totalIn) + ' VND' : '0 VND'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span>Đã rút thành công: </span>
                                                <span className="font-extrabold text-rose-400">-{wallet ? new Intl.NumberFormat('vi-VN').format(wallet.totalOut) + ' VND' : '0 VND'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Left Column: Withdrawal Form */}
                                        <div className="rounded-3xl border border-slate-200/80 bg-white/50 p-6 shadow-sm backdrop-blur-sm space-y-6">
                                            <div className="space-y-1.5">
                                                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                                    <ArrowUpRight className="h-5 w-5 text-indigo-600" />
                                                    Tạo lệnh rút tiền về tài khoản
                                                </h3>
                                                <p className="text-xs text-slate-500 leading-relaxed">
                                                    Hỗ trợ chuyển khoản nhanh 24/7 qua NAPAS liên kết PayOS.
                                                </p>
                                            </div>

                                            <div className="rounded-2xl bg-amber-50/70 border border-amber-200/60 p-4 text-[11px] font-medium text-amber-800 leading-relaxed space-y-1">
                                                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-900">
                                                    <AlertCircle className="h-4 w-4" />
                                                    LƯU Ý BẢO MẬT (Strict Security Mode)
                                                </div>
                                                <p>
                                                    Họ tên chủ tài khoản ngân hàng thụ hưởng bắt buộc phải trùng khớp 100% với **Tên thật trên hồ sơ cá nhân** của bạn. Hệ thống đã khóa cố định ô này để đảm bảo an toàn tuyệt đối, tránh rủi ro rút tiền về tài khoản giả mạo.
                                                </p>
                                            </div>

                                            <form onSubmit={handleCreateWithdrawal} className="space-y-4">
                                                <div className="space-y-1">
                                                    <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Ngân hàng liên kết</label>
                                                    <select
                                                        value={bankCode}
                                                        onChange={(e) => setBankCode(e.target.value)}
                                                        disabled={otpSent}
                                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition duration-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                                    >
                                                        <option value="VCB">Vietcombank (VCB)</option>
                                                        <option value="CTG">VietinBank (CTG)</option>
                                                        <option value="BID">BIDV (BID)</option>
                                                        <option value="TCB">Techcombank (TCB)</option>
                                                        <option value="MB">MBBank (MB)</option>
                                                        <option value="ACB">ACB (ACB)</option>
                                                        <option value="VPB">VPBank (VPB)</option>
                                                        <option value="VIB">VIB (VIB)</option>
                                                        <option value="TPB">TPBank (TPB)</option>
                                                        <option value="STB">Sacombank (STB)</option>
                                                        <option value="HDB">HDBank (HDB)</option>
                                                        <option value="ICB">Industrial & Commercial Bank (ICB)</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Số tài khoản ngân hàng</label>
                                                    <input
                                                        type="text"
                                                        value={accountNumber}
                                                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                                                        disabled={otpSent}
                                                        placeholder="Nhập số tài khoản ngân hàng nhận tiền"
                                                        required
                                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition duration-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Tên chủ tài khoản (ĐÃ KHÓA)</label>
                                                    <input
                                                        type="text"
                                                        value={removeSign4VietnameseString(name || currentUser?.name || '')}
                                                        disabled
                                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm font-bold text-slate-500 outline-none cursor-not-allowed select-none"
                                                    />
                                                    <p className="px-1 text-[9px] font-bold text-indigo-600">
                                                        * Tên tự động chuyển hóa: Viết hoa không dấu chuẩn ngân hàng.
                                                    </p>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Số tiền rút (VND)</label>
                                                    <input
                                                        type="number"
                                                        value={withdrawAmount}
                                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                                        disabled={otpSent}
                                                        placeholder="Tối thiểu 50.000 VND"
                                                        min="50000"
                                                        max={wallet?.balance || 0}
                                                        required
                                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition duration-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                                    />
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-[10px] text-slate-400 font-semibold">
                                                            Rút tối thiểu: 50.000đ
                                                        </span>
                                                        {wallet && wallet.balance >= 50000 && !otpSent && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setWithdrawAmount(String(wallet.balance))}
                                                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition"
                                                            >
                                                                Rút tối đa số dư
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="block text-[10px] font-black tracking-widest text-slate-500 uppercase">Ghi chú (tùy chọn)</label>
                                                    <input
                                                        type="text"
                                                        value={withdrawDesc}
                                                        onChange={(e) => setWithdrawDesc(e.target.value)}
                                                        disabled={otpSent}
                                                        placeholder="Nội dung chuyển tiền"
                                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition duration-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                                    />
                                                </div>

                                                {otpSent && (
                                                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                                                        <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-950 uppercase tracking-wide">
                                                            <AlertCircle className="h-4 w-4 text-indigo-600 animate-pulse" />
                                                            Xác thực mã OTP rút tiền
                                                        </div>
                                                        <p className="text-[11px] font-semibold text-indigo-700 leading-relaxed">
                                                            Một mã xác thực OTP gồm 6 chữ số đã được gửi tới email đăng ký của bạn. Vui lòng kiểm tra và nhập vào ô dưới đây.
                                                        </p>
                                                        <div className="grid grid-cols-3 gap-3 items-end">
                                                            <div className="col-span-2 space-y-1">
                                                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Mã OTP</span>
                                                                <input
                                                                    type="text"
                                                                    maxLength={6}
                                                                    value={otpCode}
                                                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                                                    placeholder="Nhập mã OTP 6 số"
                                                                    required
                                                                    className="h-12 w-full rounded-2xl border border-indigo-200 bg-white px-3 text-center text-sm font-black letter-spacing-4 text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition duration-200 font-mono"
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                disabled={countdown > 0 || otpLoading}
                                                                onClick={handleRequestOtp}
                                                                className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-[10px] font-black uppercase text-slate-700 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {countdown > 0 ? `Gửi lại (${countdown}s)` : 'Gửi lại mã'}
                                                            </button>
                                                        </div>
                                                        <div className="flex justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setOtpSent(false)
                                                                    setOtpCode('')
                                                                }}
                                                                className="text-[10px] font-black uppercase text-rose-600 hover:underline"
                                                            >
                                                                Hủy & Sửa thông tin
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {!otpSent ? (
                                                    <button
                                                        type="button"
                                                        disabled={otpLoading || !wallet || wallet.balance < 50000}
                                                        onClick={handleRequestOtp}
                                                        className="w-full flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-indigo-600/10 transition hover:bg-indigo-700 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {otpLoading ? (
                                                            <>
                                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                                Đang gửi OTP...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <AlertCircle className="h-4 w-4" />
                                                                Nhận mã OTP qua Email
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="submit"
                                                        disabled={withdrawLoading || !otpCode || otpCode.length < 6}
                                                        className="w-full flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-600/10 transition hover:bg-emerald-700 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {withdrawLoading ? (
                                                            <>
                                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                                Đang xác thực & rút...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Banknote className="h-4 w-4" />
                                                                Xác nhận & Rút tiền
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </form>
                                        </div>

                                        {/* Right Column: Withdrawal and Wallet History */}
                                        <div className="space-y-8">
                                            {/* PayOS Payout Request list */}
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                                                    Lịch sử rút tiền (PayOS)
                                                </h3>

                                                {withdrawalsLoading ? (
                                                    <div className="text-center py-8 text-slate-400 font-semibold">
                                                        Đang tải lịch sử rút tiền...
                                                    </div>
                                                ) : withdrawals.length === 0 ? (
                                                    <div className="text-center py-10 text-slate-400 font-semibold border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/40 text-xs">
                                                        Chưa có yêu cầu rút tiền nào.
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                                                        {withdrawals.map((item) => (
                                                            <div key={item.payoutId} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-2.5">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="space-y-0.5">
                                                                        <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                                                                            <span>Ngân hàng: {item.bankCode}</span>
                                                                            <span className="text-[10px] text-slate-400">#{item.payoutId}</span>
                                                                        </div>
                                                                        <p className="text-[10px] font-semibold text-slate-500">
                                                                            STK: {item.accountNumber} - {item.accountName}
                                                                        </p>
                                                                    </div>
                                                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                                                                        item.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                                        item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                                        item.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                                        'bg-red-50 text-red-700 border border-red-200'
                                                                    }`}>
                                                                        {item.status === 'PENDING' ? 'Chờ duyệt' :
                                                                         item.status === 'APPROVED' ? 'Thành công' :
                                                                         item.status === 'REJECTED' ? 'Từ chối' :
                                                                         'Thất bại'}
                                                                    </span>
                                                                </div>

                                                                <div className="flex justify-between items-end border-t border-slate-50 pt-2.5 text-xs">
                                                                    <div>
                                                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed font-sans">
                                                                            {item.description || 'Rút tiền ví'}
                                                                        </p>
                                                                        {item.failureReason && (
                                                                            <p className="text-[9px] font-bold text-rose-600 mt-0.5 leading-relaxed">
                                                                                Lý do: {item.failureReason}
                                                                            </p>
                                                                        )}
                                                                        <p className="text-[9px] text-slate-400">
                                                                            {new Date(item.createdAt).toLocaleString('vi-VN')}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-sm font-black text-rose-600">
                                                                            -{new Intl.NumberFormat('vi-VN').format(item.amount)}đ
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Transaction history list */}
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                                                    Lịch sử biến động ví
                                                </h3>

                                                {!wallet || wallet.transactions.length === 0 ? (
                                                    <div className="text-center py-10 text-slate-400 font-semibold border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/40 text-xs">
                                                        Chưa có biến động số dư.
                                                    </div>
                                                ) : (
                                                    <div className="overflow-hidden rounded-2xl border border-slate-100 divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
                                                        {wallet.transactions.map((tx) => (
                                                            <div key={tx.txId} className="flex flex-col sm:flex-row justify-between sm:items-center p-3.5 gap-3 bg-white hover:bg-slate-50/50 transition">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${
                                                                            tx.txType === 'CREDIT_REFUND' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                                                        }`}>
                                                                            {tx.txType === 'CREDIT_REFUND' ? 'Nhận hoàn' : 'Trừ ví'}
                                                                        </span>
                                                                        <span className="text-[10px] font-black text-slate-900">GD #{tx.txId}</span>
                                                                    </div>
                                                                    <p className="text-xs font-semibold text-slate-600">
                                                                        {tx.description || 'Không có mô tả'}
                                                                    </p>
                                                                    <p className="text-[9px] text-slate-400">
                                                                        {new Date(tx.createdAt).toLocaleString('vi-VN')}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className={`text-xs font-black ${
                                                                        tx.txType === 'CREDIT_REFUND' ? 'text-emerald-600' : 'text-rose-600'
                                                                    }`}>
                                                                        {tx.txType === 'CREDIT_REFUND' ? '+' : '-'}{new Intl.NumberFormat('vi-VN').format(tx.amount)}đ
                                                                    </p>
                                                                    <p className="text-[9px] font-semibold text-slate-400">
                                                                        Số dư: {new Intl.NumberFormat('vi-VN').format(tx.balanceAfter)}đ
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <CustomDialog
                isOpen={!!dialog}
                title={dialog?.title || ''}
                message={dialog?.message || ''}
                onConfirm={() => {
                    dialog?.onConfirm()
                    setDialog(null)
                }}
                onCancel={() => setDialog(null)}
            />
        </div>
    )
}
