import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, User, Calendar, FileText, Pill, FlaskConical,
  Receipt, Shield, Users, Activity, Bell, MessageSquare, FolderOpen,
  Star, Settings, LogOut, Menu, X, Heart, Clock, LineChart,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/hooks/useAuth'
import { signOut } from '@/features/auth/authService'
import { getInitials } from '@/utils/cn'
import { cn } from '@/utils/cn'
import { useMyPatientRecord } from '@/services/patientPortalService'
import { LoadingSpinner } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'

const PATIENT_NAV = [
  { to: '/portal', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/portal/profile', icon: User, label: 'My Profile' },
  { to: '/portal/book', icon: Calendar, label: 'Book Appointment' },
  { to: '/portal/appointments', icon: Calendar, label: 'My Appointments' },
  { to: '/portal/queue', icon: Clock, label: 'Live Queue' },
  { to: '/portal/records', icon: FileText, label: 'Medical Records' },
  { to: '/portal/prescriptions', icon: Pill, label: 'Prescriptions' },
  { to: '/portal/lab', icon: FlaskConical, label: 'Lab Results' },
  { to: '/portal/billing', icon: Receipt, label: 'Billing & Payments' },
  { to: '/portal/insurance', icon: Shield, label: 'Insurance' },
  { to: '/portal/family', icon: Users, label: 'Family Members' },
  { to: '/portal/tracker', icon: LineChart, label: 'Health Tracker' },
  { to: '/portal/timeline', icon: Activity, label: 'Health Timeline' },
  { to: '/portal/notifications', icon: Bell, label: 'Notifications' },
  { to: '/portal/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/portal/documents', icon: FolderOpen, label: 'Documents' },
  { to: '/portal/feedback', icon: Star, label: 'Feedback' },
  { to: '/portal/settings', icon: Settings, label: 'Settings' },
]

export function PatientLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile, user } = useAuthStore()
  const navigate = useNavigate()
  const { data: patient, isLoading } = useMyPatientRecord(user?.id)

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  if (isLoading) return <LoadingSpinner className="min-h-screen" />

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-navy-950/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-navy-950 to-navy-900 text-white transition-transform lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <Heart className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold font-display text-sm">MediFlow</span>
              <p className="text-[10px] text-navy-400">Patient Portal</p>
            </div>
          </div>
          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>

        <nav className="p-3 space-y-0.5 overflow-y-auto h-[calc(100vh-8rem)]">
          {PATIENT_NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-primary-600 text-white' : 'text-navy-300 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-navy-300 hover:bg-white/10 hover:text-white">
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-navy-100">
          {/* Emergency strip */}
          {patient && (
            <div className="bg-primary-600 text-white px-4 py-1.5 text-xs flex flex-wrap gap-x-4 gap-y-1 justify-center">
              <span><strong>Blood:</strong> {patient.blood_group || 'N/A'}</span>
              <span><strong>Allergies:</strong> {patient.allergies?.join(', ') || 'None'}</span>
              <span><strong>Emergency:</strong> {patient.emergency_contact_name || 'N/A'} {patient.emergency_contact_phone}</span>
            </div>
          )}
          <div className="h-14 flex items-center justify-between px-4 sm:px-6">
            <button className="lg:hidden p-2 rounded-lg hover:bg-navy-50" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              {patient?.portal_status === 'pending' && <Badge variant="warning">Pending Approval</Badge>}
              <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                {profile ? getInitials(profile.full_name) : '?'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-navy-900">{profile?.full_name}</p>
                <p className="text-xs text-navy-500">{patient?.patient_number}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
