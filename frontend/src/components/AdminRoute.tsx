import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export default function AdminRoute() {
  const { user, isAuthenticated } = useAuthStore()
  const isAdminUser = Boolean(user?.isAdmin || user?.role === 'ADMIN')

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdminUser) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
