import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

import { getCurrentPatient } from '@/lib/auth/current-patient'
import { getPatientAppointment } from '@/lib/actions/patient-data'
import { formatTime12h } from '@/lib/scheduling/time'
import { Avatar } from '@/components/shared/Avatar'
import { StatusPill } from '@/components/shared/StatusPill'
import { StatusTimeline } from '@/components/patient/StatusTimeline'
import { AppointmentActions } from '@/components/patient/AppointmentActions'

function formatDate(slotDate: string): string {
  return new Date(`${slotDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatFee(fee: number): string {
  return `OMR ${fee.toFixed(3)}`
}

export default async function AppointmentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const patient = await getCurrentPatient()
  if (!patient) redirect('/login')

  const appt = await getPatientAppointment(patient.id, params.id)
  if (!appt) notFound()

  const doctorName = appt.doctor.profile.full_name
  const shortDate = new Date(`${appt.slot_date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-xs text-[var(--txt3)]">
        <Link href="/patient/dashboard" className="hover:text-[var(--txt)]">
          Dashboard
        </Link>
        <ChevronRight size={12} />
        <Link href="/patient/appointments" className="hover:text-[var(--txt)]">
          My Appointments
        </Link>
        <ChevronRight size={12} />
        <span className="text-[var(--txt2)]">
          {doctorName}, {shortDate}
        </span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        <div className="space-y-5 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={doctorName} src={appt.doctor.profile.avatar_url} size={52} />
              <div>
                <div className="text-[15px] font-medium text-[var(--txt)]">{doctorName}</div>
                <div className="text-xs text-[var(--txt3)]">{appt.doctor.specialty}</div>
              </div>
            </div>
            <StatusPill status={appt.status} />
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <Detail label="Date" value={formatDate(appt.slot_date)} />
            <Detail
              label="Time"
              value={`${formatTime12h(appt.start_time)} – ${formatTime12h(appt.end_time)}`}
            />
            <Detail label="Fee" value={formatFee(appt.doctor.consultation_fee)} />
          </dl>

          {appt.notes && (
            <div>
              <div className="text-xs text-[var(--txt3)]">Notes</div>
              <p className="mt-1 text-sm text-[var(--txt2)]">{appt.notes}</p>
            </div>
          )}

          <AppointmentActions
            appointmentId={appt.id}
            doctorId={appt.doctor_id}
            slotDate={appt.slot_date}
            startTime={appt.start_time}
            status={appt.status}
            size="default"
          />
        </div>

        <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-5">
          <h2 className="mb-4 text-sm font-medium text-[var(--txt)]">Status</h2>
          <StatusTimeline status={appt.status} />
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--txt3)]">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-[var(--txt)]">{value}</dd>
    </div>
  )
}
