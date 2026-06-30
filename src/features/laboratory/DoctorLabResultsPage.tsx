import { FlaskConical, Lock } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import { useDoctorRecord } from '@/services/doctorService'
import { useDoctorLabResults } from '@/services/clinicalService'
import { formatDate } from '@/utils/cn'
import type { LabStatus } from '@/types'

const statusMap: Record<LabStatus, 'warning' | 'info' | 'success' | 'danger'> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'danger',
}

export function DoctorLabResultsPage() {
  const { user } = useAuthStore()
  const { data: doctor } = useDoctorRecord(user?.id)
  const { data: tests, isLoading } = useDoctorLabResults(doctor?.id)

  return (
    <div>
      <PageHeader
        title="Lab Results"
        description="Results from lab technicians — read-only. Use these to decide treatment and admission."
      />

      <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 flex items-start gap-2">
        <Lock className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>Lab data is entered by technicians and cannot be edited here. Order new tests during consultation.</span>
      </div>

      {isLoading ? <LoadingSpinner /> : !tests?.length ? (
        <EmptyState icon={FlaskConical} title="No lab tests" description="Tests you order during consultation will appear here when the lab technician completes them" />
      ) : (
        <div className="space-y-4">
          {tests.map((test) => {
            const patient = test.patient as { first_name: string; last_name: string; patient_number: string } | null
            const results = test.laboratory_results as { result_summary?: string }[] | null
            const techName = (test as { technician_name?: string }).technician_name
            return (
              <Card key={test.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy-900">{test.test_name}</p>
                    <p className="text-sm text-navy-600">
                      {patient ? `${patient.first_name} ${patient.last_name}` : '—'} · {patient?.patient_number}
                    </p>
                    <p className="text-xs text-navy-500 mt-1">
                      Ordered {formatDate(test.ordered_at)}
                      {techName && ` · Lab tech: ${techName}`}
                    </p>
                    {test.notes && (
                      <p className="text-xs text-navy-600 mt-2 bg-navy-50 rounded-lg px-3 py-2">
                        <strong>Your instructions:</strong> {test.notes}
                      </p>
                    )}
                  </div>
                  <Badge variant={statusMap[test.status as LabStatus]}>{test.status.replace('_', ' ')}</Badge>
                </div>
                {results?.[0]?.result_summary && (
                  <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Technician results</p>
                    <p className="text-sm text-navy-800">{results[0].result_summary}</p>
                    {test.completed_at && (
                      <p className="text-xs text-navy-500 mt-2">Completed {formatDate(test.completed_at)}</p>
                    )}
                  </div>
                )}
                {test.status === 'pending' && (
                  <p className="text-sm text-amber-700 mt-3">Awaiting lab technician...</p>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
