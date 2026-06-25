import { redirect } from 'next/navigation'

import { getCurrentDoctor } from '@/lib/auth/current-doctor'
import { getWeekSchedule } from '@/lib/actions/schedule'
import { ScheduleView } from '@/components/doctor/ScheduleView'
import { dateKey, mondayOf } from '@/lib/scheduling/time'

export default async function SchedulePage() {
  const current = await getCurrentDoctor()
  if (!current) redirect('/login')
  if (!current.doctor) redirect('/onboarding')

  const doctorId = current.doctor.id
  const weekStart = mondayOf(new Date())
  const week = await getWeekSchedule(doctorId, weekStart)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-[15px] font-medium text-[var(--txt)]">Schedule</h1>
        <p className="text-xs text-[var(--txt3)]">
          Your week at a glance. Click a booked slot for appointment details.
        </p>
      </div>

      <ScheduleView
        doctorId={doctorId}
        isActive={current.doctor.is_active}
        initialWeekStart={dateKey(weekStart)}
        initialWeek={week}
      />
    </div>
  )
}
