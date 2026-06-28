import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types'

export interface CreateUserPayload {
  email: string
  password: string
  full_name: string
  role: UserRole
  phone?: string
  doctor?: {
    department_id?: string
    license_number?: string
    specialization?: string
    qualification?: string
    years_experience?: number
    consultation_fee?: number
    consultation_room?: string
    languages?: string[]
  }
}

export interface CreateUserResult {
  user_id: string
  email: string
  password: string
  full_name: string
  role: string
}

async function invokeAdmin<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-users', { body })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data as T
}

export function useCreateStaffUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      invokeAdmin<CreateUserResult>({ action: 'create', ...payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['doctors'] })
      qc.invalidateQueries({ queryKey: ['doctors-by-dept'] })
    },
  })
}

export function useToggleUserActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ user_id, is_active }: { user_id: string; is_active: boolean }) =>
      invokeAdmin({ action: 'toggle_active', user_id, is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['doctors'] })
    },
  })
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ user_id, password }: { user_id: string; password: string }) =>
      invokeAdmin<{ success: boolean; password: string }>({ action: 'reset_password', user_id, password }),
  })
}

export function useToggleDoctorActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ doctor_id, is_active }: { doctor_id: string; is_active: boolean }) =>
      invokeAdmin({ action: 'toggle_doctor', doctor_id, is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] })
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['doctors-by-dept'] })
    },
  })
}
