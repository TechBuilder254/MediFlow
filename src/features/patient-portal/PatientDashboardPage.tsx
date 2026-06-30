import { Link } from 'react-router-dom'
import {
  Calendar, FileText, Pill, Bell, Megaphone, CheckCircle, MapPin,
  FlaskConical, Receipt,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/hooks/useAuth'
import { useMyPatientRecord, useMyAppointments, usePatientDashboard } from '@/services/patientPortalService'
import { useAnnouncements } from '@/services/settingsService'
import { calcProfileCompletion } from '@/utils/patientFlow'
import { formatDate, formatTime, cn, formatCurrency } from '@/utils/cn'

const QUICK_ACTIONS = [
  { to: '/portal/book', icon: Calendar, label: 'Book Appointment', color: 'bg-primary-600 text-white' },
  { to: '/portal/records', icon: FileText, label: 'Medical Records', color: 'bg-white border border-navy-200' },
  { to: '/portal/prescriptions', icon: Pill, label: 'Prescriptions', color: 'bg-white border border-navy-200' },
  { to: '/portal/notifications', icon: Bell, label: 'Notifications', color: 'bg-white border border-navy-200' },
]

export function PatientDashboardPage() {
  const { profile, user } = useAuthStore()
  const { data: patient, isLoading } = useMyPatientRecord(user?.id)
  const { data: appointments } = useMyAppointments(patient?.id)
  const { data: summary } = usePatientDashboard(patient?.id)
  const { data: announcements } = useAnnouncements()

  if (isLoading) return <LoadingSpinner />

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const { percent } = calcProfileCompletion(patient)
  const upcoming = appointments?.filter((a) => ['pending', 'confirmed', 'suggested', 'checked_in'].includes(a.status)).slice(0, 3)
  const turnAppointment = appointments?.find((a) => a.status === 'in_progress')

  return (
    <div>
      <PageHeader title={`Hello ${firstName} 👋`} description="Manage your healthcare in one place" />

      {turnAppointment && (
        <Card className="mb-6 border-2 border-primary-500 bg-primary-50 animate-pulse">
          <div className="text-center py-4">
            <CheckCircle className="h-10 w-10 text-primary-600 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-navy-900">It's Your Turn!</h2>
            <p className="text-navy-600 mt-1 flex items-center justify-center gap-1">
              <MapPin className="h-4 w-4" /> Proceed to {turnAppointment.room_number || 'consultation room'}
            </p>
          </div>
        </Card>
      )}

      {!patient?.profile_completed && percent < 100 && (
        <Card className="mb-6 border-primary-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Complete your profile</p>
            <span className="text-sm font-bold text-primary-600">{percent}%</span>
          </div>
          <div className="h-2 rounded-full bg-navy-100"><div className="h-full bg-primary-600 rounded-full" style={{ width: `${percent}%` }} /></div>
          <Link to="/portal/complete-profile" className="text-sm text-primary-600 font-medium mt-2 inline-block">Complete now →</Link>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {QUICK_ACTIONS.map(({ to, icon: Icon, label, color }) => (
          <Link key={to} to={to}>
            <div className={cn('rounded-2xl p-5 h-full flex flex-col items-center justify-center text-center gap-2 transition-shadow hover:shadow-md', color)}>
              <Icon className="h-6 w-6" />
              <span className="text-sm font-semibold">{label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/portal/prescriptions">
          <Card hover className="text-center">
            <Pill className="h-6 w-6 text-primary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-navy-900">{summary?.activePrescriptions ?? 0}</p>
            <p className="text-xs text-navy-500">Pending prescriptions</p>
          </Card>
        </Link>
        <Link to="/portal/lab">
          <Card hover className="text-center">
            <FlaskConical className="h-6 w-6 text-sky-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-navy-900 truncate">{summary?.latestLab?.test_name ?? 'No results'}</p>
            <p className="text-xs text-navy-500">Latest lab test</p>
          </Card>
        </Link>
        <Link to="/portal/billing">
          <Card hover className="text-center">
            <Receipt className="h-6 w-6 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-navy-900">
              {summary?.outstandingBill ? formatCurrency(summary.outstandingBill.total_amount - summary.outstandingBill.amount_paid) : formatCurrency(0)}
            </p>
            <p className="text-xs text-navy-500">Outstanding balance</p>
          </Card>
        </Link>
        <Link to="/portal/records">
          <Card hover className="text-center">
            <FileText className="h-6 w-6 text-violet-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-navy-900">Medical history</p>
            <p className="text-xs text-navy-500">View your progress</p>
          </Card>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold font-display text-navy-900">Upcoming Appointments</h2>
            <Link to="/portal/appointments" className="text-sm text-primary-600">View all</Link>
          </div>
          {!upcoming?.length ? (
            <Card className="text-center py-8">
              <p className="text-navy-500 text-sm">No upcoming appointments</p>
              <Link to="/portal/book"><Button size="sm" className="mt-3"><Calendar className="h-4 w-4" /> Book Now</Button></Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcoming.map((apt) => {
                const doctor = apt.doctor as { profile?: { full_name: string }; specialization?: string } | null
                const dept = apt.department as { name: string } | null
                return (
                  <Card key={apt.id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-navy-900">{dept?.name}</p>
                        <p className="text-sm text-navy-600">{doctor?.profile?.full_name || doctor?.specialization}</p>
                        <p className="text-xs text-navy-500 mt-1">{formatDate(apt.appointment_date)} · {formatTime(apt.start_time)}</p>
                      </div>
                      <StatusBadge status={apt.status} urgency={apt.urgency} />
                    </div>
                    {apt.status === 'confirmed' && apt.appointment_date === new Date().toISOString().split('T')[0] && (
                      <Link to="/portal/appointments"><Button size="sm" variant="outline" className="mt-3 w-full">I'm Here — Check In</Button></Link>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="h-5 w-5 text-primary-600" />
            <h2 className="font-semibold font-display text-navy-900">Hospital Announcements</h2>
          </div>
          <div className="space-y-3">
            {announcements?.length ? announcements.map((a) => (
              <Card key={a.id}>
                <p className="font-medium text-navy-900">{a.title}</p>
                <p className="text-sm text-navy-500 mt-1">{a.body}</p>
              </Card>
            )) : (
              <Card className="text-sm text-navy-500 text-center py-4">No announcements at this time</Card>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function StatusBadge({ status, urgency }: { status: string; urgency?: string }) {
  const map: Record<string, 'warning' | 'success' | 'danger' | 'info' | 'primary'> = {
    pending: 'warning', confirmed: 'success', declined: 'danger', suggested: 'info', checked_in: 'primary', in_progress: 'success',
  }
  const label = status === 'pending' ? 'Pending Review' : status.replace('_', ' ')
  return (
    <div className="flex flex-col items-end gap-1">
      <Badge variant={map[status] || 'default'}>{label}</Badge>
      {urgency === 'urgent' && <span className="text-xs">🔴 Urgent</span>}
    </div>
  )
}
