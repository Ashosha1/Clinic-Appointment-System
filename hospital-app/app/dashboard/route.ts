import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { dashboardFor } from '@/lib/auth/roles'

/**
 * Generic /dashboard entry point. Reads the user's role and bounces them to
 * the correct role dashboard — handles landing on /dashboard after auth.
 */
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.redirect(`${origin}/onboarding`)
  }

  return NextResponse.redirect(`${origin}${dashboardFor(profile.role)}`)
}
