import { redirect } from 'next/navigation'

import { getCurrentPatient } from '@/lib/auth/current-patient'
import { getActiveDoctors } from '@/lib/actions/patient-data'
import { FindDoctor } from '@/components/patient/FindDoctor'

export default async function FindDoctorPage() {
  const patient = await getCurrentPatient()
  if (!patient) redirect('/login')

  const doctors = await getActiveDoctors()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-[15px] font-medium text-[var(--txt)]">Find a doctor</h1>
        <p className="text-xs text-[var(--txt3)]">
          Browse available doctors and book an appointment.
        </p>
      </div>

      <FindDoctor doctors={doctors} />
    </div>
  )
}
