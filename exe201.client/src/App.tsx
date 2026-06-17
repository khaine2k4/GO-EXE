// PhotoMarket App Routing Configuration
import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import HomePage from './pages/HomePage'
import GalleryPage from './pages/GalleryPage'
import PhotosetsPage from './pages/PhotosetsPage'
import PhotosetDetailPage from './pages/PhotosetDetailPage'
import AlbumDetailPage from './pages/AlbumDetailPage'
import PhotographerProfilePage from './pages/PhotographerProfilePage'
import CustomerBookingsPage from './pages/CustomerBookingsPage'
import CustomerBookingDetailPage from './pages/CustomerBookingDetailPage'
import PhotographerDashboardPage from './pages/PhotographerDashboardPage'
import PhotographerBookingDetailPage from './pages/PhotographerBookingDetailPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import AdminCategoriesPage from './pages/AdminCategoriesPage'
import AdminServicesPage from './pages/AdminServicesPage'
import AdminPaymentsPage from './pages/AdminPaymentsPage'
import AdminRevenuePage from './pages/AdminRevenuePage'
import AdminCommissionsPage from './pages/AdminCommissionsPage'
import AdminSettlementsPage from './pages/AdminSettlementsPage'
import AdminPayoutsPage from './pages/AdminPayoutsPage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import PremierPage from './pages/PremierPage'
import AdminSupportPage from './pages/AdminSupportPage'
import AdminReviewsPage from './pages/AdminReviewsPage'
import FAQPage from './pages/FAQPage'
import ProfilePage from './pages/ProfilePage'
import ChatPage from './pages/ChatPage'
import { useAppStore } from './store/AppStore'
import usePageTracking from './hooks/usePageTracking'

function RequireAuth({ children, role }: { children: React.ReactNode; role?: string }) {
  const { state } = useAppStore()
  if (!state.currentUser) return <Navigate to="/login" replace />
  if (role && !roleMatches(state.currentUser.role, role)) return <Navigate to="/" replace />
  return <>{children}</>
}

function roleMatches(actual: string, expected: string) {
  if (actual === expected) return true
  if (expected === 'CUSTOMER') return actual === 'USER'
  if (expected === 'STUDIO_OWNER') return actual === 'PHOTOGRAPHER'
  if (expected === 'USER') return actual === 'CUSTOMER'
  if (expected === 'PHOTOGRAPHER') return actual === 'STUDIO_OWNER'
  return false
}

export default function App() {
  const { state } = useAppStore()
  const role = state.currentUser?.role
  usePageTracking()

  return (
    <Routes>
      {/* Auth pages — no layout */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Admin Dedicated Workspace Sidebar Layout */}
      <Route element={<RequireAuth role="ADMIN"><AdminLayout /></RequireAuth>}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/services" element={<AdminServicesPage />} />
        <Route path="/admin/payments" element={<AdminPaymentsPage />} />
        <Route path="/admin/revenue" element={<AdminRevenuePage />} />
        <Route path="/admin/commissions" element={<AdminCommissionsPage />} />
        <Route path="/admin/settlements" element={<AdminSettlementsPage />} />
        <Route path="/admin/payouts" element={<AdminPayoutsPage />} />
        <Route path="/admin/support" element={<AdminSupportPage />} />
        <Route path="/admin/reviews" element={<AdminReviewsPage />} />
        <Route path="/admin/categories" element={<AdminCategoriesPage />} />
      </Route>

      {/* Protected pages inside Layout */}
      <Route element={<Layout />}>
        {/* Public / Customer */}
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/photosets" element={<PhotosetsPage />} />
        <Route path="/photosets/:id" element={<PhotosetDetailPage />} />
        <Route path="/albums/:id" element={
          <RequireAuth><AlbumDetailPage /></RequireAuth>
        } />
        <Route path="/photographers/:id" element={<PhotographerProfilePage />} />
        <Route path="/customer/bookings" element={
          <RequireAuth role="CUSTOMER"><CustomerBookingsPage /></RequireAuth>
        } />
        <Route path="/customer/bookings/:id" element={
          <RequireAuth role="CUSTOMER"><CustomerBookingDetailPage /></RequireAuth>
        } />
        <Route path="/premier" element={<PremierPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/profile" element={
          <RequireAuth><ProfilePage /></RequireAuth>
        } />
        <Route path="/chat" element={
          <RequireAuth><ChatPage /></RequireAuth>
        } />

        {/* Photographer */}
        <Route path="/photographer/portfolio" element={
          <RequireAuth role="PHOTOGRAPHER"><Navigate to="/photographer/dashboard?tab=content&section=portfolio" replace /></RequireAuth>
        } />
        <Route path="/photographer/services" element={
          <RequireAuth role="PHOTOGRAPHER"><Navigate to="/photographer/dashboard?tab=manage&section=services" replace /></RequireAuth>
        } />
        <Route path="/photographer/packages" element={
          <RequireAuth role="PHOTOGRAPHER"><Navigate to="/photographer/dashboard?tab=manage&section=packages" replace /></RequireAuth>
        } />
        <Route path="/photographer/dashboard" element={
          <RequireAuth role="PHOTOGRAPHER"><PhotographerDashboardPage /></RequireAuth>
        } />
        <Route path="/photographer/revenue" element={
          <RequireAuth role="PHOTOGRAPHER"><Navigate to="/photographer/dashboard?tab=finance" replace /></RequireAuth>
        } />
        <Route path="/photographer/commissions" element={
          <RequireAuth role="PHOTOGRAPHER"><Navigate to="/photographer/dashboard?tab=finance" replace /></RequireAuth>
        } />
        <Route path="/photographer/finance" element={
          <RequireAuth role="PHOTOGRAPHER"><Navigate to="/photographer/dashboard?tab=finance" replace /></RequireAuth>
        } />
        <Route path="/photographer/schedule" element={
          <RequireAuth role="PHOTOGRAPHER"><Navigate to="/photographer/dashboard?tab=manage&section=schedule" replace /></RequireAuth>
        } />
        <Route path="/photographer/booking-stats" element={
          <RequireAuth role="PHOTOGRAPHER"><Navigate to="/photographer/dashboard?tab=bookings" replace /></RequireAuth>
        } />
        <Route path="/photographer/commission-setting" element={
          <RequireAuth role="PHOTOGRAPHER"><Navigate to="/photographer/dashboard?tab=finance" replace /></RequireAuth>
        } />
        <Route path="/photographer/bookings" element={
          <RequireAuth role="PHOTOGRAPHER"><Navigate to="/photographer/dashboard?tab=bookings" replace /></RequireAuth>
        } />
        <Route path="/photographer/bookings/:id" element={
          <RequireAuth role="PHOTOGRAPHER"><PhotographerBookingDetailPage /></RequireAuth>
        } />
        <Route path="/photographer/wallet" element={
          <RequireAuth role="PHOTOGRAPHER"><Navigate to="/photographer/dashboard?tab=finance" replace /></RequireAuth>
        } />

        {/* Redirect root based on role if logged in */}
        <Route path="*" element={
          role === 'PHOTOGRAPHER' ? <Navigate to="/photographer/dashboard" replace />
            : role === 'ADMIN' ? <Navigate to="/admin/dashboard" replace />
              : <NotFoundPage />
        } />
      </Route>
    </Routes>
  )
}
