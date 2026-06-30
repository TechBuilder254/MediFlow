import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useAddMedicine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      name: string
      generic_name?: string
      category?: string
      unit: string
      unit_price: number
      reorder_level: number
      initial_stock: number
      batch_number?: string
      expiry_date?: string
      location?: string
    }) => {
      const { data: medicine, error: medErr } = await supabase
        .from('medicines')
        .insert({
          name: payload.name,
          generic_name: payload.generic_name || null,
          category: payload.category || 'general',
          unit: payload.unit,
          unit_price: payload.unit_price,
          reorder_level: payload.reorder_level,
        })
        .select()
        .single()
      if (medErr) throw medErr

      const { error: invErr } = await supabase.from('inventory').insert({
        medicine_id: medicine.id,
        item_name: payload.name,
        item_type: 'medicine',
        quantity: payload.initial_stock,
        unit: payload.unit,
        batch_number: payload.batch_number || null,
        expiry_date: payload.expiry_date || null,
        location: payload.location || 'Pharmacy',
      })
      if (invErr) throw invErr

      return medicine
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medicines'] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useRestockMedicine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      medicine_id: string
      item_name: string
      quantity: number
      batch_number?: string
      expiry_date?: string
    }) => {
      const { data: existing } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('medicine_id', payload.medicine_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('inventory')
          .update({
            quantity: existing.quantity + payload.quantity,
            batch_number: payload.batch_number || undefined,
            expiry_date: payload.expiry_date || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('inventory').insert({
          medicine_id: payload.medicine_id,
          item_name: payload.item_name,
          item_type: 'medicine',
          quantity: payload.quantity,
          batch_number: payload.batch_number || null,
          expiry_date: payload.expiry_date || null,
          location: 'Pharmacy',
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medicines'] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}
