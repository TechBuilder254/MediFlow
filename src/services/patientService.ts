import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Patient, PortalStatus } from '@/types'
import { generatePatientNumber } from '@/utils/cn'

export function usePatients(search?: string) {
  return useQuery({
    queryKey: ['patients', search],
    queryFn: async () => {
      let query = supabase
        .from('patients')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,patient_number.ilike.%${search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Patient[]
    },
  })
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Patient
    },
    enabled: !!id,
  })
}

export function useCreatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patient: Partial<Patient>) => {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          ...patient,
          patient_number: patient.patient_number || generatePatientNumber(),
          portal_status: 'approved',
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  })
}

export function useUpdatePatient() {
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
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      qc.invalidateQueries({ queryKey: ['patient', vars.id] })
      qc.invalidateQueries({ queryKey: ['my-patient'] })
    },
  })
}

export function useApprovePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      patientId,
      status,
      approvedBy,
      rejectionReason,
    }: {
      patientId: string
      status: PortalStatus
      approvedBy: string
      rejectionReason?: string
    }) => {
      const { data, error } = await supabase
        .from('patients')
        .update({
          portal_status: status,
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          rejection_reason: status === 'rejected' ? rejectionReason : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', patientId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      qc.invalidateQueries({ queryKey: ['patient', vars.patientId] })
      qc.invalidateQueries({ queryKey: ['my-patient'] })
    },
  })
}
