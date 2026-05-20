// ── Roles ────────────────────────────────────────────────────
export type Role = 'USER' | 'PHOTOGRAPHER' | 'ADMIN'

// ── Booking Status (new escrow flow) ─────────────────────────
// PENDING          → booking tạo, payment holding, chờ photographer xác nhận
// CONFIRMED        → photographer đã nhận job
// DELIVERED        → đã giao ảnh, chờ user confirm/dispute
// COMPLETED        → user confirm HOẶC auto-release sau 48h
// DISPUTED         → user khiếu nại, admin đang xử lý
// REFUNDED         → admin refund cho user
// CANCELLED        → hủy trước khi confirm
export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'REFUNDED'
  | 'CANCELLED'

export type PackageTier = 'STANDARD' | 'PREMIUM' | 'DELUXE'

export type MoneyVND = number

export type BookingImage = {
  url: string
  isLocked: boolean
}

// ── Payment (escrow) ─────────────────────────────────────────
export type PaymentStatus = 'holding' | 'released' | 'refunded'

export type Payment = {
  id: string
  bookingId: string
  amount: MoneyVND          // full amount paid
  platformFee: MoneyVND     // % cut
  netToPhotographer: MoneyVND
  status: PaymentStatus
  paidAt: string
  releasedAt?: string
}

// ── Booking ──────────────────────────────────────────────────
export type Booking = {
  id: string
  customerId: string
  customerName: string
  photographerId: string
  photographerName: string
  date: string              // YYYY-MM-DD
  packageTier: PackageTier
  totalPrice: MoneyVND
  status: BookingStatus
  images: BookingImage[]
  disputeReason?: string
  createdAt: string
  updatedAt: string
}

// ── Photographer approval ────────────────────────────────────
export type PhotographerStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

// Album: partner tạo album, ảnh hiện Portfolio Showcase & Khám phá
export type AlbumImage = { id: string; url: string; title?: string }

export type Album = {
  id: string
  photographerId: string
  title: string
  coverUrl: string
  images: AlbumImage[]
  createdAt: string
  /** Gói chụp ảnh liên kết — dùng trên trang Bộ sưu tập & chi tiết album */
  photosetId?: string
}

export type Photographer = {
  id: string           // same as userId
  name: string
  location: string
  bio: string
  avatarUrl: string
  coverUrl: string
  startingPrice: MoneyVND
  rating: number
  reviewCount: number
  tags: string[]
  busyDates: string[]  // YYYY-MM-DD
  status: PhotographerStatus
  portfolio: { id: string; url: string; title?: string }[]
  albums?: Album[]     // album do partner tạo → ảnh hiện Portfolio
}

// ── Auth User ────────────────────────────────────────────────
export type AuthUser = {
  id: string
  name: string
  email: string
  password: string     // plain-text for mock only
  role: Role
  avatarUrl?: string
  createdAt: string
  status?: string      // 'ACTIVE' | 'LOCKED' từ DB
}

// ── Transaction (wallet) ─────────────────────────────────────
export type Transaction = {
  id: string
  bookingId: string
  type: 'PAYMENT' | 'RELEASE' | 'REFUND' | 'WITHDRAW' | 'PLATFORM_FEE'
  amount: MoneyVND
  createdAt: string
  note?: string
}

// ── Dispute ──────────────────────────────────────────────────
export type DisputeStatus = 'open' | 'resolved_refund' | 'resolved_release'

export type Dispute = {
  id: string
  bookingId: string
  reason: string
  status: DisputeStatus
  createdAt: string
  resolvedAt?: string
  adminNote?: string
}

// ── Photoset (Moments-style packages) ─────────────────────────
export type AddOn = {
  id: string
  name: string
  price: number
}

export type PhotosetPhotographer = {
  id: string       // photographer id, e.g. PH001
  name: string
  avatar: string
  rating: number
  reviewCount: number
  location: string
  address?: string
  bio: string
}

// Album thuộc gói chụp (photoset) — ảnh trong album dùng cho Portfolio Showcase
export type PhotosetAlbumImage = { id: string; url: string; title?: string }

export type PhotosetAlbum = {
  id: string
  title: string
  coverUrl: string
  images: PhotosetAlbumImage[]
}

export type Photoset = {
  id: string
  title: string
  price: number
  currency: string
  coverImage: string
  coverAspectRatio?: number
  images: string[]
  tags: string[]
  description: string
  features: string[]
  photographer: PhotosetPhotographer
  packageDetails: {
    standard: { price: number; features: string[] }
    premium?: { price: number; features: string[] }
    deluxe?: { price: number; features: string[] }
  }
  addOns: AddOn[]
  policies: string[]
  /** Album trong gói — Portfolio Showcase của photographer = ảnh từ các album trong gói của họ */
  albums?: PhotosetAlbum[]
}

export type TimeSlot = {
  id: string
  start: string
  end: string
  duration: string
  isAvailable: boolean
  isRecommended?: boolean
}
