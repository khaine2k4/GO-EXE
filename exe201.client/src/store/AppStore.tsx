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
import {
  initialBookings,
  initialDisputes,
  initialPayments,
  initialTransactions,
  mockUsers,
  photographers,
  photosets,
} from '../data/mock'

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
  login: (email: string, password: string) => AuthUser | null
  logout: () => void
  setCurrentUser: (user: AuthUser | null) => void
  register: (data: {
    name: string; email: string; password: string; role: Role
    bio?: string; location?: string; tags?: string[]; startingPrice?: number
  }) => AuthUser

  // Admin: photographer approval
  approvePhotographer: (photographerId: string) => void
  rejectPhotographer: (photographerId: string) => void

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

// ── Reducer ───────────────────────────────────────────────────
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.user }

    case 'ADD_USER':
      return { ...state, users: [...state.users, action.user] }

    case 'SET_PHOTOGRAPHER_STATUS':
      return {
        ...state,
        photographers: state.photographers.map((p) =>
          p.id === action.id ? { ...p, status: action.status } : p
        ),
      }

    case 'ADD_PHOTOGRAPHER':
      return { ...state, photographers: [...state.photographers, action.photographer] }

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

    default:
      return state
  }
}

// Gộp albums từ mock vào photographers đã load (tránh mất album khi state cũ từ localStorage)
function mergePhotographersWithMockAlbums(loaded: Photographer[]): Photographer[] {
  return loaded.map((p) => {
    const fromMock = photographers.find((m) => m.id === p.id)
    if (fromMock?.albums?.length && (!p.albums || p.albums.length === 0))
      return { ...p, albums: fromMock.albums }
    return p
  })
}

// ── Persistence ───────────────────────────────────────────────
function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>
      const loadedPhotographers = Array.isArray(parsed.photographers) ? parsed.photographers : photographers
      return {
        currentUser: parsed.currentUser ?? null,
        users: Array.isArray(parsed.users) ? parsed.users : mockUsers,
        photographers: mergePhotographersWithMockAlbums(loadedPhotographers),
        photosets: Array.isArray(parsed.photosets) ? parsed.photosets : photosets,
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : initialBookings,
        payments: Array.isArray(parsed.payments) ? parsed.payments : initialPayments,
        disputes: Array.isArray(parsed.disputes) ? parsed.disputes : initialDisputes,
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : initialTransactions,
      }
    }
  } catch { /* ignore */ }
  return {
    currentUser: null,
    users: mockUsers,
    photographers,
    photosets,
    bookings: initialBookings,
    payments: initialPayments,
    disputes: initialDisputes,
    transactions: initialTransactions,
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
    if (token && !state.currentUser) {
      api.get('/auth/me')
        .then(response => {
          const user = response.data;
          dispatch({
            type: 'SET_USER', user: {
              id: String(user.id),
              name: user.name,
              email: user.email,
              role: user.role,
              password: '',
              createdAt: new Date().toISOString()
            }
          });
        })
        .catch(err => {
          console.error('Tự động đăng nhập thất bại:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        });
    }
  }, [])

  const actions = useMemo<AppActions>(() => ({
    // ── Auth ──────────────────────────────────────────────────
    login(email, password) {
      const user = state.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      )
      if (!user) return null
      dispatch({ type: 'SET_USER', user })
      return user
    },
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

    // ── Admin: Approval ───────────────────────────────────────
    approvePhotographer(id) {
      dispatch({ type: 'SET_PHOTOGRAPHER_STATUS', id, status: 'APPROVED' })
    },
    rejectPhotographer(id) {
      dispatch({ type: 'SET_PHOTOGRAPHER_STATUS', id, status: 'REJECTED' })
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
