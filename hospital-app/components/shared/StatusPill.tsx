import type { AppointmentStatus } from '@/types/database'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<AppointmentStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-[var(--bg3)] text-[var(--txt2)]',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-[var(--p3)] text-[var(--p)]',
  },
  completed: {
    label: 'Completed',
    className: 'bg-[var(--blue-light)] text-[var(--blue)]',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-[var(--red-light)] text-[var(--red)]',
  },
}

/** Status badge used across appointment cards and detail views. */
export function StatusPill({
  status,
  className,
}: {
  status: AppointmentStatus
  className?: string
}) {
  const style = STATUS_STYLE[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
        style.className,
        className
      )}
    >
      {style.label}
    </span>
  )
}
