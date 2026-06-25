'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from './_helpers'

export interface PatientProfileInput {
  fullName: string
  phone: string
  avatarUrl?: string | null
}

/** Updates the signed-in patient's profile. RLS scopes the write to their row. */
export async function updatePatientProfile(
  input: PatientProfileInput
): Promise<ActionResult> {
  if (!input.fullName.trim()) return { error: 'Full name is required.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You are not signed in.' }

  const update: { full_name: string; phone: string | null; avatar_url?: string | null } = {
    full_name: input.fullName.trim(),
    phone: input.phone.trim() || null,
  }
  if (input.avatarUrl !== undefined) update.avatar_url = input.avatarUrl

  const { error } = await supabase.from('profiles').update(update).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/patient/profile')
  revalidatePath('/', 'layout')
  return { error: null }
}
