import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function usePatientClinicalSummary(patientId?: string) {
  return useQuery({
    queryKey: ['clinical-summary', patientId],
    queryFn: async () => {
      const [patient, records, prescriptions, labs, assessments] = await Promise.all([
        supabase.from('patients').select('*').eq('id', patientId!).single(),
        supabase.from('medical_records').select('*, diagnoses(*)').eq('patient_id', patientId!).order('visit_date', { ascending: false }).limit(5),
        supabase.from('prescriptions').select('*, medicine:medicines(name)').eq('patient_id', patientId!).eq('dispensed', false),
        supabase.from('laboratory_tests').select('*').eq('patient_id', patientId!).order('ordered_at', { ascending: false }).limit(5),
        supabase.from('nurse_assessments').select('*').eq('patient_id', patientId!).order('created_at', { ascending: false }).limit(1),
      ])
      return {
        patient: patient.data,
        records: records.data ?? [],
        prescriptions: prescriptions.data ?? [],
        labs: labs.data ?? [],
        latestAssessment: assessments.data?.[0] ?? null,
      }
    },
    enabled: !!patientId,
  })
}

export function useCompleteConsultation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      appointmentId: string
      patientId: string
      doctorId: string
      chiefComplaint: string
      symptoms: string
      notes: string
      diagnosis: string
      vitals?: Record<string, unknown>
      prescriptions?: { medicine_id: string; dosage: string; frequency: string; duration: string; instructions?: string }[]
      labTests?: { test_name: string; test_type?: string }[]
      patientUserId?: string | null
    }) => {
      const { data: record, error: recErr } = await supabase
        .from('medical_records')
        .insert({
          patient_id: payload.patientId,
          doctor_id: payload.doctorId,
          appointment_id: payload.appointmentId,
          visit_date: new Date().toISOString(),
          chief_complaint: payload.chiefComplaint,
          symptoms: payload.symptoms,
          notes: payload.notes,
          vitals: payload.vitals ?? {},
        })
        .select()
        .single()
      if (recErr) throw recErr

      if (payload.diagnosis.trim()) {
        await supabase.from('diagnoses').insert({
          medical_record_id: record.id,
          patient_id: payload.patientId,
          doctor_id: payload.doctorId,
          description: payload.diagnosis,
        })
      }

      if (payload.prescriptions?.length) {
        await supabase.from('prescriptions').insert(
          payload.prescriptions.map((rx) => ({
            patient_id: payload.patientId,
            doctor_id: payload.doctorId,
            appointment_id: payload.appointmentId,
            medical_record_id: record.id,
            ...rx,
          })),
        )
      }

      if (payload.labTests?.length) {
        await supabase.from('laboratory_tests').insert(
          payload.labTests.map((t) => ({
            patient_id: payload.patientId,
            doctor_id: payload.doctorId,
            test_name: t.test_name,
            test_type: t.test_type ?? 'general',
            status: 'pending',
          })),
        )
      }

      const { error: aptErr } = await supabase
        .from('appointments')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', payload.appointmentId)
      if (aptErr) throw aptErr

      if (payload.patientUserId) {
        await supabase.from('notifications').insert({
          user_id: payload.patientUserId,
          title: 'Consultation completed',
          message: 'Your visit has been completed. Check your records and prescriptions in the portal.',
          type: 'appointment',
        })
      }

      return record
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['clinical-summary'] })
      qc.invalidateQueries({ queryKey: ['my-appointments'] })
      qc.invalidateQueries({ queryKey: ['lab-tests'] })
      qc.invalidateQueries({ queryKey: ['pending-prescriptions'] })
    },
  })
}

export function useNurseAssessment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      patient_id: string
      appointment_id?: string
      nurse_id: string
      blood_pressure?: string
      temperature?: number
      weight_kg?: number
      height_cm?: number
      pulse?: number
      oxygen_saturation?: number
      blood_sugar?: number
      pain_level?: number
      chief_complaint?: string
      status?: 'in_progress' | 'ready_for_doctor'
    }) => {
      const { data, error } = await supabase
        .from('nurse_assessments')
        .insert({ ...payload, status: payload.status ?? 'ready_for_doctor' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clinical-summary'] }),
  })
}

export function useUpdateLabTest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, result_summary, patientUserId }: {
      id: string
      status: string
      result_summary?: string
      patientUserId?: string | null
    }) => {
      const updates: Record<string, unknown> = { status }
      if (status === 'completed') updates.completed_at = new Date().toISOString()

      const { error } = await supabase.from('laboratory_tests').update(updates).eq('id', id)
      if (error) throw error

      if (result_summary) {
        await supabase.from('laboratory_results').insert({
          test_id: id,
          result_summary,
          result_data: { summary: result_summary },
        })
      }

      if (status === 'completed' && patientUserId) {
        await supabase.from('notifications').insert({
          user_id: patientUserId,
          title: 'Lab results ready',
          message: result_summary || 'Your laboratory test results are available.',
          type: 'lab',
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lab-tests'] })
      qc.invalidateQueries({ queryKey: ['my-lab'] })
    },
  })
}

export function useDispensePrescription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ prescriptionId, medicineId }: { prescriptionId: string; medicineId: string }) => {
      const { error } = await supabase
        .from('prescriptions')
        .update({ dispensed: true, dispensed_at: new Date().toISOString() })
        .eq('id', prescriptionId)
      if (error) throw error

      const { data: inv } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('medicine_id', medicineId)
        .limit(1)
        .maybeSingle()

      if (inv && inv.quantity > 0) {
        await supabase.from('inventory').update({ quantity: inv.quantity - 1 }).eq('id', inv.id)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-prescriptions'] })
      qc.invalidateQueries({ queryKey: ['medicines'] })
      qc.invalidateQueries({ queryKey: ['my-prescriptions'] })
    },
  })
}
