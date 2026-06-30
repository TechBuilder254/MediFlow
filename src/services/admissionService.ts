import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useAdmitPatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      patient_id: string
      doctor_id: string
      ward_id: string
      bed_id: string
      diagnosis: string
      notes?: string
      patientUserId?: string | null
    }) => {
      const { data, error } = await supabase
        .from('admissions')
        .insert({
          patient_id: payload.patient_id,
          doctor_id: payload.doctor_id,
          ward_id: payload.ward_id,
          bed_id: payload.bed_id,
          diagnosis: payload.diagnosis,
          notes: payload.notes || null,
          status: 'admitted',
          admission_date: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw error

      await supabase.from('beds').update({ status: 'occupied' }).eq('id', payload.bed_id)

      if (payload.patientUserId) {
        await supabase.from('notifications').insert({
          user_id: payload.patientUserId,
          title: 'Admission confirmed',
          message: `You have been admitted for: ${payload.diagnosis}. Ward staff will assist you shortly.`,
          type: 'admission',
        })
      }

      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admissions'] })
      qc.invalidateQueries({ queryKey: ['beds'] })
    },
  })
}
