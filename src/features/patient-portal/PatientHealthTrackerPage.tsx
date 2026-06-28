import { LineChart, Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ApprovalGate } from '@/features/patient-portal/components/ApprovalGate'

export function PatientHealthTrackerPage() {
  return (
    <ApprovalGate>
      <PageHeader
        title="Health Tracker"
        description="Log blood pressure, weight, sugar levels, and more"
        action={<Button disabled><Plus className="h-4 w-4" /> Log Reading</Button>}
      />
      <EmptyState
        icon={LineChart}
        title="Start tracking your health"
        description="Record vitals and see trends over time. Charts will appear here once you add readings."
      />
    </ApprovalGate>
  )
}
