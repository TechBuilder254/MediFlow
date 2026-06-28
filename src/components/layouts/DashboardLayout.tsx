import { NavLink, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Stethoscope, Calendar, BedDouble,
  FlaskConical, Pill, Package, Receipt, BarChart3, UserCog,
  Settings, ScrollText, LogOut, Bell, Menu, X, Activity,
  ClipboardList, Heart, Building2, UserCheck,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/hooks/useAuth'
import { signOut } from '@/features/auth/authService'
import { ROLE_LABELS, type UserRole } from '@/types'
import { getInitials } from '@/utils/cn'
import { cn } from '@/utils/cn'
import { getNavRoutes, isPatientRole, type AppRoute } from '@/lib/permissions'
import { LoadingSpinner } from '@/components/ui/EmptyState'

const NAV_CONFIG: Record<AppRoute, { icon: typeof LayoutDashboard; label: string }> = {
  '/dashboard': { icon: LayoutDashboard, label: 'Dashboard' },
  '/portal': { icon: Heart, label: 'My Portal' },
  '/patients': { icon: Users, label: 'Patients' },
  '/doctors': { icon: Stethoscope, label: 'Doctors' },
  '/appointments': { icon: Calendar, label: 'Appointments' },
  '/consultation': { icon: Stethoscope, label: 'Consultation' },
  '/queue': { icon: ClipboardList, label: 'Queue' },
  '/reception': { icon: UserCheck, label: 'Reception' },
  '/assessments': { icon: Heart, label: 'Assessments' },
  '/admissions': { icon: BedDouble, label: 'Admissions' },
  '/laboratory': { icon: FlaskConical, label: 'Laboratory' },
  '/pharmacy': { icon: Pill, label: 'Pharmacy' },
  '/inventory': { icon: Package, label: 'Inventory' },
  '/billing': { icon: Receipt, label: 'Billing' },
  '/reports': { icon: BarChart3, label: 'Reports' },
  '/users': { icon: UserCog, label: 'Users' },
  '/audit-logs': { icon: ScrollText, label: 'Audit Logs' },
  '/settings': { icon: Settings, label: 'Settings' },
  '/departments': { icon: Building2, label: 'Departments' },
}

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile, loading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Hard block: patients may ONLY access /portal — never staff pages
  if (loading) return <LoadingSpinner className="min-h-screen" />

  if (profile && isPatientRole(profile.role) && !location.pathname.startsWith('/portal')) {
    return <Navigate to="/portal" replace />
  }

  if (profile && !isPatientRole(profile.role) && location.pathname.startsWith('/portal')) {
    return <Navigate to="/dashboard" replace />
  }

  const allowedRoutes = getNavRoutes(profile?.role as UserRole | undefined)
  const filteredNav = allowedRoutes.map((route) => ({
    to: route,
    ...NAV_CONFIG[route],
  }))

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-navy-950/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-navy-950 text-white transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
            <span className="font-bold font-display">MediFlow</span>
          </div>
          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {filteredNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-navy-300 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-navy-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-navy-100 flex items-center justify-between px-4 sm:px-6">
          <button className="lg:hidden p-2 rounded-lg hover:bg-navy-50" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            {profile?.role !== 'patient' && (
              <button className="relative p-2 rounded-xl hover:bg-navy-50 text-navy-500">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                {profile ? getInitials(profile.full_name) : '?'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-navy-900">{profile?.full_name}</p>
                <p className="text-xs text-navy-500">{profile ? ROLE_LABELS[profile.role] : ''}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
