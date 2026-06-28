import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search, UserPlus, Eye } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { usePatients, useCreatePatient } from '@/services/patientService'
import { formatDate } from '@/utils/cn'
import { useAuthStore } from '@/hooks/useAuth'
import { canRegisterPatient } from '@/lib/permissions'

const patientSchema = z.object({
  first_name: z.string().min(2, 'Required'),
  last_name: z.string().min(2, 'Required'),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  blood_group: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_number: z.string().optional(),
  allergies: z.string().optional(),
})

type PatientForm = z.infer<typeof patientSchema>

export function PatientsPage() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const { profile } = useAuthStore()
  const canRegister = canRegisterPatient(profile?.role)
  const { data: patients, isLoading } = usePatients(search)
  const createPatient = useCreatePatient()

  const form = useForm<PatientForm>({ resolver: zodResolver(patientSchema) })

  const onSubmit = async (data: PatientForm) => {
    await createPatient.mutateAsync({
      ...data,
      allergies: data.allergies ? data.allergies.split(',').map((a) => a.trim()) : [],
    })
    setShowModal(false)
    form.reset()
  }

  return (
    <div>
      <PageHeader
        title="Patients"
        description="Register, search, and manage patient records"
        action={
          canRegister ? (
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" /> Register Patient
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
        <input
          className="w-full rounded-xl border border-navy-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          placeholder="Search by name or patient number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !patients?.length ? (
        <EmptyState
          icon={UserPlus}
          title="No patients found"
          description={canRegister ? 'Register your first patient to get started' : 'No patient records yet'}
          action={canRegister ? <Button onClick={() => setShowModal(true)}>Register Patient</Button> : undefined}
        />
      ) : (
        <div className="rounded-2xl border border-navy-100 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50">
                <th className="text-left px-6 py-3 font-semibold text-navy-600">Patient #</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600">Name</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600 hidden md:table-cell">Phone</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600 hidden lg:table-cell">Blood Group</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600 hidden lg:table-cell">Registered</th>
                <th className="text-right px-6 py-3 font-semibold text-navy-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-b border-navy-50 hover:bg-navy-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <Badge variant="primary">{p.patient_number}</Badge>
                  </td>
                  <td className="px-6 py-4 font-medium text-navy-900">
                    {p.first_name} {p.last_name}
                  </td>
                  <td className="px-6 py-4 text-navy-500 hidden md:table-cell">{p.phone || '—'}</td>
                  <td className="px-6 py-4 hidden lg:table-cell">{p.blood_group || '—'}</td>
                  <td className="px-6 py-4 text-navy-500 hidden lg:table-cell">{formatDate(p.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/patients/${p.id}`}>
                      <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /> View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Register New Patient" size="lg">
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid sm:grid-cols-2 gap-4">
          <Input label="First Name" {...form.register('first_name')} error={form.formState.errors.first_name?.message} />
          <Input label="Last Name" {...form.register('last_name')} error={form.formState.errors.last_name?.message} />
          <Input label="Date of Birth" type="date" {...form.register('date_of_birth')} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-navy-700">Gender</label>
            <select {...form.register('gender')} className="w-full rounded-xl border border-navy-200 px-4 py-2.5 text-sm">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Input label="Blood Group" {...form.register('blood_group')} placeholder="e.g. O+" />
          <Input label="Phone" {...form.register('phone')} />
          <Input label="Email" type="email" {...form.register('email')} />
          <Input label="Address" {...form.register('address')} />
          <Input label="Emergency Contact Name" {...form.register('emergency_contact_name')} />
          <Input label="Emergency Contact Phone" {...form.register('emergency_contact_phone')} />
          <Input label="Insurance Provider" {...form.register('insurance_provider')} />
          <Input label="Insurance Number" {...form.register('insurance_number')} />
          <div className="sm:col-span-2">
            <Input label="Allergies (comma-separated)" {...form.register('allergies')} placeholder="Penicillin, Peanuts" />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={createPatient.isPending}>Register Patient</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
