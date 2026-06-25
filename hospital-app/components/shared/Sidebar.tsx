'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'

import type { UserRole } from '@/types/database'
import { NAV_BY_ROLE, ROLE_LABEL } from '@/lib/auth/nav'
import { useLogout } from '@/lib/auth/use-logout'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/shared/Logo'
import { Avatar } from '@/components/shared/Avatar'

interface SidebarProps {
  role: UserRole
  name: string
  email?: string | null
  avatarUrl?: string | null
}

/** Desktop sidebar — role-aware navigation, hidden on mobile. */
export function Sidebar({ role, name, email, avatarUrl }: SidebarProps) {
  const pathname = usePathname()
  const logout = useLogout()
  const items = NAV_BY_ROLE[role]
  const isAdmin = role === 'admin'

  return (
    <aside
      className={cn(
        'hidden h-screen w-[200px] flex-col border-r md:flex',
        isAdmin
          ? 'border-white/10 bg-[#0F1C2E] text-white'
          : 'border-[var(--border)] bg-[var(--bg)]'
      )}
    >
      <div className="px-4 py-5">
        <Logo size={32} withWordmark={!isAdmin} />
        {isAdmin && (
          <span className="ml-2 text-base font-semibold tracking-tight text-white">
            MediConnect
          </span>
        )}
        <p
          className={cn(
            'mt-1 text-xs',
            isAdmin ? 'text-white/50' : 'text-[var(--txt3)]'
          )}
        >
          Your trusted path to care.
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors',
                isAdmin
                  ? active
                    ? 'bg-[var(--p)] font-semibold text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                  : active
                    ? 'bg-[var(--p-light)] font-semibold text-[var(--p)]'
                    : 'text-[var(--txt2)] hover:bg-[var(--bg2)] hover:text-[var(--txt)]'
              )}
            >
              <Icon size={18} className="shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div
        className={cn(
          'border-t p-3',
          isAdmin ? 'border-white/10' : 'border-[var(--border)]'
        )}
      >
        <div className="flex items-center gap-2.5">
          <Avatar name={name} src={avatarUrl} size={36} />
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'truncate text-sm font-medium',
                isAdmin ? 'text-white' : 'text-[var(--txt)]'
              )}
            >
              {name}
            </p>
            <span
              className={cn(
                'inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                isAdmin
                  ? 'bg-white/10 text-white/70'
                  : 'bg-[var(--p3)] text-[var(--p)]'
              )}
            >
              {ROLE_LABEL[role]}
            </span>
          </div>
          <button
            onClick={logout}
            aria-label="Log out"
            title="Log out"
            className={cn(
              'rounded-[var(--radius-sm)] p-2 transition-colors',
              isAdmin
                ? 'text-white/60 hover:bg-white/10 hover:text-white'
                : 'text-[var(--txt3)] hover:bg-[var(--bg2)] hover:text-[var(--txt)]'
            )}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}

/** Mobile bottom navigation — first five destinations as icon tabs. */
export function BottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const items = NAV_BY_ROLE[role].slice(0, 5)
  const isAdmin = role === 'admin'

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex border-t md:hidden',
        isAdmin
          ? 'border-white/10 bg-[#0F1C2E]'
          : 'border-[var(--border)] bg-[var(--bg)]'
      )}
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] transition-colors',
              isAdmin
                ? active
                  ? 'text-white'
                  : 'text-white/60'
                : active
                  ? 'text-[var(--p)]'
                  : 'text-[var(--txt3)]'
            )}
          >
            <Icon size={20} />
            <span className="max-w-full truncate px-1">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
