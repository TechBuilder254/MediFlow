import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { ApprovalGate } from '@/features/patient-portal/components/ApprovalGate'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyPatientRecord, useMyMedicalRecords } from '@/services/patientPortalService'
import { formatDate } from '@/utils/cn'

export function PatientMedicalRecordsPage() {
  const { user } = useAuthStore()
  const { data: patient } = useMyPatientRecord(user?.id)
  const { data: records, isLoading } = useMyMedicalRecords(patient?.id)

  return (
    <ApprovalGate>
      <PageHeader title="Medical Records" description="Diagnoses, vitals, visit history, and treatment plans" />
      {isLoading ? <LoadingSpinner /> : !records?.length ? (
        <EmptyState icon={FileText} title="No medical records" description="Records will appear here after your visits" />
      ) : (
        <div className="space-y-4">
          {records.map((rec) => {
            const doctor = rec.doctor as { profile?: { full_name: string } } | null
            const diagnoses = rec.diagnoses as { description: string }[] | null
            const vitals = rec.vitals as Record<string, string> | null
            return (
              <Card key={rec.id}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-navy-900">{rec.chief_complaint || 'Visit'}</p>
                    <p className="text-sm text-navy-500">Dr. {doctor?.profile?.full_name || '—'} · {formatDate(rec.visit_date)}</p>
                  </div>
                </div>
                {rec.symptoms && <p className="text-sm text-navy-600 mb-2"><strong>Symptoms:</strong> {rec.symptoms}</p>}
                {rec.notes && <p className="text-sm text-navy-600 mb-2"><strong>Notes:</strong> {rec.notes}</p>}
                {diagnoses?.length ? (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-navy-500 mb-1">Diagnoses</p>
                    {diagnoses.map((d, i) => <p key={i} className="text-sm text-navy-800">• {d.description}</p>)}
                  </div>
                ) : null}
                {vitals && Object.keys(vitals).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(vitals).map(([k, v]) => (
                      <span key={k} className="rounded-lg bg-navy-50 px-3 py-1 text-xs text-navy-700 capitalize">{k}: {v}</span>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </ApprovalGate>
  )
}
