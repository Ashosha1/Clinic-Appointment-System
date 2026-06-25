'use client'

import { useMemo, useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, TriangleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { getWeekSchedule } from '@/lib/actions/schedule'
import { addDays, formatTime12h, mondayOf, parseTimeToMinutes } from '@/lib/scheduling/time'
import { DAY_SHORT, type DaySchedule, type ScheduleSlot } from '@/types/scheduling'

interface ScheduleViewProps {
  doctorId: string
  isActive: boolean
  initialWeekStart: string // YYYY-MM-DD (Monday)
  initialWeek: DaySchedule[]
}

function parseLocal(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const STATUS_STYLES: Record<ScheduleSlot['status'], string> = {
  available: 'bg-[var(--p-light)] border border-[var(--p)] text-[var(--p)]',
  booked: 'bg-[var(--blue-light)] text-[var(--blue)]',
  completed: 'bg-[var(--green-light)] text-[var(--green)]',
  cancelled: 'bg-[var(--red-light)] text-[var(--red)] line-through',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function ScheduleView({
  doctorId,
  isActive,
  initialWeekStart,
  initialWeek,
}: ScheduleViewProps) {
  const [weekStart, setWeekStart] = useState(() => parseLocal(initialWeekStart))
  const [week, setWeek] = useState(initialWeek)
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useState<{ day: DaySchedule; slot: ScheduleSlot } | null>(
    null
  )
  const [mobileDay, setMobileDay] = useState(0)

  function loadWeek(start: Date) {
    setWeekStart(start)
    startTransition(async () => {
      const data = await getWeekSchedule(doctorId, start)
      setWeek(data)
    })
  }

  // Union of all slot start times across the week → grid rows.
  const rowTimes = useMemo(() => {
    const set = new Set<string>()
    for (const day of week) for (const s of day.slots) set.add(s.start_time)
    return [...set].sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b))
  }, [week])

  const weekLabel = `${weekStart.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${addDays(weekStart, 6).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`

  function onSlotClick(day: DaySchedule, slot: ScheduleSlot) {
    if (slot.appointment) setSelected({ day, slot })
  }

  function SlotCell({ day, slot }: { day: DaySchedule; slot: ScheduleSlot }) {
    return (
      <button
        type="button"
        onClick={() => onSlotClick(day, slot)}
        disabled={!slot.appointment}
        className={cn(
          'w-full rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs transition-opacity',
          STATUS_STYLES[slot.status],
          slot.appointment ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
        )}
      >
        <div className="font-medium">{formatTime12h(slot.start_time)}</div>
        {slot.appointment ? (
          <div className="truncate opacity-90">{slot.appointment.patient_name}</div>
        ) : (
          <div className="opacity-70">Available</div>
        )}
      </button>
    )
  }

  return (
    <div className="space-y-4">
      {!isActive && (
        <div className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--red)] bg-[var(--red-light)] px-4 py-3 text-sm text-[var(--red)]">
          <TriangleAlert size={16} />
          <span>
            You’re not accepting new bookings. Patients can’t request appointments until you turn
            this back on in your profile.
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous week"
            onClick={() => loadWeek(addDays(weekStart, -7))}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next week"
            onClick={() => loadWeek(addDays(weekStart, 7))}
          >
            <ChevronRight size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => loadWeek(mondayOf(new Date()))}>
            Today
          </Button>
        </div>
        <span className={cn('text-sm font-medium text-[var(--txt)]', pending && 'opacity-50')}>
          {weekLabel}
        </span>
      </div>

      {/* Desktop week grid */}
      <div className="hidden md:block">
        {rowTimes.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)]">
            <div className="grid grid-cols-7 border-b border-[var(--border)]">
              {week.map((day) => (
                <div
                  key={day.date}
                  className="border-r border-[var(--border)] px-2 py-2 text-center last:border-r-0"
                >
                  <div className="text-xs font-medium text-[var(--txt)]">
                    {DAY_SHORT[day.day_of_week]}
                  </div>
                  <div className="text-[11px] text-[var(--txt3)]">
                    {parseLocal(day.date).getDate()}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={cn(
                    'min-h-24 space-y-1 border-r border-[var(--border)] p-1.5 last:border-r-0',
                    day.is_blocked && 'bg-[var(--bg2)]'
                  )}
                >
                  {day.is_blocked ? (
                    <div className="px-1 py-2 text-center text-[11px] text-[var(--txt3)] line-through">
                      Blocked{day.block_reason ? ` · ${day.block_reason}` : ''}
                    </div>
                  ) : day.slots.length === 0 ? (
                    <div className="px-1 py-2 text-center text-[11px] text-[var(--txt3)]">—</div>
                  ) : (
                    day.slots.map((slot) => (
                      <SlotCell key={slot.start_time} day={day} slot={slot} />
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile single-day list */}
      <div className="md:hidden">
        <div className="mb-3 flex gap-1 overflow-x-auto">
          {week.map((day, i) => (
            <button
              key={day.date}
              type="button"
              onClick={() => setMobileDay(i)}
              className={cn(
                'flex min-w-12 flex-col items-center rounded-[var(--radius-sm)] px-2 py-1.5 text-xs',
                i === mobileDay
                  ? 'bg-[var(--p)] text-white'
                  : 'bg-[var(--bg2)] text-[var(--txt2)]'
              )}
            >
              <span className="font-medium">{DAY_SHORT[day.day_of_week]}</span>
              <span>{parseLocal(day.date).getDate()}</span>
            </button>
          ))}
        </div>
        {week[mobileDay] && (
          <MobileDay day={week[mobileDay]} onSlotClick={onSlotClick} SlotCell={SlotCell} />
        )}
      </div>

      <Legend />

      <Sheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="Appointment"
      >
        {selected?.slot.appointment && (
          <div className="space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-[var(--txt3)]">
                Patient
              </div>
              <div className="text-sm font-medium text-[var(--txt)]">
                {selected.slot.appointment.patient_name}
              </div>
              {selected.slot.appointment.patient_phone && (
                <div className="text-xs text-[var(--txt2)]">
                  {selected.slot.appointment.patient_phone}
                </div>
              )}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-[var(--txt3)]">Time</div>
              <div className="text-sm text-[var(--txt)]">
                {formatTime12h(selected.slot.start_time)} – {formatTime12h(selected.slot.end_time)}
              </div>
              <div className="text-xs text-[var(--txt2)]">
                {parseLocal(selected.day.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-[var(--txt3)]">Status</div>
              <span
                className={cn(
                  'mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-medium',
                  STATUS_STYLES[selected.slot.status]
                )}
              >
                {STATUS_LABEL[selected.slot.appointment.status]}
              </span>
            </div>
            {selected.slot.appointment.notes && (
              <div>
                <div className="text-[11px] uppercase tracking-wide text-[var(--txt3)]">Notes</div>
                <p className="text-sm text-[var(--txt2)]">{selected.slot.appointment.notes}</p>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  )
}

function MobileDay({
  day,
  SlotCell,
}: {
  day: DaySchedule
  onSlotClick: (day: DaySchedule, slot: ScheduleSlot) => void
  SlotCell: (props: { day: DaySchedule; slot: ScheduleSlot }) => React.ReactNode
}) {
  if (day.is_blocked) {
    return (
      <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--bg2)] p-4 text-center text-sm text-[var(--txt3)]">
        Blocked{day.block_reason ? ` · ${day.block_reason}` : ''}
      </div>
    )
  }
  if (day.slots.length === 0) return <EmptyState />
  return (
    <div className="space-y-2">
      {day.slots.map((slot) => (
        <SlotCell key={slot.start_time} day={day} slot={slot} />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--txt3)]">
      No availability set yet. Set your weekly schedule to start accepting bookings.
    </div>
  )
}

function Legend() {
  const items: { label: string; cls: string }[] = [
    { label: 'Available', cls: STATUS_STYLES.available },
    { label: 'Booked', cls: STATUS_STYLES.booked },
    { label: 'Completed', cls: STATUS_STYLES.completed },
    { label: 'Cancelled', cls: STATUS_STYLES.cancelled },
  ]
  return (
    <div className="flex flex-wrap gap-3 text-xs text-[var(--txt3)]">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className={cn('h-3 w-3 rounded-sm', i.cls)} />
          {i.label}
        </span>
      ))}
    </div>
  )
}
