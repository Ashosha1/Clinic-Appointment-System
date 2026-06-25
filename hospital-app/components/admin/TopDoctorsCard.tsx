import type { TopDoctor } from '@/lib/actions/admin-data'

/** Top doctors by bookings this month — name, a proportional bar, and count. */
export function TopDoctorsCard({ doctors }: { doctors: TopDoctor[] }) {
  const max = Math.max(1, ...doctors.map((d) => d.count))

  return (
    <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-card">
      <h3 className="text-sm font-semibold text-[var(--txt)]">Top doctors</h3>
      <p className="mt-0.5 text-xs text-[var(--txt3)]">By bookings this month</p>

      {doctors.length === 0 ? (
        <p className="mt-4 text-xs text-[var(--txt3)]">No bookings yet this month.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {doctors.map((d) => (
            <li key={d.id}>
              <div className="flex items-center justify-between text-xs">
                <span className="truncate font-medium text-[var(--txt)]">{d.name}</span>
                <span className="ml-2 shrink-0 text-[var(--txt2)]">{d.count}</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--bg3)]">
                <div
                  className="h-1.5 rounded-full bg-[var(--p)]"
                  style={{ width: `${Math.round((d.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
