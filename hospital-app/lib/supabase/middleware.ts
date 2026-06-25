import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

import type { Database, UserRole } from '@/types/database'
import { dashboardFor, requiredRole } from '@/lib/auth/roles'

const AUTH_PAGES = ['/login', '/signup']

/**
 * Refreshes the Supabase auth session on every matched request and enforces
 * role-based routing. Returns the response to send (either the session-synced
 * passthrough or a redirect that carries the refreshed auth cookies).
 *
 * IMPORTANT: do not run code between createServerClient and getUser().
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const needRole = requiredRole(pathname)
  const isAuthPage = AUTH_PAGES.includes(pathname)
  const isProtected =
    needRole !== null || pathname === '/onboarding' || pathname === '/dashboard'

  // Build a redirect that preserves the freshly-refreshed auth cookies.
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.search = ''
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => res.cookies.set(cookie))
    return res
  }

  // Unauthenticated.
  if (!user) {
    if (isProtected) return redirectTo('/login')
    return supabaseResponse
  }

  // Authenticated — resolve role from profiles.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  const role = profile?.role as UserRole | undefined

  // Signed in but no profile row yet (e.g. just confirmed email) → onboarding.
  if (!role) {
    if (pathname === '/onboarding') return supabaseResponse
    return redirectTo('/onboarding')
  }

  // Already-authenticated users shouldn't see login/signup.
  if (isAuthPage) return redirectTo(dashboardFor(role))

  // Wrong role for a role-scoped area → send to their own dashboard.
  if (needRole && needRole !== role) return redirectTo(dashboardFor(role))

  return supabaseResponse
}
