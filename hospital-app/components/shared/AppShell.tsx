import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getMyNotifications } from '@/lib/actions/notifications'
import type { UserRole } from '@/types/database'
import { Sidebar, BottomNav } from '@/components/shared/Sidebar'
import { TopBar } from '@/components/shared/TopBar'
import { RouteSkeleton } from '@/components/shared/RoleGuard'

/**
 * Dashboard chrome shared by every role: 200px sidebar + main column
 * (TopBar over a scrollable content area). On mobile the sidebar collapses to
 * a bottom navigation bar. Assumes <RoleGuard> has already validated the role.
 */
export async function AppShell({
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
    .select('full_name, avatar_url')
    .eq('user_id', user.id)
    .maybeSingle()

  const name = profile?.full_name ?? 'there'
  const { items: notifications, unread } = await getMyNotifications()

  return (
    <div className="grid min-h-screen md:grid-cols-[200px_1fr]">
      <Sidebar role={role} name={name} email={user.email} avatarUrl={profile?.avatar_url} />

      <div className="flex min-h-screen min-w-0 flex-col bg-[var(--bg2)]">
        <TopBar
          name={name}
          role={role}
          email={user.email}
          avatarUrl={profile?.avatar_url}
          notifications={notifications}
          unreadCount={unread}
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 sm:px-6 md:pb-6">
          <Suspense fallback={<RouteSkeleton />}>{children}</Suspense>
        </main>
      </div>

      <BottomNav role={role} />
    </div>
  )
}
