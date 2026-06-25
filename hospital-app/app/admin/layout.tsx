import { RoleGuard } from '@/components/shared/RoleGuard'
import { AppShell } from '@/components/shared/AppShell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="admin">
      <AppShell role="admin">{children}</AppShell>
    </RoleGuard>
  )
}
