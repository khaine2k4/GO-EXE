import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type {
  AuthUser,
  Booking,
  Dispute,
  DisputeStatus,
  Payment,
  Photographer,
  PhotographerStatus,
  Role,
  Transaction,
} from '../types'
import api from '../api/axios'
import type { Photoset } from '../types'

// ── State ─────────────────────────────────────────────────────
type AppState = {
  currentUser: AuthUser | null
  users: AuthUser[]
  photographers: Photographer[]
  photosets: import('../types').Photoset[]
  bookings: Booking[]
  payments: Payment[]
  disputes: Dispute[]
  transactions: Transaction[]
}

// ── Actions ───────────────────────────────────────────────────
type AppActions = {
  // Auth
  logout: () => void
  setCurrentUser: (user: AuthUser | null) => void
  register: (data: {
    name: string; email: string; password: string; role: Role
    bio?: string; location?: string; tags?: string[]; startingPrice?: number
  }) => AuthUser

  // Admin: photographer approval + account management
  approvePhotographer: (photographerId: string) => Promise<void>
  rejectPhotographer: (photographerId: string, reason: string) => Promise<void>
  lockUser: (userId: string) => Promise<void>
  unlockUser: (userId: string) => Promise<void>
  updateUserRole: (userId: string, role: Role) => Promise<void>

  // Photographer: Update profile
  updatePhotographer: (patch: Partial<Photographer>) => void

  // Partner: tạo gói / album → hiện Khám phá & Portfolio
  createPhotoset: (photoset: Photoset) => void
  createAlbum: (album: import('../types').Album) => void

  // Booking lifecycle
  createBooking: (input: {
    photographerId: string; date: string; packageTier: Booking['packageTier']; totalPrice: number
    cardNumber: string; expiry: string; cvc: string
  }) => Promise<Booking>
  confirmJob: (bookingId: string) => void            // Photographer xác nhận
  deliverPhotos: (bookingId: string, urls: string[]) => void  // Photographer giao ảnh
  confirmCompletion: (bookingId: string) => void     // User xác nhận hoàn thành → release
  cancelBooking: (bookingId: string) => void         // Hủy trước khi confirm

  // Dispute
  createDispute: (bookingId: string, reason: string) => void  // User khiếu nại
  resolveDispute: (bookingId: string, decision: 'refund' | 'release', adminNote?: string) => void

  // Wallet
  withdraw: (amount: number) => void

  // Demo: switch user quickly (for role demo)
  switchDemoUser: (userId: string) => void
}

type Ctx = { state: AppState; actions: AppActions }
const AppStoreContext = createContext<Ctx | null>(null)

// ── Helpers ───────────────────────────────────────────────────
const PLATFORM_FEE = 0.10
const STORAGE_KEY = 'photomarket:v2'

function uid(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}
function now() { return new Date().toISOString() }

// ── Dispatch types ────────────────────────────────────────────
type Action =
  | { type: 'SET_USER'; user: AuthUser | null }
  | { type: 'ADD_USER'; user: AuthUser }
  | { type: 'SET_PHOTOGRAPHER_STATUS'; id: string; status: PhotographerStatus }
  | { type: 'ADD_PHOTOGRAPHER'; photographer: Photographer }
  | { type: 'UPDATE_PHOTOGRAPHER'; id: string; patch: Partial<Photographer> }
  | { type: 'ADD_BOOKING'; booking: Booking }
  | { type: 'UPDATE_BOOKING'; id: string; patch: Partial<Booking> }
  | { type: 'ADD_PAYMENT'; payment: Payment }
  | { type: 'UPDATE_PAYMENT'; id: string; patch: Partial<Payment> }
  | { type: 'ADD_DISPUTE'; dispute: Dispute }
  | { type: 'UPDATE_DISPUTE'; id: string; patch: Partial<Dispute> }
  | { type: 'ADD_TRANSACTION'; tx: Transaction }
  | { type: 'ADD_BUSY_DATE'; photographerId: string; date: string }
  | { type: 'ADD_PHOTOSET'; photoset: Photoset }
  | { type: 'SET_USERS_FROM_API'; users: AuthUser[] }
  | { type: 'SET_PHOTOGRAPHERS_FROM_API'; photographers: Photographer[] }
  | { type: 'UPDATE_USER_ROLE_LOCAL'; id: string; role: Role }
  | { type: 'UPDATE_USER_STATUS_LOCAL'; id: string; status: string }

// ── Reducer ───────────────────────────────────────────────────
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER': {
      let normalizedUser = action.user
      if (normalizedUser) {
        if (normalizedUser.role === 'STUDIO_OWNER' as any) {
          normalizedUser.role = 'PHOTOGRAPHER'
        } else if (normalizedUser.role === 'CUSTOMER' as any) {
          normalizedUser.role = 'USER'
        }
      }

      const nextState = { ...state, currentUser: normalizedUser }

      if (normalizedUser && normalizedUser.role === 'PHOTOGRAPHER') {
        const existingPhotographer = state.photographers.find((p) => p.id === normalizedUser!.id)
        
        const mappedPhotographer: Photographer = {
          id: normalizedUser.id,
          name: normalizedUser.studioName || normalizedUser.name,
          location: [normalizedUser.city, normalizedUser.district].filter(Boolean).join(', ') || 'Việt Nam',
          bio: normalizedUser.bio || '',
          avatarUrl: normalizedUser.logoUrl || normalizedUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(normalizedUser.studioName || normalizedUser.name)}&backgroundColor=6366f1`,
          coverUrl: normalizedUser.coverUrl || 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&auto=format&fit=crop&q=80',
          startingPrice: existingPhotographer?.startingPrice ?? 1000000,
          rating: existingPhotographer?.rating ?? 5.0,
          reviewCount: existingPhotographer?.reviewCount ?? 0,
          tags: existingPhotographer?.tags?.length ? existingPhotographer.tags : ['Wedding', 'Portrait'],
          busyDates: existingPhotographer?.busyDates ?? [],
          status: (normalizedUser.studioStatus || (normalizedUser.status === 'ACTIVE' ? 'APPROVED' : normalizedUser.status === 'LOCKED' ? 'REJECTED' : 'PENDING')) as PhotographerStatus,
          portfolio: existingPhotographer?.portfolio ?? [],
          albums: existingPhotographer?.albums ?? [],
        }

        const exists = state.photographers.some((p) => p.id === normalizedUser!.id)
        if (exists) {
          nextState.photographers = state.photographers.map((p) =>
            p.id === normalizedUser!.id ? { ...p, ...mappedPhotographer } : p
          )
        } else {
          nextState.photographers = [...state.photographers, mappedPhotographer]
        }
      }

      return nextState
    }


    case 'ADD_USER':
      return { ...state, users: [...state.users, action.user] }

    case 'SET_PHOTOGRAPHER_STATUS':
      return {
        ...state,
        photographers: state.photographers.map((p) =>
          p.id === action.id ? { ...p, status: action.status } : p
        ),
      }

    case 'ADD_PHOTOGRAPHER': {
      const exists = state.photographers.some((p) => p.id === action.photographer.id)
      if (exists) {
        return {
          ...state,
          photographers: state.photographers.map((p) =>
            p.id === action.photographer.id ? { ...p, ...action.photographer } : p
          ),
        }
      }
      return { ...state, photographers: [...state.photographers, action.photographer] }
    }

    case 'UPDATE_PHOTOGRAPHER':
      return {
        ...state,
        photographers: state.photographers.map((p) => p.id === action.id ? { ...p, ...action.patch } : p)
      }

    case 'ADD_BOOKING':
      return { ...state, bookings: [action.booking, ...state.bookings] }

    case 'UPDATE_BOOKING':
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.id ? { ...b, ...action.patch, updatedAt: now() } : b
        ),
      }

    case 'ADD_PAYMENT':
      return { ...state, payments: [action.payment, ...state.payments] }

    case 'UPDATE_PAYMENT':
      return {
        ...state,
        payments: state.payments.map((p) =>
          p.id === action.id ? { ...p, ...action.patch } : p
        ),
      }

    case 'ADD_DISPUTE':
      return { ...state, disputes: [action.dispute, ...state.disputes] }

    case 'UPDATE_DISPUTE':
      return {
        ...state,
        disputes: state.disputes.map((d) =>
          d.id === action.id ? { ...d, ...action.patch } : d
        ),
      }

    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.tx, ...state.transactions] }

    case 'ADD_BUSY_DATE':
      return {
        ...state,
        photographers: state.photographers.map((p) =>
          p.id === action.photographerId && !p.busyDates.includes(action.date)
            ? { ...p, busyDates: [...p.busyDates, action.date] }
            : p
        ),
      }

    case 'ADD_PHOTOSET':
      return { ...state, photosets: [action.photoset, ...state.photosets] }

    case 'SET_USERS_FROM_API':
      return { ...state, users: action.users }

    case 'SET_PHOTOGRAPHERS_FROM_API':
      return { ...state, photographers: action.photographers }

    case 'UPDATE_USER_ROLE_LOCAL':
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.id ? { ...u, role: action.role } : u
        ),
      }

    case 'UPDATE_USER_STATUS_LOCAL':
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.id ? { ...u, status: action.status } : u
        ),
      }

    default:
      return state
  }
}

// ── Persistence ───────────────────────────────────────────────
function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>
      const loadedPhotographers = Array.isArray(parsed.photographers) ? parsed.photographers : []
      const user = parsed.currentUser ?? null
      if (user) {
        if (user.role === 'STUDIO_OWNER' as any) user.role = 'PHOTOGRAPHER';
        if (user.role === 'CUSTOMER' as any) user.role = 'USER';
      }
      return {
        currentUser: user,
        users: Array.isArray(parsed.users) ? parsed.users : [],
        photographers: loadedPhotographers,
        photosets: Array.isArray(parsed.photosets) ? parsed.photosets : [],
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
        payments: Array.isArray(parsed.payments) ? parsed.payments : [],
        disputes: Array.isArray(parsed.disputes) ? parsed.disputes : [],
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      }
    }
  } catch { /* ignore */ }
  return {
    currentUser: null,
    users: [],
    photographers: [],
    photosets: [],
    bookings: [],
    payments: [],
    disputes: [],
    transactions: [],
  }
}

// ── Provider ──────────────────────────────────────────────────
export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Tự động gọi API /me để lấy lại thông tin user khi F5
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(response => {
          const user = response.data;
          let normalizedRole = user.role;
          if (normalizedRole === 'STUDIO_OWNER') normalizedRole = 'PHOTOGRAPHER';
          else if (normalizedRole === 'CUSTOMER') normalizedRole = 'USER';

          dispatch({
            type: 'SET_USER', user: {
              id: String(user.id),
              name: user.name,
              email: user.email,
              role: normalizedRole,
              password: '',
              createdAt: new Date().toISOString(),
              status: user.status,
              avatarUrl: user.avatarUrl,
              phone: user.phone,
              gender: user.gender,
              dob: user.dob,
              studioName: user.studioName,
              logoUrl: user.logoUrl,
              studioPhone: user.studioPhone,
              studioEmail: user.studioEmail,
              bio: user.bio,
              city: user.city,
              district: user.district,
              addressLine: user.addressLine,
              coverUrl: user.coverUrl,
              studioStatus: user.studioStatus,
              banReason: user.banReason,
            }
          });
        })
        .catch(err => {
          console.error('Tự động đăng nhập thất bại:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'SET_USER', user: null });
        });
    }
  }, [])

  // Khi admin đăng nhập → tải danh sách users và studios thật từ backend
  useEffect(() => {
    const user = state.currentUser
    if (!user || user.role !== 'ADMIN') return
    const token = localStorage.getItem('token')
    if (!token) return

    Promise.all([
      api.get<any[]>('/admin/users'),
      api.get<any[]>('/admin/studios'),
    ])
      .then(([usersRes, studiosRes]) => {
        const mappedUsers: AuthUser[] = usersRes.data.map((u: any) => ({
          id: String(u.id),
          name: u.name,
          email: u.email,
          role: (u.role === 'CUSTOMER' ? 'USER' : u.role === 'STUDIO_OWNER' ? 'PHOTOGRAPHER' : u.role) as Role,
          password: '',
          avatarUrl: u.avatarUrl ?? undefined,
          createdAt: new Date().toISOString(),
          status: u.status,
        }))

        const mappedPhotographers: Photographer[] = studiosRes.data.map((s: any) => ({
          id: String(s.id),
          name: s.studioName ?? s.name,
          location: [s.city, s.district].filter(Boolean).join(', ') || 'Việt Nam',
          bio: s.bio ?? '',
          avatarUrl:
            s.logoUrl ??
            s.avatarUrl ??
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.studioName ?? s.name)}&backgroundColor=6366f1`,
          coverUrl: s.coverUrl ?? '',
          startingPrice: 0,
          rating: 0,
          reviewCount: 0,
          tags: [],
          busyDates: [],
          status: ((s.status ?? 'PENDING') as PhotographerStatus),
          portfolio: [],
          albums: [],
        }))

        dispatch({ type: 'SET_USERS_FROM_API', users: mappedUsers })
        dispatch({ type: 'SET_PHOTOGRAPHERS_FROM_API', photographers: mappedPhotographers })
      })
      .catch((err) => console.error('Tải dữ liệu Admin thất bại:', err))
  }, [state.currentUser?.id, state.currentUser?.role])

  const actions = useMemo<AppActions>(() => ({
    // ── Auth ──────────────────────────────────────────────────
    logout() {
      dispatch({ type: 'SET_USER', user: null })
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    setCurrentUser(user) {
      dispatch({ type: 'SET_USER', user })
    },
    register({ name, email, password, role, bio, location, tags, startingPrice }) {
      const id = uid(role === 'PHOTOGRAPHER' ? 'PH' : 'USR')
      const user: AuthUser = {
        id,
        name,
        email,
        password,
        role,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1`,
        createdAt: now(),
      }
      dispatch({ type: 'ADD_USER', user })

      if (role === 'PHOTOGRAPHER') {
        const ph: Photographer = {
          id,
          name,
          location: location ?? 'Việt Nam',
          bio: bio ?? '',
          avatarUrl: user.avatarUrl ?? '',
          coverUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&auto=format&fit=crop&q=80',
          startingPrice: startingPrice ?? 1000000,
          rating: 0,
          reviewCount: 0,
          tags: tags ?? [],
          busyDates: [],
          status: 'PENDING',
          portfolio: [],
          albums: [],
        }
        dispatch({ type: 'ADD_PHOTOGRAPHER', photographer: ph })
      }

      dispatch({ type: 'SET_USER', user })
      return user
    },

    // ── Admin: Approval + User Management ────────────────────
    async approvePhotographer(id) {
      try {
        await api.put(`/admin/studios/${id}/approve`)
      } catch (err) {
        console.error('Phê duyệt Studio thất bại:', err)
      }
      dispatch({ type: 'SET_PHOTOGRAPHER_STATUS', id, status: 'APPROVED' })
    },
    async rejectPhotographer(id, reason) {
      try {
        await api.put(`/admin/studios/${id}/reject`, { rejectionReason: reason })
      } catch (err) {
        console.error('Từ chối Studio thất bại:', err)
      }
      dispatch({ type: 'SET_PHOTOGRAPHER_STATUS', id, status: 'REJECTED' })
    },
    async lockUser(userId) {
      try {
        await api.put(`/admin/users/${userId}/status`, { status: 'LOCKED' })
        dispatch({ type: 'UPDATE_USER_STATUS_LOCAL', id: userId, status: 'LOCKED' })
      } catch (err) {
        console.error('Khóa tài khoản thất bại:', err)
      }
    },
    async unlockUser(userId) {
      try {
        await api.put(`/admin/users/${userId}/status`, { status: 'ACTIVE' })
        dispatch({ type: 'UPDATE_USER_STATUS_LOCAL', id: userId, status: 'ACTIVE' })
      } catch (err) {
        console.error('Mở khóa tài khoản thất bại:', err)
      }
    },
    async updateUserRole(userId, role) {
      try {
        await api.put(`/admin/users/${userId}/role`, { roleName: role })
        dispatch({ type: 'UPDATE_USER_ROLE_LOCAL', id: userId, role })
      } catch (err) {
        console.error('Cập nhật role thất bại:', err)
      }
    },

    // ── Photographer: Edit Profile ────────────────────────────
    updatePhotographer(patch) {
      if (!state.currentUser) return
      dispatch({ type: 'UPDATE_PHOTOGRAPHER', id: state.currentUser.id, patch })
    },

    createPhotoset(photoset) {
      dispatch({ type: 'ADD_PHOTOSET', photoset })
    },
    createAlbum(album) {
      const me = state.photographers.find((p) => p.id === album.photographerId)
      if (!me) return
      const albums = [...(me.albums ?? []), album]
      dispatch({ type: 'UPDATE_PHOTOGRAPHER', id: me.id, patch: { albums } })
    },

    // ── Booking: create with full payment ────────────────────
    async createBooking({ photographerId, date, packageTier, totalPrice, cardNumber, expiry, cvc }) {
      // Card validation
      const digits = cardNumber.replace(/\s/g, '')
      if (digits.length < 12 || !/^\d+$/.test(digits)) throw new Error('Số thẻ không hợp lệ')
      if (!/^\d{2}\/\d{2}$/.test(expiry)) throw new Error('Expiry phải dạng MM/YY')
      if (!/^\d{3,4}$/.test(cvc)) throw new Error('CVC không hợp lệ')

      // Simulate payment delay
      await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800))

      const user = state.currentUser
      if (!user) throw new Error('Chưa đăng nhập')
      const photographer = state.photographers.find((p) => p.id === photographerId)
      if (!photographer) throw new Error('Không tìm thấy nhiếp ảnh gia')

      const bookingId = uid('BK')
      const paymentId = uid('PAY')
      const platformFee = Math.round(totalPrice * PLATFORM_FEE)
      const net = totalPrice - platformFee

      const booking: Booking = {
        id: bookingId,
        customerId: user.id,
        customerName: user.name,
        photographerId,
        photographerName: photographer.name,
        date,
        packageTier,
        totalPrice,
        status: 'PENDING',
        images: [],
        createdAt: now(),
        updatedAt: now(),
      }

      const payment: Payment = {
        id: paymentId,
        bookingId,
        amount: totalPrice,
        platformFee,
        netToPhotographer: net,
        status: 'holding',
        paidAt: now(),
      }

      dispatch({ type: 'ADD_BOOKING', booking })
      dispatch({ type: 'ADD_PAYMENT', payment })
      dispatch({ type: 'ADD_BUSY_DATE', photographerId, date })

      return booking
    },

    // ── Photographer: confirm job ─────────────────────────────
    confirmJob(bookingId) {
      dispatch({ type: 'UPDATE_BOOKING', id: bookingId, patch: { status: 'CONFIRMED' } })
    },

    // ── Photographer: deliver photos ──────────────────────────
    deliverPhotos(bookingId, urls) {
      dispatch({
        type: 'UPDATE_BOOKING',
        id: bookingId,
        patch: {
          status: 'DELIVERED',
          images: urls.map((url) => ({ url, isLocked: true })),
        },
      })
    },

    // ── User: confirm completion → release ────────────────────
    confirmCompletion(bookingId) {
      dispatch({ type: 'UPDATE_BOOKING', id: bookingId, patch: { status: 'COMPLETED', images: [] } })

      const payment = state.payments.find((p) => p.bookingId === bookingId)
      if (payment) {
        dispatch({
          type: 'UPDATE_PAYMENT',
          id: payment.id,
          patch: { status: 'released', releasedAt: now() },
        })
        // unlock images
        const booking = state.bookings.find((b) => b.id === bookingId)
        if (booking) {
          dispatch({
            type: 'UPDATE_BOOKING',
            id: bookingId,
            patch: {
              status: 'COMPLETED',
              images: booking.images.map((img) => ({ ...img, isLocked: false })),
            },
          })
        }
        dispatch({
          type: 'ADD_TRANSACTION',
          tx: {
            id: uid('TX'),
            bookingId,
            type: 'RELEASE',
            amount: payment.netToPhotographer,
            createdAt: now(),
            note: 'User xác nhận hoàn thành → release cho photographer',
          },
        })
      }
    },

    // ── User: cancel ──────────────────────────────────────────
    cancelBooking(bookingId) {
      dispatch({ type: 'UPDATE_BOOKING', id: bookingId, patch: { status: 'CANCELLED' } })
      const payment = state.payments.find((p) => p.bookingId === bookingId)
      if (payment) {
        dispatch({ type: 'UPDATE_PAYMENT', id: payment.id, patch: { status: 'refunded' } })
        dispatch({
          type: 'ADD_TRANSACTION',
          tx: { id: uid('TX'), bookingId, type: 'REFUND', amount: payment.amount, createdAt: now(), note: 'Hủy booking, hoàn tiền đầy đủ' },
        })
      }
    },

    // ── User: dispute ─────────────────────────────────────────
    createDispute(bookingId, reason) {
      dispatch({ type: 'UPDATE_BOOKING', id: bookingId, patch: { status: 'DISPUTED', disputeReason: reason } })
      dispatch({
        type: 'ADD_DISPUTE',
        dispute: { id: uid('DSP'), bookingId, reason, status: 'open', createdAt: now() },
      })
    },

    // ── Admin: resolve dispute ────────────────────────────────
    resolveDispute(bookingId, decision, adminNote) {
      const dispute = state.disputes.find((d) => d.bookingId === bookingId && d.status === 'open')
      const payment = state.payments.find((p) => p.bookingId === bookingId)
      const dsStatus: DisputeStatus = decision === 'refund' ? 'resolved_refund' : 'resolved_release'

      if (dispute) {
        dispatch({ type: 'UPDATE_DISPUTE', id: dispute.id, patch: { status: dsStatus, resolvedAt: now(), adminNote } })
      }

      if (decision === 'refund') {
        dispatch({ type: 'UPDATE_BOOKING', id: bookingId, patch: { status: 'REFUNDED' } })
        if (payment) {
          dispatch({ type: 'UPDATE_PAYMENT', id: payment.id, patch: { status: 'refunded' } })
          dispatch({
            type: 'ADD_TRANSACTION',
            tx: { id: uid('TX'), bookingId, type: 'REFUND', amount: payment.amount, createdAt: now(), note: `Admin refund: ${adminNote ?? ''}` },
          })
        }
      } else {
        const booking = state.bookings.find((b) => b.id === bookingId)
        dispatch({
          type: 'UPDATE_BOOKING',
          id: bookingId,
          patch: {
            status: 'COMPLETED',
            images: booking?.images.map((img) => ({ ...img, isLocked: false })) ?? []
          }
        })
        if (payment) {
          dispatch({ type: 'UPDATE_PAYMENT', id: payment.id, patch: { status: 'released', releasedAt: now() } })
          dispatch({
            type: 'ADD_TRANSACTION',
            tx: { id: uid('TX'), bookingId, type: 'RELEASE', amount: payment.netToPhotographer, createdAt: now(), note: `Admin release: ${adminNote ?? ''}` },
          })
        }
      }
    },

    // ── Wallet: withdraw ──────────────────────────────────────
    withdraw(amount) {
      dispatch({
        type: 'ADD_TRANSACTION',
        tx: { id: uid('TX'), bookingId: '—', type: 'WITHDRAW', amount, createdAt: now(), note: 'Rút tiền (mock)' },
      })
    },

    // ── Demo: switch user quickly ─────────────────────────────
    switchDemoUser(userId) {
      const user = state.users.find((u) => u.id === userId)
      if (user) dispatch({ type: 'SET_USER', user })
    },
  }), [state.bookings, state.disputes, state.payments, state.photographers, state.users, state.currentUser])

  return <AppStoreContext.Provider value={{ state, actions }}>{children}</AppStoreContext.Provider>
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider')
  return ctx
}
