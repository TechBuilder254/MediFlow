import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { canAccessRoute, getDefaultRoute, type AppRoute } from '@/lib/permissions'

interface RoleRouteProps {
  route: AppRoute
}

export function RoleRoute({ route }: RoleRouteProps) {
  const { profile, loading } = useAuthStore()

  if (loading) return <LoadingSpinner className="min-h-screen" />

  if (!profile) return <Navigate to="/" replace />

  if (!canAccessRoute(profile.role, route)) {
    return <Navigate to={getDefaultRoute(profile.role)} replace />
  }

  return <Outlet />
}
