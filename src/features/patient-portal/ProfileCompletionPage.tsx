import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyPatientRecord, useUpdateMyProfile } from '@/services/patientPortalService'
import { calcProfileCompletion } from '@/utils/patientFlow'
import { LoadingSpinner } from '@/components/ui/EmptyState'

export function ProfileCompletionPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { data: patient, isLoading } = useMyPatientRecord(user?.id)
  const update = useUpdateMyProfile()
  const [skipped, setSkipped] = useState(false)

  const form = useForm({
    values: patient ? {
      blood_group: patient.blood_group || '',
      address: patient.address || '',
      emergency_contact_name: patient.emergency_contact_name || '',
      emergency_contact_phone: patient.emergency_contact_phone || '',
      next_of_kin_name: patient.next_of_kin_name || '',
      next_of_kin_phone: patient.next_of_kin_phone || '',
      next_of_kin_relationship: patient.next_of_kin_relationship || '',
      allergies: patient.allergies?.join(', ') || '',
      insurance_provider: patient.insurance_provider || '',
      insurance_number: patient.insurance_number || '',
      medical_conditions: patient.medical_conditions?.join(', ') || '',
    } : undefined,
  })

  if (isLoading) return <LoadingSpinner />

  const { percent, missing } = calcProfileCompletion(patient)

  if (patient?.profile_completed && !skipped) {
    navigate('/portal', { replace: true })
    return null
  }

  const onSave = async (data: Record<string, string>, complete = false) => {
    if (!patient) return
    await update.mutateAsync({
      id: patient.id,
      blood_group: data.blood_group || null,
      address: data.address || null,
      emergency_contact_name: data.emergency_contact_name || null,
      emergency_contact_phone: data.emergency_contact_phone || null,
      next_of_kin_name: data.next_of_kin_name || null,
      next_of_kin_phone: data.next_of_kin_phone || null,
      next_of_kin_relationship: data.next_of_kin_relationship || null,
      allergies: data.allergies ? data.allergies.split(',').map((a) => a.trim()).filter(Boolean) : [],
      insurance_provider: data.insurance_provider || null,
      insurance_number: data.insurance_number || null,
      medical_conditions: data.medical_conditions ? data.medical_conditions.split(',').map((a) => a.trim()).filter(Boolean) : [],
      profile_completed: complete,
    })
    navigate('/portal')
  }

  return (
    <div>
      <PageHeader title="Complete Your Profile" description="Help us serve you better — optional fields can be skipped" />

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-navy-700">Profile Completion</p>
          <p className="text-sm font-bold text-primary-600">{percent}%</p>
        </div>
        <div className="h-3 rounded-full bg-navy-100 overflow-hidden">
          <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${percent}%` }} />
        </div>
        {missing.length > 0 && (
          <p className="text-xs text-navy-500 mt-2">Missing: {missing.join(', ')}</p>
        )}
      </Card>

      <Card>
        <form onSubmit={form.handleSubmit((d) => onSave(d, percent >= 60))} className="grid sm:grid-cols-2 gap-4">
          <Input label="Blood Group" {...form.register('blood_group')} placeholder="e.g. O+" />
          <Input label="Address" {...form.register('address')} className="sm:col-span-2" />
          <Input label="Emergency Contact Name" {...form.register('emergency_contact_name')} />
          <Input label="Emergency Contact Phone" {...form.register('emergency_contact_phone')} />
          <Input label="Next of Kin" {...form.register('next_of_kin_name')} />
          <Input label="Next of Kin Phone" {...form.register('next_of_kin_phone')} />
          <Input label="Relationship" {...form.register('next_of_kin_relationship')} placeholder="Spouse, Parent..." />
          <Input label="Allergies (comma-separated)" {...form.register('allergies')} className="sm:col-span-2" placeholder="Penicillin, Peanuts" />
          <Input label="Insurance Provider (Optional)" {...form.register('insurance_provider')} />
          <Input label="Insurance Number (Optional)" {...form.register('insurance_number')} />
          <Input label="Medical Conditions (Optional)" {...form.register('medical_conditions')} className="sm:col-span-2" placeholder="Diabetes, Hypertension" />
          <div className="sm:col-span-2 flex gap-3 pt-2">
            <Button type="submit" loading={update.isPending}>Save & Continue</Button>
            <Button type="button" variant="ghost" onClick={() => { setSkipped(true); navigate('/portal') }}>Skip for Now</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
