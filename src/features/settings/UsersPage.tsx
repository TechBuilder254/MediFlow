import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, KeyRound, UserX, UserCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/hooks/useAuth'
import { canManageUsers } from '@/lib/permissions'
import {
  useCreateStaffUser,
  useToggleUserActive,
  useResetUserPassword,
} from '@/services/adminService'
import { ROLE_LABELS, STAFF_ROLES, type UserRole } from '@/types'
import { getInitials, formatDate } from '@/utils/cn'

const userSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'cashier'] as const),
  phone: z.string().optional(),
})

type UserForm = z.infer<typeof userSchema>

const CREATABLE_ROLES = STAFF_ROLES.filter((r) => r !== 'super_admin')

export function UsersPage() {
  const [showModal, setShowModal] = useState(false)
  const [credentials, setCredentials] = useState<{ name: string; email: string; password: string } | null>(null)
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const { profile } = useAuthStore()
  const canManage = canManageUsers(profile?.role)

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const createUser = useCreateStaffUser()
  const toggleActive = useToggleUserActive()
  const resetPassword = useResetUserPassword()

  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'nurse' },
  })

  const onSubmit = async (data: UserForm) => {
    const result = await createUser.mutateAsync({
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      role: data.role,
      phone: data.phone,
    })
    setShowModal(false)
    form.reset({ role: 'nurse' })
    setCredentials({ name: result.full_name, email: result.email, password: result.password })
  }

  const handleToggle = async (userId: string, name: string, isActive: boolean) => {
    if (userId === profile?.id) {
      alert('You cannot suspend your own account.')
      return
    }
    const msg = isActive
      ? `Suspend ${name}? They will not be able to log in.`
      : `Re-activate ${name}?`
    if (!confirm(msg)) return
    await toggleActive.mutateAsync({ user_id: userId, is_active: !isActive })
  }

  const handleResetPassword = async () => {
    if (!resetTarget || newPassword.length < 6) return
    const result = await resetPassword.mutateAsync({ user_id: resetTarget.id, password: newPassword })
    setResetTarget(null)
    setNewPassword('')
    setCredentials({ name: resetTarget.name, email: users?.find((u) => u.id === resetTarget.id)?.email ?? '', password: result.password })
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Create staff accounts, set passwords, and suspend users"
        action={
          canManage ? (
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" /> Add User
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-2xl border border-navy-100 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50">
                <th className="text-left px-6 py-3 font-semibold text-navy-600">User</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600">Role</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600 hidden md:table-cell">Email</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600">Status</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600 hidden lg:table-cell">Joined</th>
                {canManage && <th className="text-right px-6 py-3 font-semibold text-navy-600">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id} className="border-b border-navy-50 hover:bg-navy-50/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                        {getInitials(user.full_name)}
                      </div>
                      <span className="font-medium text-navy-900">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="primary">{ROLE_LABELS[user.role as UserRole]}</Badge>
                  </td>
                  <td className="px-6 py-4 text-navy-500 hidden md:table-cell">{user.email}</td>
                  <td className="px-6 py-4">
                    <Badge variant={user.is_active ? 'success' : 'danger'}>
                      {user.is_active ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-navy-500 hidden lg:table-cell">{formatDate(user.created_at)}</td>
                  {canManage && (
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setResetTarget({ id: user.id, name: user.full_name }); setNewPassword('') }}
                        >
                          <KeyRound className="h-4 w-4" /> Reset Password
                        </Button>
                        {user.id !== profile?.id && user.role !== 'super_admin' && (
                          <Button
                            variant={user.is_active ? 'danger' : 'outline'}
                            size="sm"
                            loading={toggleActive.isPending}
                            onClick={() => handleToggle(user.id, user.full_name, user.is_active)}
                          >
                            {user.is_active ? (
                              <><UserX className="h-4 w-4" /> Suspend</>
                            ) : (
                              <><UserCheck className="h-4 w-4" /> Activate</>
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Staff User" size="md">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-navy-600 bg-navy-50 rounded-xl p-3">
            Set the login email and password when creating the account. The password is shown once after creation.
          </p>
          <Input label="Full Name" {...form.register('full_name')} error={form.formState.errors.full_name?.message} />
          <Input label="Email (login)" type="email" {...form.register('email')} error={form.formState.errors.email?.message} />
          <Input label="Password" type="password" {...form.register('password')} error={form.formState.errors.password?.message} />
          <Input label="Phone" {...form.register('phone')} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-navy-700">Role</label>
            <select {...form.register('role')} className="w-full rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm">
              {CREATABLE_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <p className="text-xs text-navy-500">To add a doctor with full profile, use the Doctors page.</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={createUser.isPending}>Create Account</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title={`Reset Password — ${resetTarget?.name}`} size="sm">
        <div className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setResetTarget(null)}>Cancel</Button>
            <Button onClick={handleResetPassword} loading={resetPassword.isPending} disabled={newPassword.length < 6}>
              Reset Password
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!credentials} onClose={() => setCredentials(null)} title="Account Credentials" size="md">
        {credentials && (
          <div className="space-y-4">
            <p className="text-sm text-navy-600">
              Login details for <strong>{credentials.name}</strong>. Copy and share securely — passwords are not stored in plain text.
            </p>
            <div className="rounded-xl bg-navy-50 p-4 space-y-2 text-sm font-mono">
              <p><span className="text-navy-500">Email: </span>{credentials.email}</p>
              <p><span className="text-navy-500">Password: </span>{credentials.password}</p>
            </div>
            <Button className="w-full" onClick={() => setCredentials(null)}>Done</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
