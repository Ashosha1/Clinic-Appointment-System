import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

/**
 * Resolves the signed-in user's profile when they are an admin. Returns null if
 * not signed in or not an admin. RoleGuard already gates /admin routes; this is
 * a server-side double-check for data helpers and actions.
 */
export async function getCurrentAdmin(): Promise<Profile | null> {
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

  if (!profile || profile.role !== 'admin') return null

  return profile
}
