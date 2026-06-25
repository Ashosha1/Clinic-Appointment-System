import { RoleGuard } from '@/components/shared/RoleGuard'
import { AppShell } from '@/components/shared/AppShell'

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="patient">
      <AppShell role="patient">{children}</AppShell>
    </RoleGuard>
  )
}
