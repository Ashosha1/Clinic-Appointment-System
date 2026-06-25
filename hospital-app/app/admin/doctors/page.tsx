import { getAdminDoctors } from '@/lib/actions/admin-data'
import { AdminDoctorsManager } from '@/components/admin/AdminDoctorsManager'

export const dynamic = 'force-dynamic'

export default async function AdminDoctorsPage() {
  const doctors = await getAdminDoctors()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--txt)]">Doctors</h2>
        <p className="text-sm text-[var(--txt2)]">
          Approve new doctors, adjust specialty and fees, and view schedules.
        </p>
      </div>

      <AdminDoctorsManager doctors={doctors} />
    </div>
  )
}
