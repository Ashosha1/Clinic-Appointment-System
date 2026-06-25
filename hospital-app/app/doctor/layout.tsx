import { RoleGuard } from '@/components/shared/RoleGuard'
import { AppShell } from '@/components/shared/AppShell'

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="doctor">
      <AppShell role="doctor">{children}</AppShell>
    </RoleGuard>
  )
}
