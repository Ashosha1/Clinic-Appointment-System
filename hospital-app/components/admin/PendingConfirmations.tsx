'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { formatTime12h } from '@/lib/scheduling/time'
import { confirmAppointment } from '@/lib/actions/admin'
import type { AdminAppointmentRow } from '@/lib/actions/admin-data'

function formatDate(slotDate: string): string {
  const d = new Date(`${slotDate}T00:00:00`)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Quick-action list of pending appointments with an inline Confirm button. */
export function PendingConfirmations({ items }: { items: AdminAppointmentRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  function handleConfirm(row: AdminAppointmentRow) {
    setBusyId(row.id)
    startTransition(async () => {
      const res = await confirmAppointment(row.id)
      if (res.error) {
        toast({ variant: 'destructive', title: 'Could not confirm', description: res.error })
      } else {
        toast({ variant: 'success', title: 'Confirmed', description: row.patient_name })
        router.refresh()
      }
      setBusyId(null)
    })
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-card">
      <h3 className="text-sm font-semibold text-[var(--txt)]">Pending confirmations</h3>
      <p className="mt-0.5 text-xs text-[var(--txt3)]">Needs your action</p>

      {items.length === 0 ? (
        <p className="mt-4 text-xs text-[var(--txt3)]">All caught up — nothing pending.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--txt)]">
                  {row.patient_name}
                </p>
                <p className="truncate text-xs text-[var(--txt3)]">
                  {row.doctor_name} · {formatDate(row.slot_date)} {formatTime12h(row.start_time)}
                </p>
              </div>
              <Button
                size="sm"
                disabled={pending && busyId === row.id}
                onClick={() => handleConfirm(row)}
                className="h-8 shrink-0 bg-[var(--green)] px-3 text-white hover:opacity-90"
              >
                {pending && busyId === row.id ? '…' : 'Confirm'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
