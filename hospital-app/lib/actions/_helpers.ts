import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type ActionResult = { error: string } | { error: null }

export interface DoctorContext {
  supabase: SupabaseClient<Database>
  profileId: string
  doctorId: string
}

/**
 * Resolves the signed-in doctor and verifies they own `doctorId`. Defense in
 * depth on top of RLS: server actions accept a doctorId from the client, so we
 * confirm it matches the caller before mutating.
 */
export async function authorizeDoctor(
  doctorId: string
): Promise<{ ctx: DoctorContext } | { error: string }> {
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

  if (!profile || profile.role !== 'doctor') {
    return { error: 'Only doctors can perform this action.' }
  }

  const { data: doctor } = await supabase
    .from('doctors')
    .select('id')
    .eq('id', doctorId)
    .eq('profile_id', profile.id)
    .maybeSingle()

  if (!doctor) return { error: 'You do not own this doctor profile.' }

  return { ctx: { supabase, profileId: profile.id, doctorId: doctor.id } }
}
