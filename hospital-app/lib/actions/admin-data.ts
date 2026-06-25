import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/auth/current-admin'
import { addDays, dateKey, mondayOf } from '@/lib/scheduling/time'
import type { AppointmentStatus, UserRole } from '@/types/database'

/* ---------- Shared row + summary types ---------- */

export interface AdminAppointmentRow {
  id: string
  slot_date: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  doctor_id: string
  patient_name: string
  patient_avatar: string | null
  doctor_name: string
  doctor_specialty: string
}

export interface DoctorOption {
  id: string
  name: string
  specialty: string
}

export interface AdminStats {
  apptsThisMonth: number
  /** Percentage change vs last month, or null when last month had none. */
  apptsTrendPct: number | null
  activeDoctors: number
  newDoctorsThisWeek: number
  pendingCount: number
  /** Cancellation rate this month, 0–100. */
  cancellationRate: number
  /** Change in cancellation rate vs last month, in percentage points. */
  cancellationTrendPct: number | null
}

export interface WeeklyBar {
  label: string
  count: number
}

export interface TopDoctor {
  id: string
  name: string
  specialty: string
  count: number
}

export interface AdminDashboardData {
  stats: AdminStats
  weekly: WeeklyBar[]
  topDoctors: TopDoctor[]
  pending: AdminAppointmentRow[]
  appointments: AdminAppointmentRow[]
}

/* ---------- Supabase join-shape helpers ---------- */

/** Embedded relations come back as an object (with a !fkey hint) or, in some
 *  inferred types, an array. Normalize to the first/only record. */
function one<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) return value[0]
  return value ?? undefined
}

interface JoinedAppointment {
  id: string
  slot_date: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  created_at: string
  doctor_id: string
  patient: { full_name: string; avatar_url: string | null } | null
  doctor:
    | {
        id: string
        specialty: string
        profile: { full_name: string } | null
      }
    | null
}

const APPOINTMENT_SELECT = `
  id, slot_date, start_time, end_time, status, created_at, doctor_id,
  patient:profiles!appointments_patient_id_fkey ( full_name, avatar_url ),
  doctor:doctors!appointments_doctor_id_fkey (
    id, specialty,
    profile:profiles!doctors_profile_id_fkey ( full_name )
  )
`

function toRow(raw: JoinedAppointment): AdminAppointmentRow {
  const patient = one(raw.patient)
  const doctor = one(raw.doctor)
  const doctorProfile = one(doctor?.profile)
  return {
    id: raw.id,
    slot_date: raw.slot_date,
    start_time: raw.start_time,
    end_time: raw.end_time,
    status: raw.status,
    doctor_id: raw.doctor_id,
    patient_name: patient?.full_name ?? 'Unknown patient',
    patient_avatar: patient?.avatar_url ?? null,
    doctor_name: doctorProfile?.full_name ?? 'Unknown doctor',
    doctor_specialty: doctor?.specialty ?? '',
  }
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/**
 * Clinic-wide dashboard payload. The admin's authed client sees every row via
 * the is_admin() RLS policies, so a handful of batched queries cover the stats
 * row, the appointments table, the weekly chart, the top-doctors list, and the
 * pending-confirmations queue without per-row round-trips.
 */
export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const supabase = await createClient()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const weekStart = mondayOf(now)
  const weekEnd = addDays(weekStart, 6)
  const weekAgo = addDays(now, -7)
  const todayKey = dateKey(now)

  const [statRes, pendingCountRes, joinedRes, doctorsRes] = await Promise.all([
    supabase
      .from('appointments')
      .select('status, created_at')
      .gte('created_at', lastMonthStart.toISOString()),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('appointments')
      .select(APPOINTMENT_SELECT)
      .order('created_at', { ascending: false })
      .limit(300),
    supabase
      .from('doctors')
      .select('id, is_active, profile:profiles!doctors_profile_id_fkey ( full_name, created_at )'),
  ])

  /* ----- Stats from the lightweight status/created_at rows ----- */
  const statRows = (statRes.data ?? []) as { status: AppointmentStatus; created_at: string }[]
  const monthStartMs = monthStart.getTime()
  const lastMonthStartMs = lastMonthStart.getTime()

  let thisMonthTotal = 0
  let thisMonthCancelled = 0
  let lastMonthTotal = 0
  let lastMonthCancelled = 0
  for (const r of statRows) {
    const t = new Date(r.created_at).getTime()
    if (t >= monthStartMs) {
      thisMonthTotal++
      if (r.status === 'cancelled') thisMonthCancelled++
    } else if (t >= lastMonthStartMs) {
      lastMonthTotal++
      if (r.status === 'cancelled') lastMonthCancelled++
    }
  }

  const apptsTrendPct =
    lastMonthTotal > 0
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : null
  const cancellationRate =
    thisMonthTotal > 0 ? Math.round((thisMonthCancelled / thisMonthTotal) * 100) : 0
  const lastCancellationRate =
    lastMonthTotal > 0 ? (lastMonthCancelled / lastMonthTotal) * 100 : null
  const cancellationTrendPct =
    lastCancellationRate === null
      ? null
      : Math.round(cancellationRate - lastCancellationRate)

  /* ----- Doctors: active count + new this week ----- */
  const doctorRows = (doctorsRes.data ?? []) as {
    id: string
    is_active: boolean
    profile: { full_name: string; created_at: string } | { full_name: string; created_at: string }[] | null
  }[]
  let activeDoctors = 0
  let newDoctorsThisWeek = 0
  for (const d of doctorRows) {
    if (d.is_active) activeDoctors++
    const prof = one(d.profile)
    if (prof && new Date(prof.created_at).getTime() >= weekAgo.getTime()) {
      newDoctorsThisWeek++
    }
  }

  /* ----- Joined rows power the table, week chart, top doctors, pending ----- */
  const joined = (joinedRes.data ?? []) as unknown as JoinedAppointment[]
  const appointments = joined.map(toRow)

  // Weekly bars (Mon–Sun) by slot_date within the current week.
  const weekStartKey = dateKey(weekStart)
  const weekEndKey = dateKey(weekEnd)
  const weekCounts = new Array(7).fill(0) as number[]
  for (const a of joined) {
    if (a.status === 'cancelled') continue
    if (a.slot_date >= weekStartKey && a.slot_date <= weekEndKey) {
      const d = new Date(`${a.slot_date}T00:00:00`)
      const dow = d.getDay() // 0 = Sun
      const idx = dow === 0 ? 6 : dow - 1
      weekCounts[idx]++
    }
  }
  const weekly: WeeklyBar[] = WEEKDAY_LABELS.map((label, i) => ({
    label,
    count: weekCounts[i],
  }))

  // Top doctors by bookings this month (exclude cancelled).
  const byDoctor = new Map<string, TopDoctor>()
  for (const a of joined) {
    if (a.status === 'cancelled') continue
    if (new Date(a.created_at).getTime() < monthStartMs) continue
    const doctor = one(a.doctor)
    if (!doctor) continue
    const existing = byDoctor.get(doctor.id)
    if (existing) {
      existing.count++
    } else {
      byDoctor.set(doctor.id, {
        id: doctor.id,
        name: one(doctor.profile)?.full_name ?? 'Unknown doctor',
        specialty: doctor.specialty,
        count: 1,
      })
    }
  }
  const topDoctors = [...byDoctor.values()].sort((a, b) => b.count - a.count).slice(0, 4)

  // Pending confirmations, soonest upcoming first.
  const pending = appointments
    .filter((a) => a.status === 'pending' && a.slot_date >= todayKey)
    .sort((a, b) =>
      a.slot_date === b.slot_date
        ? a.start_time.localeCompare(b.start_time)
        : a.slot_date.localeCompare(b.slot_date)
    )
    .slice(0, 5)

  return {
    stats: {
      apptsThisMonth: thisMonthTotal,
      apptsTrendPct,
      activeDoctors,
      newDoctorsThisWeek,
      pendingCount: pendingCountRes.count ?? 0,
      cancellationRate,
      cancellationTrendPct,
    },
    weekly,
    topDoctors,
    pending,
    appointments,
  }
}

/**
 * Full appointments list for the management page, plus the doctor roster that
 * powers the doctor filter. Ordered most-recent-date first. Capped to keep the
 * payload bounded; filtering/pagination happen client-side.
 */
export async function getAdminAppointments(): Promise<{
  rows: AdminAppointmentRow[]
  doctors: DoctorOption[]
}> {
  const supabase = await createClient()

  const [apptRes, doctorRes] = await Promise.all([
    supabase
      .from('appointments')
      .select(APPOINTMENT_SELECT)
      .order('slot_date', { ascending: false })
      .order('start_time', { ascending: false })
      .limit(1000),
    supabase
      .from('doctors')
      .select('id, specialty, profile:profiles!doctors_profile_id_fkey ( full_name )'),
  ])

  const rows = ((apptRes.data ?? []) as unknown as JoinedAppointment[]).map(toRow)

  const doctorRows = (doctorRes.data ?? []) as {
    id: string
    specialty: string
    profile: { full_name: string } | { full_name: string }[] | null
  }[]
  const doctors: DoctorOption[] = doctorRows
    .map((d) => ({
      id: d.id,
      name: one(d.profile)?.full_name ?? 'Unknown doctor',
      specialty: d.specialty,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return { rows, doctors }
}

/* ---------- User management ---------- */

export interface AdminUser {
  profileId: string
  name: string
  avatarUrl: string | null
  email: string | null
  role: UserRole
  joined: string
  appointmentCount: number
  /** Account-level active flag (profiles.is_active). */
  isActive: boolean
  /** Doctor record id, or null for non-doctors. */
  doctorId: string | null
  /** doctors.is_active — only meaningful for doctors. Drives "Approve". */
  doctorApproved: boolean | null
  specialty: string | null
  consultationFee: number | null
}

/**
 * Every account with the data the user-management table needs. Emails live in
 * auth.users, so this uses the service-role admin API — gated behind an admin
 * check first. Appointment counts are tallied in memory from a single fetch.
 */
export async function getAdminUsers(): Promise<AdminUser[]> {
  const admin = await getCurrentAdmin()
  if (!admin) return []

  const service = createServiceRoleClient()

  const [profileRes, doctorRes, apptRes] = await Promise.all([
    service
      .from('profiles')
      .select('id, user_id, role, full_name, avatar_url, is_active, created_at')
      .order('created_at', { ascending: false }),
    service.from('doctors').select('id, profile_id, is_active, specialty, consultation_fee'),
    service.from('appointments').select('patient_id, doctor_id'),
  ])

  // Tally appointment counts per patient profile and per doctor record.
  const patientCounts = new Map<string, number>()
  const doctorCounts = new Map<string, number>()
  for (const a of (apptRes.data ?? []) as { patient_id: string; doctor_id: string }[]) {
    patientCounts.set(a.patient_id, (patientCounts.get(a.patient_id) ?? 0) + 1)
    doctorCounts.set(a.doctor_id, (doctorCounts.get(a.doctor_id) ?? 0) + 1)
  }

  // Map a profile id to its doctor record.
  const doctorByProfile = new Map<
    string,
    { id: string; is_active: boolean; specialty: string; consultation_fee: number | null }
  >()
  for (const d of (doctorRes.data ?? []) as {
    id: string
    profile_id: string
    is_active: boolean
    specialty: string
    consultation_fee: number | null
  }[]) {
    doctorByProfile.set(d.profile_id, {
      id: d.id,
      is_active: d.is_active,
      specialty: d.specialty,
      consultation_fee: d.consultation_fee,
    })
  }

  // Email lookup from auth.users (paged).
  const emailById = new Map<string, string>()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data) break
    for (const u of data.users) {
      if (u.email) emailById.set(u.id, u.email)
    }
    if (data.users.length < 1000) break
  }

  const profiles = (profileRes.data ?? []) as {
    id: string
    user_id: string
    role: UserRole
    full_name: string
    avatar_url: string | null
    is_active: boolean
    created_at: string
  }[]

  return profiles.map((p) => {
    const doc = doctorByProfile.get(p.id)
    const appointmentCount = doc
      ? doctorCounts.get(doc.id) ?? 0
      : patientCounts.get(p.id) ?? 0
    return {
      profileId: p.id,
      name: p.full_name,
      avatarUrl: p.avatar_url,
      email: emailById.get(p.user_id) ?? null,
      role: p.role,
      joined: p.created_at,
      appointmentCount,
      isActive: p.is_active,
      doctorId: doc?.id ?? null,
      doctorApproved: doc ? doc.is_active : null,
      specialty: doc?.specialty ?? null,
      consultationFee: doc?.consultation_fee ?? null,
    }
  })
}

/* ---------- Doctor management ---------- */

export interface AdminDoctor {
  doctorId: string
  profileId: string
  name: string
  avatarUrl: string | null
  specialty: string
  consultationFee: number | null
  appointmentCount: number
  /** doctors.is_active — false means awaiting approval. */
  isApproved: boolean
}

/** All doctors with name, specialty, fee, total bookings, and approval state. */
export async function getAdminDoctors(): Promise<AdminDoctor[]> {
  const supabase = await createClient()

  const [doctorRes, apptRes] = await Promise.all([
    supabase
      .from('doctors')
      .select(
        'id, profile_id, specialty, consultation_fee, is_active, profile:profiles!doctors_profile_id_fkey ( full_name, avatar_url )'
      ),
    supabase.from('appointments').select('doctor_id'),
  ])

  const counts = new Map<string, number>()
  for (const a of (apptRes.data ?? []) as { doctor_id: string }[]) {
    counts.set(a.doctor_id, (counts.get(a.doctor_id) ?? 0) + 1)
  }

  const rows = (doctorRes.data ?? []) as {
    id: string
    profile_id: string
    specialty: string
    consultation_fee: number | null
    is_active: boolean
    profile: { full_name: string; avatar_url: string | null }
      | { full_name: string; avatar_url: string | null }[]
      | null
  }[]

  return rows
    .map((d) => {
      const prof = one(d.profile)
      return {
        doctorId: d.id,
        profileId: d.profile_id,
        name: prof?.full_name ?? 'Unknown doctor',
        avatarUrl: prof?.avatar_url ?? null,
        specialty: d.specialty,
        consultationFee: d.consultation_fee,
        appointmentCount: counts.get(d.id) ?? 0,
        isApproved: d.is_active,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

/* ---------- Analytics ---------- */

export interface DayPoint {
  /** YYYY-MM-DD */
  date: string
  /** Short axis label, e.g. "Jun 3" */
  label: string
  count: number
}

export interface AnalyticsTopDoctor {
  name: string
  count: number
}

export interface AdminAnalytics {
  perDay: DayPoint[]
  topDoctors: AnalyticsTopDoctor[]
  cancellationRate: number
  avgPerDay: number
  busiestDay: string
  /** 12 rows (hours 7am–6pm) × 7 cols (Mon–Sun) of non-cancelled volume. */
  heatmap: number[][]
  maxHeat: number
  windowDays: number
}

const HEAT_START_HOUR = 7
const HEAT_HOURS = 12 // 7,8,…,18 (7am–6pm slot starts)
const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Last-30-days analytics: per-day line, top doctors, KPI cards, and a
 *  weekday×hour heatmap. Computed in memory from a single windowed fetch. */
export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const supabase = await createClient()

  const windowDays = 30
  const today = new Date()
  const start = addDays(today, -(windowDays - 1))
  const fromKey = dateKey(start)
  const toKey = dateKey(today)

  const { data } = await supabase
    .from('appointments')
    .select(
      'slot_date, start_time, status, doctor_id, doctor:doctors!appointments_doctor_id_fkey ( profile:profiles!doctors_profile_id_fkey ( full_name ) )'
    )
    .gte('slot_date', fromKey)
    .lte('slot_date', toKey)

  type DoctorRel = { profile: { full_name: string } | { full_name: string }[] | null }
  const rows = (data ?? []) as {
    slot_date: string
    start_time: string
    status: AppointmentStatus
    doctor_id: string
    doctor: DoctorRel | DoctorRel[] | null
  }[]

  // Per-day buckets seeded with every date in the window so gaps render as 0.
  const perDayMap = new Map<string, number>()
  for (let i = 0; i < windowDays; i++) {
    perDayMap.set(dateKey(addDays(start, i)), 0)
  }

  const heatmap: number[][] = Array.from({ length: HEAT_HOURS }, () => new Array(7).fill(0))
  const weekdayTotals = new Array(7).fill(0) as number[]
  const doctorCounts = new Map<string, { name: string; count: number }>()

  let total = 0
  let cancelled = 0

  for (const r of rows) {
    total++
    if (r.status === 'cancelled') {
      cancelled++
      continue
    }

    perDayMap.set(r.slot_date, (perDayMap.get(r.slot_date) ?? 0) + 1)

    const d = new Date(`${r.slot_date}T00:00:00`)
    const dow = d.getDay() // 0 = Sun
    const colIdx = dow === 0 ? 6 : dow - 1 // Mon-first columns
    weekdayTotals[dow]++

    const hour = Number(r.start_time.slice(0, 2))
    const rowIdx = hour - HEAT_START_HOUR
    if (rowIdx >= 0 && rowIdx < HEAT_HOURS) {
      heatmap[rowIdx][colIdx]++
    }

    const doctorRel = one(r.doctor)
    const profile = one(doctorRel?.profile)
    const name = profile?.full_name ?? 'Unknown doctor'
    const existing = doctorCounts.get(r.doctor_id)
    if (existing) existing.count++
    else doctorCounts.set(r.doctor_id, { name, count: 1 })
  }

  const perDay: DayPoint[] = [...perDayMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({
      date,
      label: new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      count,
    }))

  const topDoctors = [...doctorCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((d) => ({ name: d.name, count: d.count }))

  const nonCancelled = total - cancelled
  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0
  const avgPerDay = Math.round((nonCancelled / windowDays) * 10) / 10

  let busiestIdx = -1
  for (let i = 0; i < 7; i++) {
    if (busiestIdx === -1 || weekdayTotals[i] > weekdayTotals[busiestIdx]) busiestIdx = i
  }
  const busiestDay = busiestIdx >= 0 && weekdayTotals[busiestIdx] > 0 ? WEEKDAY_FULL[busiestIdx] : '—'

  const maxHeat = Math.max(0, ...heatmap.flat())

  return {
    perDay,
    topDoctors,
    cancellationRate,
    avgPerDay,
    busiestDay,
    heatmap,
    maxHeat,
    windowDays,
  }
}
