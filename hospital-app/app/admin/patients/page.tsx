import { getAdminUsers } from '@/lib/actions/admin-data'
import { AdminUsersManager } from '@/components/admin/AdminUsersManager'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const users = await getAdminUsers()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--txt)]">User management</h2>
        <p className="text-sm text-[var(--txt2)]">
          View accounts, approve doctors, and suspend or reactivate users.
        </p>
      </div>

      <AdminUsersManager users={users} />
    </div>
  )
}
