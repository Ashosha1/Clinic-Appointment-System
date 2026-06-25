import { cn } from '@/lib/utils'
import type { WeeklyBar } from '@/lib/actions/admin-data'

/** CSS bar chart of appointments per weekday (Mon–Sun). The tallest bar is
 *  emphasised with the solid primary colour. */
export function WeeklyBars({ data }: { data: WeeklyBar[] }) {
  const max = Math.max(1, ...data.map((d) => d.count))

  return (
    <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-card">
      <h3 className="text-sm font-semibold text-[var(--txt)]">This week</h3>
      <p className="mt-0.5 text-xs text-[var(--txt3)]">Appointments by day</p>

      <div className="mt-4 flex h-32 items-end justify-between gap-1.5">
        {data.map((d) => {
          const isMax = d.count === max && d.count > 0
          const heightPct = Math.round((d.count / max) * 100)
          return (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full flex-1 items-end">
                <div
                  className={cn(
                    'w-full rounded-t-[4px] transition-all',
                    isMax ? 'bg-[var(--p)]' : 'bg-[var(--p3)]'
                  )}
                  style={{ height: `${Math.max(heightPct, d.count > 0 ? 6 : 2)}%` }}
                  title={`${d.count} appointment${d.count === 1 ? '' : 's'}`}
                />
              </div>
              <span className="text-[10px] text-[var(--txt3)]">{d.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
