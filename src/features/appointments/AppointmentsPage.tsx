import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Calendar, Stethoscope } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import { formatDate, formatTime } from '@/utils/cn'
import type { Appointment, AppointmentStatus } from '@/types'
import { DoctorAppointmentRequests } from '@/features/appointments/DoctorAppointmentRequests'
import { useAuthStore } from '@/hooks/useAuth'

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

export function AppointmentsPage() {
  const [showModal, setShowModal] = useState(false)
  const [view, setView] = useState<'day' | 'week' | 'month'>('week')
  const qc = useQueryClient()
  const { profile } = useAuthStore()
  const isDoctor = profile?.role === 'doctor' || profile?.role === 'admin' || profile?.role === 'super_admin'

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patient:patients(first_name, last_name, patient_number), doctor:doctors(specialization), department:departments(name)')
        .order('appointment_date', { ascending: true })
      if (error) throw error
      return data as Appointment[]
    },
  })

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const { data } = await supabase.from('patients').select('id, first_name, last_name').is('deleted_at', null)
      return data ?? []
    },
  })

  const { data: doctors } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: async () => {
      const { data } = await supabase.from('doctors').select('id, specialization')
      return data ?? []
    },
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

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Schedule and manage patient appointments"
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> New Appointment
          </Button>
        }
      />

      {isDoctor && <DoctorAppointmentRequests />}

      <div className="flex gap-2 mb-6">
        {(['day', 'week', 'month'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
              view === v ? 'bg-primary-600 text-white' : 'bg-white border border-navy-200 text-navy-600 hover:bg-navy-50'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !appointments?.length ? (
        <EmptyState
          icon={Calendar}
          title="No appointments scheduled"
          description="Create your first appointment to get started"
          action={<Button onClick={() => setShowModal(true)}>New Appointment</Button>}
        />
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <div key={apt.id} className="rounded-2xl border border-navy-100 bg-white p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-navy-900">
                    {apt.patient ? `${(apt.patient as { first_name: string; last_name: string }).first_name} ${(apt.patient as { first_name: string; last_name: string }).last_name}` : 'Unknown'}
                  </h3>
                      <Badge variant={statusVariant[apt.status as AppointmentStatus] || 'default'}>{apt.status}</Badge>
                </div>
                <p className="text-sm text-navy-500 mt-1">
                  {(apt.doctor as { specialization?: string })?.specialization || 'Doctor'} &middot; {apt.department ? (apt.department as { name: string }).name : 'General'}
                </p>
              </div>
              <div className="text-sm text-right flex flex-col items-end gap-2">
                <p className="font-medium text-navy-800">{formatDate(apt.appointment_date)}</p>
                <p className="text-navy-500">{formatTime(apt.start_time)} - {formatTime(apt.end_time)}</p>
                {['checked_in', 'in_progress', 'confirmed'].includes(apt.status) && isDoctor && (
                  <Link to={`/consultation/${apt.id}`}>
                    <Button size="sm" variant="outline"><Stethoscope className="h-3 w-3" /> Consult</Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
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
                <option key={d.id} value={d.id}>{d.specialization || 'Doctor'}</option>
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
