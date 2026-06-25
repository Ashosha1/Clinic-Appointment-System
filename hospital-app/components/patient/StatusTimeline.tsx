import { Check, X } from 'lucide-react'

import type { AppointmentStatus } from '@/types/database'
import { cn } from '@/lib/utils'

const FLOW: { status: AppointmentStatus; label: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'completed', label: 'Completed' },
]

const RANK: Record<AppointmentStatus, number> = {
  pending: 0,
  confirmed: 1,
  completed: 2,
  cancelled: 0,
}

/** Vertical stepper: Pending → Confirmed → Completed. A cancelled appointment
 *  shows reached steps then a red Cancelled node. */
export function StatusTimeline({ status }: { status: AppointmentStatus }) {
  const cancelled = status === 'cancelled'
  const current = RANK[status]

  const nodes = FLOW.map((step, i) => ({
    ...step,
    reached: !cancelled && i <= current,
    isCurrent: !cancelled && i === current,
  }))

  return (
    <ol className="space-y-0">
      {nodes.map((node, i) => (
        <li key={node.status} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-medium',
                node.reached
                  ? 'border-[var(--p)] bg-[var(--p)] text-white'
                  : 'border-[var(--border)] bg-[var(--bg2)] text-[var(--txt3)]'
              )}
            >
              {node.reached ? <Check size={12} /> : i + 1}
            </span>
            {i < FLOW.length - 1 && (
              <span
                className={cn(
                  'my-0.5 h-6 w-0.5 rounded-full',
                  nodes[i + 1].reached ? 'bg-[var(--p)]' : 'bg-[var(--border)]'
                )}
              />
            )}
          </div>
          <span
            className={cn(
              'pt-0.5 text-sm',
              node.reached ? 'font-medium text-[var(--txt)]' : 'text-[var(--txt3)]'
            )}
          >
            {node.label}
          </span>
        </li>
      ))}

      {cancelled && (
        <li className="flex gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--red)] bg-[var(--red)] text-white">
            <X size={12} />
          </span>
          <span className="pt-0.5 text-sm font-medium text-[var(--red)]">Cancelled</span>
        </li>
      )}
    </ol>
  )
}
