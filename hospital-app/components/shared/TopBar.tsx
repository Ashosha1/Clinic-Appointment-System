'use client'

import { useEffect, useState } from 'react'

import type { UserRole } from '@/types/database'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { UserMenu } from '@/components/shared/UserMenu'
import { NotificationBell } from '@/components/shared/NotificationBell'
import type { NotificationItem } from '@/lib/notifications/format'

interface TopBarProps {
  name: string
  role: UserRole
  email?: string | null
  avatarUrl?: string | null
  notifications?: NotificationItem[]
  unreadCount?: number
}

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function TopBar({
  name,
  role,
  email,
  avatarUrl,
  notifications = [],
  unreadCount = 0,
}: TopBarProps) {
  // Compute the greeting after mount so it reflects the user's local time
  // without causing a hydration mismatch.
  const [hour, setHour] = useState<number | null>(null)
  useEffect(() => setHour(new Date().getHours()), [])

  const firstName = name.trim().split(/\s+/)[0] || name

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--nav-bg)] px-4 backdrop-blur sm:px-6">
      <h1 className="truncate text-base font-semibold text-[var(--txt)] sm:text-lg">
        {hour === null ? `Hello, ${firstName}` : `${greeting(hour)}, ${firstName}`}
      </h1>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <NotificationBell items={notifications} unread={unreadCount} />

        <UserMenu name={name} role={role} email={email} avatarUrl={avatarUrl} />
      </div>
    </header>
  )
}
