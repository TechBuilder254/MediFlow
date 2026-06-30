import { useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { ApprovalGate } from '@/features/patient-portal/components/ApprovalGate'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyPatientRecord, useMyMessages, useSendPatientMessage } from '@/services/patientPortalService'
import { toast } from '@/hooks/useToast'
import { formatDate } from '@/utils/cn'

const RECIPIENTS = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'receptionist', label: 'Reception' },
  { value: 'pharmacist', label: 'Pharmacy' },
]

export function PatientMessagesPage() {
  const { user } = useAuthStore()
  const { data: patient } = useMyPatientRecord(user?.id)
  const { data: messages, isLoading } = useMyMessages(patient?.id)
  const sendMessage = useSendPatientMessage()
  const [recipient, setRecipient] = useState('doctor')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patient?.id || !user?.id || !subject.trim() || !body.trim()) return
    try {
      await sendMessage.mutateAsync({
        patient_id: patient.id,
        sender_id: user.id,
        recipient_role: recipient,
        subject: subject.trim(),
        body: body.trim(),
      })
      toast('Message sent — your care team will respond soon.')
      setSubject('')
      setBody('')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to send message.', 'error')
    }
  }

  return (
    <ApprovalGate>
      <PageHeader title="Messages" description="Secure messaging with doctors, reception, and pharmacy" />

      {isLoading ? <LoadingSpinner /> : !messages?.length ? (
        <EmptyState icon={MessageSquare} title="No messages yet" description="Send a message to your care team" />
      ) : (
        <div className="space-y-3 mb-6">
          {messages.map((msg) => {
            const sender = msg.sender as { full_name: string; role: string } | null
            const isMine = msg.sender_id === user?.id
            return (
              <Card key={msg.id} className={isMine ? 'border-primary-100' : ''}>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-semibold text-navy-900">{msg.subject}</p>
                    <p className="text-xs text-navy-500 mt-0.5">
                      {isMine ? `To ${msg.recipient_role}` : `From ${sender?.full_name ?? msg.recipient_role}`} · {formatDate(msg.created_at)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-navy-700 mt-2">{msg.body}</p>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <p className="text-sm font-medium text-navy-700 mb-3">New Message</p>
        <form onSubmit={handleSend} className="space-y-3">
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full rounded-xl border border-navy-200 px-4 py-2.5 text-sm"
          >
            {RECIPIENTS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <Input label="Subject" placeholder="Question about my prescription" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          <textarea
            rows={4}
            required
            className="w-full rounded-xl border border-navy-200 px-4 py-2.5 text-sm"
            placeholder="Type your message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <Button type="submit" loading={sendMessage.isPending}><Send className="h-4 w-4" /> Send Message</Button>
        </form>
      </Card>
    </ApprovalGate>
  )
}
