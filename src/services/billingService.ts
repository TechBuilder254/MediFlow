import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PaymentMethod } from '@/types'

function generateInvoiceNumber() {
  return `INV-${Date.now().toString().slice(-8)}`
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      patient_id: string
      appointment_id?: string
      description: string
      amount: number
      tax_rate?: number
    }) => {
      const taxRate = payload.tax_rate ?? 0
      const taxAmount = payload.amount * (taxRate / 100)
      const total = payload.amount + taxAmount

      const { data, error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: generateInvoiceNumber(),
          patient_id: payload.patient_id,
          appointment_id: payload.appointment_id ?? null,
          subtotal: payload.amount,
          tax_amount: taxAmount,
          discount_amount: 0,
          total_amount: total,
          amount_paid: 0,
          status: 'pending',
          due_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single()
      if (error) throw error

      await supabase.from('invoice_items').insert({
        invoice_id: data.id,
        description: payload.description,
        quantity: 1,
        unit_price: payload.amount,
        total_price: payload.amount,
      })

      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      invoice_id: string
      amount: number
      payment_method: PaymentMethod
      reference_number?: string
      received_by: string
      patientUserId?: string | null
    }) => {
      const { data: invoice, error: fetchErr } = await supabase
        .from('invoices')
        .select('total_amount, amount_paid')
        .eq('id', payload.invoice_id)
        .single()
      if (fetchErr) throw fetchErr

      const newPaid = Number(invoice.amount_paid) + payload.amount
      const status = newPaid >= Number(invoice.total_amount) ? 'paid' : 'partial'

      await supabase.from('payments').insert({
        invoice_id: payload.invoice_id,
        amount: payload.amount,
        payment_method: payload.payment_method,
        reference_number: payload.reference_number ?? null,
        received_by: payload.received_by,
      })

      const { error } = await supabase
        .from('invoices')
        .update({ amount_paid: newPaid, status, updated_at: new Date().toISOString() })
        .eq('id', payload.invoice_id)
      if (error) throw error

      if (payload.patientUserId && status === 'paid') {
        await supabase.from('notifications').insert({
          user_id: payload.patientUserId,
          title: 'Payment received',
          message: `Your payment of KES ${payload.amount.toLocaleString()} was received. Thank you.`,
          type: 'billing',
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['my-invoices'] })
      qc.invalidateQueries({ queryKey: ['patient-dashboard'] })
    },
  })
}

export function usePatientPayInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      invoice_id: string
      amount: number
      payment_method: PaymentMethod
      reference_number?: string
      userId: string
    }) => {
      const { data: invoice, error: fetchErr } = await supabase
        .from('invoices')
        .select('total_amount, amount_paid, patient_id, patients(user_id)')
        .eq('id', payload.invoice_id)
        .single()
      if (fetchErr) throw fetchErr

      const patient = invoice.patients as { user_id: string } | null
      if (patient?.user_id !== payload.userId) throw new Error('Not authorized to pay this invoice')

      const newPaid = Number(invoice.amount_paid) + payload.amount
      const status = newPaid >= Number(invoice.total_amount) ? 'paid' : 'partial'

      const { error: payErr } = await supabase.from('payments').insert({
        invoice_id: payload.invoice_id,
        amount: payload.amount,
        payment_method: payload.payment_method,
        reference_number: payload.reference_number ?? `${payload.payment_method.toUpperCase()}-${Date.now()}`,
        received_by: null,
      })
      if (payErr) throw payErr

      const { error } = await supabase
        .from('invoices')
        .update({ amount_paid: newPaid, status, updated_at: new Date().toISOString() })
        .eq('id', payload.invoice_id)
      if (error) throw error

      if (status === 'paid' && patient?.user_id) {
        await supabase.from('notifications').insert({
          user_id: patient.user_id,
          title: 'Payment confirmed',
          message: `Your payment of KES ${payload.amount.toLocaleString()} was received successfully.`,
          type: 'billing',
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['my-invoices'] })
      qc.invalidateQueries({ queryKey: ['patient-dashboard'] })
      qc.invalidateQueries({ queryKey: ['my-notifications'] })
    },
  })
}

export function usePendingPrescriptions() {
  return useQuery({
    queryKey: ['pending-prescriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*, patient:patients(first_name, last_name, patient_number, user_id), medicine:medicines(name, unit, unit_price), doctor:doctors(display_name, specialization)')
        .eq('dispensed', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}
