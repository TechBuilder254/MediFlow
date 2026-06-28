import { Shield } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { ApprovalGate } from '@/features/patient-portal/components/ApprovalGate'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyPatientRecord } from '@/services/patientPortalService'

export function PatientInsurancePage() {
  const { user } = useAuthStore()
  const { data: patient, isLoading } = useMyPatientRecord(user?.id)

  return (
    <ApprovalGate>
      <PageHeader title="Insurance" description="View your coverage, claims, and policy details" />
      {isLoading ? <LoadingSpinner /> : (
        <Card>
          <Shield className="h-8 w-8 text-primary-600 mb-4" />
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {[
              ['Provider', patient?.insurance_provider],
              ['Policy Number', patient?.insurance_number],
              ['Coverage', 'Comprehensive'],
              ['Claims', '0 pending'],
              ['Remaining Limit', 'Contact provider'],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-xl bg-navy-50 px-4 py-3">
                <p className="text-xs text-navy-400">{label}</p>
                <p className="font-medium text-navy-800 mt-0.5">{(value as string) || '—'}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </ApprovalGate>
  )
}
