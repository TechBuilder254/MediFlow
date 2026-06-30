import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Calendar, UserPlus, CheckCircle, FileText } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import { formatDate, formatTime, cn } from '@/utils/cn'
import type { Appointment, AppointmentStatus } from '@/types'
import { DoctorAppointmentRequests } from '@/features/appointments/DoctorAppointmentRequests'
import { useAuthStore } from '@/hooks/useAuth'
import { useDoctorRecord } from '@/services/doctorService'
import { useReassignAppointment } from '@/services/appointmentService'
import { useReviewAppointment } from '@/services/appointmentWorkflowService'
import { isDoctorRole } from '@/lib/permissions'
import { toast } from '@/hooks/useToast'

const statusVariant: Partial<Record<AppointmentStatus, 'warning' | 'primary' | 'success' | 'danger' | 'info'>> = {
  pending: 'warning',
  confirmed: 'primary',
  completed: 'success',
  cancelled: 'danger',
  declined: 'danger',
  suggested: 'info',
  checked_in: 'primary',
  in_progress: 'success',
}

const ACTIVE_STATUSES = ['pending', 'confirmed', 'checked_in', 'in_progress', 'suggested']

export function AppointmentsPage() {
  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState<'mine' | 'help'>('mine')
  const qc = useQueryClient()
  const { profile, user } = useAuthStore()
  const isDoctor = isDoctorRole(profile?.role)
  const isStaffScheduler = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'receptionist' || profile?.role === 'nurse'

  const { data: myDoctor } = useDoctorRecord(isDoctor ? user?.id : undefined)
  const reassign = useReassignAppointment()
  const acceptApt = useReviewAppointment()

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', myDoctor?.id, isDoctor, tab],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('*, patient:patients(first_name, last_name, patient_number, user_id), doctor:doctors(id, display_name, specialization), department:departments(name)')
        .order('appointment_date', { ascending: true })

      if (isDoctor && myDoctor?.id) {
        if (tab === 'mine') {
          query = query.eq('doctor_id', myDoctor.id)
        } else {
          query = query.neq('doctor_id', myDoctor.id).in('status', ACTIVE_STATUSES)
        }
      }

      const { data, error } = await query
      if (error) throw error
      return data as Appointment[]
    },
    enabled: !isDoctor || !!myDoctor?.id,
  })

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const { data } = await supabase.from('patients').select('id, first_name, last_name').is('deleted_at', null)
      return data ?? []
    },
    enabled: isStaffScheduler,
  })

  const { data: doctors } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: async () => {
      const { data } = await supabase.from('doctors').select('id, display_name, specialization').eq('is_active', true)
      return data ?? []
    },
    enabled: isStaffScheduler,
  })

  const createAppointment = useMutation({
    mutationFn: async (form: FormData) => {
      const { error } = await supabase.from('appointments').insert({
        patient_id: form.get('patient_id') as string,
        doctor_id: form.get('doctor_id') as string,
        appointment_date: form.get('appointment_date') as string,
        start_time: form.get('start_time') as string,
        end_time: form.get('end_time') as string,
        reason: form.get('reason') as string,
        status: 'pending',
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      setShowModal(false)
    },
  })

  const handleTakeOver = async (apt: Appointment) => {
    if (!myDoctor?.id || !profile) return
    if (!confirm(`Take over this patient from another doctor?`)) return
    try {
      const patient = apt.patient as { user_id?: string } | null
      await reassign.mutateAsync({
        appointmentId: apt.id,
        newDoctorId: myDoctor.id,
        patientUserId: patient?.user_id,
        doctorName: profile.full_name,
      })
      toast('Patient assigned to you.')
      setTab('mine')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not reassign.', 'error')
    }
  }

  const handleAccept = async (apt: Appointment) => {
    if (!myDoctor?.id || !profile) return
    const patient = apt.patient as { user_id?: string } | null
    try {
      await acceptApt.mutateAsync({
        appointmentId: apt.id,
        action: 'accept',
        roomNumber: myDoctor.consultation_room || 'Room 204',
        patientUserId: patient?.user_id,
        doctorName: profile.full_name,
      })
      toast('Appointment accepted — open patient chart to document the visit.')
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['pending-appointments'] })
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not accept.', 'error')
    }
  }

  const canOpenChart = (apt: Appointment) => {
    if (!isDoctor || !myDoctor) return false
    return apt.doctor_id === myDoctor.id && apt.status !== 'cancelled' && apt.status !== 'declined'
  }

  return (
    <div>
      <PageHeader
        title="Appointments"
        description={isDoctor ? 'Your schedule — help colleagues when they are busy' : 'Schedule and manage patient appointments'}
        action={
          isStaffScheduler ? (
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" /> New Appointment
            </Button>
          ) : undefined
        }
      />

      {isDoctor && <DoctorAppointmentRequests />}

      {isDoctor && (
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setTab('mine')}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium', tab === 'mine' ? 'bg-primary-600 text-white' : 'bg-white border border-navy-200')}
          >
            My Appointments
          </button>
          <button
            type="button"
            onClick={() => setTab('help')}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium', tab === 'help' ? 'bg-primary-600 text-white' : 'bg-white border border-navy-200')}
          >
            Help Colleagues
          </button>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : !appointments?.length ? (
        <EmptyState
          icon={Calendar}
          title={tab === 'help' ? 'No colleagues need help' : 'No appointments scheduled'}
          description={tab === 'help' ? 'Other doctors have no patients waiting for cover' : 'Your upcoming appointments will appear here'}
          action={isStaffScheduler ? <Button onClick={() => setShowModal(true)}>New Appointment</Button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => {
            const patient = apt.patient as { first_name: string; last_name: string; user_id?: string } | null
            const doctor = apt.doctor as { display_name?: string; specialization?: string } | null
            const dept = apt.department as { name: string } | null
            return (
              <div key={apt.id} className="rounded-2xl border border-navy-100 bg-white p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-sm transition-shadow">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-navy-900">
                      {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown'}
                    </h3>
                    <Badge variant={statusVariant[apt.status as AppointmentStatus] || 'default'}>{apt.status}</Badge>
                  </div>
                  <p className="text-sm text-navy-500 mt-1">
                    {tab === 'help' && doctor?.display_name && <span className="text-amber-700">Dr. {doctor.display_name} · </span>}
                    {doctor?.specialization || 'Doctor'} · {dept?.name || 'General'}
                  </p>
                </div>
                <div className="text-sm text-right flex flex-col items-end gap-2">
                  <p className="font-medium text-navy-800">{formatDate(apt.appointment_date)}</p>
                  <p className="text-navy-500">{formatTime(apt.start_time)} - {formatTime(apt.end_time)}</p>
                  {tab === 'help' && isDoctor && (
                    <Button size="sm" variant="outline" loading={reassign.isPending} onClick={() => handleTakeOver(apt)}>
                      <UserPlus className="h-3 w-3" /> Take over
                    </Button>
                  )}
                  {isDoctor && apt.status === 'pending' && apt.doctor_id === myDoctor?.id && (
                    <Button size="sm" onClick={() => handleAccept(apt)} loading={acceptApt.isPending}>
                      <CheckCircle className="h-3 w-3" /> Accept
                    </Button>
                  )}
                  {canOpenChart(apt) && (
                    <Link to={`/consultation/${apt.id}`}>
                      <Button size="sm" variant={apt.status === 'pending' ? 'outline' : 'primary'}>
                        <FileText className="h-3 w-3" />
                        {apt.status === 'completed' ? 'View visit' : 'Open patient chart'}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Schedule Appointment">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createAppointment.mutate(new FormData(e.currentTarget))
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-navy-700">Patient</label>
            <select name="patient_id" required className="w-full rounded-xl border border-navy-200 px-4 py-2.5 text-sm">
              <option value="">Select patient</option>
              {patients?.map((p) => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-navy-700">Doctor</label>
            <select name="doctor_id" required className="w-full rounded-xl border border-navy-200 px-4 py-2.5 text-sm">
              <option value="">Select doctor</option>
              {doctors?.map((d) => (
                <option key={d.id} value={d.id}>{d.display_name || d.specialization || 'Doctor'}</option>
              ))}
            </select>
          </div>
          <Input label="Date" name="appointment_date" type="date" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Time" name="start_time" type="time" required />
            <Input label="End Time" name="end_time" type="time" required />
          </div>
          <Input label="Reason" name="reason" placeholder="Consultation reason" />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={createAppointment.isPending}>Schedule</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
