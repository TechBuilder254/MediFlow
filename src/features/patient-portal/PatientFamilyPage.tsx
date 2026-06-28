import { Users, Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ApprovalGate } from '@/features/patient-portal/components/ApprovalGate'

export function PatientFamilyPage() {
  return (
    <ApprovalGate>
      <PageHeader
        title="Family Members"
        description="Manage children and dependents under your account"
        action={<Button disabled><Plus className="h-4 w-4" /> Add Family Member</Button>}
      />
      <EmptyState
        icon={Users}
        title="No family members linked"
        description="Link family members to book appointments and view records on their behalf. Coming soon."
      />
    </ApprovalGate>
  )
}
