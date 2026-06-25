'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

export interface OnboardingInput {
  fullName: string
  phone: string
  // Doctor-only fields.
  specialty?: string
  bio?: string
  consultationFee?: number
}

type ActionResult = { error: string } | { error: null }

/**
 * Saves the signed-in user's onboarding details. Updates the profile and, for
 * doctors, upserts the matching `doctors` row. RLS scopes every write to the
 * caller's own records.
 */
export async function saveOnboarding(input: OnboardingInput): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You are not signed in.' }

  const { data: profile, error: profileLookupError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileLookupError || !profile) {
    return { error: 'Could not find your profile.' }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ full_name: input.fullName, phone: input.phone })
    .eq('id', profile.id)

  if (updateError) return { error: updateError.message }

  if (profile.role === 'doctor') {
    if (!input.specialty) return { error: 'Specialty is required.' }

    const { data: existingDoctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('profile_id', profile.id)
      .maybeSingle()

    const payload = {
      specialty: input.specialty,
      bio: input.bio || null,
      consultation_fee: input.consultationFee ?? null,
    }

    const { error: doctorError } = existingDoctor
      ? await supabase.from('doctors').update(payload).eq('id', existingDoctor.id)
      : await supabase.from('doctors').insert({ profile_id: profile.id, ...payload })

    if (doctorError) return { error: doctorError.message }
  }

  revalidatePath('/', 'layout')
  return { error: null }
}
