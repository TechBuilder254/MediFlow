import { MessageSquare, Send } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { ApprovalGate } from '@/features/patient-portal/components/ApprovalGate'

export function PatientMessagesPage() {
  return (
    <ApprovalGate>
      <PageHeader title="Messages" description="Secure messaging with doctors, reception, and pharmacy" />
      <EmptyState icon={MessageSquare} title="No messages yet" description="Send a message to your care team" />
      <Card className="mt-6">
        <p className="text-sm font-medium text-navy-700 mb-3">New Message</p>
        <div className="space-y-3">
          <select className="w-full rounded-xl border border-navy-200 px-4 py-2.5 text-sm">
            <option>Doctor</option>
            <option>Reception</option>
            <option>Pharmacy</option>
          </select>
          <Input label="Subject" placeholder="Question about my prescription" />
          <textarea rows={4} className="w-full rounded-xl border border-navy-200 px-4 py-2.5 text-sm" placeholder="Type your message..." />
          <Button><Send className="h-4 w-4" /> Send Message</Button>
        </div>
      </Card>
    </ApprovalGate>
  )
}
