import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { canAccessRoute, getDefaultRoute, type AppRoute } from '@/lib/permissions'

interface RoleRouteProps {
  route: AppRoute
}

export function RoleRoute({ route }: RoleRouteProps) {
  const { profile, loading } = useAuthStore()
  const location = useLocation()

  if (loading) return <LoadingSpinner className="min-h-screen" />

  if (!profile) return <Navigate to="/login" replace state={{ from: location }} />

  if (!canAccessRoute(profile.role, route)) {
    return <Navigate to={getDefaultRoute(profile.role)} replace />
  }

  return <Outlet />
}
