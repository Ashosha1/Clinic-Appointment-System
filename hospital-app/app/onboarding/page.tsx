import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { ensureProfile } from '@/lib/auth/ensure-profile'
import { Logo } from '@/components/shared/Logo'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { OnboardingForm } from './onboarding-form'

export default async function OnboardingPage() {
  const profile = await ensureProfile()
  if (!profile) redirect('/login')

  let doctorDefaults: { specialty: string; bio: string; consultationFee: string } | undefined
  if (profile.role === 'doctor') {
    const supabase = await createClient()
    const { data: doctor } = await supabase
      .from('doctors')
      .select('specialty, bio, consultation_fee')
      .eq('profile_id', profile.id)
      .maybeSingle()
    doctorDefaults = {
      specialty: doctor?.specialty ?? '',
      bio: doctor?.bio ?? '',
      consultationFee:
        doctor?.consultation_fee != null ? String(doctor.consultation_fee) : '',
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg2)]">
      <header className="flex items-center justify-between px-6 py-5">
        <Logo withWordmark />
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-lg px-6 py-8">
        <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-bold text-[var(--txt)]">
            Complete your profile
          </h1>
          <p className="mt-1 text-sm text-[var(--txt2)]">
            {profile.role === 'doctor'
              ? 'Tell patients a little about your practice.'
              : 'A few details so we can keep you in the loop.'}
          </p>

          <div className="mt-6">
            <OnboardingForm
              role={profile.role}
              defaults={{
                fullName: profile.full_name ?? '',
                phone: profile.phone ?? '',
                ...doctorDefaults,
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
