import { Bell } from 'lucide-react'

import { getAllNotifications } from '@/lib/actions/notifications'
import {
  describeNotification,
  formatNotificationTime,
} from '@/lib/notifications/format'

export const dynamic = 'force-dynamic'

const ROLE_LABEL: Record<string, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  admin: 'Admin',
}

export default async function AdminNotificationsPage() {
  const rows = await getAllNotifications()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--txt)]">Notifications</h2>
        <p className="text-sm text-[var(--txt2)]">
          System-wide activity feed — every notification sent to patients and doctors.
        </p>
      </div>

      <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] shadow-card">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <Bell size={28} className="text-[var(--txt3)]" />
            <p className="text-sm text-[var(--txt3)]">No notifications have been sent yet.</p>
          </div>
        ) : (
          <ul>
            {rows.map((n) => {
              const { title, body } = describeNotification(n)
              return (
                <li
                  key={n.id}
                  className="flex items-start gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--p3)] text-[var(--p)]">
                    <Bell size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--txt)]">{title}</p>
                      <span className="shrink-0 text-[11px] text-[var(--txt3)]">
                        {formatNotificationTime(n.sent_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--txt2)]">{body}</p>
                    <p className="mt-1 text-[11px] text-[var(--txt3)]">
                      To {n.recipientName}
                      {n.recipientRole ? ` · ${ROLE_LABEL[n.recipientRole] ?? n.recipientRole}` : ''}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
