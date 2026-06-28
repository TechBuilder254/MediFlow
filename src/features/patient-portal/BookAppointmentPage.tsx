import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Star, ChevronLeft, ChevronRight, Upload, Building2, Stethoscope,
  Calendar, Clock, FileText, CheckCircle, X, User, Plus, PenLine,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState, LoadingSpinner } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import {
  useMyPatientRecord,
  useBookAppointment,
  useDoctorBookedSlots,
  uploadAppointmentFiles,
} from '@/services/patientPortalService'
import { supabase } from '@/lib/supabase'
import {
  URGENCY_OPTIONS,
  getDoctorAvailableDates,
  getDoctorSlotsForDate,
  getSlotEndTime,
  getDoctorName,
  getNextAvailableLabel,
  formatWorkingDays,
  formatTime12,
  formatBookingDate,
  FEATURED_BOOKING_DEPARTMENTS,
  TRIAGE_DEPARTMENT_NAME,
} from '@/utils/patientFlow'
import { BookingCalendar } from '@/features/patient-portal/components/BookingCalendar'
import { BookingTimePicker } from '@/features/patient-portal/components/BookingTimePicker'
import type { AppointmentUrgency } from '@/types'
import { cn } from '@/utils/cn'

const STEPS = [
  { key: 'department', label: 'Department', icon: Building2, desc: 'Choose the department for your visit' },
  { key: 'doctor', label: 'Doctor', icon: Stethoscope, desc: 'Select a doctor from the department' },
  { key: 'date', label: 'Date', icon: Calendar, desc: 'Pick a preferred day' },
  { key: 'time', label: 'Time', icon: Clock, desc: 'Choose an available time slot' },
  { key: 'details', label: 'Details', icon: FileText, desc: 'Describe your problem and urgency' },
  { key: 'confirm', label: 'Confirm', icon: CheckCircle, desc: 'Review and submit your request' },
] as const

const BOOKING_DEPARTMENTS = FEATURED_BOOKING_DEPARTMENTS

type DeptRow = { id: string; name: string; description?: string | null }

type DoctorRow = {
  id: string
  display_name?: string | null
  specialization?: string | null
  qualification?: string | null
  years_experience?: number | null
  consultation_fee?: number | null
  consultation_room?: string | null
  languages?: string[] | null
  schedule?: unknown
  profile?: { full_name: string } | { full_name: string }[] | null
}

export function BookAppointmentPage() {
  const [step, setStep] = useState(0)
  const [deptId, setDeptId] = useState('')
  const [showAllDepartments, setShowAllDepartments] = useState(false)
  const [isCustomService, setIsCustomService] = useState(false)
  const [customServiceName, setCustomServiceName] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [urgency, setUrgency] = useState<AppointmentUrgency>('routine')
  const [symptoms, setSymptoms] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [profileDoctor, setProfileDoctor] = useState<DoctorRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { user } = useAuthStore()
  const { data: patient } = useMyPatientRecord(user?.id)
  const book = useBookAppointment()
  const navigate = useNavigate()

  const { data: allDepartments, isLoading: loadingDepts } = useQuery({
    queryKey: ['booking-departments-all'],
    queryFn: async () => {
      const { data } = await supabase.from('departments').select('id, name, description').order('name')
      return (data ?? []) as DeptRow[]
    },
  })

  const featuredDepartments = BOOKING_DEPARTMENTS
    .map((name) => allDepartments?.find((d) => d.name === name))
    .filter(Boolean) as DeptRow[]

  const moreDepartments = allDepartments?.filter(
    (d) => !BOOKING_DEPARTMENTS.includes(d.name as (typeof BOOKING_DEPARTMENTS)[number]),
  ) ?? []

  const triageDeptId = allDepartments?.find((d) => d.name === TRIAGE_DEPARTMENT_NAME)?.id

  const selectDepartment = (id: string) => {
    setIsCustomService(false)
    setCustomServiceName('')
    setDeptId(id)
  }

  const selectCustomService = () => {
    setIsCustomService(true)
    setShowAllDepartments(false)
    setDeptId('')
  }

  useEffect(() => {
    if (!isCustomService) return
    const trimmed = customServiceName.trim()
    if (trimmed.length >= 3 && triageDeptId) {
      setDeptId(triageDeptId)
    } else {
      setDeptId('')
    }
  }, [isCustomService, customServiceName, triageDeptId])

  const { data: doctors, isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors-by-dept', deptId],
    queryFn: async () => {
      const { data } = await supabase
        .from('doctors')
        .select('id, display_name, specialization, qualification, years_experience, consultation_fee, consultation_room, languages, schedule, profile:profiles(full_name)')
        .eq('department_id', deptId)
        .eq('is_active', true)
        .order('display_name')
      return (data ?? []).filter((doc) => {
        const profile = doc.profile as { is_active?: boolean } | { is_active?: boolean }[] | null
        const p = Array.isArray(profile) ? profile[0] : profile
        return p?.is_active !== false
      }) as DoctorRow[]
    },
    enabled: !!deptId,
  })

  const selectedDoctor = doctors?.find((d) => d.id === doctorId)
  const selectedDept = allDepartments?.find((d) => d.id === deptId)
  const displayDeptName = isCustomService ? customServiceName.trim() : selectedDept?.name
  const doctorHasAvailability = selectedDoctor
    ? getDoctorAvailableDates(selectedDoctor.schedule, 1).length > 0
    : false
  const { data: bookedSlots = [], isLoading: loadingSlots } = useDoctorBookedSlots(doctorId, date)
  const availableSlots = selectedDoctor && date
    ? getDoctorSlotsForDate(selectedDoctor.schedule, bookedSlots)
    : []

  useEffect(() => {
    setDoctorId('')
    setDate('')
    setTime('')
  }, [deptId])

  useEffect(() => {
    setDate('')
    setTime('')
  }, [doctorId])

  useEffect(() => {
    setTime('')
  }, [date])

  const canNext =
    (step === 0 && !!deptId && (!isCustomService || customServiceName.trim().length >= 3)) ||
    (step === 1 && !!doctorId) ||
    (step === 2 && !!date) ||
    (step === 3 && !!time) ||
    (step === 4 && symptoms.trim().length >= 10)

  const submit = async () => {
    if (!patient || !doctorId || !deptId || !date || !time || !user) return
    setSubmitting(true)
    try {
      let attachment_urls: string[] | undefined
      if (files.length) {
        attachment_urls = await uploadAppointmentFiles(user.id, files)
      }
      await book.mutateAsync({
        patient_id: patient.id,
        doctor_id: doctorId,
        department_id: deptId,
        appointment_date: date,
        start_time: time,
        end_time: getSlotEndTime(time),
        reason: symptoms.slice(0, 100),
        symptoms,
        urgency,
        status: 'pending',
        attachment_urls,
        notes: isCustomService
          ? `Service requested: ${customServiceName.trim()}. Routed via ${TRIAGE_DEPARTMENT_NAME} for triage.`
          : undefined,
      })
      navigate('/portal/appointments')
    } finally {
      setSubmitting(false)
    }
  }

  const onFilesSelected = (list: FileList | null) => {
    if (!list) return
    const picked = Array.from(list).filter((f) => f.size <= 10 * 1024 * 1024)
    setFiles((prev) => [...prev, ...picked].slice(0, 3))
  }

  const current = STEPS[step]

  return (
    <div>
      <PageHeader
        title="Book Appointment"
        description={`Step ${step + 1} of ${STEPS.length}: ${current.label}`}
      />

      <div className="flex gap-1 mb-4">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-primary-600' : 'bg-navy-100')}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 mb-8 p-4 rounded-xl bg-primary-50 border border-primary-100">
        <div className="rounded-lg bg-primary-600 p-2 text-white">
          <current.icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-navy-900">{current.label}</p>
          <p className="text-sm text-navy-600">{current.desc}</p>
        </div>
      </div>

      {step === 0 && (
        loadingDepts ? <LoadingSpinner /> : (
          allDepartments?.length ? (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-navy-700 mb-3">Popular services</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(featuredDepartments.length ? featuredDepartments : allDepartments).map((d) => (
                    <DepartmentCard
                      key={d.id}
                      dept={d}
                      selected={!isCustomService && deptId === d.id}
                      onSelect={() => selectDepartment(d.id)}
                    />
                  ))}
                </div>
              </div>

              {moreDepartments.length > 0 && (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAllDepartments((v) => !v)
                      if (showAllDepartments) setIsCustomService(false)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    {showAllDepartments ? 'Hide other services' : `View all services (${moreDepartments.length} more)`}
                  </Button>

                  {showAllDepartments && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                      {moreDepartments.map((d) => (
                        <DepartmentCard
                          key={d.id}
                          dept={d}
                          selected={!isCustomService && deptId === d.id}
                          onSelect={() => selectDepartment(d.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-navy-700 mb-3">Can&apos;t find what you need?</p>
                <Card
                  className={cn(
                    'border-dashed',
                    isCustomService && 'ring-2 ring-primary-600 bg-primary-50/50 border-primary-200',
                  )}
                >
                  <button
                    type="button"
                    onClick={selectCustomService}
                    className="w-full text-left flex items-start gap-3"
                  >
                    <div className="rounded-lg bg-navy-100 p-2 shrink-0">
                      <PenLine className="h-5 w-5 text-navy-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-navy-900">Other — describe your service</p>
                      <p className="text-xs text-navy-500 mt-1">
                        Type what you need (e.g. Dermatology, Physiotherapy). We&apos;ll route you through {TRIAGE_DEPARTMENT_NAME} for triage.
                      </p>
                    </div>
                  </button>

                  {isCustomService && (
                    <div className="mt-4 pt-4 border-t border-navy-100">
                      <label className="text-sm font-medium text-navy-700">What service do you need?</label>
                      <input
                        type="text"
                        value={customServiceName}
                        onChange={(e) => setCustomServiceName(e.target.value)}
                        placeholder="e.g. Dermatology, ENT, Physiotherapy"
                        className="w-full mt-1.5 rounded-xl border border-navy-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        autoFocus
                      />
                      <p className={cn(
                        'text-xs mt-1',
                        customServiceName.trim().length < 3 ? 'text-amber-600' : 'text-navy-400',
                      )}>
                        {customServiceName.trim().length < 3
                          ? 'Please enter at least 3 characters'
                          : `You will be booked under ${TRIAGE_DEPARTMENT_NAME} for triage`}
                      </p>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          ) : (
            <EmptyState icon={Building2} title="No departments available" description="Please contact reception to book an appointment." />
          )
        )
      )}

      {step === 1 && isCustomService && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-900">
          You requested <strong>{customServiceName.trim()}</strong>. A {TRIAGE_DEPARTMENT_NAME} doctor will review and direct you to the right specialist if needed.
        </div>
      )}

      {step === 1 && (
        loadingDoctors ? <LoadingSpinner /> : (
          doctors?.length ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {doctors.map((doc) => (
                <Card key={doc.id} hover className={cn(doctorId === doc.id && 'ring-2 ring-primary-600')}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-navy-900">{getDoctorName(doc)}</p>
                      <p className="text-sm text-primary-600">{doc.specialization}</p>
                    </div>
                    <div className="flex text-amber-400 shrink-0">
                      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                    </div>
                  </div>
                  <p className="text-xs text-navy-500 mt-2">
                    Next Available: <span className="font-medium text-navy-700">{getNextAvailableLabel(doc.schedule)}</span>
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant={doctorId === doc.id ? 'primary' : 'outline'} onClick={() => setDoctorId(doc.id)}>
                      {doctorId === doc.id ? 'Selected' : 'Select'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setProfileDoctor(doc)}>
                      View Profile
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Stethoscope}
              title="No doctors in this department"
              description="Try another department or contact reception for assistance."
              action={<Button variant="outline" onClick={() => setStep(0)}>Choose another department</Button>}
            />
          )
        )
      )}

      {step === 2 && (
        !selectedDoctor ? (
          <EmptyState icon={Calendar} title="Select a doctor first" action={<Button onClick={() => setStep(1)}>Go to doctor selection</Button>} />
        ) : doctorHasAvailability ? (
          <BookingCalendar
            schedule={selectedDoctor.schedule}
            value={date}
            onChange={setDate}
          />
        ) : (
          <EmptyState icon={Calendar} title="No available dates" description="This doctor has no open days in the booking window. Try another doctor." />
        )
      )}

      {step === 3 && (
        loadingSlots ? <LoadingSpinner /> : (
          availableSlots.length ? (
            <BookingTimePicker
              date={date}
              slots={availableSlots}
              value={time}
              onChange={setTime}
            />
          ) : (
            <EmptyState
              icon={Clock}
              title="No times available"
              description="All slots are booked for this day. Please choose another date."
              action={<Button variant="outline" onClick={() => setStep(2)}>Pick another date</Button>}
            />
          )
        )
      )}

      {step === 4 && (
        <div className="space-y-6 max-w-xl">
          <div>
            <label className="text-sm font-medium text-navy-700">How urgent is your visit?</label>
            <div className="mt-2 space-y-2">
              {URGENCY_OPTIONS.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => setUrgency(u.value)}
                  className={cn(
                    'w-full text-left rounded-xl border p-4 transition-colors',
                    urgency === u.value ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600' : 'border-navy-200 hover:border-primary-200',
                  )}
                >
                  <span className="mr-2">{u.emoji}</span>
                  <span className="font-medium">{u.label}</span>
                  <span className="text-xs text-navy-500 block mt-0.5 ml-6">{u.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-navy-700">Describe your problem</label>
            <p className="text-xs text-navy-500 mt-0.5">Be specific — this helps the doctor prepare for your visit.</p>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={6}
              className="w-full mt-1.5 rounded-xl border border-navy-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={"I've been having chest pain for three days.\n\nSometimes I feel dizzy.\n\nNo previous heart disease."}
            />
            <p className={cn('text-xs mt-1', symptoms.trim().length < 10 ? 'text-amber-600' : 'text-navy-400')}>
              {symptoms.trim().length < 10 ? 'Please write at least 10 characters' : `${symptoms.trim().length} characters`}
            </p>
          </div>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              multiple
              className="hidden"
              onChange={(e) => onFilesSelected(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-navy-200 rounded-xl p-6 text-center text-navy-500 hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
            >
              <Upload className="h-6 w-6 mx-auto mb-2 text-navy-400" />
              <p className="text-sm font-medium">Upload referral, prescription, or X-ray</p>
              <p className="text-xs mt-1">Optional · PDF, JPG, PNG · Max 10MB each · Up to 3 files</p>
            </button>
            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between text-sm bg-navy-50 rounded-lg px-3 py-2">
                    <span className="truncate text-navy-700">{f.name}</span>
                    <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-navy-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {step === 5 && (
        <Card className="max-w-lg">
          <h3 className="font-semibold text-navy-900 mb-4">Confirm your booking</h3>
          <div className="space-y-3 text-sm">
            <SummaryRow label="Department" value={displayDeptName} />
            {isCustomService && (
              <SummaryRow label="Triage via" value={TRIAGE_DEPARTMENT_NAME} />
            )}
            <SummaryRow label="Doctor" value={selectedDoctor ? getDoctorName(selectedDoctor) : undefined} />
            <SummaryRow label="Specialization" value={selectedDoctor?.specialization ?? undefined} />
            <SummaryRow label="Date" value={date ? formatBookingDate(date).full : undefined} />
            <SummaryRow label="Time" value={time ? formatTime12(time) : undefined} />
            <SummaryRow label="Urgency" value={`${URGENCY_OPTIONS.find((u) => u.value === urgency)?.emoji} ${URGENCY_OPTIONS.find((u) => u.value === urgency)?.label}`} />
            {files.length > 0 && <SummaryRow label="Attachments" value={`${files.length} file(s)`} />}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-navy-50">
            <p className="text-xs font-medium text-navy-500 mb-1">Your symptoms</p>
            <p className="text-sm text-navy-800 whitespace-pre-wrap">{symptoms}</p>
          </div>
          <Badge variant="warning" className="mt-4">Status after submit: Pending Doctor Review</Badge>
        </Card>
      )}

      <div className="flex justify-between mt-8 pt-6 border-t border-navy-100">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        {step < 5 ? (
          <Button disabled={!canNext} onClick={() => setStep(step + 1)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={submit} loading={submitting || book.isPending}>
            Submit Request
          </Button>
        )}
      </div>

      <Modal
        open={!!profileDoctor}
        onClose={() => setProfileDoctor(null)}
        title={profileDoctor ? getDoctorName(profileDoctor) : 'Doctor Profile'}
        size="md"
      >
        {profileDoctor && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary-100 p-3">
                <User className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-navy-900">{getDoctorName(profileDoctor)}</p>
                <p className="text-primary-600">{profileDoctor.specialization}</p>
              </div>
            </div>
            <ProfileField label="Qualifications" value={profileDoctor.qualification} />
            <ProfileField label="Years of Experience" value={profileDoctor.years_experience ? `${profileDoctor.years_experience} years` : undefined} />
            <ProfileField label="Languages Spoken" value={profileDoctor.languages?.join(', ')} />
            <ProfileField label="Working Days" value={formatWorkingDays(profileDoctor.schedule)} />
            <ProfileField label="Consultation Room" value={profileDoctor.consultation_room} />
            <ProfileField label="Consultation Fee" value={profileDoctor.consultation_fee ? `KES ${Number(profileDoctor.consultation_fee).toLocaleString()}` : undefined} />
            <Button className="w-full mt-2" onClick={() => { setDoctorId(profileDoctor.id); setProfileDoctor(null) }}>
              Select this doctor
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

function DepartmentCard({
  dept,
  selected,
  onSelect,
}: {
  dept: DeptRow
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Card
      hover
      onClick={onSelect}
      className={cn(selected && 'ring-2 ring-primary-600 bg-primary-50/50')}
    >
      <p className="font-semibold text-navy-900">{dept.name}</p>
      {dept.description && <p className="text-xs text-navy-500 mt-1">{dept.description}</p>}
    </Card>
  )
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-navy-50 last:border-0">
      <span className="text-navy-500 shrink-0">{label}</span>
      <span className="font-medium text-navy-900 text-right">{value || '—'}</span>
    </div>
  )
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs font-medium text-navy-500 uppercase tracking-wide">{label}</p>
      <p className="text-navy-800 mt-0.5">{value}</p>
    </div>
  )
}
