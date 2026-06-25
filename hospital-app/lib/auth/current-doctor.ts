import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type Doctor = Database['public']['Tables']['doctors']['Row']

export interface CurrentDoctor {
  profile: Profile
  doctor: Doctor | null
}

/**
 * Resolves the signed-in user's profile and doctor record. `doctor` is null if
 * the doctor hasn't completed onboarding yet. Returns null when not signed in
 * or not a doctor.
 */
export async function getCurrentDoctor(): Promise<CurrentDoctor | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'doctor') return null

  const { data: doctor } = await supabase
    .from('doctors')
    .select('*')
    .eq('profile_id', profile.id)
    .maybeSingle()

  return { profile, doctor: doctor ?? null }
}
