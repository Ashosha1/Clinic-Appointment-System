'use server'

import { revalidatePath } from 'next/cache'

import { authorizeDoctor, type ActionResult } from './_helpers'

/** Blocks a single date for the doctor. `date` is a local YYYY-MM-DD string. */
export async function blockDate(
  doctorId: string,
  date: string,
  reason?: string
): Promise<ActionResult> {
  const auth = await authorizeDoctor(doctorId)
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth.ctx

  const { data: existing } = await supabase
    .from('blocked_dates')
    .select('id')
    .eq('doctor_id', doctorId)
    .eq('date', date)
    .maybeSingle()

  if (existing) return { error: 'That date is already blocked.' }

  const { error } = await supabase
    .from('blocked_dates')
    .insert({ doctor_id: doctorId, date, reason: reason?.trim() || null })

  if (error) return { error: error.message }

  revalidatePath('/doctor/availability')
  revalidatePath('/doctor/schedule')
  return { error: null }
}

/** Removes a blocked date for the doctor. */
export async function unblockDate(
  doctorId: string,
  date: string
): Promise<ActionResult> {
  const auth = await authorizeDoctor(doctorId)
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth.ctx

  const { error } = await supabase
    .from('blocked_dates')
    .delete()
    .eq('doctor_id', doctorId)
    .eq('date', date)

  if (error) return { error: error.message }

  revalidatePath('/doctor/availability')
  revalidatePath('/doctor/schedule')
  return { error: null }
}
