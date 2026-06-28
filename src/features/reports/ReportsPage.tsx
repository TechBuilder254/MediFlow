import { useQuery } from '@tanstack/react-query'
import { BarChart3 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, StatCard } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/cn'
import { DepartmentChart } from '@/components/charts/DashboardCharts'
import { fetchDepartmentPerformance } from '@/services/dashboardService'

export function ReportsPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: async () => {
      const [patients, appointments, invoices, labs, rx, doctors] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact', head: true }),
        supabase.from('invoices').select('total_amount, amount_paid, status'),
        supabase.from('laboratory_tests').select('id', { count: 'exact', head: true }),
        supabase.from('prescriptions').select('id', { count: 'exact', head: true }),
        supabase.from('doctors').select('id, display_name, specialization'),
      ])
      const revenue = invoices.data?.reduce((s, i) => s + Number(i.amount_paid), 0) ?? 0
      const outstanding = invoices.data?.reduce((s, i) => s + (Number(i.total_amount) - Number(i.amount_paid)), 0) ?? 0
      return {
        totalPatients: patients.count ?? 0,
        totalAppointments: appointments.count ?? 0,
        totalRevenue: revenue,
        outstanding,
        labTests: labs.count ?? 0,
        prescriptions: rx.count ?? 0,
        doctors: doctors.data ?? [],
      }
    },
  })

  const { data: deptData } = useQuery({ queryKey: ['dept-performance'], queryFn: fetchDepartmentPerformance })

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader title="Reports" description="Hospital performance and operational statistics" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Patients" value={summary?.totalPatients ?? 0} icon={BarChart3} color="primary" />
        <StatCard title="Total Appointments" value={summary?.totalAppointments ?? 0} icon={BarChart3} color="accent" />
        <StatCard title="Total Revenue" value={formatCurrency(summary?.totalRevenue ?? 0)} icon={BarChart3} color="success" />
        <StatCard title="Outstanding" value={formatCurrency(summary?.outstanding ?? 0)} icon={BarChart3} color="warning" />
      </div>

      {deptData && <DepartmentChart data={deptData} />}

      <Card className="mt-6">
        <h3 className="font-semibold text-navy-900 mb-4">Doctor Workload</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100">
              <th className="text-left py-2 text-navy-600">Doctor</th>
              <th className="text-left py-2 text-navy-600">Specialization</th>
            </tr>
          </thead>
          <tbody>
            {summary?.doctors.map((d) => (
              <tr key={d.id} className="border-b border-navy-50">
                <td className="py-2 font-medium">{d.display_name || d.specialization}</td>
                <td className="py-2 text-navy-500">{d.specialization}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
