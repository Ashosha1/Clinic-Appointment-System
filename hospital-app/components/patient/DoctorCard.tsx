import Link from 'next/link'
import { CalendarClock } from 'lucide-react'

import type { DoctorListing } from '@/lib/actions/patient-data'
import { formatTime12h } from '@/lib/scheduling/time'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'

function formatFee(fee: number): string {
  return `OMR ${fee.toFixed(3)}`
}

function nextSlotLabel(slot: DoctorListing['next_slot']): string {
  if (!slot) return 'No availability soon'
  const date = new Date(`${slot.date}T${slot.start_time}`)
  const day = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return `${day} · ${formatTime12h(slot.start_time)}`
}

export function DoctorCard({ doctor }: { doctor: DoctorListing }) {
  return (
    <div className="flex flex-col rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-5">
      <div className="flex items-start gap-3">
        <Avatar name={doctor.name} src={doctor.avatar_url} size={48} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-medium text-[var(--txt)]">
            {doctor.name}
          </div>
          <div className="text-xs text-[var(--txt3)]">{doctor.specialty}</div>
          <div className="mt-0.5 text-xs font-medium text-[var(--txt2)]">
            {formatFee(doctor.consultation_fee)}
          </div>
        </div>
      </div>

      {doctor.bio && (
        <p className="mt-3 line-clamp-2 text-xs text-[var(--txt3)]">{doctor.bio}</p>
      )}

      <div className="mt-3 flex items-center gap-1.5">
        <span
          className="inline-flex items-center gap-1 rounded-full bg-[var(--p3)] px-2 py-0.5 text-[11px] font-medium text-[var(--p)]"
        >
          <CalendarClock size={12} />
          {nextSlotLabel(doctor.next_slot)}
        </span>
      </div>

      <div className="mt-4">
        <Button asChild className="w-full" disabled={!doctor.next_slot}>
          <Link href={`/patient/book/${doctor.id}`}>Book now</Link>
        </Button>
      </div>
    </div>
  )
}
