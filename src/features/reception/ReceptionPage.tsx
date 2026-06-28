import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, UserCheck, UserPlus, ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useSearchPatients, useTodayAppointmentsForPatient, useStaffCheckIn, useWalkInAppointment } from '@/services/receptionService'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { formatTime } from '@/utils/cn'

export function ReceptionPage() {
  const [search, setSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [walkInOpen, setWalkInOpen] = useState(false)
  const checkIn = useStaffCheckIn()
  const walkIn = useWalkInAppointment()

  const { data: results } = useSearchPatients(search)
  const { data: todayAppts } = useTodayAppointmentsForPatient(selectedPatientId ?? undefined)

  const { data: doctors } = useQuery({
    queryKey: ['doctors-active'],
    queryFn: async () => {
      const { data } = await supabase
        .from('doctors')
        .select('id, display_name, specialization, department_id')
        .eq('is_active', true)
      return data ?? []
    },
  })

  const selectedPatient = results?.find((p) => p.id === selectedPatientId) ?? null

  return (
    <div>
      <PageHeader title="Reception Desk" description="Search patients, check in appointments, and register walk-ins" />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary-600" /> Search Patient
          </h3>
          <input
            className="w-full rounded-xl border border-navy-200 px-4 py-2.5 text-sm mb-4"
            placeholder="Name, patient number, phone, or National ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedPatientId(null) }}
          />

          {results && results.length > 0 && (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full text-left rounded-xl border p-3 transition-colors ${selectedPatientId === p.id ? 'border-primary-600 bg-primary-50' : 'border-navy-100 hover:border-primary-200'}`}
                  >
                    <p className="font-medium text-navy-900">{p.first_name} {p.last_name}</p>
                    <p className="text-xs text-navy-500">{p.patient_number} · {p.phone || 'No phone'}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {search.length >= 2 && !results?.length && (
            <p className="text-sm text-navy-500 text-center py-4">No patients found</p>
          )}
        </Card>

        <Card>
          {selectedPatient ? (
            <div>
              <h3 className="font-semibold text-navy-900 text-lg">{selectedPatient.first_name} {selectedPatient.last_name}</h3>
              <p className="text-sm text-navy-500 mb-4">{selectedPatient.patient_number}</p>

              <h4 className="text-sm font-medium text-navy-700 mb-2">Today's Appointments</h4>
              {!todayAppts?.length ? (
                <p className="text-sm text-navy-500 mb-4">No appointment today</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {todayAppts.map((apt) => {
                    const doc = apt.doctor as { display_name?: string; specialization?: string } | null
                    const dept = apt.department as { name: string } | null
                    return (
                      <div key={apt.id} className="rounded-xl border border-navy-100 p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-navy-900">{formatTime(apt.start_time)} — {doc?.display_name || doc?.specialization}</p>
                          <p className="text-xs text-navy-500">{dept?.name}</p>
                          <Badge variant="primary" className="mt-1">{apt.status}</Badge>
                        </div>
                        {apt.status === 'confirmed' && (
                          <Button size="sm" loading={checkIn.isPending} onClick={() => checkIn.mutate({
                            appointmentId: apt.id,
                            patientId: selectedPatient.id,
                            departmentId: apt.department_id ?? undefined,
                          })}>
                            <UserCheck className="h-4 w-4" /> Check In
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setWalkInOpen(true)}>
                  <UserPlus className="h-4 w-4" /> Walk-in
                </Button>
                <Link to={`/patients/${selectedPatient.id}`}>
                  <Button variant="ghost">View Profile</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-navy-500">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 text-navy-300" />
              <p>Search and select a patient to check in</p>
            </div>
          )}
        </Card>
      </div>

      <Modal open={walkInOpen} onClose={() => setWalkInOpen(false)} title="Walk-in Appointment">
        {selectedPatient && (
          <form onSubmit={async (e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const apt = await walkIn.mutateAsync({
              patient_id: selectedPatient.id,
              doctor_id: fd.get('doctor_id') as string,
              reason: fd.get('reason') as string,
            })
            await checkIn.mutateAsync({
              appointmentId: apt.id,
              patientId: selectedPatient.id,
            })
            setWalkInOpen(false)
          }} className="space-y-4">
            <p className="text-sm text-navy-600">Patient: <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong></p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-navy-700">Assign Doctor</label>
              <select name="doctor_id" required className="w-full rounded-xl border border-navy-200 px-4 py-2.5 text-sm">
                <option value="">Select doctor</option>
                {doctors?.map((d) => (
                  <option key={d.id} value={d.id}>{d.display_name || d.specialization}</option>
                ))}
              </select>
            </div>
            <Input label="Reason" name="reason" placeholder="Walk-in complaint" />
            <Button type="submit" loading={walkIn.isPending || checkIn.isPending}>Create & Check In</Button>
          </form>
        )}
      </Modal>
    </div>
  )
}
