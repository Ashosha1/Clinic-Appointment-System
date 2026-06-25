import { redirect } from 'next/navigation'

import { getCurrentDoctor } from '@/lib/auth/current-doctor'
import { createClient } from '@/lib/supabase/server'
import { AvailabilityTabs } from '@/components/doctor/AvailabilityTabs'
import { normalizeTime } from '@/lib/scheduling/time'
import type { DayScheduleInput } from '@/types/scheduling'

export default async function AvailabilityPage() {
  const current = await getCurrentDoctor()
  if (!current) redirect('/login')
  if (!current.doctor) redirect('/onboarding')

  const doctorId = current.doctor.id
  const supabase = await createClient()

  const [{ data: slots }, { data: blocked }] = await Promise.all([
    supabase
      .from('availability_slots')
      .select('day_of_week, start_time, end_time, slot_duration_minutes, is_active')
      .eq('doctor_id', doctorId),
    supabase
      .from('blocked_dates')
      .select('date, reason')
      .eq('doctor_id', doctorId),
  ])

  const initialSlots: DayScheduleInput[] = (slots ?? []).map((s) => ({
    day_of_week: s.day_of_week,
    is_active: s.is_active,
    start_time: normalizeTime(s.start_time),
    end_time: normalizeTime(s.end_time),
    slot_duration_minutes: s.slot_duration_minutes,
  }))

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-[15px] font-medium text-[var(--txt)]">Availability</h1>
        <p className="text-xs text-[var(--txt3)]">
          Set your weekly working hours and block off specific dates.
        </p>
      </div>

      <AvailabilityTabs
        doctorId={doctorId}
        initialSlots={initialSlots}
        blocked={blocked ?? []}
      />
    </div>
  )
}
