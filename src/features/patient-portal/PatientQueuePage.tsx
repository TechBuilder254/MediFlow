import { Clock, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { ApprovalGate } from '@/features/patient-portal/components/ApprovalGate'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyPatientRecord, useMyQueue } from '@/services/patientPortalService'

export function PatientQueuePage() {
  const { user } = useAuthStore()
  const { data: patient } = useMyPatientRecord(user?.id)
  const { data: queue, isLoading } = useMyQueue(patient?.id)

  return (
    <ApprovalGate>
      <PageHeader title="Live Queue Tracking" description="See your position and estimated wait time" />
      {isLoading ? <LoadingSpinner /> : !queue ? (
        <EmptyState icon={Clock} title="Not in queue" description="Check in at reception when you arrive for your appointment" />
      ) : (
        <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
          <Card className="text-center border-2 border-navy-200">
            <Users className="h-8 w-8 text-navy-400 mx-auto mb-2" />
            <p className="text-xs text-navy-500">Current Queue</p>
            <p className="text-4xl font-bold text-navy-900 mt-1">{queue.entry.ticket_number - queue.peopleAhead}</p>
          </Card>
          <Card className="text-center border-2 border-primary-300 bg-primary-50">
            <Clock className="h-8 w-8 text-primary-600 mx-auto mb-2" />
            <p className="text-xs text-primary-700">Your Number</p>
            <p className="text-4xl font-bold text-primary-700 mt-1">{queue.entry.ticket_number}</p>
          </Card>
          <Card className="text-center border-2 border-amber-200 bg-amber-50">
            <p className="text-xs text-amber-700">Estimated Wait</p>
            <p className="text-4xl font-bold text-amber-700 mt-3">{queue.peopleAhead * 5}</p>
            <p className="text-sm text-amber-600">minutes</p>
          </Card>
        </div>
      )}
    </ApprovalGate>
  )
}
