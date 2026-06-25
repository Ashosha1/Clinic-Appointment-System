import { getAdminAppointments } from '@/lib/actions/admin-data'
import { AdminAppointmentsManager } from '@/components/admin/AdminAppointmentsManager'

export const dynamic = 'force-dynamic'

export default async function AdminAppointmentsPage() {
  const { rows, doctors } = await getAdminAppointments()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--txt)]">Appointments</h2>
        <p className="text-sm text-[var(--txt2)]">
          Search, filter, confirm, export, and override appointment statuses.
        </p>
      </div>

      <AdminAppointmentsManager rows={rows} doctors={doctors} />
    </div>
  )
}
