import { FolderOpen, Download } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ApprovalGate } from '@/features/patient-portal/components/ApprovalGate'

const DOC_TYPES = ['Medical Report', 'Prescription', 'Invoice', 'Lab Result', 'Discharge Summary', 'Medical Certificate']

export function PatientDocumentsPage() {
  return (
    <ApprovalGate>
      <PageHeader title="Documents" description="Download medical reports, prescriptions, and certificates" />
      <EmptyState icon={FolderOpen} title="No documents yet" description="Documents from your visits will be available here for download" />
      <div className="grid sm:grid-cols-2 gap-3 mt-6">
        {DOC_TYPES.map((type) => (
          <Card key={type} className="flex items-center justify-between opacity-50">
            <span className="text-sm font-medium text-navy-700">{type}</span>
            <Button variant="ghost" size="sm" disabled><Download className="h-4 w-4" /></Button>
          </Card>
        ))}
      </div>
    </ApprovalGate>
  )
}
