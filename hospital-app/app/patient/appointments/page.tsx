import { redirect } from 'next/navigation'

import { getCurrentPatient } from '@/lib/auth/current-patient'
import { getPatientAppointments } from '@/lib/actions/patient-data'
import { AppointmentsView } from '@/components/patient/AppointmentsView'

export default async function AppointmentsPage() {
  const patient = await getCurrentPatient()
  if (!patient) redirect('/login')

  const appointments = await getPatientAppointments(patient.id)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-[15px] font-medium text-[var(--txt)]">My appointments</h1>
        <p className="text-xs text-[var(--txt3)]">
          Manage your upcoming and past visits.
        </p>
      </div>

      <AppointmentsView appointments={appointments} />
    </div>
  )
}
