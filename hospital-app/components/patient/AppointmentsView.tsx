'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import type { PatientAppointment } from '@/lib/actions/patient-data'
import { formatTime12h } from '@/lib/scheduling/time'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { StatusPill } from '@/components/shared/StatusPill'
import { AppointmentActions } from '@/components/patient/AppointmentActions'

const PAGE_SIZE = 10

function formatDate(slotDate: string): string {
  return new Date(`${slotDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function Card({ appt }: { appt: PatientAppointment }) {
  const isUpcoming = appt.status === 'pending' || appt.status === 'confirmed'
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
        {isUpcoming ? (
          <AppointmentActions
            appointmentId={appt.id}
            doctorId={appt.doctor_id}
            slotDate={appt.slot_date}
            startTime={appt.start_time}
            status={appt.status}
          />
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={`/patient/book/${appt.doctor_id}`}>Book again</Link>
          </Button>
        )}
      </div>
    </div>
  )
}

export function AppointmentsView({ appointments }: { appointments: PatientAppointment[] }) {
  const [pastPage, setPastPage] = useState(1)

  const { upcoming, past } = useMemo(() => {
    const up = appointments
      .filter((a) => a.status === 'pending' || a.status === 'confirmed')
      .sort((a, b) =>
        `${a.slot_date}T${a.start_time}`.localeCompare(`${b.slot_date}T${b.start_time}`)
      )
    const pa = appointments
      .filter((a) => a.status === 'completed' || a.status === 'cancelled')
      .sort((a, b) =>
        `${b.slot_date}T${b.start_time}`.localeCompare(`${a.slot_date}T${a.start_time}`)
      )
    return { upcoming: up, past: pa }
  }, [appointments])

  const pageCount = Math.max(1, Math.ceil(past.length / PAGE_SIZE))
  const pagedPast = past.slice((pastPage - 1) * PAGE_SIZE, pastPage * PAGE_SIZE)

  return (
    <Tabs
      tabs={[
        { value: 'upcoming', label: `Upcoming (${upcoming.length})` },
        { value: 'past', label: 'Past' },
      ]}
      defaultValue="upcoming"
    >
      {(active) =>
        active === 'upcoming' ? (
          upcoming.length === 0 ? (
            <EmptyState text="No upcoming appointments." />
          ) : (
            <div className="space-y-3">
              {upcoming.map((a) => (
                <Card key={a.id} appt={a} />
              ))}
            </div>
          )
        ) : past.length === 0 ? (
          <EmptyState text="No past appointments." />
        ) : (
          <div className="space-y-3">
            {pagedPast.map((a) => (
              <Card key={a.id} appt={a} />
            ))}
            {pageCount > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pastPage === 1}
                  onClick={() => setPastPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs text-[var(--txt3)]">
                  Page {pastPage} of {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pastPage === pageCount}
                  onClick={() => setPastPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )
      }
    </Tabs>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-[var(--radius)] border border-dashed border-[var(--border)] py-12 text-center text-sm text-[var(--txt3)]">
      {text}
    </p>
  )
}
