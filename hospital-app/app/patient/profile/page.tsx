import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { PatientProfileForm } from '@/components/patient/PatientProfileForm'

export default async function PatientProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, avatar_url')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-[15px] font-medium text-[var(--txt)]">Profile</h1>
        <p className="text-xs text-[var(--txt3)]">Your personal details.</p>
      </div>

      <PatientProfileForm
        userId={user.id}
        email={user.email}
        initial={{
          fullName: profile?.full_name ?? '',
          phone: profile?.phone ?? '',
          avatarUrl: profile?.avatar_url ?? null,
        }}
      />
    </div>
  )
}
