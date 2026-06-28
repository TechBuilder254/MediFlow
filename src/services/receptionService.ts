import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useSearchPatients(query: string) {
  return useQuery({
    queryKey: ['patient-search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return []
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, patient_number, phone, national_id')
        .is('deleted_at', null)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,patient_number.ilike.%${query}%,phone.ilike.%${query}%,national_id.ilike.%${query}%`)
        .limit(10)
      if (error) throw error
      return data ?? []
    },
    enabled: query.length >= 2,
  })
}

export function useTodayAppointmentsForPatient(patientId?: string) {
  return useQuery({
    queryKey: ['patient-today-appts', patientId],
    queryFn: async () => {
      const d = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('appointments')
        .select('*, doctor:doctors(display_name, specialization), department:departments(name)')
        .eq('patient_id', patientId!)
        .eq('appointment_date', d)
        .in('status', ['confirmed', 'pending', 'suggested'])
      if (error) throw error
      return data ?? []
    },
    enabled: !!patientId,
  })
}

export function useStaffCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ appointmentId, patientId, departmentId }: {
      appointmentId: string
      patientId: string
      departmentId?: string
    }) => {
      await supabase
        .from('appointments')
        .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
        .eq('id', appointmentId)

      const d = new Date().toISOString().split('T')[0]
      const { count } = await supabase
        .from('queue_entries')
        .select('id', { count: 'exact', head: true })
        .gte('checked_in_at', `${d}T00:00:00`)

      const { error } = await supabase.from('queue_entries').insert({
        patient_id: patientId,
        department_id: departmentId ?? null,
        ticket_number: (count ?? 0) + 1,
        status: 'waiting',
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queue'] })
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['patient-today-appts'] })
    },
  })
}

export function useWalkInAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      patient_id: string
      doctor_id: string
      department_id?: string
      reason?: string
    }) => {
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const endH = now.getHours() + 1

      const { data: apt, error } = await supabase
        .from('appointments')
        .insert({
          ...payload,
          appointment_date: now.toISOString().split('T')[0],
          start_time: time,
          end_time: `${String(endH).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
          status: 'confirmed',
          urgency: 'moderate',
          reason: payload.reason ?? 'Walk-in visit',
        })
        .select()
        .single()
      if (error) throw error
      return apt
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}
