import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/hooks/useAuth'
import { fetchUserProfile } from '@/features/auth/authService'

export function useAuthInit() {
  const { setUser, setProfile, setLoading, reset } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else reset()
    })

    async function fetchProfile(userId: string) {
      const data = await fetchUserProfile(userId)
      setProfile(data)
      setLoading(false)
    }

    return () => subscription.unsubscribe()
  }, [setUser, setProfile, setLoading, reset])
}
