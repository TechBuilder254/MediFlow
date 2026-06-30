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

export function useVisitForAppointment(appointmentId?: string) {
  return useQuery({
    queryKey: ['visit-appointment', appointmentId],
    queryFn: async () => {
      const { data: record, error } = await supabase
        .from('medical_records')
        .select('*, diagnoses(*)')
        .eq('appointment_id', appointmentId!)
        .maybeSingle()
      if (error) throw error
      return record
    },
    enabled: !!appointmentId,
  })
}

export function useAppointmentLabOrders(appointmentId?: string) {
  return useQuery({
    queryKey: ['appointment-labs', appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('laboratory_tests')
        .select('*, laboratory_results(*)')
        .eq('appointment_id', appointmentId!)
        .order('ordered_at', { ascending: false })
      if (error) throw error
      if (!data?.length) return []

      const techIds = data.map((t) => t.technician_id).filter(Boolean) as string[]
      const { data: techs } = techIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', techIds)
        : { data: [] as { id: string; full_name: string }[] }
      const techMap = new Map((techs ?? []).map((t) => [t.id, t.full_name]))
      return data.map((t) => ({
        ...t,
        technician_name: t.technician_id ? techMap.get(t.technician_id) : null,
      }))
    },
    enabled: !!appointmentId,
  })
}

export function usePatientVisitTimeline(patientId?: string) {
  return useQuery({
    queryKey: ['visit-timeline', patientId],
    queryFn: async () => {
      const [appointmentsRes, recordsRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, appointment_date, start_time, status, reason, symptoms, doctor:doctors(display_name, specialization)')
          .eq('patient_id', patientId!)
          .order('appointment_date', { ascending: false })
          .limit(20),
        supabase
          .from('medical_records')
          .select('*, diagnoses(*), doctor:doctors(display_name)')
          .eq('patient_id', patientId!)
          .order('visit_date', { ascending: false }),
      ])
      if (appointmentsRes.error) throw appointmentsRes.error
      if (recordsRes.error) throw recordsRes.error

      const recordByApt = new Map(
        (recordsRes.data ?? [])
          .filter((r) => r.appointment_id)
          .map((r) => [r.appointment_id as string, r]),
      )

      return (appointmentsRes.data ?? []).map((apt) => ({
        appointment: apt,
        record: recordByApt.get(apt.id) ?? null,
      }))
    },
    enabled: !!patientId,
  })
}

export function useSaveVisitDraft() {
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
    }) => {
      const { data: existing } = await supabase
        .from('medical_records')
        .select('id')
        .eq('appointment_id', payload.appointmentId)
        .maybeSingle()

      let recordId: string
      if (existing) {
        const { error } = await supabase
          .from('medical_records')
          .update({
            chief_complaint: payload.chiefComplaint,
            symptoms: payload.symptoms,
            notes: payload.notes,
            vitals: payload.vitals ?? {},
            visit_date: new Date().toISOString(),
          })
          .eq('id', existing.id)
        if (error) throw error
        recordId = existing.id
      } else {
        const { data: record, error } = await supabase
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
          .select('id')
          .single()
        if (error) throw error
        recordId = record.id
      }

      if (payload.diagnosis.trim()) {
        await supabase.from('diagnoses').delete().eq('medical_record_id', recordId)
        await supabase.from('diagnoses').insert({
          medical_record_id: recordId,
          patient_id: payload.patientId,
          doctor_id: payload.doctorId,
          description: payload.diagnosis,
        })
      }

      await supabase
        .from('appointments')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', payload.appointmentId)
        .in('status', ['pending', 'confirmed', 'checked_in'])

      return { id: recordId }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['visit-appointment', vars.appointmentId] })
      qc.invalidateQueries({ queryKey: ['visit-timeline', vars.patientId] })
      qc.invalidateQueries({ queryKey: ['clinical-summary', vars.patientId] })
      qc.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

export function useOrderLabTest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      patientId: string
      doctorId: string
      appointmentId: string
      test_name: string
      notes?: string
      technician_id: string
      patientUserId?: string | null
    }) => {
      const { data: test, error } = await supabase
        .from('laboratory_tests')
        .insert({
          patient_id: payload.patientId,
          doctor_id: payload.doctorId,
          appointment_id: payload.appointmentId,
          test_name: payload.test_name,
          test_type: 'general',
          notes: payload.notes || null,
          technician_id: payload.technician_id,
          status: 'pending',
        })
        .select('id, test_name, technician_id')
        .single()
      if (error) throw error

      await supabase.from('notifications').insert({
        user_id: payload.technician_id,
        title: 'New lab request',
        message: `Test ordered: ${payload.test_name}. ${payload.notes ? `Instructions: ${payload.notes}` : 'Check Laboratory for details.'}`,
        type: 'lab',
        link: '/laboratory',
      })

      if (payload.patientUserId) {
        await supabase.from('notifications').insert({
          user_id: payload.patientUserId,
          title: 'Lab test ordered',
          message: `Your doctor ordered: ${payload.test_name}. A lab technician will process it — results will appear when ready.`,
          type: 'lab',
          link: '/portal/lab',
        })
      }

      await supabase
        .from('appointments')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', payload.appointmentId)
        .in('status', ['pending', 'confirmed', 'checked_in'])

      return test
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['appointment-labs', vars.appointmentId] })
      qc.invalidateQueries({ queryKey: ['doctor-lab-results'] })
      qc.invalidateQueries({ queryKey: ['lab-tests'] })
      qc.invalidateQueries({ queryKey: ['my-lab'] })
      qc.invalidateQueries({ queryKey: ['clinical-summary', vars.patientId] })
    },
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
      prescriptions?: { medicine_id: string; dosage: string; frequency: string; duration: string; instructions?: string; quantity?: number }[]
      labTests?: { test_name: string; test_type?: string; notes?: string; technician_id: string }[]
      patientUserId?: string | null
    }) => {
      const { data: existing } = await supabase
        .from('medical_records')
        .select('id')
        .eq('appointment_id', payload.appointmentId)
        .maybeSingle()

      let record: { id: string }
      if (existing) {
        const { data: updated, error: updErr } = await supabase
          .from('medical_records')
          .update({
            chief_complaint: payload.chiefComplaint,
            symptoms: payload.symptoms,
            notes: payload.notes,
            vitals: payload.vitals ?? {},
            visit_date: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()
        if (updErr) throw updErr
        record = updated
        await supabase.from('diagnoses').delete().eq('medical_record_id', existing.id)
      } else {
        const { data: inserted, error: recErr } = await supabase
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
        record = inserted
      }

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
            quantity: rx.quantity ?? 1,
          })),
        )
      }

      // Consultation fee invoice
      const { data: doctor } = await supabase
        .from('doctors')
        .select('consultation_fee')
        .eq('id', payload.doctorId)
        .single()

      const consultFee = Number(doctor?.consultation_fee ?? 0)
      if (consultFee > 0) {
        const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`
        const { data: invoice } = await supabase
          .from('invoices')
          .insert({
            invoice_number: invoiceNumber,
            patient_id: payload.patientId,
            appointment_id: payload.appointmentId,
            subtotal: consultFee,
            tax_amount: 0,
            discount_amount: 0,
            total_amount: consultFee,
            amount_paid: 0,
            status: 'pending',
            due_date: new Date().toISOString().split('T')[0],
          })
          .select()
          .single()

        if (invoice) {
          await supabase.from('invoice_items').insert({
            invoice_id: invoice.id,
            description: 'Consultation fee',
            quantity: 1,
            unit_price: consultFee,
            total_price: consultFee,
          })
        }
      }

      if (payload.labTests?.length) {
        const inserted = await supabase.from('laboratory_tests').insert(
          payload.labTests.map((t) => ({
            patient_id: payload.patientId,
            doctor_id: payload.doctorId,
            appointment_id: payload.appointmentId,
            test_name: t.test_name,
            test_type: t.test_type ?? 'general',
            notes: t.notes || null,
            technician_id: t.technician_id,
            status: 'pending',
          })),
        ).select('id, test_name, technician_id')

        if (!inserted.error && inserted.data) {
          for (const test of inserted.data) {
            await supabase.from('notifications').insert({
              user_id: test.technician_id,
              title: 'New lab request',
              message: `Dr. ordered: ${test.test_name}. Check Laboratory for instructions.`,
              type: 'lab',
              link: '/laboratory',
            })
          }
        }
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
          message: 'Your visit notes and prescriptions are ready. Collect medicine at the pharmacy; lab results will appear when ready.',
          type: 'appointment',
          link: '/portal/records',
        })
      }

      return record
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['clinical-summary'] })
      qc.invalidateQueries({ queryKey: ['my-appointments'] })
      qc.invalidateQueries({ queryKey: ['lab-tests'] })
      qc.invalidateQueries({ queryKey: ['doctor-lab-results'] })
      qc.invalidateQueries({ queryKey: ['pending-prescriptions'] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['my-invoices'] })
      qc.invalidateQueries({ queryKey: ['patient-dashboard'] })
      qc.invalidateQueries({ queryKey: ['visit-appointment', vars.appointmentId] })
      qc.invalidateQueries({ queryKey: ['visit-timeline', vars.patientId] })
      qc.invalidateQueries({ queryKey: ['appointment-labs', vars.appointmentId] })
      qc.invalidateQueries({ queryKey: ['my-records'] })
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
    mutationFn: async ({ id, status, result_summary, patientUserId, technicianId }: {
      id: string
      status: string
      result_summary?: string
      patientUserId?: string | null
      technicianId?: string
    }) => {
      const updates: Record<string, unknown> = { status }
      if (status === 'completed') updates.completed_at = new Date().toISOString()
      if (technicianId && status === 'in_progress') updates.technician_id = technicianId

      const { error } = await supabase.from('laboratory_tests').update(updates).eq('id', id)
      if (error) throw error

      if (result_summary) {
        await supabase.from('laboratory_results').insert({
          test_id: id,
          result_summary,
          result_data: { summary: result_summary },
        })
      }

      if (status === 'completed') {
        const { data: test } = await supabase
          .from('laboratory_tests')
          .select('test_name, doctor_id, doctors(user_id)')
          .eq('id', id)
          .single()

        const doctor = test?.doctors as { user_id: string } | null

        if (patientUserId) {
          await supabase.from('notifications').insert({
            user_id: patientUserId,
            title: 'Lab results ready',
            message: result_summary || 'Your laboratory test results are available.',
            type: 'lab',
            link: '/portal/lab',
          })
        }

        if (doctor?.user_id) {
          await supabase.from('notifications').insert({
            user_id: doctor.user_id,
            title: 'Lab results ready for review',
            message: `${test?.test_name}: ${result_summary || 'Results submitted by lab technician.'}`,
            type: 'lab',
            link: '/lab-results',
          })
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lab-tests'] })
      qc.invalidateQueries({ queryKey: ['my-lab'] })
      qc.invalidateQueries({ queryKey: ['doctor-lab-results'] })
    },
  })
}

export function useDoctorLabResults(doctorId?: string) {
  return useQuery({
    queryKey: ['doctor-lab-results', doctorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('laboratory_tests')
        .select('*, patient:patients(first_name, last_name, patient_number), laboratory_results(*)')
        .eq('doctor_id', doctorId!)
        .order('ordered_at', { ascending: false })
      if (error) throw error
      if (!data?.length) return []

      const techIds = data.map((t) => t.technician_id).filter(Boolean) as string[]
      const { data: techs } = techIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', techIds)
        : { data: [] as { id: string; full_name: string }[] }

      const techMap = new Map((techs ?? []).map((t) => [t.id, t.full_name]))
      return data.map((t) => ({
        ...t,
        technician_name: t.technician_id ? techMap.get(t.technician_id) : null,
      }))
    },
    enabled: !!doctorId,
  })
}

export function useDispensePrescription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      prescriptionId,
      medicineId,
      quantity,
      pharmacistId,
      patientUserId,
      patientId,
      unitPrice,
    }: {
      prescriptionId: string
      medicineId: string
      quantity: number
      pharmacistId: string
      patientUserId?: string | null
      patientId: string
      unitPrice: number
    }) => {
      const { data: inv } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('medicine_id', medicineId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!inv || inv.quantity < quantity) {
        throw new Error(`Insufficient stock. Available: ${inv?.quantity ?? 0}, needed: ${quantity}`)
      }

      const { error } = await supabase
        .from('prescriptions')
        .update({
          dispensed: true,
          dispensed_at: new Date().toISOString(),
          dispensed_by: pharmacistId,
        })
        .eq('id', prescriptionId)
      if (error) throw error

      await supabase.from('inventory').update({ quantity: inv.quantity - quantity }).eq('id', inv.id)

      // Pharmacy charge invoice
      const medTotal = unitPrice * quantity
      if (medTotal > 0) {
        const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`
        const { data: invoice } = await supabase
          .from('invoices')
          .insert({
            invoice_number: invoiceNumber,
            patient_id: patientId,
            subtotal: medTotal,
            tax_amount: 0,
            discount_amount: 0,
            total_amount: medTotal,
            amount_paid: 0,
            status: 'pending',
            due_date: new Date().toISOString().split('T')[0],
          })
          .select()
          .single()

        if (invoice) {
          await supabase.from('invoice_items').insert({
            invoice_id: invoice.id,
            description: `Medicine dispensed (×${quantity})`,
            quantity,
            unit_price: unitPrice,
            total_price: medTotal,
          })
        }
      }

      if (patientUserId) {
        await supabase.from('notifications').insert({
          user_id: patientUserId,
          title: 'Prescription dispensed',
          message: `Your medicine has been dispensed (${quantity} unit${quantity > 1 ? 's' : ''}). Collect at pharmacy and check billing for payment.`,
          type: 'pharmacy',
          link: '/portal/prescriptions',
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-prescriptions'] })
      qc.invalidateQueries({ queryKey: ['dispensed-prescriptions'] })
      qc.invalidateQueries({ queryKey: ['medicines'] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['my-prescriptions'] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['my-invoices'] })
      qc.invalidateQueries({ queryKey: ['my-notifications'] })
    },
  })
}

export function useDispensedPrescriptions() {
  return useQuery({
    queryKey: ['dispensed-prescriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*, patient:patients(first_name, last_name, patient_number), medicine:medicines(name, unit), doctor:doctors(display_name)')
        .eq('dispensed', true)
        .order('dispensed_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
    },
  })
}
