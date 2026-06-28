import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, FlaskConical, Pill } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import { usePatientClinicalSummary, useCompleteConsultation } from '@/services/clinicalService'
import { formatDate, formatTime } from '@/utils/cn'

export function ConsultationPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const navigate = useNavigate()
  const complete = useCompleteConsultation()

  const [chiefComplaint, setChiefComplaint] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [notes, setNotes] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [rxName, setRxName] = useState('')
  const [rxDosage, setRxDosage] = useState('')
  const [labTest, setLabTest] = useState('')
  const [prescriptions, setPrescriptions] = useState<{ medicine_id: string; name: string; dosage: string; frequency: string; duration: string }[]>([])
  const [labTests, setLabTests] = useState<string[]>([])

  const { data: appointment, isLoading } = useQuery({
    queryKey: ['consultation-apt', appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patient:patients(*), doctor:doctors(id)')
        .eq('id', appointmentId!)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!appointmentId,
  })

  const patient = appointment?.patient as {
    id: string; first_name: string; last_name: string; date_of_birth?: string
    blood_group?: string; allergies?: string[]; user_id?: string
    insurance_provider?: string; phone?: string
  } | null

  const { data: clinical } = usePatientClinicalSummary(patient?.id)

  const { data: medicines } = useQuery({
    queryKey: ['medicines-list'],
    queryFn: async () => {
      const { data } = await supabase.from('medicines').select('id, name').order('name')
      return data ?? []
    },
  })

  if (isLoading) return <LoadingSpinner />

  if (!appointment || !patient) {
    return (
      <div className="text-center py-12">
        <p className="text-navy-600">Appointment not found</p>
        <Link to="/appointments"><Button className="mt-4">Back</Button></Link>
      </div>
    )
  }

  const age = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 86400000))
    : null

  const handleComplete = async () => {
    const doctorId = (appointment.doctor as { id: string })?.id
    if (!doctorId) return

    await complete.mutateAsync({
      appointmentId: appointment.id,
      patientId: patient.id,
      doctorId,
      chiefComplaint: chiefComplaint || appointment.reason || '',
      symptoms: symptoms || appointment.symptoms || '',
      notes,
      diagnosis,
      vitals: clinical?.latestAssessment ? {
        blood_pressure: clinical.latestAssessment.blood_pressure,
        temperature: clinical.latestAssessment.temperature,
        pulse: clinical.latestAssessment.pulse,
      } : {},
      prescriptions: prescriptions.map((p) => ({
        medicine_id: p.medicine_id,
        dosage: p.dosage,
        frequency: p.frequency,
        duration: p.duration,
      })),
      labTests: labTests.map((t) => ({ test_name: t })),
      patientUserId: patient.user_id,
    })
    navigate('/appointments')
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/appointments" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to appointments
        </Link>
      </div>

      <PageHeader
        title={`Consultation — ${patient.first_name} ${patient.last_name}`}
        description={`${formatDate(appointment.appointment_date)} · ${formatTime(appointment.start_time)}`}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h3 className="font-semibold text-navy-900 mb-3">Patient Info</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-navy-500">Age</dt><dd className="font-medium">{age ?? '—'} years</dd></div>
              <div><dt className="text-navy-500">Blood Group</dt><dd className="font-medium">{patient.blood_group || '—'}</dd></div>
              <div><dt className="text-navy-500">Phone</dt><dd>{patient.phone || '—'}</dd></div>
              <div><dt className="text-navy-500">Insurance</dt><dd>{patient.insurance_provider || 'None'}</dd></div>
              <div>
                <dt className="text-navy-500">Allergies</dt>
                <dd>{patient.allergies?.length ? patient.allergies.join(', ') : 'None recorded'}</dd>
              </div>
            </dl>
          </Card>

          {clinical?.latestAssessment && (
            <Card>
              <h3 className="font-semibold text-navy-900 mb-3">Nurse Assessment</h3>
              <dl className="space-y-1 text-sm">
                {clinical.latestAssessment.blood_pressure && <div>BP: {clinical.latestAssessment.blood_pressure}</div>}
                {clinical.latestAssessment.temperature && <div>Temp: {clinical.latestAssessment.temperature}°C</div>}
                {clinical.latestAssessment.pulse && <div>Pulse: {clinical.latestAssessment.pulse} bpm</div>}
              </dl>
              <Badge variant="success" className="mt-2">Ready for Doctor</Badge>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="font-semibold text-navy-900 mb-4">Consultation Notes</h3>
            <div className="space-y-4">
              <Input label="Chief Complaint" value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} />
              <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={3} className="w-full rounded-xl border border-navy-200 px-4 py-2 text-sm" placeholder="Symptoms..." />
              <Input label="Diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-xl border border-navy-200 px-4 py-2 text-sm" placeholder="Doctor notes..." />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2"><Pill className="h-4 w-4" /> Prescription</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <select value={rxName} onChange={(e) => setRxName(e.target.value)} className="rounded-xl border border-navy-200 px-3 py-2 text-sm">
                <option value="">Select medicine</option>
                {medicines?.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <Input placeholder="Dosage" value={rxDosage} onChange={(e) => setRxDosage(e.target.value)} />
              <Button type="button" variant="outline" onClick={() => {
                const med = medicines?.find((m) => m.id === rxName)
                if (!med || !rxDosage) return
                setPrescriptions((p) => [...p, { medicine_id: med.id, name: med.name, dosage: rxDosage, frequency: 'Twice daily', duration: '7 days' }])
                setRxName('')
                setRxDosage('')
              }}>Add</Button>
            </div>
            {prescriptions.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {prescriptions.map((p, i) => (
                  <li key={i} className="bg-navy-50 rounded-lg px-3 py-2">{p.name} — {p.dosage}</li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2"><FlaskConical className="h-4 w-4" /> Lab Request</h3>
            <div className="flex gap-2">
              <Input placeholder="e.g. Full Blood Count" value={labTest} onChange={(e) => setLabTest(e.target.value)} className="flex-1" />
              <Button type="button" variant="outline" onClick={() => {
                if (!labTest.trim()) return
                setLabTests((t) => [...t, labTest.trim()])
                setLabTest('')
              }}>Add</Button>
            </div>
            {labTests.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {labTests.map((t, i) => <Badge key={i} variant="primary">{t}</Badge>)}
              </div>
            )}
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => navigate('/appointments')}>Cancel</Button>
            <Button onClick={handleComplete} loading={complete.isPending}>Complete Consultation</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
