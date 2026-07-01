'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/notifications/email'
import { buildWelcomeEmail } from '@/lib/notifications/emailTemplates'
import { generateTempPassword } from '@/lib/password'
import type { ActionResult } from './_helpers'
import type { AppointmentStatus, Database, UserRole } from '@/types/database'

function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

interface AdminContext {
  supabase: SupabaseClient<Database>
  profileId: string
}

/**
 * Resolves the signed-in admin. Defense in depth on top of the is_admin() RLS
 * policies: admin actions mutate clinic-wide data, so we confirm the caller's
 * role before touching anything.
 */
async function authorizeAdmin(): Promise<{ ctx: AdminContext } | { error: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You are not signed in.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Only administrators can perform this action.' }
  }

  return { ctx: { supabase, profileId: profile.id } }
}

const NOTIFICATION_TYPE: Partial<Record<AppointmentStatus, string>> = {
  confirmed: 'appointment_confirmed',
  cancelled: 'appointment_cancelled',
  completed: 'appointment_completed',
}

/**
 * Records the status change in appointment_history and drops an in-app
 * notification for the patient. Both tables lack a client INSERT policy, so we
 * use the service-role client (trusted server context only).
 */
async function logHistoryAndNotify(params: {
  appointmentId: string
  patientId: string
  changedBy: string
  oldStatus: AppointmentStatus
  newStatus: AppointmentStatus
  reason?: string | null
  doctorName?: string | null
  slotDate: string
  startTime: string
}) {
  const service = createServiceRoleClient()

  await service.from('appointment_history').insert({
    appointment_id: params.appointmentId,
    changed_by: params.changedBy,
    old_status: params.oldStatus,
    new_status: params.newStatus,
    reason: params.reason ?? null,
  })

  const type = NOTIFICATION_TYPE[params.newStatus]
  if (type) {
    await service.from('notifications').insert({
      user_id: params.patientId,
      type,
      payload: {
        appointment_id: params.appointmentId,
        status: params.newStatus,
        slot_date: params.slotDate,
        start_time: params.startTime,
        doctor_name: params.doctorName ?? null,
        reason: params.reason ?? null,
      },
    })
  }
}

/**
 * Core status transition used by the dashboard and appointments-management
 * actions. Updates the appointment with the admin's authed client (RLS allows
 * admins to update any row), then logs history + notifies the patient.
 */
async function changeStatus(
  appointmentId: string,
  newStatus: AppointmentStatus,
  reason: string | null,
  expectFrom?: AppointmentStatus[]
): Promise<ActionResult> {
  const auth = await authorizeAdmin()
  if ('error' in auth) return auth
  const { supabase, profileId } = auth.ctx

  const { data: appt } = await supabase
    .from('appointments')
    .select(
      'id, status, patient_id, slot_date, start_time, doctor:doctors!appointments_doctor_id_fkey ( profile:profiles!doctors_profile_id_fkey ( full_name ) )'
    )
    .eq('id', appointmentId)
    .maybeSingle()

  if (!appt) return { error: 'Appointment not found.' }
  if (appt.status === newStatus) {
    return { error: `This appointment is already ${newStatus}.` }
  }
  if (expectFrom && !expectFrom.includes(appt.status)) {
    return { error: `Only ${expectFrom.join(' or ')} appointments can be changed here.` }
  }

  const { error } = await supabase
    .from('appointments')
    .update({ status: newStatus })
    .eq('id', appointmentId)
  if (error) return { error: error.message }

  const doctorRel = Array.isArray(appt.doctor) ? appt.doctor[0] : appt.doctor
  const doctorProfile = doctorRel
    ? Array.isArray(doctorRel.profile)
      ? doctorRel.profile[0]
      : doctorRel.profile
    : null

  await logHistoryAndNotify({
    appointmentId,
    patientId: appt.patient_id,
    changedBy: profileId,
    oldStatus: appt.status,
    newStatus,
    reason,
    doctorName: doctorProfile?.full_name ?? null,
    slotDate: appt.slot_date,
    startTime: appt.start_time,
  })

  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/appointments')
  revalidatePath('/admin/notifications')
  return { error: null }
}

/** Confirm a pending appointment. */
export async function confirmAppointment(appointmentId: string): Promise<ActionResult> {
  return changeStatus(appointmentId, 'confirmed', null, ['pending'])
}

export type BulkResult = { error: string } | { error: null; count: number }

/**
 * Confirm every still-pending appointment in `ids` in one pass. Authorizes
 * once, updates the matching pending rows together, then logs history + a
 * notification per confirmed appointment via the service-role client.
 */
export async function bulkConfirmAppointments(ids: string[]): Promise<BulkResult> {
  if (ids.length === 0) return { error: 'No appointments selected.' }

  const auth = await authorizeAdmin()
  if ('error' in auth) return { error: auth.error }
  const { supabase, profileId } = auth.ctx

  const { data: appts } = await supabase
    .from('appointments')
    .select(
      'id, status, patient_id, slot_date, start_time, doctor:doctors!appointments_doctor_id_fkey ( profile:profiles!doctors_profile_id_fkey ( full_name ) )'
    )
    .in('id', ids)
    .eq('status', 'pending')

  const pendingRows = appts ?? []
  if (pendingRows.length === 0) return { error: 'Nothing left to confirm.' }

  const pendingIds = pendingRows.map((a) => a.id)
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'confirmed' })
    .in('id', pendingIds)
  if (error) return { error: error.message }

  for (const appt of pendingRows) {
    const doctorRel = Array.isArray(appt.doctor) ? appt.doctor[0] : appt.doctor
    const doctorProfile = doctorRel
      ? Array.isArray(doctorRel.profile)
        ? doctorRel.profile[0]
        : doctorRel.profile
      : null
    await logHistoryAndNotify({
      appointmentId: appt.id,
      patientId: appt.patient_id,
      changedBy: profileId,
      oldStatus: 'pending',
      newStatus: 'confirmed',
      reason: null,
      doctorName: doctorProfile?.full_name ?? null,
      slotDate: appt.slot_date,
      startTime: appt.start_time,
    })
  }

  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/appointments')
  revalidatePath('/admin/notifications')
  return { error: null, count: pendingRows.length }
}

/** Cancel an appointment (admin override). A reason is required. */
export async function cancelAppointmentByAdmin(
  appointmentId: string,
  reason: string
): Promise<ActionResult> {
  const trimmed = reason.trim()
  if (!trimmed) return { error: 'A reason is required to cancel an appointment.' }
  return changeStatus(appointmentId, 'cancelled', trimmed, ['pending', 'confirmed'])
}

/**
 * Generic status override used by the appointments-management page. A reason is
 * required so the change is auditable in appointment_history.
 */
export async function overrideAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus,
  reason: string
): Promise<ActionResult> {
  const trimmed = reason.trim()
  if (!trimmed) return { error: 'A reason is required to change the status.' }
  return changeStatus(appointmentId, newStatus, trimmed)
}

/* ---------- User management ---------- */

/**
 * Suspend or reactivate an account (profiles.is_active). Uses the service-role
 * client so the change can't be blocked by the caller's own row policies, after
 * confirming the caller is an admin.
 */
export async function setProfileActive(
  profileId: string,
  active: boolean
): Promise<ActionResult> {
  const auth = await authorizeAdmin()
  if ('error' in auth) return auth

  // An admin shouldn't be able to suspend their own account out from under
  // themselves.
  if (profileId === auth.ctx.profileId && !active) {
    return { error: 'You cannot suspend your own account.' }
  }

  const service = createServiceRoleClient()
  const { error } = await service
    .from('profiles')
    .update({ is_active: active })
    .eq('id', profileId)
  if (error) return { error: error.message }

  revalidatePath('/admin/patients')
  revalidatePath('/admin/doctors')
  return { error: null }
}

/**
 * Approve or deactivate a doctor at the practice level (doctors.is_active).
 * Approving makes the doctor visible/bookable to patients and drops an in-app
 * notification for the doctor.
 */
export async function setDoctorApproval(
  doctorId: string,
  approved: boolean
): Promise<ActionResult> {
  const auth = await authorizeAdmin()
  if ('error' in auth) return auth

  const service = createServiceRoleClient()

  const { data: doctor } = await service
    .from('doctors')
    .select('profile_id')
    .eq('id', doctorId)
    .maybeSingle()

  const { error } = await service
    .from('doctors')
    .update({ is_active: approved })
    .eq('id', doctorId)
  if (error) return { error: error.message }

  if (approved && doctor?.profile_id) {
    await service.from('notifications').insert({
      user_id: doctor.profile_id,
      type: 'doctor_approved',
      payload: { doctor_id: doctorId },
    })
  }

  revalidatePath('/admin/patients')
  revalidatePath('/admin/doctors')
  return { error: null }
}

/**
 * Inline-edit a doctor's specialty and/or consultation fee from the doctor
 * management table. Service role after an admin check.
 */
export async function updateDoctorDetails(
  doctorId: string,
  patch: { specialty?: string; consultationFee?: number | null }
): Promise<ActionResult> {
  const auth = await authorizeAdmin()
  if ('error' in auth) return auth

  const update: { specialty?: string; consultation_fee?: number | null } = {}
  if (patch.specialty !== undefined) {
    const trimmed = patch.specialty.trim()
    if (!trimmed) return { error: 'Specialty cannot be empty.' }
    update.specialty = trimmed
  }
  if (patch.consultationFee !== undefined) {
    if (patch.consultationFee !== null && patch.consultationFee < 0) {
      return { error: 'Fee cannot be negative.' }
    }
    update.consultation_fee = patch.consultationFee
  }
  if (Object.keys(update).length === 0) return { error: null }

  const service = createServiceRoleClient()
  const { error } = await service.from('doctors').update(update).eq('id', doctorId)
  if (error) return { error: error.message }

  revalidatePath('/admin/doctors')
  return { error: null }
}

export interface CreateUserInput {
  fullName: string
  email: string
  role: Extract<UserRole, 'doctor' | 'admin'>
  /** Temporary password. If omitted, one is generated. */
  password?: string
  phone?: string
  /** Required when role is 'doctor'. */
  specialty?: string
}

/**
 * Admin-only: creates a new doctor or admin account. Creates the auth user
 * (email pre-confirmed) with a temporary password, the matching profile, and a
 * doctors row for doctors, then emails the new user their login credentials.
 */
export async function createUserAsAdmin(input: CreateUserInput): Promise<ActionResult> {
  const auth = await authorizeAdmin()
  if ('error' in auth) return auth

  const fullName = input.fullName.trim()
  const email = input.email.trim().toLowerCase()
  const phone = input.phone?.trim() || null
  const specialty = input.specialty?.trim() || ''
  const password = input.password?.trim() || generateTempPassword()

  if (!fullName) return { error: 'Name is required.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (input.role === 'doctor' && !specialty) {
    return { error: 'Specialty is required for doctors.' }
  }

  const service = createServiceRoleClient()

  // 1. Create the auth user with the email already confirmed.
  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: input.role },
  })
  if (createErr) {
    const exists = /already.*registered|already exists/i.test(createErr.message)
    return { error: exists ? 'An account with that email already exists.' : createErr.message }
  }
  const userId = created.user.id

  // 2. Create the profile. On failure, roll back the orphaned auth user.
  const { data: profile, error: profileErr } = await service
    .from('profiles')
    .insert({ user_id: userId, role: input.role, full_name: fullName, phone })
    .select('id')
    .single()
  if (profileErr || !profile) {
    await service.auth.admin.deleteUser(userId)
    return { error: profileErr?.message ?? 'Could not create the profile.' }
  }

  // 3. For doctors, create the doctors row.
  if (input.role === 'doctor') {
    const { error: doctorErr } = await service
      .from('doctors')
      .insert({ profile_id: profile.id, specialty })
    if (doctorErr) {
      await service.auth.admin.deleteUser(userId)
      return { error: doctorErr.message }
    }
  }

  // 4. Email the new user their login credentials. Best-effort.
  try {
    const { subject, html, text } = buildWelcomeEmail({
      name: fullName,
      email,
      tempPassword: password,
      role: input.role,
      loginUrl: `${siteUrl()}/login`,
    })
    await sendEmail({ to: email, subject, html, text })
  } catch (err) {
    console.error('[createUserAsAdmin] welcome email failed:', err)
  }

  revalidatePath('/admin/doctors')
  revalidatePath('/admin/patients')
  return { error: null }
}
