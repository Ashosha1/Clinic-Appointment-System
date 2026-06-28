import { createServiceRoleClient } from '@/lib/supabase/server'
import { formatTime12h } from '@/lib/scheduling/time'
import { sendEmail, type SendEmailResult } from '@/lib/notifications/email'
import {
  buildAppointmentEmail,
  type AppointmentEmailKind,
} from '@/lib/notifications/emailTemplates'

/** Absolute base URL for links inside emails. */
function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

function formatDateLabel(slotDate: string): string {
  return new Date(`${slotDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface ApptRow {
  id: string
  slot_date: string
  start_time: string
  patient_id: string
  doctor:
    | { specialty: string; profile: { full_name: string } | { full_name: string }[] | null }
    | { specialty: string; profile: { full_name: string } | { full_name: string }[] | null }[]
    | null
}

/**
 * Loads an appointment, resolves the patient's email, and sends the email for
 * `kind`. Returns a result instead of throwing so callers (booking, cancel,
 * reminder cron) can log failures without breaking the primary flow.
 */
export async function sendAppointmentEmail(
  appointmentId: string,
  kind: AppointmentEmailKind
): Promise<SendEmailResult> {
  const service = createServiceRoleClient()

  const { data, error } = await service
    .from('appointments')
    .select(
      'id, slot_date, start_time, patient_id, doctor:doctors!appointments_doctor_id_fkey ( specialty, profile:profiles!doctors_profile_id_fkey ( full_name ) )'
    )
    .eq('id', appointmentId)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'Appointment not found.' }

  const appt = data as unknown as ApptRow
  const doctorRel = Array.isArray(appt.doctor) ? appt.doctor[0] : appt.doctor
  const doctorProfile = Array.isArray(doctorRel?.profile)
    ? doctorRel?.profile[0]
    : doctorRel?.profile

  // Resolve the patient's name + auth email (email lives on auth.users).
  const { data: patientProfile } = await service
    .from('profiles')
    .select('user_id, full_name')
    .eq('id', appt.patient_id)
    .maybeSingle()

  if (!patientProfile?.user_id) {
    return { ok: false, error: 'Patient profile not found.' }
  }

  const { data: authData, error: authError } =
    await service.auth.admin.getUserById(patientProfile.user_id)
  const to = authData?.user?.email
  if (authError || !to) {
    return { ok: false, error: authError?.message ?? 'Patient has no email.' }
  }

  const { subject, html, text } = buildAppointmentEmail({
    kind,
    patientName: patientProfile.full_name ?? 'there',
    doctorName: doctorProfile?.full_name ?? 'your doctor',
    specialty: doctorRel?.specialty ?? '',
    dateLabel: formatDateLabel(appt.slot_date),
    timeLabel: formatTime12h(appt.start_time),
    appointmentUrl: `${siteUrl()}/patient/appointments/${appt.id}`,
  })

  return sendEmail({ to, subject, html, text })
}
