import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { getDefaultRoute } from '@/lib/permissions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { signOut } from '@/features/auth/authService'

function SuspendedAccount() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-navy-50">
      <Card className="max-w-md text-center p-8">
        <h2 className="text-lg font-semibold text-navy-900">Account suspended</h2>
        <p className="text-sm text-navy-600 mt-2">Your account has been disabled. Contact the hospital administrator.</p>
        <Button className="mt-6" variant="outline" onClick={() => signOut()}>Sign out</Button>
      </Card>
    </div>
  )
}

export function ProtectedRoute() {
  const { user, profile, loading } = useAuthStore()

  if (loading) return <LoadingSpinner className="min-h-screen" />
  if (!user) return <Navigate to="/login" replace />
  if (profile && !profile.is_active) return <SuspendedAccount />

  return <Outlet />
}

export function PublicRoute() {
  const { user, profile, loading } = useAuthStore()
  if (loading) return <LoadingSpinner className="min-h-screen" />
  if (user && profile) return <Navigate to={getDefaultRoute(profile.role)} replace />
  return <Outlet />
}
