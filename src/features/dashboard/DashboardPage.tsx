import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Users, Calendar, Stethoscope, DollarSign, BedDouble,
  AlertTriangle, FlaskConical, Pill, Clock, UserCheck,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { RevenueChart, PatientsChart, DepartmentChart } from '@/components/charts/DashboardCharts'
import {
  useDashboardStats,
  fetchWeeklyRevenue,
  fetchMonthlyPatients,
  fetchDepartmentPerformance,
} from '@/services/dashboardService'
import { useRoleDashboard } from '@/services/roleDashboardService'
import { formatCurrency, formatTime } from '@/utils/cn'
import { useAuthStore } from '@/hooks/useAuth'
import type { UserRole } from '@/types'

const STAT_ICONS = [Users, Calendar, Stethoscope, DollarSign, BedDouble, AlertTriangle, FlaskConical, Pill]

export function DashboardPage() {
  const { profile, user } = useAuthStore()
  const role = profile?.role as UserRole | undefined
  const { data: roleData, isLoading: roleLoading } = useRoleDashboard(role, user?.id)
  const { data: stats, isLoading: statsLoading } = useDashboardStats()

  const { data: revenueData } = useQuery({ queryKey: ['weekly-revenue'], queryFn: fetchWeeklyRevenue, enabled: role === 'super_admin' || role === 'admin' })
  const { data: patientsData } = useQuery({ queryKey: ['monthly-patients'], queryFn: fetchMonthlyPatients, enabled: role === 'super_admin' || role === 'admin' })
  const { data: deptData } = useQuery({ queryKey: ['dept-performance'], queryFn: fetchDepartmentPerformance, enabled: role === 'super_admin' || role === 'admin' })

  if (roleLoading || (role === 'super_admin' || role === 'admin') && statsLoading) return <LoadingSpinner />

  const isAdmin = role === 'super_admin' || role === 'admin'

  return (
    <div>
      <PageHeader
        title={`Good ${getGreeting()}, ${profile?.full_name?.split(' ')[0] ?? 'there'}`}
        description={getRoleDescription(role)}
      />

      {isAdmin && stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Today's Patients" value={stats.todayPatients} icon={Users} color="primary" />
          <StatCard title="Appointments" value={stats.appointments} icon={Calendar} color="accent" />
          <StatCard title="Doctors On Duty" value={stats.doctorsOnDuty} icon={Stethoscope} color="success" />
          <StatCard title="Revenue Today" value={formatCurrency(stats.revenueToday)} icon={DollarSign} color="primary" />
          <StatCard title="Beds Available" value={stats.bedsAvailable} icon={BedDouble} color="success" />
          <StatCard title="Emergency Cases" value={stats.emergencyCases} icon={AlertTriangle} color="danger" />
          <StatCard title="Pending Lab Results" value={stats.pendingLabResults} icon={FlaskConical} color="warning" />
          <StatCard title="Low Stock Medicines" value={stats.lowStockMedicines} icon={Pill} color="warning" />
        </div>
      )}

      {roleData && roleData.stats.length > 0 && !isAdmin && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {roleData.stats.map((s, i) => (
            <StatCard key={s.label} title={s.label} value={s.value} icon={STAT_ICONS[i % STAT_ICONS.length]} color="primary" />
          ))}
        </div>
      )}

      {roleData?.type === 'doctor' && roleData.schedule && roleData.schedule.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-navy-900 mb-4">Today's Schedule</h2>
          <div className="space-y-3">
            {roleData.schedule.map((apt: {
              id: string; start_time: string; status: string; room_number?: string
              patient?: { first_name: string; last_name: string }
            }) => (
              <div key={apt.id} className="rounded-2xl border border-navy-100 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[4rem]">
                    <p className="font-bold text-navy-900">{formatTime(apt.start_time)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">
                      {apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'Patient'}
                    </p>
                    <Badge variant={apt.status === 'checked_in' || apt.status === 'in_progress' ? 'warning' : 'primary'}>
                      {apt.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                {['checked_in', 'in_progress', 'confirmed'].includes(apt.status) && (
                  <Link to={`/consultation/${apt.id}`}>
                    <Button size="sm"><UserCheck className="h-4 w-4" /> Start Consultation</Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(role === 'receptionist' || role === 'admin' || role === 'super_admin') && (
        <div className="mb-8 flex gap-3">
          <Link to="/reception"><Button><Clock className="h-4 w-4" /> Open Reception Desk</Button></Link>
          <Link to="/queue"><Button variant="outline">View Queue</Button></Link>
        </div>
      )}

      {role === 'nurse' && (
        <div className="mb-8">
          <Link to="/assessments"><Button><UserCheck className="h-4 w-4" /> Start Nurse Assessment</Button></Link>
        </div>
      )}

      {isAdmin && (
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {revenueData && <RevenueChart data={revenueData} />}
          {patientsData && <PatientsChart data={patientsData} />}
        </div>
      )}

      {isAdmin && deptData && (
        <div className="grid lg:grid-cols-2 gap-6">
          <DepartmentChart data={deptData} />
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

function getRoleDescription(role?: UserRole) {
  const map: Partial<Record<UserRole, string>> = {
    super_admin: 'Full system overview and hospital management.',
    admin: 'Hospital operations and staff management.',
    doctor: "Today's schedule and patient consultations.",
    nurse: 'Patient assessments and ward monitoring.',
    receptionist: 'Front desk — check-ins, walk-ins, and queue.',
    pharmacist: 'Prescription dispensing and inventory.',
    lab_technician: 'Laboratory tests and results.',
    cashier: 'Billing and payment collection.',
  }
  return map[role ?? 'admin'] ?? "Here's what's happening today."
}
