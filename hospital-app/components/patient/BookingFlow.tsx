'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'

import type { DoctorListing } from '@/lib/actions/patient-data'
import type { TimeSlot } from '@/types/scheduling'
import { generateSlotsForDate } from '@/lib/actions/slots'
import { bookAppointment, cancelAppointment } from '@/lib/actions/bookAppointment'
import { dateKey } from '@/lib/scheduling/time'
import { formatTime12h } from '@/lib/scheduling/time'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/shared/Avatar'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { StepIndicator } from '@/components/patient/StepIndicator'
import { toast } from '@/hooks/use-toast'

const STEPS = ['Pick a date', 'Pick a time', 'Confirm']

interface BookingFlowProps {
  doctor: DoctorListing
  blockedDates: string[]
  activeWeekdays: number[]
  /** When set, a successful booking cancels this prior appointment (reschedule). */
  rescheduleFromId?: string
}

function formatFee(fee: number): string {
  return `OMR ${fee.toFixed(3)}`
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function BookingFlow({
  doctor,
  blockedDates,
  activeWeekdays,
  rescheduleFromId,
}: BookingFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [date, setDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slot, setSlot] = useState<TimeSlot | null>(null)
  const [notes, setNotes] = useState('')
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const blocked = new Set(blockedDates)
  const weekdays = new Set(activeWeekdays)

  const tomorrow = new Date()
  tomorrow.setHours(0, 0, 0, 0)
  tomorrow.setDate(tomorrow.getDate() + 1)

  function isDisabled(d: Date) {
    const day = new Date(d)
    day.setHours(0, 0, 0, 0)
    if (day < tomorrow) return true // no past, no same-day
    if (blocked.has(dateKey(d))) return true
    return !weekdays.has(d.getDay())
  }

  function highlighted(): Set<string> {
    // Mark the bookable days (doctor works, not blocked, future) over a 60-day
    // horizon. Real free-slot availability is confirmed when slots load.
    const set = new Set<string>()
    const cursor = new Date(tomorrow)
    for (let i = 0; i < 60; i++) {
      if (!isDisabled(cursor)) set.add(dateKey(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    return set
  }

  async function goToSlots() {
    if (!date) return
    setLoadingSlots(true)
    setStep(1)
    const result = await generateSlotsForDate(doctor.id, date)
    setSlots(result)
    setLoadingSlots(false)
  }

  function confirmBooking() {
    if (!date || !slot) return
    setInlineError(null)
    startTransition(async () => {
      const res = await bookAppointment({
        doctorId: doctor.id,
        slotDate: dateKey(date),
        startTime: slot.start_time,
        endTime: slot.end_time,
        notes,
      })
      if (!res.success) {
        if (res.slotTaken) {
          setInlineError(res.error)
          // Refresh slots so the taken one shows as unavailable.
          const refreshed = await generateSlotsForDate(doctor.id, date)
          setSlots(refreshed)
          setSlot(null)
          setStep(1)
        } else {
          setInlineError(res.error)
        }
        return
      }
      if (rescheduleFromId) {
        await cancelAppointment(rescheduleFromId)
      }
      toast({ variant: 'success', title: 'Appointment booked' })
      router.push(`/patient/appointments/${res.id}`)
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Avatar name={doctor.name} src={doctor.avatar_url} size={44} />
        <div>
          <div className="text-[15px] font-medium text-[var(--txt)]">{doctor.name}</div>
          <div className="text-xs text-[var(--txt3)]">
            {doctor.specialty} · {formatFee(doctor.consultation_fee)}
          </div>
        </div>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-5">
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-sm font-medium text-[var(--txt)]">Pick a date</h2>
            <Calendar
              selected={date}
              onSelect={(d) => setDate(d)}
              isDisabled={isDisabled}
              highlighted={highlighted()}
              highlightClassName="bg-[var(--p3)] text-[var(--p)]"
            />
            <div className="flex justify-end">
              <Button onClick={goToSlots} disabled={!date}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-sm font-medium text-[var(--txt)]">
              Pick a time{date && ` · ${formatLongDate(date)}`}
            </h2>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-10 text-[var(--txt3)]">
                <Loader2 className="animate-spin" size={20} />
              </div>
            ) : slots.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--txt3)]">
                No availability on this date. Please choose another day.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slots.map((s) => {
                  const selected = slot?.start_time === s.start_time
                  return (
                    <button
                      key={s.start_time}
                      type="button"
                      disabled={s.is_booked}
                      onClick={() => setSlot(s)}
                      className={cn(
                        'rounded-[var(--radius-sm)] border px-3 py-2 text-sm transition-colors',
                        s.is_booked &&
                          'cursor-not-allowed border-[var(--border)] bg-[var(--bg2)] text-[var(--txt3)]',
                        !s.is_booked &&
                          !selected &&
                          'border-[var(--p)] bg-[var(--p3)] text-[var(--p4)] hover:bg-[var(--p-light)]',
                        selected && 'border-[var(--p)] bg-[var(--p)] text-white'
                      )}
                    >
                      {formatTime12h(s.start_time)}
                      {s.is_booked && <span className="ml-1 text-[10px]">· Taken</span>}
                    </button>
                  )
                })}
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={() => setStep(2)} disabled={!slot}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && date && slot && (
          <div className="space-y-5">
            <h2 className="text-sm font-medium text-[var(--txt)]">Confirm booking</h2>
            <dl className="space-y-2.5 rounded-[var(--radius-sm)] bg-[var(--bg2)] p-4 text-sm">
              <Row label="Doctor" value={`${doctor.name} · ${doctor.specialty}`} />
              <Row label="Date" value={formatLongDate(date)} />
              <Row
                label="Time"
                value={`${formatTime12h(slot.start_time)} – ${formatTime12h(slot.end_time)}`}
              />
              <Row label="Fee" value={formatFee(doctor.consultation_fee)} />
            </dl>

            <div className="space-y-1.5">
              <label className="text-sm text-[var(--txt2)]">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Reason for visit or any notes for the doctor"
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--txt)] outline-none focus:border-[var(--p)] focus:ring-1 focus:ring-[var(--p)]"
              />
            </div>

            {inlineError && (
              <p className="rounded-[var(--radius-sm)] bg-[var(--red-light)] px-3 py-2 text-sm text-[var(--red)]">
                {inlineError}
              </p>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} disabled={pending}>
                Back
              </Button>
              <Button onClick={confirmBooking} disabled={pending}>
                {pending ? 'Booking…' : 'Confirm booking'}
              </Button>
            </div>
          </div>
        )}

        {step === 1 && inlineError && (
          <p className="mt-3 rounded-[var(--radius-sm)] bg-[var(--red-light)] px-3 py-2 text-sm text-[var(--red)]">
            {inlineError}
          </p>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[var(--txt3)]">{label}</dt>
      <dd className="text-right font-medium text-[var(--txt)]">{value}</dd>
    </div>
  )
}
