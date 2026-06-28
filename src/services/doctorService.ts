import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Doctor } from '@/types'

export type DoctorWithRelations = Doctor & {
  department: { name: string } | null
  profile: { full_name: string; email: string; phone?: string | null; is_active: boolean } | null
}

export function useDoctors() {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*, department:departments(name), profile:profiles(full_name, email, phone, is_active)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as DoctorWithRelations[]
    },
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('departments').select('id, name').order('name')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useUpdateDoctor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Doctor> & { id: string }) => {
      const { data, error } = await supabase
        .from('doctors')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] })
      qc.invalidateQueries({ queryKey: ['doctors-by-dept'] })
    },
  })
}

export function isDoctorActive(doc: DoctorWithRelations): boolean {
  if (doc.is_active === false) return false
  const profile = Array.isArray(doc.profile) ? doc.profile[0] : doc.profile
  if (profile && !profile.is_active) return false
  return true
}

export function getDoctorDisplayName(doc: DoctorWithRelations): string {
  const profile = Array.isArray(doc.profile) ? doc.profile[0] : doc.profile
  return doc.display_name || profile?.full_name || doc.specialization || 'Doctor'
}
