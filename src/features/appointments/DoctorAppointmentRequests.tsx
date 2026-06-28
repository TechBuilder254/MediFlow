import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useReviewAppointment, useCallNextPatient, TIME_SLOTS } from '@/services/appointmentWorkflowService'
import { useAuthStore } from '@/hooks/useAuth'
import { formatDate, formatTime } from '@/utils/cn'
import { getNextWeekdays } from '@/utils/patientFlow'
import { URGENCY_OPTIONS } from '@/utils/patientFlow'

export function DoctorAppointmentRequests() {
  const { profile } = useAuthStore()
  const review = useReviewAppointment()
  const callNext = useCallNextPatient()
  const [suggestModal, setSuggestModal] = useState<string | null>(null)
  const [declineModal, setDeclineModal] = useState<string | null>(null)

  const { data: doctor } = useQuery({
    queryKey: ['my-doctor', profile?.id],
    queryFn: async () => {
      const { data } = await supabase.from('doctors').select('id, consultation_room').eq('user_id', profile!.id).maybeSingle()
      return data
    },
    enabled: !!profile,
  })

  const { data: pending, refetch } = useQuery({
    queryKey: ['pending-appointments', doctor?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*, patient:patients(first_name, last_name, user_id, phone), department:departments(name)')
        .eq('doctor_id', doctor!.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      return data ?? []
    },
    enabled: !!doctor?.id,
    refetchInterval: 30000,
  })

  if (!doctor) return null

  const handleAccept = async (apt: typeof pending extends (infer T)[] | undefined ? T : never) => {
    const patient = apt.patient as { user_id: string } | null
    await review.mutateAsync({
      appointmentId: apt.id,
      action: 'accept',
      roomNumber: doctor.consultation_room || 'Room 204',
      patientUserId: patient?.user_id,
      doctorName: profile?.full_name,
    })
    refetch()
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold font-display text-navy-900">Appointment Requests</h2>
        <Button size="sm" onClick={() => callNext.mutate({ doctorId: doctor.id, roomNumber: doctor.consultation_room || undefined })} loading={callNext.isPending}>
          <UserCheck className="h-4 w-4" /> Call Next Patient
        </Button>
      </div>

      {!pending?.length ? (
        <Card className="text-center py-6 text-navy-500 text-sm">No pending requests</Card>
      ) : (
        <div className="space-y-4">
          {pending.map((apt) => {
            const patient = apt.patient as { first_name: string; last_name: string; phone?: string } | null
            const dept = apt.department as { name: string } | null
            const urgency = URGENCY_OPTIONS.find((u) => u.value === apt.urgency)
            return (
              <Card key={apt.id} className={apt.urgency === 'urgent' ? 'border-red-300 bg-red-50/30' : ''}>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-navy-900">{patient ? `${patient.first_name} ${patient.last_name}` : 'Patient'}</p>
                      {urgency && <Badge variant={apt.urgency === 'urgent' ? 'danger' : 'warning'}>{urgency.emoji} {urgency.label}</Badge>}
                    </div>
                    <p className="text-sm text-navy-500">{dept?.name} · {patient?.phone}</p>
                    <p className="text-sm text-navy-600 mt-2"><strong>Preferred:</strong> {formatDate(apt.appointment_date)} · {formatTime(apt.start_time)}</p>
                    {apt.symptoms && <p className="text-sm text-navy-700 mt-2 bg-white rounded-lg p-3 border border-navy-100">{apt.symptoms}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => handleAccept(apt)} loading={review.isPending}>
                      <CheckCircle className="h-4 w-4" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSuggestModal(apt.id)}>
                      <Clock className="h-4 w-4" /> Suggest Time
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeclineModal(apt.id)}>
                      <XCircle className="h-4 w-4" /> Decline
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {suggestModal && (
        <SuggestModal
          open
          onClose={() => setSuggestModal(null)}
          onSubmit={async (date, time, msg) => {
            const apt = pending?.find((a) => a.id === suggestModal)
            const patient = apt?.patient as { user_id: string } | null
            await review.mutateAsync({
              appointmentId: suggestModal,
              action: 'suggest',
              suggestedDate: date,
              suggestedTime: time,
              doctorMessage: msg,
              patientUserId: patient?.user_id,
              doctorName: profile?.full_name,
            })
            setSuggestModal(null)
            refetch()
          }}
        />
      )}

      {declineModal && (
        <Modal open onClose={() => setDeclineModal(null)} title="Decline Appointment">
          <form onSubmit={async (e) => {
            e.preventDefault()
            const reason = new FormData(e.currentTarget).get('reason') as string
            const apt = pending?.find((a) => a.id === declineModal)
            const patient = apt?.patient as { user_id: string } | null
            await review.mutateAsync({ appointmentId: declineModal, action: 'decline', declineReason: reason, patientUserId: patient?.user_id })
            setDeclineModal(null)
            refetch()
          }} className="space-y-4">
            <Input label="Reason" name="reason" required placeholder="Doctor unavailable..." />
            <Button type="submit" variant="danger">Decline</Button>
          </form>
        </Modal>
      )}
    </div>
  )
}

function SuggestModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (date: string, time: string, msg: string) => void }) {
  const days = getNextWeekdays(5)
  const [date, setDate] = useState(days[0]?.date || '')
  const [time, setTime] = useState('14:00')
  const [msg, setMsg] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Suggest Another Time" size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <button key={d.date} type="button" onClick={() => setDate(d.date)} className={`px-3 py-2 rounded-lg text-sm border ${date === d.date ? 'border-primary-600 bg-primary-50' : 'border-navy-200'}`}>{d.dayName}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {TIME_SLOTS.map((t) => (
            <button key={t} type="button" onClick={() => setTime(t)} className={`px-4 py-2 rounded-lg text-sm border ${time === t ? 'border-primary-600 bg-primary-600 text-white' : 'border-navy-200'}`}>{t}</button>
          ))}
        </div>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={2} className="w-full rounded-xl border px-4 py-2 text-sm" placeholder="I'm unavailable at 10:00 AM. Please come at 2:00 PM." />
        <Button onClick={() => onSubmit(date, time, msg)}>Send Suggestion</Button>
      </div>
    </Modal>
  )
}
