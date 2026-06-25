import { createClient } from '@/lib/supabase/server'
import type { Database, UserRole } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

/**
 * Returns the signed-in user's profile, creating one from the auth metadata
 * captured at signup if it doesn't exist yet (the email-confirmation path
 * reaches the app before any profile row was written client-side).
 */
export async function ensureProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return existing

  const meta = (user.user_metadata ?? {}) as { role?: string; full_name?: string }
  const role: UserRole = meta.role === 'doctor' ? 'doctor' : 'patient'
  const fullName = meta.full_name || user.email?.split('@')[0] || 'New user'

  const { data: created } = await supabase
    .from('profiles')
    .insert({ user_id: user.id, role, full_name: fullName })
    .select('*')
    .single()

  return created ?? null
}
