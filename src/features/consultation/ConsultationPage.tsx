import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, FlaskConical, Pill, FileText, History, User,
  Save, CheckCircle, Clock, Stethoscope, AlertCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import {
  usePatientClinicalSummary,
  useCompleteConsultation,
  useVisitForAppointment,
  usePatientVisitTimeline,
  useAppointmentLabOrders,
  useSaveVisitDraft,
  useOrderLabTest,
} from '@/services/clinicalService'
import { useLabTechnicians, useDoctorRecord } from '@/services/doctorService'
import { useReviewAppointment } from '@/services/appointmentWorkflowService'
import { useAuthStore } from '@/hooks/useAuth'
import { isDoctorRole } from '@/lib/permissions'
import { formatDate, formatTime, cn } from '@/utils/cn'
import { toast } from '@/hooks/useToast'
import type { AppointmentStatus } from '@/types'

type Tab = 'visit' | 'history' | 'labs'

const statusColors: Partial<Record<AppointmentStatus, 'warning' | 'primary' | 'success' | 'danger' | 'info'>> = {
  pending: 'warning',
  confirmed: 'primary',
  in_progress: 'info',
  completed: 'success',
  checked_in: 'primary',
}

export function ConsultationPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('visit')

  const [chiefComplaint, setChiefComplaint] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [notes, setNotes] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [rxName, setRxName] = useState('')
  const [rxDosage, setRxDosage] = useState('')
  const [rxFrequency, setRxFrequency] = useState('Twice daily')
  const [rxDuration, setRxDuration] = useState('7 days')
  const [rxQuantity, setRxQuantity] = useState('1')
  const [rxInstructions, setRxInstructions] = useState('')
  const [labTest, setLabTest] = useState('')
  const [labNotes, setLabNotes] = useState('')
  const [labTechId, setLabTechId] = useState('')
  const [prescriptions, setPrescriptions] = useState<{
    medicine_id: string; name: string; dosage: string; frequency: string
    duration: string; quantity: number; instructions?: string
  }[]>([])
  const [loadedDraft, setLoadedDraft] = useState(false)

  const { user, profile } = useAuthStore()
  const isDoctor = isDoctorRole(profile?.role)
  const { data: myDoctor } = useDoctorRecord(isDoctor ? user?.id : undefined)
  const { data: labTechnicians } = useLabTechnicians()

  const complete = useCompleteConsultation()
  const saveDraft = useSaveVisitDraft()
  const orderLab = useOrderLabTest()
  const acceptApt = useReviewAppointment()

  const { data: appointment, isLoading } = useQuery({
    queryKey: ['consultation-apt', appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patient:patients(*), doctor:doctors(id, display_name, consultation_room)')
        .eq('id', appointmentId!)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!appointmentId,
  })

  const patient = appointment?.patient as {
    id: string; first_name: string; last_name: string; patient_number?: string
    date_of_birth?: string; blood_group?: string; allergies?: string[]
    user_id?: string; insurance_provider?: string; phone?: string
  } | null

  const { data: existingVisit } = useVisitForAppointment(appointmentId)
  const { data: timeline } = usePatientVisitTimeline(patient?.id)
  const { data: aptLabs, refetch: refetchAptLabs } = useAppointmentLabOrders(appointmentId)
  const { data: clinical } = usePatientClinicalSummary(patient?.id)

  const { data: medicines } = useQuery({
    queryKey: ['medicines-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('medicines')
        .select('id, name, inventory(quantity), reorder_level')
        .order('name')
      return data ?? []
    },
  })

  const isCompleted = appointment?.status === 'completed'
  const isPending = appointment?.status === 'pending'
  const doctorId = (appointment?.doctor as { id: string })?.id
  const isMyAppointment = !isDoctor || !myDoctor || doctorId === myDoctor.id

  useEffect(() => {
    if (loadedDraft || !appointment) return
    const dx = (existingVisit?.diagnoses as { description: string }[] | null)?.[0]?.description
    if (existingVisit) {
      setChiefComplaint(existingVisit.chief_complaint || appointment.reason || '')
      setSymptoms(existingVisit.symptoms || appointment.symptoms || '')
      setNotes(existingVisit.notes || '')
      setDiagnosis(dx || '')
      setLoadedDraft(true)
    } else if (!isCompleted) {
      setChiefComplaint(appointment.reason || '')
      setSymptoms(appointment.symptoms || '')
      setLoadedDraft(true)
    }
  }, [existingVisit, appointment, loadedDraft, isCompleted])

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

  const vitals = clinical?.latestAssessment ? {
    blood_pressure: clinical.latestAssessment.blood_pressure,
    temperature: clinical.latestAssessment.temperature,
    pulse: clinical.latestAssessment.pulse,
  } : {}

  const handleAccept = async () => {
    const doctor = appointment.doctor as { consultation_room?: string } | null
    try {
      await acceptApt.mutateAsync({
        appointmentId: appointment.id,
        action: 'accept',
        roomNumber: doctor?.consultation_room || 'Room 204',
        patientUserId: patient.user_id,
        doctorName: profile?.full_name,
      })
      toast('Appointment accepted — you can now document this visit.')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not accept.', 'error')
    }
  }

  const handleSaveDraft = async () => {
    if (!doctorId || !isMyAppointment) return
    try {
      await saveDraft.mutateAsync({
        appointmentId: appointment.id,
        patientId: patient.id,
        doctorId,
        chiefComplaint,
        symptoms,
        notes,
        diagnosis,
        vitals,
      })
      toast('Visit notes saved for this appointment.')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save notes.', 'error')
    }
  }

  const handleOrderLab = async () => {
    if (!doctorId || !labTest.trim() || !labTechId) {
      toast('Enter test name and select a lab technician.', 'error')
      return
    }
    try {
      await orderLab.mutateAsync({
        patientId: patient.id,
        doctorId,
        appointmentId: appointment.id,
        test_name: labTest.trim(),
        notes: labNotes.trim() || undefined,
        technician_id: labTechId,
        patientUserId: patient.user_id,
      })
      toast('Lab request sent to technician. Patient notified.')
      setLabTest('')
      setLabNotes('')
      setLabTechId('')
      refetchAptLabs()
      setTab('labs')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to order lab test.', 'error')
    }
  }

  const handleComplete = async () => {
    if (!doctorId) return
    if (isDoctor && myDoctor && doctorId !== myDoctor.id) {
      toast('This appointment belongs to another doctor.', 'error')
      return
    }
    if (isPending) {
      toast('Accept the appointment before completing the visit.', 'error')
      return
    }
    try {
      await complete.mutateAsync({
        appointmentId: appointment.id,
        patientId: patient.id,
        doctorId,
        chiefComplaint: chiefComplaint || appointment.reason || '',
        symptoms: symptoms || appointment.symptoms || '',
        notes,
        diagnosis,
        vitals,
        prescriptions: prescriptions.map((p) => ({
          medicine_id: p.medicine_id,
          dosage: p.dosage,
          frequency: p.frequency,
          duration: p.duration,
          quantity: p.quantity,
          instructions: p.instructions,
        })),
        labTests: [],
        patientUserId: patient.user_id,
      })
      toast('Visit completed. Prescriptions sent to pharmacy; patient notified.')
      navigate('/appointments')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to complete visit.', 'error')
    }
  }

  const pastVisits = timeline?.filter((v) => v.appointment.id !== appointment.id && v.record) ?? []

  return (
    <div>
      <div className="mb-4">
        <Link to="/appointments" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to appointments
        </Link>
      </div>

      {/* Patient header card */}
      <div className="rounded-2xl bg-gradient-to-r from-navy-900 to-primary-800 text-white p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
            {patient.first_name[0]}{patient.last_name[0]}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold font-display">{patient.first_name} {patient.last_name}</h1>
              <Badge variant={statusColors[appointment.status as AppointmentStatus] || 'default'} className="!bg-white/20 !text-white border-white/30">
                {appointment.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-white/70 text-sm mt-1">
              {patient.patient_number} · {age ?? '—'} yrs · {patient.blood_group || 'Blood group unknown'}
              · {formatDate(appointment.appointment_date)} at {formatTime(appointment.start_time)}
            </p>
          </div>
          {!isCompleted && isMyAppointment && (
            <div className="flex gap-2">
              <Button variant="outline" className="!border-white/40 !text-white hover:!bg-white/10" onClick={handleSaveDraft} loading={saveDraft.isPending}>
                <Save className="h-4 w-4" /> Save notes
              </Button>
            </div>
          )}
        </div>
      </div>

      {isPending && isMyAppointment && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2 text-amber-900 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>This appointment is pending your acceptance. Accept it to start documenting this visit.</span>
          </div>
          <Button onClick={handleAccept} loading={acceptApt.isPending}>
            <CheckCircle className="h-4 w-4" /> Accept appointment
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-navy-100/60 p-1 rounded-xl w-fit">
        {([
          { id: 'visit' as Tab, label: 'This Visit', icon: FileText },
          { id: 'history' as Tab, label: 'Follow-up History', icon: History },
          { id: 'labs' as Tab, label: 'Lab Orders', icon: FlaskConical },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
              tab === id ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-600 hover:text-navy-900',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {id === 'labs' && aptLabs && aptLabs.length > 0 && (
              <span className="ml-1 h-5 w-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">{aptLabs.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar — always visible */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-navy-900 mb-3 flex items-center gap-2"><User className="h-4 w-4" /> Patient profile</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-navy-500">Phone</dt><dd>{patient.phone || '—'}</dd></div>
              <div><dt className="text-navy-500">Insurance</dt><dd>{patient.insurance_provider || 'None'}</dd></div>
              <div>
                <dt className="text-navy-500">Allergies</dt>
                <dd className={patient.allergies?.length ? 'text-danger font-medium' : ''}>
                  {patient.allergies?.length ? patient.allergies.join(', ') : 'None recorded'}
                </dd>
              </div>
            </dl>
          </Card>

          {clinical?.latestAssessment && (
            <Card>
              <h3 className="font-semibold text-navy-900 mb-3 flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Nurse vitals</h3>
              <dl className="space-y-1 text-sm">
                {clinical.latestAssessment.blood_pressure && <div>BP: <strong>{clinical.latestAssessment.blood_pressure}</strong></div>}
                {clinical.latestAssessment.temperature && <div>Temp: <strong>{clinical.latestAssessment.temperature}°C</strong></div>}
                {clinical.latestAssessment.pulse && <div>Pulse: <strong>{clinical.latestAssessment.pulse} bpm</strong></div>}
              </dl>
              <Badge variant="success" className="mt-2">Ready for doctor</Badge>
            </Card>
          )}

          {appointment.symptoms && (
            <Card className="border-l-4 border-l-amber-400">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Patient reported</p>
              <p className="text-sm text-navy-700">{appointment.symptoms}</p>
            </Card>
          )}
        </div>

        {/* Main tab content */}
        <div className="lg:col-span-2 space-y-6">
          {tab === 'visit' && (
            <>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-navy-900">Visit notes — {formatDate(appointment.appointment_date)}</h3>
                  {existingVisit && <Badge variant="info">Draft saved</Badge>}
                </div>
                <p className="text-xs text-navy-500 mb-4">
                  These notes belong to <strong>this appointment only</strong>. Each new visit gets its own record.
                </p>
                {isCompleted ? (
                  <div className="space-y-3 text-sm bg-navy-50 rounded-xl p-4">
                    <div><span className="text-navy-500">Chief complaint:</span> <strong>{chiefComplaint || '—'}</strong></div>
                    <div><span className="text-navy-500">Symptoms:</span> {symptoms || '—'}</div>
                    <div><span className="text-navy-500">Diagnosis:</span> <strong>{diagnosis || '—'}</strong></div>
                    <div><span className="text-navy-500">Doctor notes:</span> {notes || '—'}</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Input label="Chief complaint" value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} disabled={!isMyAppointment || isPending} />
                    <div>
                      <label className="text-sm font-medium text-navy-700 mb-1 block">Symptoms & examination</label>
                      <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={3} disabled={!isMyAppointment || isPending} className="w-full rounded-xl border border-navy-200 px-4 py-2 text-sm disabled:opacity-60" placeholder="What the patient reports and what you observe..." />
                    </div>
                    <Input label="Diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} disabled={!isMyAppointment || isPending} placeholder="e.g. Acute pharyngitis" />
                    <div>
                      <label className="text-sm font-medium text-navy-700 mb-1 block">Clinical notes & follow-up plan</label>
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} disabled={!isMyAppointment || isPending} className="w-full rounded-xl border border-navy-200 px-4 py-2 text-sm disabled:opacity-60" placeholder="Treatment plan, advice, when to return..." />
                    </div>
                  </div>
                )}
              </Card>

              {!isCompleted && isMyAppointment && !isPending && (
                <Card>
                  <h3 className="font-semibold text-navy-900 mb-1 flex items-center gap-2"><Pill className="h-4 w-4" /> Prescription</h3>
                  <p className="text-xs text-navy-500 mb-4">Patient collects at pharmacy — pharmacist dispenses and updates stock.</p>
                  <div className="grid sm:grid-cols-2 gap-3 mb-3">
                    <select value={rxName} onChange={(e) => setRxName(e.target.value)} className="rounded-xl border border-navy-200 px-3 py-2 text-sm sm:col-span-2">
                      <option value="">Select medicine</option>
                      {medicines?.map((m) => {
                        const stock = (m.inventory as { quantity: number }[])?.[0]?.quantity ?? 0
                        return <option key={m.id} value={m.id}>{m.name} — {stock} in stock</option>
                      })}
                    </select>
                    <Input placeholder="Dosage" value={rxDosage} onChange={(e) => setRxDosage(e.target.value)} />
                    <Input placeholder="Qty" type="number" min={1} value={rxQuantity} onChange={(e) => setRxQuantity(e.target.value)} />
                    <Input placeholder="Frequency" value={rxFrequency} onChange={(e) => setRxFrequency(e.target.value)} />
                    <Input placeholder="Duration" value={rxDuration} onChange={(e) => setRxDuration(e.target.value)} />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    const med = medicines?.find((m) => m.id === rxName)
                    if (!med || !rxDosage) return
                    setPrescriptions((p) => [...p, {
                      medicine_id: med.id, name: med.name, dosage: rxDosage,
                      frequency: rxFrequency, duration: rxDuration,
                      quantity: Math.max(1, parseInt(rxQuantity, 10) || 1),
                      instructions: rxInstructions || undefined,
                    }])
                    setRxName(''); setRxDosage(''); setRxQuantity('1')
                  }}>Add medicine</Button>
                  {prescriptions.length > 0 && (
                    <ul className="mt-3 space-y-2 text-sm">
                      {prescriptions.map((p, i) => (
                        <li key={i} className="bg-navy-50 rounded-lg px-3 py-2 flex justify-between">
                          <span>{p.name} — {p.dosage} · {p.frequency} · Qty {p.quantity}</span>
                          <button type="button" className="text-danger text-xs" onClick={() => setPrescriptions((l) => l.filter((_, idx) => idx !== i))}>Remove</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              )}

              {!isCompleted && isMyAppointment && !isPending && (
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => navigate('/appointments')}>Back</Button>
                  <Button variant="outline" onClick={handleSaveDraft} loading={saveDraft.isPending}>
                    <Save className="h-4 w-4" /> Save draft
                  </Button>
                  <Button onClick={handleComplete} loading={complete.isPending}>
                    <CheckCircle className="h-4 w-4" /> Complete visit
                  </Button>
                </div>
              )}
            </>
          )}

          {tab === 'history' && (
            <Card>
              <h3 className="font-semibold text-navy-900 mb-2">Follow-up timeline</h3>
              <p className="text-xs text-navy-500 mb-6">Previous visits for this patient — each appointment has its own notes.</p>
              {!pastVisits.length ? (
                <p className="text-sm text-navy-400 py-8 text-center">No previous visit records yet. This may be the patient&apos;s first visit.</p>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-navy-200">
                  {pastVisits.map(({ appointment: apt, record }) => {
                    const doc = apt.doctor as { display_name?: string; specialization?: string } | null
                    const dx = (record?.diagnoses as { description: string }[] | null)?.[0]?.description
                    return (
                      <div key={apt.id} className="relative">
                        <div className="absolute -left-4 top-1.5 h-3 w-3 rounded-full bg-primary-500 ring-4 ring-white" />
                        <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <p className="font-semibold text-navy-900">{formatDate(apt.appointment_date)}</p>
                            <Badge variant={statusColors[apt.status as AppointmentStatus] || 'default'}>{apt.status}</Badge>
                          </div>
                          <p className="text-xs text-navy-500 mb-2">
                            Dr. {doc?.display_name || 'Unknown'} · {doc?.specialization || 'General'}
                          </p>
                          {record ? (
                            <div className="text-sm space-y-1">
                              {record.chief_complaint && <p><span className="text-navy-500">Complaint:</span> {record.chief_complaint}</p>}
                              {dx && <p><span className="text-navy-500">Diagnosis:</span> <strong>{dx}</strong></p>}
                              {record.notes && <p className="text-navy-700 bg-white rounded-lg p-2 mt-2 border border-navy-100">{record.notes}</p>}
                            </div>
                          ) : (
                            <p className="text-sm text-navy-400 italic">No notes recorded for this visit</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          )}

          {tab === 'labs' && (
            <>
              {!isCompleted && isMyAppointment && !isPending && (
                <Card className="border-l-4 border-l-sky-500">
                  <h3 className="font-semibold text-navy-900 mb-1 flex items-center gap-2"><FlaskConical className="h-4 w-4 text-sky-600" /> Request lab test</h3>
                  <p className="text-xs text-navy-500 mb-4">
                    Describe what the lab should check. The technician enters results — you review them in Lab Results.
                  </p>
                  <div className="space-y-3">
                    <Input placeholder="Test name (e.g. Full Blood Count, Malaria RDT)" value={labTest} onChange={(e) => setLabTest(e.target.value)} />
                    <textarea
                      value={labNotes}
                      onChange={(e) => setLabNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-navy-200 px-4 py-2 text-sm"
                      placeholder="Instructions for lab technician — what to test, what to look for, urgency..."
                    />
                    <select value={labTechId} onChange={(e) => setLabTechId(e.target.value)} className="w-full rounded-xl border border-navy-200 px-3 py-2 text-sm">
                      <option value="">Assign lab technician</option>
                      {labTechnicians?.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                    </select>
                    <Button onClick={handleOrderLab} loading={orderLab.isPending} disabled={!labTest.trim() || !labTechId}>
                      Send to lab
                    </Button>
                  </div>
                </Card>
              )}

              <Card>
                <h3 className="font-semibold text-navy-900 mb-4">Tests for this visit</h3>
                {!aptLabs?.length ? (
                  <p className="text-sm text-navy-400 py-4 text-center">No lab tests ordered for this appointment yet</p>
                ) : (
                  <div className="space-y-3">
                    {aptLabs.map((test) => {
                      const results = test.laboratory_results as { result_summary?: string }[] | null
                      const techName = (test as { technician_name?: string }).technician_name
                      return (
                        <div key={test.id} className="rounded-xl border border-navy-100 p-4">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-medium text-navy-900">{test.test_name}</p>
                              <p className="text-xs text-navy-500 mt-1">
                                Ordered {formatDate(test.ordered_at)}
                                {techName && ` · ${techName}`}
                              </p>
                              {test.notes && (
                                <p className="text-xs text-sky-800 bg-sky-50 rounded-lg px-3 py-2 mt-2">
                                  <strong>Your instructions:</strong> {test.notes}
                                </p>
                              )}
                            </div>
                            <Badge variant={test.status === 'completed' ? 'success' : test.status === 'in_progress' ? 'info' : 'warning'}>
                              {test.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          {results?.[0]?.result_summary ? (
                            <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-sm">
                              <p className="text-xs font-semibold text-emerald-800 mb-1">Technician results (read-only)</p>
                              {results[0].result_summary}
                            </div>
                          ) : test.status !== 'completed' && (
                            <p className="text-xs text-amber-700 mt-2 flex items-center gap-1"><Clock className="h-3 w-3" /> Awaiting lab technician</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                {aptLabs?.some((t) => t.status === 'completed') && (
                  <Link to="/lab-results" className="block mt-4 text-sm text-primary-600 hover:underline">
                    View all lab results →
                  </Link>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
