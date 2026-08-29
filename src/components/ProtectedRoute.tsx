import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { SetupProfilePage } from '@/pages/admin/SetupProfilePage'

export function ProtectedRoute() {
  const { session, broker, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-xl text-stone-600">Loading…</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  if (!broker) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10">
        <SetupProfilePage />
      </div>
    )
  }

  return <Outlet />
}
