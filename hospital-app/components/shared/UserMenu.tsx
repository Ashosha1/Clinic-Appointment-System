'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { LogOut, User } from 'lucide-react'

import type { UserRole } from '@/types/database'
import { ROLE_LABEL } from '@/lib/auth/nav'
import { useLogout } from '@/lib/auth/use-logout'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/shared/Avatar'

interface UserMenuProps {
  name: string
  role: UserRole
  email?: string | null
  avatarUrl?: string | null
}

const PROFILE_HREF: Record<UserRole, string | null> = {
  patient: '/patient/profile',
  doctor: '/doctor/profile',
  admin: null,
}

/** Avatar button that opens an account menu with a logout action. */
export function UserMenu({ name, role, email, avatarUrl }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const logout = useLogout()

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const profileHref = PROFILE_HREF[role]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--p)] focus-visible:ring-offset-2"
      >
        <Avatar name={name} src={avatarUrl} size={36} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] shadow-xl"
        >
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="truncate text-sm font-medium text-[var(--txt)]">{name}</p>
            {email && <p className="truncate text-xs text-[var(--txt3)]">{email}</p>}
            <span className="mt-1 inline-block rounded-full bg-[var(--p3)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--p)]">
              {ROLE_LABEL[role]}
            </span>
          </div>

          <div className="p-1">
            {profileHref && (
              <Link
                href={profileHref}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--txt2)] transition-colors hover:bg-[var(--bg2)] hover:text-[var(--txt)]"
              >
                <User size={16} />
                Profile
              </Link>
            )}
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false)
                void logout()
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors',
                'text-[var(--red)] hover:bg-[var(--red-light)]'
              )}
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
