'use server'

import { revalidatePath } from 'next/cache'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentPatient } from '@/lib/auth/current-patient'
import type { ActionResult } from './_helpers'

export interface BookAppointmentInput {
  doctorId: string
  slotDate: string
  startTime: string
  endTime: string
  notes?: string | null
}

export type BookResult =
  | { success: true; id: string }
  | { success: false; error: string; slotTaken?: boolean }

/**
 * Books a slot through the book_appointment_atomic RPC, which re-checks the
 * slot and inserts the appointment + history row in one transaction. A
 * slot-taken outcome is surfaced inline (slotTaken: true) so the booking page
 * can prompt the patient to pick another time rather than toasting.
 */
export async function bookAppointment(input: BookAppointmentInput): Promise<BookResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('book_appointment_atomic', {
    p_doctor_id: input.doctorId,
    p_slot_date: input.slotDate,
    p_start_time: input.startTime,
    p_end_time: input.endTime,
    p_notes: input.notes?.trim() || null,
  })

  if (error) return { success: false, error: error.message }

  const result = data as { success: boolean; error?: string; id?: string } | null
  if (!result || !result.success) {
    if (result?.error === 'slot_taken') {
      return {
        success: false,
        slotTaken: true,
        error: 'This slot was just taken. Please choose another time.',
      }
    }
    return { success: false, error: result?.error ?? 'Could not book the appointment.' }
  }

  revalidatePath('/patient/appointments')
  revalidatePath('/patient/dashboard')
  return { success: true, id: result.id! }
}

/**
 * Cancels an upcoming appointment owned by the signed-in patient. Refuses if
 * the appointment starts within two hours, or is already past/cancelled.
 */
export async function cancelAppointment(appointmentId: string): Promise<ActionResult> {
  const patient = await getCurrentPatient()
  if (!patient) return { error: 'You are not signed in.' }

  const supabase = await createClient()
  const { data: appt } = await supabase
    .from('appointments')
    .select(
      'id, slot_date, start_time, status, patient_id, doctor:doctors!appointments_doctor_id_fkey ( profile_id )'
    )
    .eq('id', appointmentId)
    .eq('patient_id', patient.id)
    .maybeSingle()

  if (!appt) return { error: 'Appointment not found.' }
  if (appt.status === 'cancelled') return { error: 'This appointment is already cancelled.' }
  if (appt.status === 'completed') return { error: 'Completed appointments cannot be cancelled.' }

  const startsAt = new Date(`${appt.slot_date}T${appt.start_time}`)
  if (startsAt.getTime() - Date.now() < 2 * 60 * 60 * 1000) {
    return { error: 'Appointments can only be cancelled more than 2 hours in advance.' }
  }

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)
    .eq('patient_id', patient.id)
  if (error) return { error: error.message }

  // appointment_history has RLS enabled with no client INSERT policy, so the
  // authed client's insert is silently rejected. Write the audit row with the
  // service-role client (trusted server context), mirroring the admin path.
  const service = createServiceRoleClient()
  const { error: historyError } = await service.from('appointment_history').insert({
    appointment_id: appointmentId,
    changed_by: patient.id,
    old_status: appt.status,
    new_status: 'cancelled',
  })
  if (historyError) return { error: historyError.message }

  // Notify the affected doctor that the patient cancelled. notifications has no
  // client INSERT policy, so this goes through the service-role client too.
  const doctorRel = Array.isArray(appt.doctor) ? appt.doctor[0] : appt.doctor
  if (doctorRel?.profile_id) {
    await service.from('notifications').insert({
      user_id: doctorRel.profile_id,
      type: 'appointment_cancelled_by_patient',
      payload: {
        appointment_id: appointmentId,
        status: 'cancelled',
        slot_date: appt.slot_date,
        start_time: appt.start_time,
        patient_name: patient.full_name ?? null,
      },
    })
  }

  revalidatePath('/patient/appointments')
  revalidatePath('/admin/notifications')
  revalidatePath(`/patient/appointments/${appointmentId}`)
  revalidatePath('/patient/dashboard')
  return { error: null }
}
