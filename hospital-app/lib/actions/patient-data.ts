import { createClient } from '@/lib/supabase/server'
import {
  addDays,
  dateKey,
  minutesToTime,
  normalizeTime,
  parseTimeToMinutes,
} from '@/lib/scheduling/time'
import type {
  Appointment,
  Doctor,
  Profile,
} from '@/types/database'

const HORIZON_DAYS = 30
const EMPTY_SET: ReadonlySet<string> = new Set()

export interface NextSlot {
  date: string
  start_time: string
  end_time: string
}

export interface DoctorListing {
  id: string
  specialty: string
  bio: string | null
  consultation_fee: number
  name: string
  avatar_url: string | null
  next_slot: NextSlot | null
}

export interface PatientAppointment extends Appointment {
  doctor: {
    id: string
    specialty: string
    consultation_fee: number
    profile: { full_name: string; avatar_url: string | null }
  }
}

interface Window {
  start: number
  end: number
  duration: number
}

interface SlotSource {
  /** Availability windows keyed by JS day_of_week (0=Sun). Windows are sorted. */
  windowsByDay: Map<number, Window[]>
  buffer: number
  /** Blocked dates as YYYY-MM-DD. */
  blocked: Set<string>
  /** Booked start times (HH:MM) keyed by YYYY-MM-DD. */
  bookedByDate: Map<string, Set<string>>
}

/** First free slot for one doctor, computed purely in memory from prefetched
 *  availability/blocked/booked data — no per-day database round-trips. */
function firstFreeSlot(src: SlotSource, horizonDays = HORIZON_DAYS): NextSlot | null {
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  for (let i = 1; i <= horizonDays; i++) {
    const day = addDays(base, i)
    const key = dateKey(day)
    if (src.blocked.has(key)) continue
    const windows = src.windowsByDay.get(day.getDay())
    if (!windows || windows.length === 0) continue
    const booked = src.bookedByDate.get(key) ?? EMPTY_SET
    for (const w of windows) {
      const step = w.duration + src.buffer
      for (let t = w.start; t + w.duration <= w.end; t += step) {
        const startStr = minutesToTime(t)
        if (!booked.has(startStr)) {
          return { date: key, start_time: startStr, end_time: minutesToTime(t + w.duration) }
        }
      }
    }
  }
  return null
}

/**
 * Batch-loads everything needed to compute next-available slots for the given
 * doctors: their buffers, active availability windows, blocked dates, and
 * booked appointments across the horizon — four queries total, regardless of
 * how many doctors or days are involved.
 */
async function loadSlotSources(doctorIds: string[]): Promise<Map<string, SlotSource>> {
  const map = new Map<string, SlotSource>()
  if (doctorIds.length === 0) return map

  const supabase = await createClient()
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  const startKey = dateKey(addDays(base, 1))
  const endKey = dateKey(addDays(base, HORIZON_DAYS))

  const [{ data: docs }, { data: windows }, { data: blocked }, { data: appts }] =
    await Promise.all([
      supabase.from('doctors').select('id, buffer_minutes').in('id', doctorIds),
      supabase
        .from('availability_slots')
        .select('doctor_id, day_of_week, start_time, end_time, slot_duration_minutes')
        .eq('is_active', true)
        .in('doctor_id', doctorIds),
      supabase
        .from('blocked_dates')
        .select('doctor_id, date')
        .in('doctor_id', doctorIds)
        .gte('date', startKey)
        .lte('date', endKey),
      supabase
        .from('appointments')
        .select('doctor_id, slot_date, start_time')
        .in('doctor_id', doctorIds)
        .in('status', ['pending', 'confirmed'])
        .gte('slot_date', startKey)
        .lte('slot_date', endKey),
    ])

  for (const id of doctorIds) {
    map.set(id, {
      windowsByDay: new Map(),
      buffer: 0,
      blocked: new Set(),
      bookedByDate: new Map(),
    })
  }
  for (const d of docs ?? []) {
    const s = map.get(d.id)
    if (s) s.buffer = d.buffer_minutes ?? 0
  }
  for (const w of windows ?? []) {
    const s = map.get(w.doctor_id)
    if (!s) continue
    const arr = s.windowsByDay.get(w.day_of_week) ?? []
    arr.push({
      start: parseTimeToMinutes(w.start_time),
      end: parseTimeToMinutes(w.end_time),
      duration: w.slot_duration_minutes,
    })
    s.windowsByDay.set(w.day_of_week, arr)
  }
  for (const s of map.values()) {
    for (const arr of s.windowsByDay.values()) arr.sort((a, b) => a.start - b.start)
  }
  for (const b of blocked ?? []) {
    map.get(b.doctor_id)?.blocked.add(b.date)
  }
  for (const a of appts ?? []) {
    const s = map.get(a.doctor_id)
    if (!s) continue
    const set = s.bookedByDate.get(a.slot_date) ?? new Set<string>()
    set.add(normalizeTime(a.start_time))
    s.bookedByDate.set(a.slot_date, set)
  }
  return map
}

/**
 * Finds the earliest free slot for a doctor within `horizonDays`, scanning
 * forward from tomorrow (same-day booking is not allowed). Returns null if
 * nothing is open in the window.
 */
export async function getNextAvailableSlot(
  doctorId: string,
  horizonDays = HORIZON_DAYS
): Promise<NextSlot | null> {
  const sources = await loadSlotSources([doctorId])
  const src = sources.get(doctorId)
  return src ? firstFreeSlot(src, horizonDays) : null
}

/** Active doctors with profile data, each annotated with their next free slot. */
export async function getActiveDoctors(): Promise<DoctorListing[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('doctors')
    .select('id, specialty, bio, consultation_fee, is_active, profile:profiles!doctors_profile_id_fkey(full_name, avatar_url)')
    .eq('is_active', true)

  const rows = (data ?? []) as unknown as Array<
    Pick<Doctor, 'id' | 'specialty' | 'bio' | 'consultation_fee'> & {
      profile: Pick<Profile, 'full_name' | 'avatar_url'> | Array<Pick<Profile, 'full_name' | 'avatar_url'>> | null
    }
  >

  const sources = await loadSlotSources(rows.map((r) => r.id))

  return rows.map((r) => {
    const profile = Array.isArray(r.profile) ? r.profile[0] : r.profile
    const src = sources.get(r.id)
    return {
      id: r.id,
      specialty: r.specialty,
      bio: r.bio,
      consultation_fee: Number(r.consultation_fee),
      name: profile?.full_name ?? 'Doctor',
      avatar_url: profile?.avatar_url ?? null,
      next_slot: src ? firstFreeSlot(src) : null,
    }
  })
}

/** A single active doctor's public-facing details, or null if not bookable. */
export async function getDoctorListing(doctorId: string): Promise<DoctorListing | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('doctors')
    .select('id, specialty, bio, consultation_fee, is_active, buffer_minutes, profile:profiles!doctors_profile_id_fkey(full_name, avatar_url)')
    .eq('id', doctorId)
    .eq('is_active', true)
    .maybeSingle()

  if (!data) return null
  const row = data as unknown as {
    id: string
    specialty: string
    bio: string | null
    consultation_fee: number
    profile:
      | Pick<Profile, 'full_name' | 'avatar_url'>
      | Array<Pick<Profile, 'full_name' | 'avatar_url'>>
      | null
  }
  const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile
  return {
    id: row.id,
    specialty: row.specialty,
    bio: row.bio,
    consultation_fee: Number(row.consultation_fee),
    name: profile?.full_name ?? 'Doctor',
    avatar_url: profile?.avatar_url ?? null,
    next_slot: await getNextAvailableSlot(row.id),
  }
}

/** All of a patient's appointments with doctor + doctor-profile joined. */
export async function getPatientAppointments(
  patientId: string
): Promise<PatientAppointment[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('appointments')
    .select(
      'id, patient_id, doctor_id, slot_date, start_time, end_time, status, notes, created_at, updated_at, doctor:doctors!appointments_doctor_id_fkey(id, specialty, consultation_fee, profile:profiles!doctors_profile_id_fkey(full_name, avatar_url))'
    )
    .eq('patient_id', patientId)

  const rows = (data ?? []) as unknown as Array<
    Appointment & {
      doctor:
        | {
            id: string
            specialty: string
            consultation_fee: number
            profile:
              | { full_name: string; avatar_url: string | null }
              | Array<{ full_name: string; avatar_url: string | null }>
              | null
          }
        | null
    }
  >

  return rows.map((r) => {
    const doctor = r.doctor
    const rawProfile = doctor?.profile
    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile
    return {
      ...r,
      doctor: {
        id: doctor?.id ?? '',
        specialty: doctor?.specialty ?? '',
        consultation_fee: Number(doctor?.consultation_fee ?? 0),
        profile: {
          full_name: profile?.full_name ?? 'Doctor',
          avatar_url: profile?.avatar_url ?? null,
        },
      },
    }
  })
}

/** One appointment with full doctor detail, scoped to the owning patient. */
export async function getPatientAppointment(
  patientId: string,
  appointmentId: string
): Promise<PatientAppointment | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('appointments')
    .select(
      'id, patient_id, doctor_id, slot_date, start_time, end_time, status, notes, created_at, updated_at, doctor:doctors!appointments_doctor_id_fkey(id, specialty, consultation_fee, profile:profiles!doctors_profile_id_fkey(full_name, avatar_url))'
    )
    .eq('id', appointmentId)
    .eq('patient_id', patientId)
    .maybeSingle()

  if (!data) return null
  const r = data as unknown as Appointment & {
    doctor:
      | {
          id: string
          specialty: string
          consultation_fee: number
          profile:
            | { full_name: string; avatar_url: string | null }
            | Array<{ full_name: string; avatar_url: string | null }>
            | null
        }
      | null
  }
  const doctor = r.doctor
  const rawProfile = doctor?.profile
  const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile
  return {
    ...r,
    doctor: {
      id: doctor?.id ?? '',
      specialty: doctor?.specialty ?? '',
      consultation_fee: Number(doctor?.consultation_fee ?? 0),
      profile: {
        full_name: profile?.full_name ?? 'Doctor',
        avatar_url: profile?.avatar_url ?? null,
      },
    },
  }
}
