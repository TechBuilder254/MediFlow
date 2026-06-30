import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, KeyRound, UserX, UserCheck, Users, Stethoscope,
  Pill, FlaskConical, Receipt, Heart, UserCog, Shield,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner, EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import { canManageUsers, getAssignableRoles, ROLE_DESCRIPTIONS } from '@/lib/permissions'
import {
  useStaffUsers,
  useCreateStaffUser,
  useUpdateStaffUser,
  useToggleUserActive,
  useResetUserPassword,
} from '@/services/adminService'
import { ROLE_LABELS, type UserRole, type Profile } from '@/types'
import { getInitials, formatDate, cn } from '@/utils/cn'
import { toast } from '@/hooks/useToast'

const ROLE_ICONS: Partial<Record<UserRole, typeof Users>> = {
  admin: Shield,
  doctor: Stethoscope,
  nurse: Heart,
  receptionist: Users,
  pharmacist: Pill,
  lab_technician: FlaskConical,
  cashier: Receipt,
}

const userSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'cashier'] as const),
  phone: z.string().optional(),
})

type UserForm = z.infer<typeof userSchema>

type RoleFilter = UserRole | 'all'

export function UsersPage() {
  const [showModal, setShowModal] = useState(false)
  const [credentials, setCredentials] = useState<{ name: string; email: string; password: string; role: string } | null>(null)
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string; email: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editRole, setEditRole] = useState<UserRole>('nurse')

  const { profile } = useAuthStore()
  const canManage = canManageUsers(profile?.role)
  const assignableRoles = getAssignableRoles(profile?.role)

  const { data: users, isLoading, isError, error, refetch } = useStaffUsers()
  const createUser = useCreateStaffUser()
  const updateUser = useUpdateStaffUser()
  const toggleActive = useToggleUserActive()
  const resetPassword = useResetUserPassword()

  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'nurse' },
  })
  const watchedRole = form.watch('role')

  const filteredUsers = useMemo(() => {
    if (!users) return []
    if (roleFilter === 'all') return users
    return users.filter((u) => u.role === roleFilter)
  }, [users, roleFilter])

  const roleCounts = useMemo(() => {
    const counts: Partial<Record<UserRole, number>> = {}
    users?.forEach((u) => { counts[u.role] = (counts[u.role] ?? 0) + 1 })
    return counts
  }, [users])

  const openEdit = (user: Profile) => {
    setSelectedUser(user)
    setEditName(user.full_name)
    setEditPhone(user.phone ?? '')
    setEditRole(user.role)
  }

  const onSubmit = async (data: UserForm) => {
    if (data.role === 'doctor') {
      toast('Use the Doctors page to add doctors with full profiles.', 'info')
      return
    }
    try {
      const result = await createUser.mutateAsync({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        role: data.role,
        phone: data.phone,
      })
      setShowModal(false)
      form.reset({ role: 'nurse' })
      await refetch()
      setCredentials({ name: result.full_name, email: result.email, password: result.password, role: result.role })
      toast(`${ROLE_LABELS[data.role]} account created.`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create account.', 'error')
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedUser) return
    try {
      await updateUser.mutateAsync({
        user_id: selectedUser.id,
        full_name: editName.trim(),
        phone: editPhone.trim() || undefined,
        role: editRole !== selectedUser.role ? editRole : undefined,
      })
      await refetch()
      toast('User updated successfully.')
      setSelectedUser(null)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update user.', 'error')
    }
  }

  const handleToggle = async (user: Profile) => {
    if (user.id === profile?.id) {
      toast('You cannot suspend your own account.', 'error')
      return
    }
    const msg = user.is_active
      ? `Suspend ${user.full_name}? They will not be able to log in.`
      : `Re-activate ${user.full_name}?`
    if (!confirm(msg)) return
    try {
      await toggleActive.mutateAsync({ user_id: user.id, is_active: !user.is_active })
      await refetch()
      toast(user.is_active ? 'User suspended.' : 'User re-activated.')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Action failed.', 'error')
    }
  }

  const handleResetPassword = async () => {
    if (!resetTarget || newPassword.length < 6) return
    try {
      const result = await resetPassword.mutateAsync({ user_id: resetTarget.id, password: newPassword })
      setResetTarget(null)
      setNewPassword('')
      setCredentials({ name: resetTarget.name, email: resetTarget.email, password: result.password, role: '' })
      toast('Password reset successfully.')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to reset password.', 'error')
    }
  }

  const quickAddRole = (role: UserRole) => {
    if (role === 'doctor') return
    form.reset({ role: role as UserForm['role'], full_name: '', email: '', password: '', phone: '' })
    setShowModal(true)
  }

  return (
    <div>
      <PageHeader
        title="Staff & Users"
        description="Create hospital staff accounts, assign roles, and manage access"
        action={
          canManage ? (
            <Button onClick={() => { form.reset({ role: 'nurse' }); setShowModal(true) }}>
              <Plus className="h-4 w-4" /> Add Staff User
            </Button>
          ) : undefined
        }
      />

      {canManage && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {assignableRoles.filter((r) => r !== 'doctor').map((role) => {
            const Icon = ROLE_ICONS[role] ?? UserCog
            return (
              <button
                key={role}
                type="button"
                onClick={() => quickAddRole(role)}
                className="rounded-xl border border-navy-100 bg-white p-3 text-left hover:border-primary-300 hover:shadow-sm transition-all"
              >
                <Icon className="h-5 w-5 text-primary-600 mb-2" />
                <p className="text-xs font-semibold text-navy-900">{ROLE_LABELS[role]}</p>
                <p className="text-[10px] text-navy-500 mt-0.5 line-clamp-2">{ROLE_DESCRIPTIONS[role]}</p>
              </button>
            )
          })}
          <Link
            to="/doctors"
            className="rounded-xl border border-primary-200 bg-primary-50 p-3 text-left hover:shadow-sm transition-all"
          >
            <Stethoscope className="h-5 w-5 text-primary-700 mb-2" />
            <p className="text-xs font-semibold text-primary-900">Add Doctor</p>
            <p className="text-[10px] text-primary-700 mt-0.5">Full profile + login</p>
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <FilterChip active={roleFilter === 'all'} onClick={() => setRoleFilter('all')} label={`All (${users?.length ?? 0})`} />
        {assignableRoles.map((role) => (
          <FilterChip
            key={role}
            active={roleFilter === role}
            onClick={() => setRoleFilter(role)}
            label={`${ROLE_LABELS[role]} (${roleCounts[role] ?? 0})`}
          />
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <Card className="text-center py-8">
          <p className="text-red-600 font-medium">Could not load staff users</p>
          <p className="text-sm text-navy-500 mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
          <Button className="mt-4" variant="outline" onClick={() => refetch()}>Retry</Button>
        </Card>
      ) : !filteredUsers.length ? (
        <EmptyState
          icon={Users}
          title={roleFilter === 'all' ? 'No staff users yet' : `No ${ROLE_LABELS[roleFilter as UserRole]} users`}
          description="Create accounts for pharmacists, lab techs, nurses, and other hospital staff"
          action={canManage ? <Button onClick={() => setShowModal(true)}>Add Staff User</Button> : undefined}
        />
      ) : (
        <div className="rounded-2xl border border-navy-100 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50">
                <th className="text-left px-6 py-3 font-semibold text-navy-600">User</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600">Role</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600 hidden md:table-cell">Email</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600 hidden lg:table-cell">Phone</th>
                <th className="text-left px-6 py-3 font-semibold text-navy-600">Status</th>
                {canManage && <th className="text-right px-6 py-3 font-semibold text-navy-600">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-navy-50 hover:bg-navy-50/30 cursor-pointer"
                  onClick={() => canManage && openEdit(user)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                        {getInitials(user.full_name)}
                      </div>
                      <div>
                        <span className="font-medium text-navy-900">{user.full_name}</span>
                        {user.id === profile?.id && <span className="text-xs text-navy-400 ml-2">(you)</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="primary">{ROLE_LABELS[user.role]}</Badge>
                  </td>
                  <td className="px-6 py-4 text-navy-500 hidden md:table-cell">{user.email}</td>
                  <td className="px-6 py-4 text-navy-500 hidden lg:table-cell">{user.phone || '—'}</td>
                  <td className="px-6 py-4">
                    <Badge variant={user.is_active ? 'success' : 'danger'}>
                      {user.is_active ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  {canManage && (
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setResetTarget({ id: user.id, name: user.full_name, email: user.email }); setNewPassword('') }}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        {user.id !== profile?.id && user.role !== 'super_admin' && (
                          <Button
                            variant={user.is_active ? 'danger' : 'outline'}
                            size="sm"
                            loading={toggleActive.isPending}
                            onClick={() => handleToggle(user)}
                          >
                            {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
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

      {/* Create modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Staff User" size="md">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-navy-600 bg-navy-50 rounded-xl p-3">
            Creates a login account. Share the email and password securely after creation.
          </p>
          <Input label="Full Name" {...form.register('full_name')} error={form.formState.errors.full_name?.message} />
          <Input label="Email (login)" type="email" {...form.register('email')} error={form.formState.errors.email?.message} />
          <Input label="Password" type="password" {...form.register('password')} error={form.formState.errors.password?.message} />
          <Input label="Phone" {...form.register('phone')} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-navy-700">Role</label>
            <select {...form.register('role')} className="w-full rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm">
              {assignableRoles.filter((r) => r !== 'doctor').map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <p className="text-xs text-primary-600">{ROLE_DESCRIPTIONS[watchedRole as UserRole]}</p>
            {watchedRole === 'doctor' && (
              <p className="text-xs text-amber-700">Doctors need a full profile — use the <Link to="/doctors" className="underline">Doctors page</Link>.</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={createUser.isPending}>Create Account</Button>
          </div>
        </form>
      </Modal>

      {/* Edit user modal */}
      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="Edit Staff User" size="md">
        {selectedUser && (
          <div className="space-y-4">
            <div className="rounded-xl bg-navy-50 p-3 text-sm">
              <p className="text-navy-500">Login email</p>
              <p className="font-medium text-navy-900">{selectedUser.email}</p>
              <p className="text-xs text-navy-400 mt-1">Joined {formatDate(selectedUser.created_at)}</p>
            </div>
            <Input label="Full Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            <Input label="Phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-navy-700">Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
                disabled={selectedUser.id === profile?.id || selectedUser.role === 'super_admin'}
                className="w-full rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm disabled:opacity-60"
              >
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
                {selectedUser.role === 'super_admin' && (
                  <option value="super_admin">{ROLE_LABELS.super_admin}</option>
                )}
              </select>
              <p className="text-xs text-navy-500">{ROLE_DESCRIPTIONS[editRole]}</p>
              {editRole === 'doctor' && selectedUser.role !== 'doctor' && (
                <p className="text-xs text-amber-700">Changing to Doctor requires a doctor profile on the <Link to="/doctors" className="underline">Doctors page</Link>.</p>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setSelectedUser(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} loading={updateUser.isPending}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title={`Reset Password — ${resetTarget?.name}`} size="sm">
        <div className="space-y-4">
          <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setResetTarget(null)}>Cancel</Button>
            <Button onClick={handleResetPassword} loading={resetPassword.isPending} disabled={newPassword.length < 6}>Reset</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!credentials} onClose={() => setCredentials(null)} title="Account Credentials" size="md">
        {credentials && (
          <div className="space-y-4">
            <p className="text-sm text-navy-600">
              Login details for <strong>{credentials.name}</strong>
              {credentials.role && <> ({ROLE_LABELS[credentials.role as UserRole] ?? credentials.role})</>}.
              Copy and share securely.
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

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
        active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-navy-600 border-navy-200 hover:border-primary-300',
      )}
    >
      {label}
    </button>
  )
}
