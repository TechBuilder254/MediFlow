import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'
import { phoneToAuthEmail } from '@/utils/patientFlow'

export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data as Profile | null
}

export async function resolveLoginEmail(identifier: string): Promise<string> {
  if (identifier.includes('@')) return identifier
  const { data } = await supabase
    .from('patients')
    .select('email, phone')
    .or(`phone.eq.${identifier},phone.eq.+${identifier.replace(/\D/g, '')}`)
    .maybeSingle()
  if (data?.email) return data.email
  return phoneToAuthEmail(identifier)
}

export interface PatientRegistration {
  fullName: string
  nationalId: string
  phone: string
  email?: string
  dateOfBirth: string
  gender: string
  password: string
}

export async function registerPatient(reg: PatientRegistration) {
  const authEmail = reg.email?.trim() || phoneToAuthEmail(reg.phone)

  const { data, error } = await supabase.auth.signUp({
    email: authEmail,
    password: reg.password,
    options: {
      emailRedirectTo: undefined,
      data: {
        full_name: reg.fullName,
        role: 'patient',
        phone: reg.phone,
        national_id: reg.nationalId,
        date_of_birth: reg.dateOfBirth,
        gender: reg.gender,
        contact_email: reg.email || null,
      },
    },
  })
  if (error) throw error
  return data
}

export async function signIn(identifier: string, password: string) {
  const email = await resolveLoginEmail(identifier)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Re-export hook from separate file to avoid circular deps
export { useAuthInit } from '@/features/auth/useAuthInit'
