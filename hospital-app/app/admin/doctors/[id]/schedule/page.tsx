import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getWeekSchedule } from '@/lib/actions/schedule'
import { ScheduleView } from '@/components/doctor/ScheduleView'
import { dateKey, mondayOf } from '@/lib/scheduling/time'

export const dynamic = 'force-dynamic'

export default async function AdminDoctorSchedulePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: doctor } = await supabase
    .from('doctors')
    .select('id, specialty, is_active, profile:profiles!doctors_profile_id_fkey ( full_name )')
    .eq('id', params.id)
    .maybeSingle()

  if (!doctor) notFound()

  const profile = Array.isArray(doctor.profile) ? doctor.profile[0] : doctor.profile
  const weekStart = mondayOf(new Date())
  const week = await getWeekSchedule(doctor.id, weekStart)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/doctors"
          className="inline-flex items-center gap-1 text-xs text-[var(--txt3)] transition-colors hover:text-[var(--txt)]"
        >
          <ArrowLeft size={14} />
          Back to doctors
        </Link>
        <h2 className="text-xl font-semibold text-[var(--txt)]">
          {profile?.full_name ?? 'Doctor'}&apos;s schedule
        </h2>
        <p className="text-sm text-[var(--txt2)]">
          {doctor.specialty} · Click a booked slot for appointment details.
        </p>
      </div>

      <ScheduleView
        doctorId={doctor.id}
        isActive={doctor.is_active}
        initialWeekStart={dateKey(weekStart)}
        initialWeek={week}
      />
    </div>
  )
}
