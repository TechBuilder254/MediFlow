import { Navigate, Outlet } from 'react-router-dom'
import { XCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyPatientRecord } from '@/services/patientPortalService'
import { LoadingSpinner } from '@/components/ui/EmptyState'

export function PatientRouteGuard() {
  const { profile, loading } = useAuthStore()

  if (loading) return <LoadingSpinner className="min-h-screen" />
  if (!profile || profile.role !== 'patient') return <Navigate to="/dashboard" replace />

  return <Outlet />
}

/** Only blocks rejected accounts — portal is instant after registration */
export function ApprovalGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const { data: patient, isLoading } = useMyPatientRecord(user?.id)

  if (isLoading) return <LoadingSpinner />

  if (patient?.portal_status === 'rejected') {
    return (
      <Card className="border-red-200 bg-red-50 max-w-lg mx-auto mt-12 text-center p-8">
        <XCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-navy-900">Portal access denied</h2>
        <p className="text-sm text-navy-600 mt-2">{patient.rejection_reason || 'Contact reception.'}</p>
      </Card>
    )
  }

  return <>{children}</>
}
