import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { ensureProfile } from '@/lib/auth/ensure-profile'
import { dashboardFor } from '@/lib/auth/roles'

/**
 * Supabase OAuth / magic-link / email-confirmation callback. Exchanges the
 * auth code for a session, makes sure a profile exists, then routes the user
 * to onboarding (if incomplete) or their role dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const profile = await ensureProfile()
  if (!profile) {
    return NextResponse.redirect(`${origin}/onboarding`)
  }

  const destination = next ?? (profile.phone ? dashboardFor(profile.role) : '/onboarding')
  return NextResponse.redirect(`${origin}${destination}`)
}
