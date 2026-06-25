import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type Tint = 'teal' | 'blue' | 'amber' | 'red'

const TINT: Record<Tint, string> = {
  teal: 'bg-[var(--p3)] text-[var(--p)]',
  blue: 'bg-[var(--blue-light)] text-[var(--blue)]',
  amber: 'bg-[var(--amber-light)] text-[var(--amber)]',
  red: 'bg-[var(--red-light)] text-[var(--red)]',
}

export interface StatTrend {
  /** e.g. "12%" or "3 pts" */
  value: string
  direction: 'up' | 'down'
  /** Whether the trend direction is a good thing (green) or bad (red). */
  good: boolean
}

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  tint: Tint
  trend?: StatTrend | null
  /** Static caption shown when there's no numeric trend (e.g. "3 new this week"). */
  caption?: string
  /** Amber attention badge (e.g. "Needs action"). */
  badge?: string
}

/** White stat card with a tinted icon square, a large figure, and a footer row
 *  carrying either a trend, a caption, or an attention badge. */
export function StatCard({ icon: Icon, label, value, tint, trend, caption, badge }: StatCardProps) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-card">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            'flex h-[38px] w-[38px] items-center justify-center rounded-[10px]',
            TINT[tint]
          )}
        >
          <Icon size={18} />
        </div>
        {badge && (
          <span className="rounded-full bg-[var(--amber-light)] px-2 py-0.5 text-[11px] font-medium text-[var(--amber)]">
            {badge}
          </span>
        )}
      </div>

      <p className="mt-3 text-2xl font-semibold leading-none text-[var(--txt)]">{value}</p>
      <p className="mt-1.5 text-xs text-[var(--txt2)]">{label}</p>

      {trend && (
        <div
          className={cn(
            'mt-2 flex items-center gap-1 text-xs font-medium',
            trend.good ? 'text-[var(--green)]' : 'text-[var(--red)]'
          )}
        >
          {trend.direction === 'up' ? (
            <ArrowUpRight size={14} />
          ) : (
            <ArrowDownRight size={14} />
          )}
          <span>{trend.value} vs last month</span>
        </div>
      )}
      {!trend && caption && <p className="mt-2 text-xs text-[var(--txt3)]">{caption}</p>}
    </div>
  )
}
