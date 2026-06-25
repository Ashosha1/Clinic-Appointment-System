'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'

import { cn } from '@/lib/utils'
import { markAllNotificationsRead } from '@/lib/actions/notifications'
import {
  describeNotification,
  formatNotificationTime,
  type NotificationItem,
} from '@/lib/notifications/format'

interface NotificationBellProps {
  items: NotificationItem[]
  unread: number
}

export function NotificationBell({ items, unread }: NotificationBellProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  function markRead() {
    if (unread === 0) return
    startTransition(async () => {
      await markAllNotificationsRead()
      router.refresh()
    })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
        className="relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg2)] text-[var(--txt2)] transition-colors hover:text-[var(--txt)]"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--red)] px-1 text-[10px] font-semibold text-white ring-2 ring-[var(--nav-bg)]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
            <span className="text-sm font-semibold text-[var(--txt)]">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markRead}
                disabled={pending}
                className="text-xs font-medium text-[var(--p)] hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--txt3)]">
                No notifications yet.
              </p>
            ) : (
              items.map((n) => {
                const { title, body } = describeNotification(n)
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'border-b border-[var(--border)] px-4 py-3 last:border-b-0',
                      !n.read_at && 'bg-[var(--p3)]/40'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--txt)]">{title}</p>
                      <span className="shrink-0 text-[10px] text-[var(--txt3)]">
                        {formatNotificationTime(n.sent_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--txt2)]">{body}</p>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
