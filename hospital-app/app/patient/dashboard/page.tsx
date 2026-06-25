import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, CalendarClock } from 'lucide-react'

import { getCurrentPatient } from '@/lib/auth/current-patient'
import {
  getActiveDoctors,
  getPatientAppointments,
  type PatientAppointment,
} from '@/lib/actions/patient-data'
import { formatTime12h } from '@/lib/scheduling/time'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/shared/StatusPill'

function formatDate(slotDate: string): string {
  return new Date(`${slotDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatFee(fee: number): string {
  return `OMR ${fee.toFixed(3)}`
}

export default async function PatientDashboard() {
  const patient = await getCurrentPatient()
  if (!patient) redirect('/login')

  const [appointments, doctors] = await Promise.all([
    getPatientAppointments(patient.id),
    getActiveDoctors(),
  ])

  const upcoming = appointments
    .filter((a) => a.status === 'pending' || a.status === 'confirmed')
    .sort((a, b) =>
      `${a.slot_date}T${a.start_time}`.localeCompare(`${b.slot_date}T${b.start_time}`)
    )
  const history = appointments
    .filter((a) => a.status === 'completed' || a.status === 'cancelled')
    .sort((a, b) =>
      `${b.slot_date}T${b.start_time}`.localeCompare(`${a.slot_date}T${a.start_time}`)
    )

  const next = upcoming[0] ?? null
  const totalVisits = appointments.filter((a) => a.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="flex flex-col gap-5 rounded-[var(--radius)] bg-[var(--p)] p-6 text-white md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          {next ? (
            <>
              <p className="text-xs uppercase tracking-wide text-white/70">
                Your next appointment
              </p>
              <p className="text-xl font-semibold">{next.doctor.profile.full_name}</p>
              <p className="text-sm text-white/80">
                {formatDate(next.slot_date)} · {formatTime12h(next.start_time)} ·{' '}
                {next.doctor.specialty}
              </p>
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="mt-2 bg-white text-[var(--p)] hover:bg-white/90"
              >
                <Link href={`/patient/appointments/${next.id}`}>View details</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">No upcoming appointments</p>
              <p className="text-sm text-white/80">Book one now to get started.</p>
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="mt-2 bg-white text-[var(--p)] hover:bg-white/90"
              >
                <Link href="/patient/find-doctor">Book now</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <Stat label="Upcoming" value={upcoming.length} />
          <Stat label="Total visits" value={totalVisits} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming list */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--txt)]">Upcoming appointments</h2>
            <Link
              href="/patient/appointments"
              className="text-xs text-[var(--p)] hover:underline"
            >
              View all
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <Empty text="Nothing scheduled yet." />
          ) : (
            <div className="space-y-2.5">
              {upcoming.slice(0, 3).map((a) => (
                <AppointmentRow key={a.id} appt={a} />
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          {/* Find a doctor */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-[var(--txt)]">Find a doctor</h2>
              <Link
                href="/patient/find-doctor"
                className="text-xs text-[var(--p)] hover:underline"
              >
                See all
              </Link>
            </div>
            {doctors.length === 0 ? (
              <Empty text="No doctors available." />
            ) : (
              <div className="space-y-2.5">
                {doctors.slice(0, 3).map((d) => (
                  <Link
                    key={d.id}
                    href={`/patient/book/${d.id}`}
                    className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-3 transition-colors hover:bg-[var(--bg2)]"
                  >
                    <Avatar name={d.name} src={d.avatar_url} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-[var(--txt)]">
                        {d.name}
                      </div>
                      <div className="text-xs text-[var(--txt3)]">
                        {d.specialty} · {formatFee(d.consultation_fee)}
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] text-[var(--p)]">
                      <CalendarClock size={12} />
                      {d.next_slot ? formatDate(d.next_slot.date) : 'Soon'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent history */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-[var(--txt)]">Recent history</h2>
            {history.length === 0 ? (
              <Empty text="No past visits." />
            ) : (
              <div className="space-y-2.5">
                {history.slice(0, 3).map((a) => (
                  <Link
                    key={a.id}
                    href={`/patient/appointments/${a.id}`}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-3 transition-colors hover:bg-[var(--bg2)]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          a.status === 'completed'
                            ? 'h-2 w-2 rounded-full bg-[var(--blue)]'
                            : 'h-2 w-2 rounded-full bg-[var(--red)]'
                        }
                      />
                      <div>
                        <div className="text-sm text-[var(--txt)]">
                          {a.doctor.profile.full_name}
                        </div>
                        <div className="text-xs text-[var(--txt3)]">
                          {formatDate(a.slot_date)}
                        </div>
                      </div>
                    </div>
                    <StatusPill status={a.status} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-white/10 px-4 py-3 text-center">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-[11px] text-white/70">{label}</div>
    </div>
  )
}

function AppointmentRow({ appt }: { appt: PatientAppointment }) {
  return (
    <Link
      href={`/patient/appointments/${appt.id}`}
      className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-3 transition-colors hover:bg-[var(--bg2)]"
    >
      <div className="flex items-center gap-3">
        <Avatar
          name={appt.doctor.profile.full_name}
          src={appt.doctor.profile.avatar_url}
          size={40}
        />
        <div>
          <div className="text-sm font-medium text-[var(--txt)]">
            {appt.doctor.profile.full_name}
          </div>
          <div className="text-xs text-[var(--txt3)]">
            {formatDate(appt.slot_date)} · {formatTime12h(appt.start_time)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusPill status={appt.status} />
        <ArrowRight size={14} className="text-[var(--txt3)]" />
      </div>
    </Link>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-[var(--radius)] border border-dashed border-[var(--border)] py-8 text-center text-sm text-[var(--txt3)]">
      {text}
    </p>
  )
}
