export type Category = {
  id: number
  name: string
  description?: string
  iconUrl?: string
  isActive: boolean
  sortOrder: number
}

export type ServiceSummary = {
  id: number
  studioId: number
  studioName: string
  categoryId: number
  categoryName: string
  name: string
  description?: string
  thumbnailUrl?: string
  city?: string
  lat?: number
  lng?: number
  isActive: boolean
  minPrice?: number
  maxPrice?: number
  rating: number
  reviewCount: number
}

export type PackageItem = {
  id: number
  serviceId: number
  name: string
  description?: string
  price: number
  durationHours?: number
  maxPhotos?: number
  inclusions?: string
  isActive: boolean
  sortOrder: number
}

export type PortfolioItem = {
  id: number
  studioId: number
  serviceId?: number
  imageUrl: string
  caption?: string
  sortOrder: number
  uploadedAt: string
}

export type ReviewItem = {
  id: number
  customerName: string
  rating: number
  comment?: string
  createdAt: string
}

export type ServiceDetail = ServiceSummary & {
  district?: string
  addressLine?: string
  studioLogoUrl?: string
  studioCoverUrl?: string
  images: string[]
  packages: PackageItem[]
  portfolio: PortfolioItem[]
  reviews: ReviewItem[]
}

export type StudioDetail = {
  id: number
  name: string
  description?: string
  city?: string
  district?: string
  addressLine?: string
  lat?: number
  lng?: number
  logoUrl?: string
  coverUrl?: string
  rating: number
  reviewCount: number
  services: ServiceSummary[]
  portfolio: PortfolioItem[]
  reviews: ReviewItem[]
}

export type StudioSummary = {
  id: number
  name: string
  description?: string
  city?: string
  district?: string
  addressLine?: string
  lat?: number
  lng?: number
  logoUrl?: string
  coverUrl?: string
  rating: number
  reviewCount: number
  serviceCount: number
  portfolioCount: number
  minPrice?: number
  categories: string[]
}

export type StudioDashboard = {
  totalServices: number
  activeServices: number
  hiddenServices: number
  totalPackages: number
  totalPortfolios: number
  portfolioImages: number
  totalBookings: number
  pendingBookings: number
  completedBookings: number
  totalRevenue: number
  grossRevenue: number
  avgRating: number
  rating: number
  totalReviews: number
  reviewCount: number
  recentServices: ServiceSummary[]
  recentPackages: PackageItem[]
}
