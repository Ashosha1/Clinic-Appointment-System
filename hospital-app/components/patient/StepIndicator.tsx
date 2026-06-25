import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  steps: string[]
  current: number
}

/** Horizontal progress bar with numbered steps for the booking flow. */
export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors',
                  done && 'bg-[var(--p)] text-white',
                  active && 'bg-[var(--p)] text-white',
                  !done && !active && 'bg-[var(--bg3)] text-[var(--txt3)]'
                )}
              >
                {done ? <Check size={14} /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-sm sm:inline',
                  active ? 'font-medium text-[var(--txt)]' : 'text-[var(--txt3)]'
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  'h-0.5 flex-1 rounded-full transition-colors',
                  done ? 'bg-[var(--p)]' : 'bg-[var(--border)]'
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
