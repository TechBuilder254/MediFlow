import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Stethoscope, UserX, UserCheck, Mail, KeyRound } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import { canManageDoctors } from '@/lib/permissions'
import { useDoctors, useDepartments, isDoctorActive, getDoctorDisplayName } from '@/services/doctorService'
import { useCreateStaffUser, useToggleDoctorActive } from '@/services/adminService'
import { formatCurrency } from '@/utils/cn'

const doctorSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  department_id: z.string().min(1, 'Select a department'),
  specialization: z.string().min(2, 'Specialization is required'),
  qualification: z.string().optional(),
  license_number: z.string().optional(),
  years_experience: z.coerce.number().min(0).optional(),
  consultation_fee: z.coerce.number().min(0).optional(),
  consultation_room: z.string().optional(),
  languages: z.string().optional(),
})

type DoctorForm = z.infer<typeof doctorSchema>

export function DoctorsPage() {
  const [showModal, setShowModal] = useState(false)
  const [credentials, setCredentials] = useState<{ name: string; email: string; password: string } | null>(null)
  const { profile } = useAuthStore()
  const canManage = canManageDoctors(profile?.role)
  const { data: doctors, isLoading } = useDoctors()
  const { data: departments } = useDepartments()
  const createDoctor = useCreateStaffUser()
  const toggleDoctor = useToggleDoctorActive()

  const form = useForm<DoctorForm>({
    resolver: zodResolver(doctorSchema),
    defaultValues: { years_experience: 0, consultation_fee: 2500 },
  })

  const onSubmit = async (data: DoctorForm) => {
    const result = await createDoctor.mutateAsync({
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      role: 'doctor',
      phone: data.phone,
      doctor: {
        department_id: data.department_id,
        specialization: data.specialization,
        qualification: data.qualification,
        license_number: data.license_number,
        years_experience: data.years_experience,
        consultation_fee: data.consultation_fee,
        consultation_room: data.consultation_room,
        languages: data.languages ? data.languages.split(',').map((l) => l.trim()) : undefined,
      },
    })
    setShowModal(false)
    form.reset()
    setCredentials({ name: result.full_name, email: result.email, password: result.password })
  }

  const handleToggle = async (doctorId: string, currentlyActive: boolean) => {
    const msg = currentlyActive
      ? 'Disable this doctor? They will no longer appear for bookings and cannot log in.'
      : 'Re-enable this doctor?'
    if (!confirm(msg)) return
    await toggleDoctor.mutateAsync({ doctor_id: doctorId, is_active: !currentlyActive })
  }

  return (
    <div>
      <PageHeader
        title="Doctors"
        description="Manage doctor profiles, login accounts, and availability"
        action={
          canManage ? (
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" /> Add Doctor
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : !doctors?.length ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors registered"
          description="Add doctors with login credentials so they can access the system"
          action={canManage ? <Button onClick={() => setShowModal(true)}>Add Doctor</Button> : undefined}
        />
      ) : (
        <div className="rounded-2xl border border-navy-100 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50">
                <th className="text-left px-6 py-3 font-semibold text-navy-600">Doctor</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600 hidden md:table-cell">Department</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600 hidden lg:table-cell">Email</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600 hidden lg:table-cell">Fee</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600">Status</th>
                {canManage && <th className="text-right px-6 py-3 font-semibold text-navy-600">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => {
                const active = isDoctorActive(doc)
                return (
                  <tr key={doc.id} className="border-b border-navy-50 hover:bg-navy-50/30">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-navy-900">{getDoctorDisplayName(doc)}</p>
                        <p className="text-xs text-navy-500">{doc.specialization}</p>
                        {doc.license_number && (
                          <p className="text-xs text-navy-400 mt-0.5">Lic: {doc.license_number}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-navy-600 hidden md:table-cell">{doc.department?.name || '—'}</td>
                    <td className="px-6 py-4 text-navy-500 hidden lg:table-cell">
                      {doc.profile?.email ? (
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{doc.profile.email}</span>
                      ) : (
                        <Badge variant="default">No login</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-primary-600 hidden lg:table-cell">
                      {formatCurrency(doc.consultation_fee)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <Badge variant={active ? 'success' : 'danger'}>
                          {active ? 'Active' : 'Disabled'}
                        </Badge>
                        {active && (
                          <Badge variant={doc.is_on_duty ? 'primary' : 'default'} className="w-fit">
                            {doc.is_on_duty ? 'On Duty' : 'Off Duty'}
                          </Badge>
                        )}
                      </div>
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant={active ? 'danger' : 'outline'}
                          size="sm"
                          loading={toggleDoctor.isPending}
                          onClick={() => handleToggle(doc.id, active)}
                        >
                          {active ? (
                            <><UserX className="h-4 w-4" /> Disable</>
                          ) : (
                            <><UserCheck className="h-4 w-4" /> Enable</>
                          )}
                        </Button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Doctor" size="lg">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-navy-600 bg-navy-50 rounded-xl p-3">
            Creates a login account for the doctor. Set their email and password below — share these credentials with them securely.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Full Name" {...form.register('full_name')} error={form.formState.errors.full_name?.message} />
            <Input label="Email (login)" type="email" {...form.register('email')} error={form.formState.errors.email?.message} />
            <Input label="Password" type="password" {...form.register('password')} error={form.formState.errors.password?.message} />
            <Input label="Phone" {...form.register('phone')} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-navy-700">Department</label>
              <select
                {...form.register('department_id')}
                className="w-full rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm"
              >
                <option value="">Select department</option>
                {departments?.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {form.formState.errors.department_id && (
                <p className="text-xs text-danger">{form.formState.errors.department_id.message}</p>
              )}
            </div>
            <Input label="Specialization" {...form.register('specialization')} error={form.formState.errors.specialization?.message} />
            <Input label="Qualification" placeholder="MBChB, MMed..." {...form.register('qualification')} />
            <Input label="License Number" {...form.register('license_number')} />
            <Input label="Years of Experience" type="number" {...form.register('years_experience')} />
            <Input label="Consultation Fee (KES)" type="number" {...form.register('consultation_fee')} />
            <Input label="Consultation Room" placeholder="Room 204" {...form.register('consultation_room')} />
            <Input label="Languages" placeholder="English, Kiswahili" {...form.register('languages')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={createDoctor.isPending}>Create Doctor Account</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!credentials} onClose={() => setCredentials(null)} title="Doctor Account Created" size="md">
        {credentials && (
          <div className="space-y-4">
            <p className="text-sm text-navy-600">
              Account created for <strong>{credentials.name}</strong>. Save these login details — passwords cannot be viewed again later (use Reset Password if needed).
            </p>
            <div className="rounded-xl bg-navy-50 p-4 space-y-2 text-sm font-mono">
              <p><span className="text-navy-500">Email: </span>{credentials.email}</p>
              <p className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-navy-400" />
                <span className="text-navy-500">Password: </span>{credentials.password}
              </p>
            </div>
            <Button className="w-full" onClick={() => setCredentials(null)}>Done</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
