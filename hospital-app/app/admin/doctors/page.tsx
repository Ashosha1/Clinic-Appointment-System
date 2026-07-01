import { getAdminDoctors } from '@/lib/actions/admin-data'
import { AdminDoctorsManager } from '@/components/admin/AdminDoctorsManager'
import { AddUserDialog } from '@/components/admin/AddUserDialog'

export const dynamic = 'force-dynamic'

export default async function AdminDoctorsPage() {
  const doctors = await getAdminDoctors()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--txt)]">Doctors</h2>
          <p className="text-sm text-[var(--txt2)]">
            Add new users, approve doctors, adjust specialty and fees, and view schedules.
          </p>
        </div>
        <AddUserDialog />
      </div>

      <AdminDoctorsManager doctors={doctors} />
    </div>
  )
}
