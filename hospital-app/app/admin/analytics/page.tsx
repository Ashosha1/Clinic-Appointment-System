import { CalendarDays, TrendingUp, XCircle } from 'lucide-react'

import { getAdminAnalytics } from '@/lib/actions/admin-data'
import { StatCard } from '@/components/admin/StatCard'
import { Heatmap } from '@/components/admin/Heatmap'
import {
  AppointmentsLineChart,
  TopDoctorsBarChart,
} from '@/components/admin/AnalyticsCharts'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalytics()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--txt)]">Analytics</h2>
        <p className="text-sm text-[var(--txt2)]">
          Trends across the last {analytics.windowDays} days.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={XCircle}
          tint="red"
          label="Cancellation rate"
          value={`${analytics.cancellationRate}%`}
          caption="Last 30 days"
        />
        <StatCard
          icon={TrendingUp}
          tint="teal"
          label="Avg appointments / day"
          value={analytics.avgPerDay}
          caption="Excludes cancellations"
        />
        <StatCard
          icon={CalendarDays}
          tint="blue"
          label="Busiest day"
          value={analytics.busiestDay}
          caption="By total bookings"
        />
      </div>

      {/* Charts */}
      <AppointmentsLineChart data={analytics.perDay} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopDoctorsBarChart data={analytics.topDoctors} />
        <Heatmap data={analytics.heatmap} max={analytics.maxHeat} />
      </div>
    </div>
  )
}
