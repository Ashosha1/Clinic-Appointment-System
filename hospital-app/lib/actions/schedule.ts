'use server'

import { createClient } from '@/lib/supabase/server'
import {
  dateKey,
  minutesToTime,
  normalizeTime,
  parseTimeToMinutes,
} from '@/lib/scheduling/time'
import type {
  AppointmentDetail,
  DaySchedule,
  ScheduleSlot,
  ScheduleSlotStatus,
} from '@/types/scheduling'

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/**
 * Builds the doctor's schedule for the 7 days starting at `weekStart` (a local
 * date, expected to be a Monday). Each day lists its generated slots enriched
 * with booking status. Blocked days return an empty slot list with is_blocked.
 */
export async function getWeekSchedule(
  doctorId: string,
  weekStart: Date
): Promise<DaySchedule[]> {
  const supabase = await createClient()

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const rangeStart = dateKey(days[0])
  const rangeEnd = dateKey(days[6])

  const [{ data: windows }, { data: doctor }, { data: blocked }, { data: appts }] =
    await Promise.all([
      supabase
        .from('availability_slots')
        .select('day_of_week, start_time, end_time, slot_duration_minutes')
        .eq('doctor_id', doctorId)
        .eq('is_active', true),
      supabase.from('doctors').select('buffer_minutes').eq('id', doctorId).maybeSingle(),
      supabase
        .from('blocked_dates')
        .select('date, reason')
        .eq('doctor_id', doctorId)
        .gte('date', rangeStart)
        .lte('date', rangeEnd),
      supabase
        .from('appointments')
        .select('id, slot_date, start_time, status, notes, patient:profiles!appointments_patient_id_fkey(full_name, phone)')
        .eq('doctor_id', doctorId)
        .gte('slot_date', rangeStart)
        .lte('slot_date', rangeEnd),
    ])

  const buffer = doctor?.buffer_minutes ?? 0
  const blockedMap = new Map((blocked ?? []).map((b) => [b.date, b.reason]))

  // Index appointments by "date|HH:MM".
  const apptMap = new Map<string, AppointmentDetail & { slot_date: string; start: string }>()
  for (const a of appts ?? []) {
    const patient = Array.isArray(a.patient) ? a.patient[0] : a.patient
    const key = `${a.slot_date}|${normalizeTime(a.start_time)}`
    apptMap.set(key, {
      id: a.id,
      patient_name: patient?.full_name ?? 'Unknown patient',
      patient_phone: patient?.phone ?? null,
      notes: a.notes,
      status: a.status,
      slot_date: a.slot_date,
      start: normalizeTime(a.start_time),
    })
  }

  return days.map((date) => {
    const key = dateKey(date)
    const dayOfWeek = date.getDay()

    if (blockedMap.has(key)) {
      return {
        date: key,
        day_of_week: dayOfWeek,
        is_blocked: true,
        block_reason: blockedMap.get(key) ?? null,
        slots: [],
      }
    }

    const dayWindows = (windows ?? []).filter((w) => w.day_of_week === dayOfWeek)
    const slots: ScheduleSlot[] = []

    for (const w of dayWindows) {
      const windowStart = parseTimeToMinutes(w.start_time)
      const windowEnd = parseTimeToMinutes(w.end_time)
      const duration = w.slot_duration_minutes
      const step = duration + buffer

      for (let t = windowStart; t + duration <= windowEnd; t += step) {
        const start = minutesToTime(t)
        const appt = apptMap.get(`${key}|${start}`)
        let status: ScheduleSlotStatus = 'available'
        if (appt) {
          status =
            appt.status === 'completed'
              ? 'completed'
              : appt.status === 'cancelled'
                ? 'cancelled'
                : 'booked'
        }
        slots.push({
          start_time: start,
          end_time: minutesToTime(t + duration),
          status,
          appointment: appt
            ? {
                id: appt.id,
                patient_name: appt.patient_name,
                patient_phone: appt.patient_phone,
                notes: appt.notes,
                status: appt.status,
              }
            : null,
        })
      }
    }

    slots.sort(
      (a, b) => parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time)
    )

    return {
      date: key,
      day_of_week: dayOfWeek,
      is_blocked: false,
      block_reason: null,
      slots,
    }
  })
}
