import { cn } from '@/lib/utils'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const START_HOUR = 7

function hourLabel(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12} ${period}`
}

/** Returns a Tailwind bg class for a cell based on its share of the busiest cell. */
function intensityClass(count: number, max: number): string {
  if (count === 0 || max === 0) return 'bg-[var(--bg2)]'
  const ratio = count / max
  if (ratio <= 0.34) return 'bg-[var(--p3)]'
  if (ratio <= 0.67) return 'bg-[var(--p2)]'
  return 'bg-[var(--p)]'
}

/** Weekday × hour appointment-volume heatmap (7am–6pm). */
export function Heatmap({ data, max }: { data: number[][]; max: number }) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--txt)]">Busy times</h3>
          <p className="mt-0.5 text-xs text-[var(--txt3)]">Appointment volume by day and hour</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--txt3)]">
          <span>Less</span>
          <span className="h-3 w-3 rounded-[3px] bg-[var(--bg2)]" />
          <span className="h-3 w-3 rounded-[3px] bg-[var(--p3)]" />
          <span className="h-3 w-3 rounded-[3px] bg-[var(--p2)]" />
          <span className="h-3 w-3 rounded-[3px] bg-[var(--p)]" />
          <span>More</span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[420px]">
          {/* Column headers */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-1">
            <div />
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-[var(--txt3)]">
                {d}
              </div>
            ))}
          </div>

          {/* Rows */}
          {data.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className="mt-1 grid grid-cols-[48px_repeat(7,1fr)] items-center gap-1"
            >
              <div className="text-right text-[10px] text-[var(--txt3)]">
                {hourLabel(START_HOUR + rowIdx)}
              </div>
              {row.map((count, colIdx) => (
                <div
                  key={colIdx}
                  title={`${DAY_LABELS[colIdx]} ${hourLabel(START_HOUR + rowIdx)}: ${count}`}
                  className={cn('h-5 rounded-[3px]', intensityClass(count, max))}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
