'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Clock } from 'lucide-react'

import type { PatientAppointment } from '@/lib/actions/patient-data'
import { formatTime12h } from '@/lib/scheduling/time'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/shared/StatusPill'
import { EmptyState } from '@/components/shared/EmptyState'

const PAGE_SIZE = 10

function formatDate(slotDate: string): string {
  return new Date(`${slotDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function HistoryRow({ appt }: { appt: PatientAppointment }) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href={`/patient/appointments/${appt.id}`}
        className="flex min-w-0 items-center gap-3"
      >
        <Avatar
          name={appt.doctor.profile.full_name}
          src={appt.doctor.profile.avatar_url}
          size={44}
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-[var(--txt)]">
            {appt.doctor.profile.full_name}
          </div>
          <div className="text-xs text-[var(--txt3)]">{appt.doctor.specialty}</div>
          <div className="mt-0.5 text-xs text-[var(--txt2)]">
            {formatDate(appt.slot_date)} · {formatTime12h(appt.start_time)}
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
        <StatusPill status={appt.status} />
        <Button asChild variant="outline" size="sm">
          <Link href={`/patient/book/${appt.doctor_id}`}>Book again</Link>
        </Button>
      </div>
    </div>
  )
}

/** Read-only list of a patient's completed and cancelled visits, paginated. */
export function PatientHistory({
  appointments,
}: {
  appointments: PatientAppointment[]
}) {
  const [page, setPage] = useState(1)

  const past = useMemo(
    () =>
      appointments
        .filter((a) => a.status === 'completed' || a.status === 'cancelled')
        .sort((a, b) =>
          `${b.slot_date}T${b.start_time}`.localeCompare(
            `${a.slot_date}T${a.start_time}`
          )
        ),
    [appointments]
  )

  if (past.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No past visits yet"
        description="Your completed and cancelled appointments will appear here once you've had a visit."
        action={{ label: 'Book an appointment', href: '/patient/book' }}
      />
    )
  }

  const pageCount = Math.max(1, Math.ceil(past.length / PAGE_SIZE))
  const paged = past.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-3">
      {paged.map((a) => (
        <HistoryRow key={a.id} appt={a} />
      ))}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-[var(--txt3)]">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === pageCount}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
