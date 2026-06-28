import { redirect } from 'next/navigation'

import { getCurrentPatient } from '@/lib/auth/current-patient'
import { getPatientAppointments } from '@/lib/actions/patient-data'
import { PatientHistory } from '@/components/patient/PatientHistory'

export default async function HistoryPage() {
  const patient = await getCurrentPatient()
  if (!patient) redirect('/login')

  const appointments = await getPatientAppointments(patient.id)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-[15px] font-medium text-[var(--txt)]">History</h1>
        <p className="text-xs text-[var(--txt3)]">
          A record of your completed and cancelled visits.
        </p>
      </div>

      <PatientHistory appointments={appointments} />
    </div>
  )
}
