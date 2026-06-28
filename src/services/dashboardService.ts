import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DashboardStats } from '@/types'

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0]

  const [
    patientsRes,
    appointmentsRes,
    doctorsRes,
    invoicesRes,
    bedsRes,
    admissionsRes,
    labRes,
    inventoryRes,
  ] = await Promise.all([
    supabase.from('patients').select('id', { count: 'exact', head: true }),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', today),
    supabase.from('doctors').select('id', { count: 'exact', head: true }).eq('is_on_duty', true),
    supabase.from('invoices').select('total_amount').gte('created_at', `${today}T00:00:00`),
    supabase.from('beds').select('status'),
    supabase.from('admissions').select('id', { count: 'exact', head: true }).eq('status', 'admitted'),
    supabase.from('laboratory_tests').select('id', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']),
    supabase.from('inventory').select('quantity, medicine:medicines(reorder_level)'),
  ])

  const revenueToday = invoicesRes.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) ?? 0
  const bedsAvailable = bedsRes.data?.filter((b) => b.status === 'available').length ?? 0
  const lowStock = inventoryRes.data?.filter((item) => {
    const reorder = (item.medicine as { reorder_level?: number } | null)?.reorder_level ?? 50
    return item.quantity <= reorder
  }).length ?? 0

  return {
    todayPatients: patientsRes.count ?? 0,
    appointments: appointmentsRes.count ?? 0,
    doctorsOnDuty: doctorsRes.count ?? 0,
    revenueToday,
    bedsAvailable,
    emergencyCases: admissionsRes.count ?? 0,
    pendingLabResults: labRes.count ?? 0,
    lowStockMedicines: lowStock,
  }
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  })
}

export async function fetchWeeklyRevenue() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }

  const { data } = await supabase
    .from('invoices')
    .select('total_amount, created_at')
    .gte('created_at', `${days[0]}T00:00:00`)

  return days.map((day) => {
    const dayTotal = data?.filter((inv) => inv.created_at.startsWith(day))
      .reduce((sum, inv) => sum + inv.total_amount, 0) ?? 0
    const label = new Date(day).toLocaleDateString('en', { weekday: 'short' })
    return { day: label, revenue: dayTotal }
  })
}

export async function fetchMonthlyPatients() {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en', { month: 'short' }) })
  }

  const { data } = await supabase.from('patients').select('created_at')

  return months.map(({ key, label }) => ({
    month: label,
    patients: data?.filter((p) => p.created_at.startsWith(key)).length ?? 0,
  }))
}

export async function fetchDepartmentPerformance() {
  const { data: departments } = await supabase.from('departments').select('id, name')
  const { data: appointments } = await supabase.from('appointments').select('department_id')

  return (departments ?? []).map((dept) => ({
    name: dept.name,
    appointments: appointments?.filter((a) => a.department_id === dept.id).length ?? 0,
  }))
}
