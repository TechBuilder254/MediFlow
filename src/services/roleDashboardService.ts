import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types'

const today = () => new Date().toISOString().split('T')[0]

export function useRoleDashboard(role?: UserRole, userId?: string) {
  return useQuery({
    queryKey: ['role-dashboard', role, userId],
    queryFn: async () => {
      const d = today()

      if (role === 'receptionist' || role === 'admin' || role === 'super_admin') {
        const [appts, queue, patients, checkins] = await Promise.all([
          supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', d),
          supabase.from('queue_entries').select('id', { count: 'exact', head: true }).gte('checked_in_at', `${d}T00:00:00`).eq('status', 'waiting'),
          supabase.from('patients').select('id', { count: 'exact', head: true }).gte('created_at', `${d}T00:00:00`),
          supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', d).eq('status', 'checked_in'),
        ])
        return {
          type: 'reception' as const,
          stats: [
            { label: "Today's Appointments", value: appts.count ?? 0 },
            { label: 'Patients Waiting', value: queue.count ?? 0 },
            { label: 'New Registrations', value: patients.count ?? 0 },
            { label: 'Pending Check-ins', value: (appts.count ?? 0) - (checkins.count ?? 0) },
          ],
        }
      }

      if (role === 'doctor') {
        const { data: doc } = await supabase.from('doctors').select('id').eq('user_id', userId!).maybeSingle()
        if (!doc) return { type: 'doctor' as const, stats: [], schedule: [] }

        const [schedule, pending, completed, labs] = await Promise.all([
          supabase.from('appointments').select('*, patient:patients(first_name, last_name)').eq('doctor_id', doc.id).eq('appointment_date', d).order('start_time'),
          supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('doctor_id', doc.id).eq('status', 'pending'),
          supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('doctor_id', doc.id).eq('appointment_date', d).eq('status', 'completed'),
          supabase.from('laboratory_tests').select('id', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']),
        ])
        const waiting = schedule.data?.filter((a) => ['checked_in', 'confirmed', 'in_progress'].includes(a.status)).length ?? 0

        return {
          type: 'doctor' as const,
          stats: [
            { label: "Today's Schedule", value: schedule.data?.length ?? 0 },
            { label: 'Waiting Patients', value: waiting },
            { label: 'Completed Today', value: completed.count ?? 0 },
            { label: 'New Requests', value: pending.count ?? 0 },
            { label: 'Pending Lab Results', value: labs.count ?? 0 },
          ],
          schedule: schedule.data ?? [],
          doctorId: doc.id,
        }
      }

      if (role === 'nurse') {
        const [queue, admissions, assessments] = await Promise.all([
          supabase.from('queue_entries').select('id', { count: 'exact', head: true }).gte('checked_in_at', `${d}T00:00:00`).eq('status', 'waiting'),
          supabase.from('admissions').select('id', { count: 'exact', head: true }).eq('status', 'admitted'),
          supabase.from('nurse_assessments').select('id', { count: 'exact', head: true }).gte('created_at', `${d}T00:00:00`),
        ])
        return {
          type: 'nurse' as const,
          stats: [
            { label: 'Patients Waiting', value: queue.count ?? 0 },
            { label: 'Ward Patients', value: admissions.count ?? 0 },
            { label: "Today's Assessments", value: assessments.count ?? 0 },
          ],
        }
      }

      if (role === 'lab_technician') {
        const [pending, completed, urgent] = await Promise.all([
          supabase.from('laboratory_tests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('laboratory_tests').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('completed_at', `${d}T00:00:00`),
          supabase.from('laboratory_tests').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
        ])
        return {
          type: 'lab' as const,
          stats: [
            { label: 'Pending Tests', value: pending.count ?? 0 },
            { label: 'Completed Today', value: completed.count ?? 0 },
            { label: 'In Progress', value: urgent.count ?? 0 },
          ],
        }
      }

      if (role === 'pharmacist') {
        const [rx, lowStock, expired] = await Promise.all([
          supabase.from('prescriptions').select('id', { count: 'exact', head: true }).eq('dispensed', false),
          supabase.from('inventory').select('quantity, medicine:medicines(reorder_level)'),
          supabase.from('inventory').select('id', { count: 'exact', head: true }).lt('expiry_date', new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]),
        ])
        const low = lowStock.data?.filter((i) => i.quantity <= ((i.medicine as { reorder_level?: number })?.reorder_level ?? 50)).length ?? 0
        return {
          type: 'pharmacy' as const,
          stats: [
            { label: 'Pending Prescriptions', value: rx.count ?? 0 },
            { label: 'Low Stock Items', value: low },
            { label: 'Expiring Soon', value: expired.count ?? 0 },
          ],
        }
      }

      if (role === 'cashier') {
        const { data: invoices } = await supabase.from('invoices').select('total_amount, amount_paid, status, created_at')
        const todayInvoices = invoices?.filter((i) => i.created_at.startsWith(d)) ?? []
        const pending = invoices?.filter((i) => i.status === 'pending' || i.status === 'partial').length ?? 0
        const todayRevenue = todayInvoices.reduce((s, i) => s + Number(i.amount_paid), 0)
        const paidToday = todayInvoices.filter((i) => i.status === 'paid').length
        return {
          type: 'cashier' as const,
          stats: [
            { label: 'Pending Payments', value: pending },
            { label: "Today's Revenue", value: `KES ${todayRevenue.toLocaleString()}` },
            { label: 'Paid Today', value: paidToday },
          ],
        }
      }

      // super_admin / admin — use full stats from dashboardService
      return { type: 'admin' as const, stats: [] }
    },
    enabled: !!role,
  })
}
