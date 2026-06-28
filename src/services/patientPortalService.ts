import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Patient } from '@/types'

export function useMyPatientRecord(userId?: string) {
  return useQuery({
    queryKey: ['my-patient', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId!)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return data as Patient | null
    },
    enabled: !!userId,
  })
}

export function usePatientDashboard(patientId?: string) {
  return useQuery({
    queryKey: ['patient-dashboard', patientId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]

      const [apptRes, invoiceRes, labRes, rxRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('*, doctor:doctors(specialization, profile:profiles(full_name))')
          .eq('patient_id', patientId!)
          .gte('appointment_date', today)
          .in('status', ['pending', 'confirmed'])
          .order('appointment_date')
          .limit(1),
        supabase
          .from('invoices')
          .select('*')
          .eq('patient_id', patientId!)
          .in('status', ['pending', 'partial'])
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('laboratory_tests')
          .select('*')
          .eq('patient_id', patientId!)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1),
        supabase
          .from('prescriptions')
          .select('id')
          .eq('patient_id', patientId!)
          .eq('dispensed', false),
      ])

      return {
        upcomingAppointment: apptRes.data?.[0] ?? null,
        outstandingBill: invoiceRes.data?.[0] ?? null,
        latestLab: labRes.data?.[0] ?? null,
        activePrescriptions: rxRes.data?.length ?? 0,
      }
    },
    enabled: !!patientId,
  })
}

export function useMyAppointments(patientId?: string) {
  return useQuery({
    queryKey: ['my-appointments', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, doctor:doctors(specialization, profile:profiles(full_name)), department:departments(name)')
        .eq('patient_id', patientId!)
        .order('appointment_date', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!patientId,
  })
}

export function useMyPrescriptions(patientId?: string) {
  return useQuery({
    queryKey: ['my-prescriptions', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*, medicine:medicines(name, unit), doctor:doctors(profile:profiles(full_name))')
        .eq('patient_id', patientId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!patientId,
  })
}

export function useMyLabResults(patientId?: string) {
  return useQuery({
    queryKey: ['my-lab', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('laboratory_tests')
        .select('*, laboratory_results(*)')
        .eq('patient_id', patientId!)
        .order('ordered_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!patientId,
  })
}

export function useMyInvoices(patientId?: string) {
  return useQuery({
    queryKey: ['my-invoices', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('patient_id', patientId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!patientId,
  })
}

export function useMyMedicalRecords(patientId?: string) {
  return useQuery({
    queryKey: ['my-records', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*, doctor:doctors(profile:profiles(full_name)), diagnoses(*)')
        .eq('patient_id', patientId!)
        .order('visit_date', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!patientId,
  })
}

export function useMyQueue(patientId?: string) {
  return useQuery({
    queryKey: ['my-queue', patientId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('patient_id', patientId!)
        .gte('checked_in_at', `${today}T00:00:00`)
        .in('status', ['waiting', 'being_served'])
        .maybeSingle()
      if (error) throw error

      if (!data) return null

      const { count } = await supabase
        .from('queue_entries')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'waiting')
        .lt('ticket_number', data.ticket_number)
        .gte('checked_in_at', `${today}T00:00:00`)

      return { entry: data, peopleAhead: count ?? 0 }
    },
    enabled: !!patientId,
    refetchInterval: 15000,
  })
}

export function useMyNotifications(userId?: string) {
  return useQuery({
    queryKey: ['my-notifications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}

export function useBookAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      patient_id: string
      doctor_id: string
      department_id: string
      appointment_date: string
      start_time: string
      end_time: string
      reason: string
      symptoms?: string
      urgency?: string
      status?: string
      attachment_urls?: string[]
      notes?: string
    }) => {
      const { data, error } = await supabase.from('appointments').insert(payload).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-appointments'] })
      qc.invalidateQueries({ queryKey: ['patient-dashboard'] })
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['doctor-booked-slots'] })
    },
  })
}

export function useDoctorBookedSlots(doctorId?: string, date?: string) {
  return useQuery({
    queryKey: ['doctor-booked-slots', doctorId, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('start_time')
        .eq('doctor_id', doctorId!)
        .eq('appointment_date', date!)
        .in('status', ['pending', 'confirmed', 'checked_in', 'in_progress', 'suggested'])
      if (error) throw error
      return (data ?? []).map((a) => String(a.start_time).slice(0, 5))
    },
    enabled: !!doctorId && !!date,
  })
}

export async function uploadAppointmentFiles(userId: string, files: File[]): Promise<string[]> {
  const paths: string[] = []
  for (const file of files) {
    const path = `${userId}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const { error } = await supabase.storage.from('appointment-attachments').upload(path, file)
    if (error) throw error
    paths.push(path)
  }
  return paths
}

export function useCheckInAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ appointmentId, patientId, departmentId }: { appointmentId: string; patientId: string; departmentId?: string }) => {
      const { error: aptErr } = await supabase
        .from('appointments')
        .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
        .eq('id', appointmentId)
      if (aptErr) throw aptErr

      const { count } = await supabase
        .from('queue_entries')
        .select('id', { count: 'exact', head: true })
        .gte('checked_in_at', `${new Date().toISOString().split('T')[0]}T00:00:00`)

      const { error: qErr } = await supabase.from('queue_entries').insert({
        patient_id: patientId,
        department_id: departmentId || null,
        ticket_number: (count ?? 0) + 1,
        status: 'waiting',
      })
      if (qErr) throw qErr
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-appointments'] })
      qc.invalidateQueries({ queryKey: ['my-queue'] })
    },
  })
}

export function useRespondToSuggestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ appointmentId, accept }: { appointmentId: string; accept: boolean }) => {
      if (accept) {
        const { data: apt } = await supabase.from('appointments').select('suggested_date, suggested_start_time, suggested_end_time, room_number').eq('id', appointmentId).single()
        const { error } = await supabase.from('appointments').update({
          status: 'confirmed',
          appointment_date: apt?.suggested_date,
          start_time: apt?.suggested_start_time,
          end_time: apt?.suggested_end_time,
        }).eq('id', appointmentId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('appointments').update({ status: 'pending' }).eq('id', appointmentId)
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-appointments'] }),
  })
}

export function useUpdateMyProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Patient> & { id: string }) => {
      const { data, error } = await supabase
        .from('patients')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-patient'] })
      qc.invalidateQueries({ queryKey: ['patient-dashboard'] })
    },
  })
}
