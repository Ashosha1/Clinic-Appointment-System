'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { dateKey } from '@/lib/scheduling/time'
import { DAY_SHORT } from '@/types/scheduling'

export { dateKey }

interface CalendarProps {
  /** Currently selected date (local). */
  selected?: Date | null
  onSelect: (date: Date) => void
  /** Dates that should render as disabled. */
  isDisabled?: (date: Date) => boolean
  /** Dates to highlight (e.g. already blocked). Keyed by local YYYY-MM-DD. */
  highlighted?: Set<string>
  /** Tailwind classes for highlighted cells. Defaults to a red (blocked) look. */
  highlightClassName?: string
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function isSameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b)
}

/** Minimal month-grid date picker (no external dependency). */
export function Calendar({
  selected,
  onSelect,
  isDisabled,
  highlighted,
  highlightClassName = 'bg-[var(--red-light)] text-[var(--red)]',
}: CalendarProps) {
  const [view, setView] = useState(() => startOfMonth(selected ?? new Date()))
  const today = new Date()

  const firstWeekday = view.getDay() // 0 = Sunday
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(view.getFullYear(), view.getMonth(), day))
  }

  const monthLabel = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="w-full select-none">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          className="rounded-[var(--radius-sm)] p-1.5 text-[var(--txt3)] transition-colors hover:bg-[var(--bg2)] hover:text-[var(--txt)]"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-[var(--txt)]">{monthLabel}</span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          className="rounded-[var(--radius-sm)] p-1.5 text-[var(--txt3)] transition-colors hover:bg-[var(--bg2)] hover:text-[var(--txt)]"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {DAY_SHORT.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[11px] font-medium text-[var(--txt3)]"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} />
          const disabled = isDisabled?.(date) ?? false
          const isSelected = selected ? isSameDay(date, selected) : false
          const isToday = isSameDay(date, today)
          const isHighlighted = highlighted?.has(dateKey(date)) ?? false

          return (
            <button
              key={dateKey(date)}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(date)}
              className={cn(
                'flex h-9 items-center justify-center rounded-[var(--radius-sm)] text-sm transition-colors',
                disabled && 'cursor-not-allowed text-[var(--txt3)] opacity-40',
                !disabled && !isSelected && 'text-[var(--txt)] hover:bg-[var(--bg2)]',
                isSelected && 'bg-[var(--p)] font-medium text-white',
                !isSelected && isHighlighted && highlightClassName,
                !isSelected && isToday && !isHighlighted && 'font-semibold text-[var(--p)]'
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
