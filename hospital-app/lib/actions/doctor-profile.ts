'use server'

import { revalidatePath } from 'next/cache'

import { authorizeDoctor, type ActionResult } from './_helpers'
import type { BufferMinutes } from '@/types/scheduling'

export interface DoctorProfileInput {
  fullName: string
  phone: string
  specialty: string
  bio: string
  avatarUrl?: string | null
  bufferMinutes: BufferMinutes
  isActive: boolean
}

/**
 * Updates the doctor's profile (name/phone/avatar) and doctor record
 * (specialty/bio/fee/buffer/active). RLS scopes writes; authorizeDoctor confirms
 * ownership of `doctorId` first.
 */
export async function updateDoctorProfile(
  doctorId: string,
  input: DoctorProfileInput
): Promise<ActionResult> {
  const auth = await authorizeDoctor(doctorId)
  if ('error' in auth) return { error: auth.error }
  const { supabase, profileId } = auth.ctx

  if (!input.fullName.trim()) return { error: 'Full name is required.' }
  if (!input.specialty.trim()) return { error: 'Specialty is required.' }

  const profileUpdate: { full_name: string; phone: string | null; avatar_url?: string | null } = {
    full_name: input.fullName.trim(),
    phone: input.phone.trim() || null,
  }
  if (input.avatarUrl !== undefined) profileUpdate.avatar_url = input.avatarUrl

  const { error: profileError } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', profileId)

  if (profileError) return { error: profileError.message }

  const { error: doctorError } = await supabase
    .from('doctors')
    .update({
      specialty: input.specialty.trim(),
      bio: input.bio.trim() || null,
      buffer_minutes: input.bufferMinutes,
      is_active: input.isActive,
    })
    .eq('id', doctorId)

  if (doctorError) return { error: doctorError.message }

  revalidatePath('/doctor/profile')
  revalidatePath('/doctor/schedule')
  revalidatePath('/', 'layout')
  return { error: null }
}
