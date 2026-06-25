'use server'

import { createClient } from '@/lib/supabase/server'
import {
  dateKey,
  minutesToTime,
  normalizeTime,
  parseTimeToMinutes,
} from '@/lib/scheduling/time'
import type { TimeSlot } from '@/types/scheduling'

/**
 * Generates the bookable time slots for a doctor on a specific date, marking
 * each as booked or free. Returns [] if the doctor has no availability that
 * weekday or the date is blocked. Slots advance by duration + the doctor's
 * buffer; a slot must fully fit before the window's end.
 */
export async function generateSlotsForDate(
  doctorId: string,
  date: Date
): Promise<TimeSlot[]> {
  const supabase = await createClient()
  const dayOfWeek = date.getDay()
  const dateStr = dateKey(date)

  // Blocked? No slots that day.
  const { data: blocked } = await supabase
    .from('blocked_dates')
    .select('id')
    .eq('doctor_id', doctorId)
    .eq('date', dateStr)
    .maybeSingle()
  if (blocked) return []

  const { data: windows } = await supabase
    .from('availability_slots')
    .select('start_time, end_time, slot_duration_minutes, is_active')
    .eq('doctor_id', doctorId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)

  if (!windows || windows.length === 0) return []

  const { data: doctor } = await supabase
    .from('doctors')
    .select('buffer_minutes')
    .eq('id', doctorId)
    .maybeSingle()
  const buffer = doctor?.buffer_minutes ?? 0

  const { data: appts } = await supabase
    .from('appointments')
    .select('start_time, status')
    .eq('doctor_id', doctorId)
    .eq('slot_date', dateStr)
    .in('status', ['pending', 'confirmed'])

  const bookedStarts = new Set(
    (appts ?? []).map((a) => normalizeTime(a.start_time))
  )

  const slots: TimeSlot[] = []
  for (const w of windows) {
    const windowStart = parseTimeToMinutes(w.start_time)
    const windowEnd = parseTimeToMinutes(w.end_time)
    const duration = w.slot_duration_minutes
    const step = duration + buffer

    for (let t = windowStart; t + duration <= windowEnd; t += step) {
      const start = minutesToTime(t)
      slots.push({
        start_time: start,
        end_time: minutesToTime(t + duration),
        is_booked: bookedStarts.has(start),
      })
    }
  }

  slots.sort((a, b) => parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time))
  return slots
}
