import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import GalleryPage from './pages/GalleryPage'
import PhotosetsPage from './pages/PhotosetsPage'
import PhotosetDetailPage from './pages/PhotosetDetailPage'
import AlbumDetailPage from './pages/AlbumDetailPage'
import PhotographerProfilePage from './pages/PhotographerProfilePage'
import CustomerBookingsPage from './pages/CustomerBookingsPage'
import CustomerBookingDetailPage from './pages/CustomerBookingDetailPage'
import PhotographerPortfolioPage from './pages/PhotographerPortfolioPage'
import PhotographerDashboardPage from './pages/PhotographerDashboardPage'
import PhotographerWalletPage from './pages/PhotographerWalletPage'
import PhotographerBookingDetailPage from './pages/PhotographerBookingDetailPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PremierPage from './pages/PremierPage'
import AdminSupportPage from './pages/AdminSupportPage'
import FAQPage from './pages/FAQPage'
import { useAppStore } from './store/AppStore'

function RequireAuth({ children, role }: { children: React.ReactNode; role?: string }) {
  const { state } = useAppStore()
  if (!state.currentUser) return <Navigate to="/login" replace />
  if (role && state.currentUser.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const { state } = useAppStore()
  const role = state.currentUser?.role

  return (
    <Routes>
      {/* Auth pages — no layout */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected pages inside Layout */}
      <Route element={<Layout />}>
        {/* Public / Customer */}
        <Route path="/" element={
          <RequireAuth><HomePage /></RequireAuth>
        } />
        <Route path="/gallery" element={
          <RequireAuth><GalleryPage /></RequireAuth>
        } />
        <Route path="/photosets" element={
          <RequireAuth><PhotosetsPage /></RequireAuth>
        } />
        <Route path="/photosets/:id" element={
          <RequireAuth><PhotosetDetailPage /></RequireAuth>
        } />
        <Route path="/albums/:id" element={
          <RequireAuth><AlbumDetailPage /></RequireAuth>
        } />
        <Route path="/photographers/:id" element={
          <RequireAuth><PhotographerProfilePage /></RequireAuth>
        } />
        <Route path="/customer/bookings" element={
          <RequireAuth role="USER"><CustomerBookingsPage /></RequireAuth>
        } />
        <Route path="/customer/bookings/:id" element={
          <RequireAuth role="USER"><CustomerBookingDetailPage /></RequireAuth>
        } />
        <Route path="/premier" element={
          <RequireAuth><PremierPage /></RequireAuth>
        } />
        <Route path="/faq" element={
          <RequireAuth><FAQPage /></RequireAuth>
        } />

        {/* Photographer */}
        <Route path="/photographer/portfolio" element={
          <RequireAuth role="PHOTOGRAPHER"><PhotographerPortfolioPage /></RequireAuth>
        } />
        <Route path="/photographer/dashboard" element={
          <RequireAuth role="PHOTOGRAPHER"><PhotographerDashboardPage /></RequireAuth>
        } />
        <Route path="/photographer/bookings/:id" element={
          <RequireAuth role="PHOTOGRAPHER"><PhotographerBookingDetailPage /></RequireAuth>
        } />
        <Route path="/photographer/wallet" element={
          <RequireAuth role="PHOTOGRAPHER"><PhotographerWalletPage /></RequireAuth>
        } />

        {/* Admin */}
        <Route path="/admin/users" element={
          <RequireAuth role="ADMIN"><AdminUsersPage /></RequireAuth>
        } />
        <Route path="/admin/orders" element={
          <RequireAuth role="ADMIN"><AdminOrdersPage /></RequireAuth>
        } />
        <Route path="/admin/support" element={
          <RequireAuth role="ADMIN"><AdminSupportPage /></RequireAuth>
        } />

        {/* Redirect root based on role if logged in */}
        <Route path="*" element={
          role === 'PHOTOGRAPHER' ? <Navigate to="/photographer/dashboard" replace />
            : role === 'ADMIN' ? <Navigate to="/admin/users" replace />
              : <NotFoundPage />
        } />
      </Route>
    </Routes>
  )
}
