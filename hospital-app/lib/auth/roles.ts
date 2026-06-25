import type { UserRole } from '@/types/database'

/** Where each role lands after auth. */
export const ROLE_DASHBOARD: Record<UserRole, string> = {
  patient: '/patient/dashboard',
  doctor: '/doctor/dashboard',
  admin: '/admin/dashboard',
}

export function dashboardFor(role: UserRole): string {
  return ROLE_DASHBOARD[role]
}

/**
 * The role a given pathname requires, or null when the path is not scoped to a
 * single role. Used by both the middleware and <RoleGuard>.
 */
export function requiredRole(pathname: string): UserRole | null {
  if (pathname === '/patient' || pathname.startsWith('/patient/')) return 'patient'
  if (pathname === '/doctor' || pathname.startsWith('/doctor/')) return 'doctor'
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin'
  return null
}
