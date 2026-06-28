import { Pill, Download } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { ApprovalGate } from '@/features/patient-portal/components/ApprovalGate'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyPatientRecord, useMyPrescriptions } from '@/services/patientPortalService'
import { formatDate } from '@/utils/cn'

export function PatientPrescriptionsPage() {
  const { user } = useAuthStore()
  const { data: patient } = useMyPatientRecord(user?.id)
  const { data: prescriptions, isLoading } = useMyPrescriptions(patient?.id)

  return (
    <ApprovalGate>
      <PageHeader title="Prescriptions" description="View and download your prescribed medicines" />
      {isLoading ? <LoadingSpinner /> : !prescriptions?.length ? (
        <EmptyState icon={Pill} title="No prescriptions" description="Prescriptions from your doctor will appear here" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {prescriptions.map((rx) => {
            const med = rx.medicine as { name: string; unit: string } | null
            const doctor = rx.doctor as { profile?: { full_name: string } } | null
            return (
              <Card key={rx.id}>
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                    <Pill className="h-5 w-5" />
                  </div>
                  <Button variant="ghost" size="sm"><Download className="h-4 w-4" /> PDF</Button>
                </div>
                <h3 className="mt-3 font-semibold text-navy-900">{med?.name || 'Medicine'}</h3>
                <div className="mt-3 space-y-1 text-sm text-navy-600">
                  <p><strong>Dosage:</strong> {rx.dosage}</p>
                  <p><strong>Frequency:</strong> {rx.frequency}</p>
                  <p><strong>Duration:</strong> {rx.duration}</p>
                  {rx.instructions && <p><strong>Instructions:</strong> {rx.instructions}</p>}
                  <p className="text-navy-400 text-xs mt-2">Prescribed by Dr. {doctor?.profile?.full_name} · {formatDate(rx.created_at)}</p>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </ApprovalGate>
  )
}
