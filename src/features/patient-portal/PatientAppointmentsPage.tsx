import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, MapPin, CheckCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyPatientRecord, useMyAppointments, useCheckInAppointment, useRespondToSuggestion } from '@/services/patientPortalService'
import { formatDate, formatTime } from '@/utils/cn'
import { URGENCY_OPTIONS } from '@/utils/patientFlow'

const TABS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const

export function PatientAppointmentsPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('all')
  const { user } = useAuthStore()
  const { data: patient } = useMyPatientRecord(user?.id)
  const { data: appointments, isLoading } = useMyAppointments(patient?.id)
  const checkIn = useCheckInAppointment()
  const respond = useRespondToSuggestion()

  const filtered = appointments?.filter((a) => {
    if (tab === 'all') return true
    if (tab === 'pending') return ['pending', 'suggested'].includes(a.status)
    if (tab === 'confirmed') return ['confirmed', 'checked_in', 'in_progress'].includes(a.status)
    if (tab === 'completed') return a.status === 'completed'
    return ['cancelled', 'declined'].includes(a.status)
  })

  return (
    <div>
      <PageHeader
        title="My Appointments"
        description="View and manage your appointment requests"
        action={<Link to="/portal/book"><Button><Plus className="h-4 w-4" /> Book Appointment</Button></Link>}
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize ${tab === t ? 'bg-primary-600 text-white' : 'bg-white border border-navy-200 text-navy-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner /> : !filtered?.length ? (
        <EmptyState icon={Calendar} title="No appointments" action={<Link to="/portal/book"><Button>Book Appointment</Button></Link>} />
      ) : (
        <div className="space-y-4">
          {filtered.map((apt) => {
            const doctor = apt.doctor as { profile?: { full_name: string }; specialization?: string } | null
            const dept = apt.department as { name: string } | null
            const urgency = URGENCY_OPTIONS.find((u) => u.value === apt.urgency)
            return (
              <Card key={apt.id}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-navy-900">{dept?.name}</p>
                      {urgency && <span className="text-xs">{urgency.emoji} {urgency.label}</span>}
                    </div>
                    <p className="text-sm text-navy-600">{doctor?.profile?.full_name || doctor?.specialization}</p>
                    <p className="text-sm text-navy-500 mt-1">{formatDate(apt.appointment_date)} · {formatTime(apt.start_time)}</p>
                    {apt.symptoms && <p className="text-sm text-navy-600 mt-2 bg-navy-50 rounded-lg p-2">{apt.symptoms}</p>}
                  </div>
                  <Badge variant={statusVariant(apt.status)}>{statusLabel(apt.status)}</Badge>
                </div>

                {apt.status === 'suggested' && apt.suggested_date && (
                  <div className="mt-4 p-4 rounded-xl bg-sky-50 border border-sky-200">
                    <p className="text-sm font-medium text-navy-900">Doctor suggested a new time:</p>
                    <p className="text-sm text-navy-700 mt-1">{formatDate(apt.suggested_date)} · {formatTime(apt.suggested_start_time!)}</p>
                    {apt.doctor_message && <p className="text-sm text-navy-500 mt-1 italic">"{apt.doctor_message}"</p>}
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={() => respond.mutate({ appointmentId: apt.id, accept: true })}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => respond.mutate({ appointmentId: apt.id, accept: false })}>Choose Another Time</Button>
                    </div>
                  </div>
                )}

                {apt.status === 'confirmed' && (
                  <Button
                    size="sm"
                    className="mt-3"
                    variant="outline"
                    loading={checkIn.isPending}
                    onClick={() => patient && checkIn.mutate({ appointmentId: apt.id, patientId: patient.id, departmentId: apt.department_id || undefined })}
                  >
                    <MapPin className="h-4 w-4" /> I'm Here — Check In
                  </Button>
                )}

                {apt.status === 'in_progress' && (
                  <div className="mt-3 flex items-center gap-2 text-primary-600 font-medium text-sm">
                    <CheckCircle className="h-4 w-4" /> It's your turn — Proceed to {apt.room_number || 'consultation room'}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function statusLabel(s: string) {
  if (s === 'pending') return 'Pending Review'
  return s.replace('_', ' ')
}

function statusVariant(s: string): 'warning' | 'success' | 'danger' | 'info' | 'primary' | 'default' {
  const m: Record<string, 'warning' | 'success' | 'danger' | 'info' | 'primary'> = {
    pending: 'warning', confirmed: 'success', declined: 'danger', suggested: 'info', checked_in: 'primary', in_progress: 'success', completed: 'success',
  }
  return m[s] || 'default'
}
