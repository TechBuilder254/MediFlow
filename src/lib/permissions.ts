import type { UserRole } from '@/types'

export type AppRoute =
  | '/dashboard'
  | '/portal'
  | '/patients'
  | '/doctors'
  | '/appointments'
  | '/consultation'
  | '/queue'
  | '/reception'
  | '/assessments'
  | '/admissions'
  | '/laboratory'
  | '/pharmacy'
  | '/inventory'
  | '/billing'
  | '/reports'
  | '/users'
  | '/audit-logs'
  | '/settings'
  | '/departments'

/** Which roles can access each route */
export const ROUTE_PERMISSIONS: Record<AppRoute, UserRole[]> = {
  '/dashboard': ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'cashier'],
  '/portal': ['patient'],
  '/patients': ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist'],
  '/doctors': ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist'],
  '/appointments': ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist'],
  '/consultation': ['super_admin', 'admin', 'doctor'],
  '/queue': ['super_admin', 'admin', 'receptionist', 'nurse'],
  '/reception': ['super_admin', 'admin', 'receptionist'],
  '/assessments': ['super_admin', 'admin', 'nurse'],
  '/admissions': ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist'],
  '/laboratory': ['super_admin', 'admin', 'doctor', 'lab_technician'],
  '/pharmacy': ['super_admin', 'admin', 'doctor', 'pharmacist'],
  '/inventory': ['super_admin', 'admin', 'pharmacist'],
  '/billing': ['super_admin', 'admin', 'receptionist', 'cashier'],
  '/reports': ['super_admin', 'admin', 'doctor'],
  '/users': ['super_admin', 'admin'],
  '/audit-logs': ['super_admin', 'admin'],
  '/settings': ['super_admin', 'admin'],
  '/departments': ['super_admin', 'admin'],
}

export const STAFF_ROLES: UserRole[] = [
  'super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'cashier',
]

export function canAccessRoute(role: UserRole | undefined, route: AppRoute): boolean {
  if (!role) return false
  return ROUTE_PERMISSIONS[route]?.includes(role) ?? false
}

export function getDefaultRoute(role: UserRole | undefined): string {
  if (role === 'patient') return '/portal'
  return '/dashboard'
}

const HIDDEN_FROM_NAV: AppRoute[] = ['/portal', '/consultation']

export function getNavRoutes(role: UserRole | undefined): AppRoute[] {
  if (!role) return []
  return (Object.keys(ROUTE_PERMISSIONS) as AppRoute[]).filter(
    (route) => ROUTE_PERMISSIONS[route].includes(role) && !HIDDEN_FROM_NAV.includes(route),
  )
}

export function canApprovePatients(role: UserRole | undefined): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'doctor'
}

/** Only staff who register new patients at the hospital */
export function canRegisterPatient(role: UserRole | undefined): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'doctor' || role === 'receptionist'
}

export function isPatientRole(role: UserRole | undefined): boolean {
  return role === 'patient'
}

export function canManageUsers(role: UserRole | undefined): boolean {
  return role === 'super_admin' || role === 'admin'
}

export function canManageDoctors(role: UserRole | undefined): boolean {
  return role === 'super_admin' || role === 'admin'
}
