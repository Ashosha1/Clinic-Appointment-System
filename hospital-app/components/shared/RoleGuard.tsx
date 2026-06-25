import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { dashboardFor } from '@/lib/auth/roles'
import type { UserRole } from '@/types/database'

/** Full-page loading state — three animated pulse bars. */
export function RouteSkeleton() {
  return (
    <div className="flex min-h-screen flex-col gap-4 p-8" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-1/3 animate-pulse rounded-[var(--radius-sm)] bg-[var(--bg3)]" />
      <div className="h-10 w-2/3 animate-pulse rounded-[var(--radius-sm)] bg-[var(--bg3)]" />
      <div className="h-10 w-1/2 animate-pulse rounded-[var(--radius-sm)] bg-[var(--bg3)]" />
    </div>
  )
}

/**
 * Server-side role gate. Redirects unauthenticated users to /login, profile-less
 * users to /onboarding, and mismatched roles to their own dashboard. Wrap each
 * role layout's content with this.
 */
export async function RoleGuard({
  role,
  children,
}: {
  role: UserRole
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) redirect('/onboarding')
  if (profile.role !== role) redirect(dashboardFor(profile.role))

  return <>{children}</>
}
