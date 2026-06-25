'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { AnalyticsTopDoctor, DayPoint } from '@/lib/actions/admin-data'

const TEAL = '#1D9E75'

const tooltipStyle = {
  background: 'var(--card)',
  border: '1px solid var(--card-border)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--txt)',
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-card">
      <h3 className="text-sm font-semibold text-[var(--txt)]">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-[var(--txt3)]">{subtitle}</p>}
      <div className="mt-4 h-64 w-full">{children}</div>
    </div>
  )
}

export function AppointmentsLineChart({ data }: { data: DayPoint[] }) {
  const tickInterval = Math.max(0, Math.floor(data.length / 6) - 1)
  return (
    <Card title="Appointments per day" subtitle="Last 30 days">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            interval={tickInterval}
            tick={{ fill: 'var(--txt3)', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: 'var(--txt3)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--border)' }} />
          <Line
            type="monotone"
            dataKey="count"
            name="Appointments"
            stroke={TEAL}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function TopDoctorsBarChart({ data }: { data: AnalyticsTopDoctor[] }) {
  return (
    <Card title="Top doctors" subtitle="By bookings, last 30 days">
      {data.length === 0 ? (
        <div className="flex h-full items-center justify-center text-xs text-[var(--txt3)]">
          No bookings in this period.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: 'var(--txt3)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fill: 'var(--txt2)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--bg2)' }} />
            <Bar dataKey="count" name="Bookings" fill={TEAL} radius={[0, 4, 4, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
