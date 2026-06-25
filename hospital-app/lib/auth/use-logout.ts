'use client'

import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

/** Signs the user out and returns them to the login page. */
export function useLogout() {
  const router = useRouter()
  return async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }
}
