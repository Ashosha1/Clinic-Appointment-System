/** Time helpers for availability/slot math. SQL `time` values arrive as
 *  "HH:MM:SS" or "HH:MM"; we normalize on "HH:MM" internally. */

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':')
  return Number(h) * 60 + Number(m)
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** "08:00" / "08:00:00" → "8:00 AM" */
export function formatTime12h(time: string): string {
  const minutes = parseTimeToMinutes(time)
  const h24 = Math.floor(minutes / 60)
  const m = minutes % 60
  const period = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

/** Strip seconds for consistent comparison/storage. */
export function normalizeTime(time: string): string {
  return minutesToTime(parseTimeToMinutes(time))
}

/** Local YYYY-MM-DD key for a Date (avoids UTC drift from toISOString). */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

/** Returns a new Date `n` days after `date` (local). */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/** Monday of the week containing `date` (local, time stripped). */
export function mondayOf(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dow = d.getDay() // 0 = Sun
  const diff = dow === 0 ? -6 : 1 - dow
  return addDays(d, diff)
}

/**
 * How many fixed-duration slots fit in [start, end], leaving `buffer` minutes
 * between consecutive slots. Each slot occupies `duration`, then a gap of
 * `buffer` before the next can begin.
 */
export function countSlots(
  start: string,
  end: string,
  duration: number,
  buffer = 0
): number {
  const range = parseTimeToMinutes(end) - parseTimeToMinutes(start)
  if (range <= 0 || duration <= 0) return 0
  const step = duration + buffer
  // First slot needs `duration`; each subsequent needs `step` more.
  return Math.floor((range + buffer) / step)
}
