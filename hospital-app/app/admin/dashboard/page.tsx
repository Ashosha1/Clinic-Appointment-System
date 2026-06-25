import { CalendarCheck, Stethoscope, Clock, XCircle } from 'lucide-react'

import { getAdminDashboard } from '@/lib/actions/admin-data'
import { StatCard, type StatTrend } from '@/components/admin/StatCard'
import { WeeklyBars } from '@/components/admin/WeeklyBars'
import { TopDoctorsCard } from '@/components/admin/TopDoctorsCard'
import { PendingConfirmations } from '@/components/admin/PendingConfirmations'
import { AdminAppointmentsTable } from '@/components/admin/AdminAppointmentsTable'

export const dynamic = 'force-dynamic'

function pctTrend(value: number | null, higherIsGood: boolean): StatTrend | null {
  if (value === null || value === 0) return null
  const direction = value > 0 ? 'up' : 'down'
  const good = value > 0 ? higherIsGood : !higherIsGood
  return { value: `${Math.abs(value)}%`, direction, good }
}

export default async function AdminDashboard() {
  const { stats, weekly, topDoctors, pending, appointments } = await getAdminDashboard()

  const cancellationTrend: StatTrend | null =
    stats.cancellationTrendPct === null || stats.cancellationTrendPct === 0
      ? null
      : {
          value: `${Math.abs(stats.cancellationTrendPct)} pts`,
          direction: stats.cancellationTrendPct > 0 ? 'up' : 'down',
          // A rising cancellation rate is bad.
          good: stats.cancellationTrendPct < 0,
        }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--txt)]">Admin dashboard</h2>
        <p className="text-sm text-[var(--txt2)]">Clinic-wide activity at a glance.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarCheck}
          tint="teal"
          label="Appointments this month"
          value={stats.apptsThisMonth}
          trend={pctTrend(stats.apptsTrendPct, true)}
          caption={stats.apptsTrendPct === null ? 'No data last month' : undefined}
        />
        <StatCard
          icon={Stethoscope}
          tint="blue"
          label="Active doctors"
          value={stats.activeDoctors}
          caption={
            stats.newDoctorsThisWeek > 0
              ? `${stats.newDoctorsThisWeek} new this week`
              : 'No new doctors this week'
          }
        />
        <StatCard
          icon={Clock}
          tint="amber"
          label="Pending confirmations"
          value={stats.pendingCount}
          badge={stats.pendingCount > 0 ? 'Needs action' : undefined}
          caption={stats.pendingCount === 0 ? 'All caught up' : undefined}
        />
        <StatCard
          icon={XCircle}
          tint="red"
          label="Cancellation rate"
          value={`${stats.cancellationRate}%`}
          trend={cancellationTrend}
          caption={stats.cancellationTrendPct === null ? 'No data last month' : undefined}
        />
      </div>

      {/* Appointments table — full width so its five columns have room to breathe */}
      <AdminAppointmentsTable rows={appointments} />

      {/* Secondary cards in a balanced row, so no single column towers over a sparse table */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <WeeklyBars data={weekly} />
        <TopDoctorsCard doctors={topDoctors} />
        <PendingConfirmations items={pending} />
      </div>
    </div>
  )
}
