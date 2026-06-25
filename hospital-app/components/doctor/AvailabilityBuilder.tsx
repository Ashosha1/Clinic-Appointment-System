'use client'

import { useState, useTransition } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { saveAvailability } from '@/lib/actions/availability'
import { countSlots } from '@/lib/scheduling/time'
import {
  DAY_LABELS,
  SLOT_DURATIONS,
  WEEK_ORDER,
  type DayScheduleInput,
} from '@/types/scheduling'

interface AvailabilityBuilderProps {
  doctorId: string
  initial: DayScheduleInput[]
}

const DEFAULT_DAY = (day: number): DayScheduleInput => ({
  day_of_week: day,
  is_active: false,
  start_time: '09:00',
  end_time: '17:00',
  slot_duration_minutes: 30,
})

export function AvailabilityBuilder({ doctorId, initial }: AvailabilityBuilderProps) {
  const [days, setDays] = useState<Record<number, DayScheduleInput>>(() => {
    const map: Record<number, DayScheduleInput> = {}
    for (const d of WEEK_ORDER) map[d] = DEFAULT_DAY(d)
    for (const s of initial) map[s.day_of_week] = { ...map[s.day_of_week], ...s }
    return map
  })
  const [pending, startTransition] = useTransition()

  function update(day: number, patch: Partial<DayScheduleInput>) {
    setDays((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }))
  }

  function onSave() {
    const slots = WEEK_ORDER.map((d) => days[d])
    startTransition(async () => {
      const res = await saveAvailability(doctorId, slots)
      if (res.error) {
        toast({ variant: 'destructive', title: 'Could not save', description: res.error })
      } else {
        toast({ variant: 'success', title: 'Schedule saved' })
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {WEEK_ORDER.map((day) => {
          const d = days[day]
          const slots = countSlots(d.start_time, d.end_time, d.slot_duration_minutes)
          return (
            <div
              key={day}
              className={cn(
                'rounded-[var(--radius)] border p-4 transition-colors',
                d.is_active
                  ? 'border-l-[3px] border-l-[var(--p)] border-[var(--card-border)] bg-[var(--card)]'
                  : 'border-[var(--border)] bg-[var(--bg2)]'
              )}
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <div className="flex w-32 items-center gap-3">
                  <Switch
                    checked={d.is_active}
                    onCheckedChange={(v) => update(day, { is_active: v })}
                    aria-label={`Toggle ${DAY_LABELS[day]}`}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      d.is_active ? 'text-[var(--txt)]' : 'text-[var(--txt3)]'
                    )}
                  >
                    {DAY_LABELS[day]}
                  </span>
                </div>

                {d.is_active ? (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={d.start_time}
                        onChange={(e) => update(day, { start_time: e.target.value })}
                        className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2 text-sm text-[var(--txt)]"
                      />
                      <span className="text-[var(--txt3)]">–</span>
                      <input
                        type="time"
                        value={d.end_time}
                        onChange={(e) => update(day, { end_time: e.target.value })}
                        className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2 text-sm text-[var(--txt)]"
                      />
                    </div>

                    <select
                      value={d.slot_duration_minutes}
                      onChange={(e) =>
                        update(day, { slot_duration_minutes: Number(e.target.value) })
                      }
                      className="h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2 text-sm text-[var(--txt)]"
                    >
                      {SLOT_DURATIONS.map((m) => (
                        <option key={m} value={m}>
                          {m} min
                        </option>
                      ))}
                    </select>

                    <span className="rounded-full bg-[var(--p-light)] px-2.5 py-1 text-xs font-medium text-[var(--p)]">
                      {slots} slot{slots === 1 ? '' : 's'} · {d.slot_duration_minutes} min each
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-[var(--txt3)]">Unavailable</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Button onClick={onSave} disabled={pending} className="w-full">
        {pending ? 'Saving…' : 'Save schedule'}
      </Button>
    </div>
  )
}
