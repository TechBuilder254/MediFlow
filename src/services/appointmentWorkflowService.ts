import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { TIME_SLOTS } from '@/utils/patientFlow'

export function useReviewAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      appointmentId: string
      action: 'accept' | 'decline' | 'suggest'
      roomNumber?: string
      declineReason?: string
      suggestedDate?: string
      suggestedTime?: string
      doctorMessage?: string
      patientUserId?: string
      doctorName?: string
    }) => {
      const { appointmentId, action, roomNumber, declineReason, suggestedDate, suggestedTime, doctorMessage, patientUserId, doctorName } = payload

      if (action === 'accept') {
        await supabase.from('appointments').update({
          status: 'confirmed',
          room_number: roomNumber || 'Room 204',
        }).eq('id', appointmentId)
        if (patientUserId) {
          await supabase.from('notifications').insert({
            user_id: patientUserId,
            title: 'Appointment Confirmed',
            message: `Your appointment with ${doctorName} has been confirmed.${roomNumber ? ` Room ${roomNumber}` : ''}`,
            type: 'appointment',
          })
        }
      } else if (action === 'decline') {
        await supabase.from('appointments').update({
          status: 'declined',
          decline_reason: declineReason,
        }).eq('id', appointmentId)
        if (patientUserId) {
          await supabase.from('notifications').insert({
            user_id: patientUserId,
            title: 'Appointment Declined',
            message: declineReason || 'Your appointment request was declined. Please book another time.',
            type: 'appointment',
          })
        }
      } else if (action === 'suggest' && suggestedDate && suggestedTime) {
        const [h] = suggestedTime.split(':').map(Number)
        await supabase.from('appointments').update({
          status: 'suggested',
          suggested_date: suggestedDate,
          suggested_start_time: suggestedTime,
          suggested_end_time: `${String(h + 1).padStart(2, '0')}:00`,
          doctor_message: doctorMessage,
        }).eq('id', appointmentId)
        if (patientUserId) {
          await supabase.from('notifications').insert({
            user_id: patientUserId,
            title: 'New Time Suggested',
            message: doctorMessage || `${doctorName} suggested a new appointment time.`,
            type: 'appointment',
          })
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['pending-appointments'] })
    },
  })
}

export function useCallNextPatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ doctorId, roomNumber }: { doctorId: string; roomNumber?: string }) => {
      const today = new Date().toISOString().split('T')[0]
      const { data: next } = await supabase
        .from('appointments')
        .select('id, patient:patients(user_id)')
        .eq('doctor_id', doctorId)
        .eq('status', 'checked_in')
        .eq('appointment_date', today)
        .order('checked_in_at')
        .limit(1)
        .maybeSingle()

      if (!next) throw new Error('No patients in queue')

      await supabase.from('appointments').update({
        status: 'in_progress',
        room_number: roomNumber || 'Room 204',
      }).eq('id', next.id)

      const patient = next.patient as unknown as { user_id: string } | null
      if (patient?.user_id) {
        await supabase.from('notifications').insert({
          user_id: patient.user_id,
          title: "It's Your Turn!",
          message: `Proceed to ${roomNumber || 'Room 204'}`,
          type: 'queue',
        })
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export { TIME_SLOTS }
