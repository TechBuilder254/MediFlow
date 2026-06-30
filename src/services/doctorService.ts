import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Doctor } from '@/types'

export type DoctorWithRelations = Doctor & {
  department: { name: string } | null
  profile: { full_name: string; email: string; phone?: string | null; is_active: boolean } | null
}

export function useDoctorRecord(userId?: string) {
  return useQuery({
    queryKey: ['my-doctor', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle()
      if (error) throw error
      return data as Doctor | null
    },
    enabled: !!userId,
  })
}

export function useLabTechnicians() {
  return useQuery({
    queryKey: ['lab-technicians'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'lab_technician')
        .eq('is_active', true)
        .order('full_name')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useDoctors() {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data: doctors, error } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      if (!doctors?.length) return [] as DoctorWithRelations[]

      const userIds = doctors.map((d) => d.user_id).filter(Boolean) as string[]
      const deptIds = doctors.map((d) => d.department_id).filter(Boolean) as string[]

      const [profilesRes, deptsRes] = await Promise.all([
        userIds.length
          ? supabase.from('profiles').select('id, full_name, email, phone, is_active').in('id', userIds)
          : Promise.resolve({ data: [] as { id: string; full_name: string; email: string; phone?: string | null; is_active: boolean }[], error: null }),
        deptIds.length
          ? supabase.from('departments').select('id, name').in('id', deptIds)
          : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
      ])

      if (profilesRes.error) throw profilesRes.error
      if (deptsRes.error) throw deptsRes.error

      const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]))
      const deptMap = new Map((deptsRes.data ?? []).map((d) => [d.id, d]))

      return doctors.map((doc) => ({
        ...doc,
        profile: doc.user_id ? profileMap.get(doc.user_id) ?? null : null,
        department: doc.department_id ? deptMap.get(doc.department_id) ?? null : null,
      })) as DoctorWithRelations[]
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
