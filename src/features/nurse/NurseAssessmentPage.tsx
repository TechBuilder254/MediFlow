import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HeartPulse } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/hooks/useAuth'
import { useNurseAssessment } from '@/services/clinicalService'
import { formatTime } from '@/utils/cn'

export function NurseAssessmentPage() {
  const { profile } = useAuthStore()
  const assess = useNurseAssessment()
  const [selectedApt, setSelectedApt] = useState<string | null>(null)
  const [form, setForm] = useState({
    blood_pressure: '', temperature: '', weight_kg: '', height_cm: '',
    pulse: '', oxygen_saturation: '', blood_sugar: '', pain_level: '', chief_complaint: '',
  })

  const today = new Date().toISOString().split('T')[0]

  const { data: waiting, isLoading } = useQuery({
    queryKey: ['nurse-waiting'],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*, patient:patients(first_name, last_name, patient_number)')
        .eq('appointment_date', today)
        .in('status', ['checked_in', 'confirmed'])
        .order('start_time')
      return data ?? []
    },
    refetchInterval: 15000,
  })

  const selected = waiting?.find((a) => a.id === selectedApt)
  const patient = selected?.patient as { first_name: string; last_name: string; patient_number: string } | null
  const patientId = selected?.patient_id as string | undefined

  const submit = async (ready: boolean) => {
    if (!selected || !patientId || !profile) return
    await assess.mutateAsync({
      patient_id: patientId,
      appointment_id: selected.id,
      nurse_id: profile.id,
      blood_pressure: form.blood_pressure || undefined,
      temperature: form.temperature ? Number(form.temperature) : undefined,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      height_cm: form.height_cm ? Number(form.height_cm) : undefined,
      pulse: form.pulse ? Number(form.pulse) : undefined,
      oxygen_saturation: form.oxygen_saturation ? Number(form.oxygen_saturation) : undefined,
      blood_sugar: form.blood_sugar ? Number(form.blood_sugar) : undefined,
      pain_level: form.pain_level ? Number(form.pain_level) : undefined,
      chief_complaint: form.chief_complaint || undefined,
      status: ready ? 'ready_for_doctor' : 'in_progress',
    })
    setSelectedApt(null)
    setForm({ blood_pressure: '', temperature: '', weight_kg: '', height_cm: '', pulse: '', oxygen_saturation: '', blood_sugar: '', pain_level: '', chief_complaint: '' })
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader title="Nurse Assessment" description="Record vitals and prepare patients for the doctor" />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-primary-600" /> Patients Waiting
          </h3>
          <div className="space-y-2">
            {waiting?.map((apt) => {
              const p = apt.patient as { first_name: string; last_name: string; patient_number: string }
              return (
                <button
                  key={apt.id}
                  type="button"
                  onClick={() => setSelectedApt(apt.id)}
                  className={`w-full text-left rounded-xl border p-3 ${selectedApt === apt.id ? 'border-primary-600 bg-primary-50' : 'border-navy-100'}`}
                >
                  <p className="font-medium">{p.first_name} {p.last_name}</p>
                  <p className="text-xs text-navy-500">{formatTime(apt.start_time)} · {p.patient_number}</p>
                </button>
              )
            })}
            {!waiting?.length && <p className="text-sm text-navy-500 text-center py-6">No patients waiting for assessment</p>}
          </div>
        </Card>

        <Card>
          {selected && patient ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-navy-900">{patient.first_name} {patient.last_name}</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Blood Pressure" placeholder="120/80" value={form.blood_pressure} onChange={(e) => setForm({ ...form, blood_pressure: e.target.value })} />
                <Input label="Temperature (°C)" type="number" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} />
                <Input label="Weight (kg)" type="number" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
                <Input label="Height (cm)" type="number" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
                <Input label="Pulse (bpm)" type="number" value={form.pulse} onChange={(e) => setForm({ ...form, pulse: e.target.value })} />
                <Input label="Oxygen (%)" type="number" value={form.oxygen_saturation} onChange={(e) => setForm({ ...form, oxygen_saturation: e.target.value })} />
                <Input label="Blood Sugar" type="number" value={form.blood_sugar} onChange={(e) => setForm({ ...form, blood_sugar: e.target.value })} />
                <Input label="Pain (0-10)" type="number" min={0} max={10} value={form.pain_level} onChange={(e) => setForm({ ...form, pain_level: e.target.value })} />
              </div>
              <Input label="Chief Complaint" value={form.chief_complaint} onChange={(e) => setForm({ ...form, chief_complaint: e.target.value })} />
              <div className="flex gap-2">
                <Button onClick={() => submit(true)} loading={assess.isPending}>Ready for Doctor</Button>
                <Button variant="outline" onClick={() => submit(false)}>Save Draft</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-navy-500 text-center py-12">Select a patient to start assessment</p>
          )}
        </Card>
      </div>
    </div>
  )
}
