import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { QRCodeSVG } from 'qrcode.react'
import { User, Shield, Lock } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyPatientRecord, useUpdateMyProfile } from '@/services/patientPortalService'
import { supabase } from '@/lib/supabase'
import { getInitials } from '@/utils/cn'
import { toast } from '@/hooks/useToast'
import { getAuthErrorMessage } from '@/utils/authErrors'

export function PatientProfilePage() {
  const { user, profile } = useAuthStore()
  const { data: patient, isLoading } = useMyPatientRecord(user?.id)
  const updateProfile = useUpdateMyProfile()
  const [pwMsg, setPwMsg] = useState('')

  const form = useForm({
    values: patient ? {
      phone: patient.phone || '',
      address: patient.address || '',
      emergency_contact_name: patient.emergency_contact_name || '',
      emergency_contact_phone: patient.emergency_contact_phone || '',
      next_of_kin_name: patient.next_of_kin_name || '',
      next_of_kin_phone: patient.next_of_kin_phone || '',
      next_of_kin_relationship: patient.next_of_kin_relationship || '',
    } : undefined,
  })

  if (isLoading || !patient) return <LoadingSpinner />

  const onSave = async (data: Record<string, string>) => {
    try {
      await updateProfile.mutateAsync({ id: patient.id, ...data })
      toast('Profile saved successfully!')
    } catch (err) {
      toast(getAuthErrorMessage(err, 'Could not save profile.'), 'error')
    }
  }

  const changePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const password = fd.get('password') as string
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast(error.message, 'error')
      setPwMsg(error.message)
    } else {
      toast('Password updated successfully!')
      setPwMsg('')
      e.currentTarget.reset()
    }
  }

  return (
    <div>
      <PageHeader title="My Profile" description="Manage your personal and emergency information" />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="text-center">
          <div className="h-20 w-20 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold mx-auto">
            {getInitials(profile?.full_name || 'P')}
          </div>
          <h2 className="mt-4 font-bold text-navy-900">{profile?.full_name}</h2>
          <p className="text-sm text-navy-500">{profile?.email}</p>
          <Badge variant="primary" className="mt-3">{patient.patient_number}</Badge>
          <div className="mt-4 p-3 inline-block border border-navy-100 rounded-xl">
            <QRCodeSVG value={patient.patient_number} size={90} />
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary-600" />
              <h3 className="font-semibold text-navy-900">Contact Information</h3>
            </div>
            <form onSubmit={form.handleSubmit(onSave)} className="grid sm:grid-cols-2 gap-4">
              <Input label="Phone" {...form.register('phone')} />
              <Input label="Address" {...form.register('address')} className="sm:col-span-2" />
              <Input label="Emergency Contact Name" {...form.register('emergency_contact_name')} />
              <Input label="Emergency Contact Phone" {...form.register('emergency_contact_phone')} />
              <Input label="Next of Kin" {...form.register('next_of_kin_name')} />
              <Input label="Next of Kin Phone" {...form.register('next_of_kin_phone')} />
              <Input label="Relationship" {...form.register('next_of_kin_relationship')} />
              <div className="sm:col-span-2 flex items-center gap-3">
                <Button type="submit" loading={updateProfile.isPending}>Save Changes</Button>
              </div>
            </form>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary-600" />
              <h3 className="font-semibold text-navy-900">Medical Profile</h3>
              <Badge variant="default">Read-only</Badge>
            </div>
            <p className="text-xs text-navy-500 mb-4">Updated by your doctor during visits</p>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                ['Blood Group', patient.blood_group],
                ['Height', patient.height_cm ? `${patient.height_cm} cm` : null],
                ['Weight', patient.weight_kg ? `${patient.weight_kg} kg` : null],
                ['Allergies', patient.allergies?.join(', ')],
                ['Chronic Diseases', patient.chronic_diseases?.join(', ')],
                ['Medical Conditions', patient.medical_conditions?.join(', ')],
                ['Insurance', patient.insurance_provider],
                ['Policy Number', patient.insurance_number],
                ['Current Medications', patient.current_medications?.join(', ')],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-xl bg-navy-50 px-4 py-3">
                  <p className="text-xs text-navy-400">{label}</p>
                  <p className="font-medium text-navy-800 mt-0.5">{(value as string) || '—'}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-primary-600" />
              <h3 className="font-semibold text-navy-900">Change Password</h3>
            </div>
            <form onSubmit={changePassword} className="flex gap-4 items-end max-w-md">
              <Input label="New Password" name="password" type="password" required minLength={6} className="flex-1" />
              <Button type="submit">Update</Button>
            </form>
            {pwMsg && <p className="text-sm mt-2 text-navy-600">{pwMsg}</p>}
          </Card>
        </div>
      </div>
    </div>
  )
}
