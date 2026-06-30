import { FlaskConical, Download, Clock } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { ApprovalGate } from '@/features/patient-portal/components/ApprovalGate'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyPatientRecord, useMyLabResults } from '@/services/patientPortalService'
import { formatDate } from '@/utils/cn'

const statusVariant = { pending: 'warning' as const, in_progress: 'info' as const, completed: 'success' as const, cancelled: 'danger' as const }

export function PatientLabPage() {
  const { user } = useAuthStore()
  const { data: patient } = useMyPatientRecord(user?.id)
  const { data: tests, isLoading } = useMyLabResults(patient?.id)

  return (
    <ApprovalGate>
      <PageHeader title="Laboratory Results" description="Blood tests, imaging reports, and diagnostic results" />
      {isLoading ? <LoadingSpinner /> : !tests?.length ? (
        <EmptyState icon={FlaskConical} title="No lab tests" description="Results will appear here once your tests are complete" />
      ) : (
        <div className="space-y-4">
          {tests.map((test) => {
            const results = test.laboratory_results as { result_summary?: string }[] | null
            return (
              <Card key={test.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-navy-900">{test.test_name}</p>
                    <p className="text-sm text-navy-500">{test.test_type || 'Diagnostic'} · Ordered {formatDate(test.ordered_at)}</p>
                    {test.notes && test.status !== 'completed' && (
                      <div className="mt-2 rounded-xl bg-sky-50 border border-sky-100 px-3 py-2 text-sm text-sky-900">
                        <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide mb-1">Doctor instructions</p>
                        {test.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <Badge variant={statusVariant[test.status as keyof typeof statusVariant] || 'default'}>
                      {test.status.replace('_', ' ')}
                    </Badge>
                    {test.status === 'completed' && (
                      <Button variant="ghost" size="sm"><Download className="h-4 w-4" /> PDF</Button>
                    )}
                  </div>
                </div>
                {test.status !== 'completed' && !results?.[0]?.result_summary && (
                  <p className="mt-3 text-xs text-amber-700 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Lab technician is processing this test
                  </p>
                )}
                {results?.[0]?.result_summary && (
                  <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Results</p>
                    <p className="text-sm text-navy-700">{results[0].result_summary}</p>
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
