import { Activity } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { ApprovalGate } from '@/features/patient-portal/components/ApprovalGate'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyPatientRecord, useMyAppointments, useMyLabResults, useMyPrescriptions } from '@/services/patientPortalService'
import { formatDate } from '@/utils/cn'

export function PatientTimelinePage() {
  const { user } = useAuthStore()
  const { data: patient } = useMyPatientRecord(user?.id)
  const { data: appointments, isLoading: a } = useMyAppointments(patient?.id)
  const { data: labs, isLoading: l } = useMyLabResults(patient?.id)
  const { data: rx, isLoading: r } = useMyPrescriptions(patient?.id)

  const isLoading = a || l || r

  const events = [
    patient ? { date: patient.created_at, label: 'Registered', type: 'register' } : null,
    ...(appointments?.map((ap) => ({ date: ap.appointment_date, label: `Consultation — ${ap.reason || 'Visit'}`, type: 'appointment' })) ?? []),
    ...(labs?.filter((t) => t.status === 'completed').map((t) => ({ date: t.completed_at || t.ordered_at, label: `Lab — ${t.test_name}`, type: 'lab' })) ?? []),
    ...(rx?.map((p) => ({ date: p.created_at, label: `Prescription issued`, type: 'rx' })) ?? []),
  ].filter(Boolean).sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime())

  return (
    <ApprovalGate>
      <PageHeader title="Health Timeline" description="Your complete healthcare journey in one view" />
      {isLoading ? <LoadingSpinner /> : (
        <div className="relative max-w-lg">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-primary-200" />
          <div className="space-y-6">
            {events.map((ev, i) => ev && (
              <div key={i} className="relative pl-10">
                <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full bg-primary-600 border-2 border-white" />
                <Card>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary-600" />
                    <p className="font-medium text-navy-900">{ev.label}</p>
                  </div>
                  <p className="text-xs text-navy-500 mt-1">{formatDate(ev.date)}</p>
                </Card>
              </div>
            ))}
            {!events.length && <p className="text-navy-500 text-sm pl-10">Your timeline will build as you use hospital services.</p>}
          </div>
        </div>
      )}
    </ApprovalGate>
  )
}
