import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useReassignAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      appointmentId,
      newDoctorId,
      patientUserId,
      doctorName,
    }: {
      appointmentId: string
      newDoctorId: string
      patientUserId?: string | null
      doctorName: string
    }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ doctor_id: newDoctorId, updated_at: new Date().toISOString() })
        .eq('id', appointmentId)
      if (error) throw error

      if (patientUserId) {
        await supabase.from('notifications').insert({
          user_id: patientUserId,
          title: 'Doctor changed',
          message: `Your appointment has been assigned to ${doctorName} who will see you shortly.`,
          type: 'appointment',
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['my-appointments'] })
    },
  })
}
