import { redirect } from 'next/navigation'

import { getCurrentDoctor } from '@/lib/auth/current-doctor'
import { DoctorProfileForm } from '@/components/doctor/DoctorProfileForm'

export default async function DoctorProfilePage() {
  const current = await getCurrentDoctor()
  if (!current) redirect('/login')
  if (!current.doctor) redirect('/onboarding')

  const { profile, doctor } = current

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-[15px] font-medium text-[var(--txt)]">Profile</h1>
        <p className="text-xs text-[var(--txt3)]">
          How you appear to patients and how bookings are scheduled.
        </p>
      </div>

      <DoctorProfileForm
        doctorId={doctor.id}
        userId={profile.user_id}
        initial={{
          fullName: profile.full_name,
          phone: profile.phone ?? '',
          avatarUrl: profile.avatar_url,
          specialty: doctor.specialty,
          bio: doctor.bio ?? '',
          consultationFee: doctor.consultation_fee,
          bufferMinutes: doctor.buffer_minutes,
          isActive: doctor.is_active,
        }}
      />
    </div>
  )
}
