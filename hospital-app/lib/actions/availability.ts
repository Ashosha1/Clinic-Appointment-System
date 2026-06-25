'use server'

import { revalidatePath } from 'next/cache'

import { authorizeDoctor, type ActionResult } from './_helpers'
import { countSlots, normalizeTime, parseTimeToMinutes } from '@/lib/scheduling/time'
import type { DayScheduleInput } from '@/types/scheduling'

/**
 * Replaces the doctor's weekly schedule with `slots`. Active days are upserted;
 * days not present (or marked inactive) are removed. Validates that each active
 * day has end > start and a duration that divides the range into whole slots.
 */
export async function saveAvailability(
  doctorId: string,
  slots: DayScheduleInput[]
): Promise<ActionResult> {
  const auth = await authorizeDoctor(doctorId)
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth.ctx

  const active = slots.filter((s) => s.is_active)

  for (const slot of active) {
    const start = parseTimeToMinutes(slot.start_time)
    const end = parseTimeToMinutes(slot.end_time)
    if (end <= start) {
      return { error: `End time must be after start time for ${dayName(slot.day_of_week)}.` }
    }
    const range = end - start
    if (range % slot.slot_duration_minutes !== 0) {
      return {
        error: `On ${dayName(slot.day_of_week)}, ${slot.slot_duration_minutes}-min slots don't fit evenly into the time range.`,
      }
    }
    if (countSlots(slot.start_time, slot.end_time, slot.slot_duration_minutes) < 1) {
      return { error: `The time range on ${dayName(slot.day_of_week)} is too short.` }
    }
  }

  // The table has no unique (doctor_id, day_of_week) constraint, so we replace
  // the whole weekly set: clear the doctor's rows, then insert active days.
  const { error: deleteError } = await supabase
    .from('availability_slots')
    .delete()
    .eq('doctor_id', doctorId)

  if (deleteError) return { error: deleteError.message }

  if (active.length) {
    const rows = active.map((s) => ({
      doctor_id: doctorId,
      day_of_week: s.day_of_week,
      start_time: normalizeTime(s.start_time),
      end_time: normalizeTime(s.end_time),
      slot_duration_minutes: s.slot_duration_minutes,
      is_active: true,
    }))

    const { error: insertError } = await supabase.from('availability_slots').insert(rows)

    if (insertError) return { error: insertError.message }
  }

  revalidatePath('/doctor/availability')
  revalidatePath('/doctor/schedule')
  return { error: null }
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
function dayName(day: number): string {
  return DAY_NAMES[day] ?? `day ${day}`
}
