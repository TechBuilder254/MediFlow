import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import { phoneToAuthEmail, isPhoneInput, normalizePhone } from '@/utils/patientFlow'
import { useAuthStore } from '@/hooks/useAuth'

export async function syncAuthSession(user: User): Promise<Profile | null> {
  const store = useAuthStore.getState()
  store.setUser(user)
  const profile = await fetchUserProfile(user.id)
  store.setProfile(profile)
  store.setLoading(false)
  return profile
}

export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data as Profile | null
}

export async function resolveLoginEmail(identifier: string): Promise<string> {
  const trimmed = identifier.trim()
  if (trimmed.includes('@')) return trimmed
  if (isPhoneInput(trimmed)) return phoneToAuthEmail(trimmed)
  return trimmed
}

export interface PatientRegistration {
  fullName: string
  nationalId?: string
  phone: string
  email: string
  dateOfBirth: string
  gender: string
  password: string
}

export async function registerPatient(reg: PatientRegistration) {
  const email = reg.email.trim()
  const phone = normalizePhone(reg.phone)

  const { data, error } = await supabase.auth.signUp({
    email,
    password: reg.password,
    options: {
      emailRedirectTo: undefined,
      data: {
        full_name: reg.fullName,
        role: 'patient',
        phone,
        national_id: reg.nationalId?.trim() || null,
        date_of_birth: reg.dateOfBirth,
        gender: reg.gender,
        contact_email: email,
      },
    },
  })
  if (error) throw error
  if (data.user) await syncAuthSession(data.user)
  return data
}

export async function signIn(identifier: string, password: string) {
  const email = await resolveLoginEmail(identifier)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (data.user) await syncAuthSession(data.user)
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  useAuthStore.getState().reset()
}

// Re-export hook from separate file to avoid circular deps
export { useAuthInit } from '@/features/auth/useAuthInit'
