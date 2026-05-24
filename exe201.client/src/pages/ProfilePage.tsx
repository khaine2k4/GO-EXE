import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, MapPin, Building, Save, Plus, Home, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/AppStore'
import { useToast } from '../components/Toast'
import api from '../api/axios'
import CustomDialog from '../components/CustomDialog'

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

    const currentUser = state.currentUser

    // Tabs state
    const [activeTab, setActiveTab] = useState<'info' | 'addresses' | 'studio' | 'password'>('info')

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

                            <label className="block space-y-2">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                    Link Ảnh Đại Diện (Avatar URL)
                                </span>
                                <input
                                    type="url"
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    placeholder="https://images.unsplash.com/..."
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                />
                            </label>

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

                                <label className="block space-y-2">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                                        Link Logo Studio (Logo URL)
                                    </span>
                                    <input
                                        type="url"
                                        value={logoUrl}
                                        onChange={(e) => setLogoUrl(e.target.value)}
                                        placeholder="https://images.unsplash.com/..."
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                    />
                                </label>

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

                            <label className="block space-y-2">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                                    Ảnh bìa Studio (Cover Photo URL)
                                </span>
                                <input
                                    type="url"
                                    value={coverUrl}
                                    onChange={(e) => setCoverUrl(e.target.value)}
                                    placeholder="https://images.unsplash.com/..."
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600 transition-colors"
                                />
                            </label>

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
