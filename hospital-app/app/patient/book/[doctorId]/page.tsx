import { notFound, redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getCurrentPatient } from '@/lib/auth/current-patient'
import { getDoctorListing } from '@/lib/actions/patient-data'
import { dateKey } from '@/lib/scheduling/time'
import { BookingFlow } from '@/components/patient/BookingFlow'

interface PageProps {
  params: { doctorId: string }
  searchParams: { reschedule?: string }
}

export default async function BookDoctorPage({ params, searchParams }: PageProps) {
  const patient = await getCurrentPatient()
  if (!patient) redirect('/login')

  const doctor = await getDoctorListing(params.doctorId)
  if (!doctor) notFound()

  const supabase = await createClient()
  const today = dateKey(new Date())

  const [{ data: blocked }, { data: windows }] = await Promise.all([
    supabase
      .from('blocked_dates')
      .select('date')
      .eq('doctor_id', params.doctorId)
      .gte('date', today),
    supabase
      .from('availability_slots')
      .select('day_of_week')
      .eq('doctor_id', params.doctorId)
      .eq('is_active', true),
  ])

  const blockedDates = (blocked ?? []).map((b) => b.date)
  const activeWeekdays = Array.from(new Set((windows ?? []).map((w) => w.day_of_week)))

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-[15px] font-medium text-[var(--txt)]">Book an appointment</h1>
        <p className="text-xs text-[var(--txt3)]">
          Choose a date and time that works for you.
        </p>
      </div>

      <BookingFlow
        doctor={doctor}
        blockedDates={blockedDates}
        activeWeekdays={activeWeekdays}
        rescheduleFromId={searchParams.reschedule}
      />
    </div>
  )
}
