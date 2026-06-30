import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BedDouble, UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/cn'
import type { BedStatus } from '@/types'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/hooks/useAuth'
import { isDoctorRole } from '@/lib/permissions'
import { useDoctorRecord } from '@/services/doctorService'
import { useAdmitPatient } from '@/services/admissionService'
import { usePatients } from '@/services/patientService'
import { toast } from '@/hooks/useToast'

const bedColors: Record<BedStatus, string> = {
  available: 'bg-emerald-100 border-emerald-300 text-emerald-700',
  occupied: 'bg-red-100 border-red-300 text-red-700',
  cleaning: 'bg-amber-100 border-amber-300 text-amber-700',
}

export function AdmissionsPage() {
  const { user, profile } = useAuthStore()
  const isDoctor = isDoctorRole(profile?.role)
  const { data: myDoctor } = useDoctorRecord(isDoctor ? user?.id : undefined)
  const admit = useAdmitPatient()
  const { data: patients } = usePatients()

  const [showAdmitForm, setShowAdmitForm] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [wardId, setWardId] = useState('')
  const [bedId, setBedId] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')

  const { data: wards, isLoading: wardsLoading } = useQuery({
    queryKey: ['wards'],
    queryFn: async () => {
      const { data, error } = await supabase.from('wards').select('*').order('name')
      if (error) throw error
      return data
    },
  })

  const { data: beds } = useQuery({
    queryKey: ['beds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beds')
        .select('*, room:rooms(room_number, ward_id)')
      if (error) throw error
      return data
    },
  })

  const { data: admissions } = useQuery({
    queryKey: ['admissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admissions')
        .select('*, patient:patients(first_name, last_name), ward:wards(name)')
        .eq('status', 'admitted')
        .order('admission_date', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const availableBeds = beds?.filter(
    (b) => b.status === 'available' && (b.room as { ward_id: string })?.ward_id === wardId,
  ) ?? []

  const handleAdmit = async () => {
    if (!myDoctor?.id) {
      toast('Your doctor profile was not found.', 'error')
      return
    }
    if (!patientId || !wardId || !bedId || !diagnosis.trim()) {
      toast('Select patient, ward, bed, and enter diagnosis.', 'error')
      return
    }
    const patient = patients?.find((p) => p.id === patientId)
    try {
      await admit.mutateAsync({
        patient_id: patientId,
        doctor_id: myDoctor.id,
        ward_id: wardId,
        bed_id: bedId,
        diagnosis: diagnosis.trim(),
        notes: notes.trim() || undefined,
        patientUserId: patient?.user_id,
      })
      toast('Patient admitted successfully.')
      setShowAdmitForm(false)
      setPatientId('')
      setWardId('')
      setBedId('')
      setDiagnosis('')
      setNotes('')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to admit patient.', 'error')
    }
  }

  if (wardsLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Admissions & Bed Management"
        description={isDoctor
          ? 'Review lab results and admit patients who need inpatient care'
          : 'Track patient admissions and bed availability'}
        action={isDoctor ? (
          <Button onClick={() => setShowAdmitForm((v) => !v)}>
            <UserPlus className="h-4 w-4 mr-2" />
            {showAdmitForm ? 'Cancel' : 'Admit patient'}
          </Button>
        ) : undefined}
      />

      {isDoctor && showAdmitForm && (
        <Card className="mb-8">
          <h3 className="font-semibold text-navy-900 mb-4">Admit patient</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-navy-700 mb-1 block">Patient</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full rounded-xl border border-navy-200 px-3 py-2 text-sm"
              >
                <option value="">Select patient</option>
                {patients?.map((p) => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.patient_number})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-navy-700 mb-1 block">Ward</label>
              <select
                value={wardId}
                onChange={(e) => { setWardId(e.target.value); setBedId('') }}
                className="w-full rounded-xl border border-navy-200 px-3 py-2 text-sm"
              >
                <option value="">Select ward</option>
                {wards?.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-navy-700 mb-1 block">Available bed</label>
              <select
                value={bedId}
                onChange={(e) => setBedId(e.target.value)}
                disabled={!wardId}
                className="w-full rounded-xl border border-navy-200 px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">Select bed</option>
                {availableBeds.map((b) => (
                  <option key={b.id} value={b.id}>
                    Room {(b.room as { room_number: string })?.room_number} — Bed {b.bed_number}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-navy-700 mb-1 block">Diagnosis / reason</label>
              <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Severe anemia — observation required" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-navy-700 mb-1 block">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-navy-200 px-4 py-2 text-sm"
                placeholder="Clinical notes for ward staff..."
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleAdmit} loading={admit.isPending}>Confirm admission</Button>
          </div>
        </Card>
      )}

      <div className="flex gap-4 mb-8">
        {(['available', 'occupied', 'cleaning'] as BedStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-2 text-sm">
            <div className={cn('h-4 w-4 rounded border', bedColors[s])} />
            <span className="capitalize text-navy-600">{s}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {wards?.map((ward) => {
          const wardBeds = beds?.filter((b) => (b.room as { ward_id: string })?.ward_id === ward.id) ?? []
          return (
            <Card key={ward.id}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold font-display text-navy-900">{ward.name}</h3>
                <Badge variant="info">{ward.type}</Badge>
              </div>
              {wardBeds.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {wardBeds.map((bed) => (
                    <div
                      key={bed.id}
                      className={cn(
                        'rounded-xl border-2 p-3 text-center text-xs font-semibold',
                        bedColors[bed.status as BedStatus],
                      )}
                    >
                      <BedDouble className="h-4 w-4 mx-auto mb-1" />
                      {(bed.room as { room_number: string })?.room_number}-{bed.bed_number}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-navy-400 py-4 text-center">No beds configured for this ward</p>
              )}
            </Card>
          )
        })}
      </div>

      <Card>
        <h3 className="font-semibold text-navy-900 mb-4">Current Admissions</h3>
        {!admissions?.length ? (
          <p className="text-sm text-navy-400 py-4">No active admissions</p>
        ) : (
          <div className="space-y-3">
            {admissions.map((adm) => {
              const patient = adm.patient as { first_name: string; last_name: string } | null
              const ward = adm.ward as { name: string } | null
              return (
                <div key={adm.id} className="flex items-center justify-between py-3 border-b border-navy-50 last:border-0">
                  <div>
                    <p className="font-medium text-navy-900">{patient ? `${patient.first_name} ${patient.last_name}` : '—'}</p>
                    <p className="text-sm text-navy-500">{ward?.name} &middot; {adm.diagnosis || 'Under observation'}</p>
                  </div>
                  <p className="text-sm text-navy-500">{formatDate(adm.admission_date)}</p>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
