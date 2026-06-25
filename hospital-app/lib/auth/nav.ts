import {
  BarChart3,
  Bell,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Clock,
  LayoutDashboard,
  Search,
  Settings,
  Stethoscope,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'

import type { UserRole } from '@/types/database'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  patient: [
    { label: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
    { label: 'Book Appointment', href: '/patient/book', icon: CalendarPlus },
    { label: 'My Appointments', href: '/patient/appointments', icon: CalendarDays },
    { label: 'Find a Doctor', href: '/patient/find-doctor', icon: Search },
    { label: 'History', href: '/patient/history', icon: Clock },
    { label: 'Profile', href: '/patient/profile', icon: User },
  ],
  doctor: [
    { label: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
    { label: 'My Schedule', href: '/doctor/schedule', icon: CalendarDays },
    { label: 'Availability', href: '/doctor/availability', icon: CalendarClock },
    { label: 'Profile', href: '/doctor/profile', icon: User },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Appointments', href: '/admin/appointments', icon: CalendarDays },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Doctors', href: '/admin/doctors', icon: Stethoscope },
    { label: 'Patients', href: '/admin/patients', icon: Users },
    { label: 'Notifications', href: '/admin/notifications', icon: Bell },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ],
}

export const ROLE_LABEL: Record<UserRole, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  admin: 'Admin',
}
