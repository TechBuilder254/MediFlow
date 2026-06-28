import { FlaskConical, Download } from 'lucide-react'
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
                  <div>
                    <p className="font-semibold text-navy-900">{test.test_name}</p>
                    <p className="text-sm text-navy-500">{test.test_type || 'Diagnostic'} · Ordered {formatDate(test.ordered_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[test.status as keyof typeof statusVariant] || 'default'}>
                      {test.status.replace('_', ' ')}
                    </Badge>
                    {test.status === 'completed' && (
                      <Button variant="ghost" size="sm"><Download className="h-4 w-4" /> PDF</Button>
                    )}
                  </div>
                </div>
                {results?.[0]?.result_summary && (
                  <p className="mt-3 text-sm text-navy-700 bg-navy-50 rounded-xl p-3">{results[0].result_summary}</p>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </ApprovalGate>
  )
}
