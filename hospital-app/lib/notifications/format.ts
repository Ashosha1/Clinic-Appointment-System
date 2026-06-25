import type { Json } from '@/types/database'

export interface NotificationItem {
  id: string
  type: string
  payload: Json | null
  sent_at: string
  read_at: string | null
}

interface Payload {
  appointment_id?: string
  status?: string
  slot_date?: string
  start_time?: string
  doctor_name?: string | null
  patient_name?: string | null
  reason?: string | null
  doctor_id?: string
}

function readPayload(payload: Json | null): Payload {
  return (payload && typeof payload === 'object' && !Array.isArray(payload)
    ? payload
    : {}) as Payload
}

function formatTime(time?: string): string {
  if (!time) return ''
  const [h, m] = time.split(':')
  const hour = Number(h)
  const period = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:${m ?? '00'} ${period}`
}

function formatDate(date?: string): string {
  if (!date) return ''
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

/** Human-readable title + body for a notification, derived from its type/payload. */
export function describeNotification(item: NotificationItem): {
  title: string
  body: string
} {
  const p = readPayload(item.payload)
  const when = [formatDate(p.slot_date), formatTime(p.start_time)].filter(Boolean).join(' at ')
  const withDoctor = p.doctor_name ? ` with ${p.doctor_name}` : ''
  const patient = p.patient_name || 'A patient'

  switch (item.type) {
    case 'appointment_confirmed':
      return {
        title: 'Appointment confirmed',
        body: `Your appointment${withDoctor}${when ? ` on ${when}` : ''} has been confirmed.`,
      }
    case 'appointment_cancelled':
      return {
        title: 'Appointment cancelled',
        body:
          `Your appointment${withDoctor}${when ? ` on ${when}` : ''} was cancelled.` +
          (p.reason ? ` Reason: ${p.reason}` : ''),
      }
    case 'appointment_cancelled_by_patient':
      return {
        title: 'Appointment cancelled',
        body: `${patient} cancelled their appointment${when ? ` on ${when}` : ''}.`,
      }
    case 'appointment_completed':
      return {
        title: 'Appointment completed',
        body: `Your appointment${withDoctor}${when ? ` on ${when}` : ''} is marked complete.`,
      }
    case 'doctor_approved':
      return {
        title: 'Your profile is approved',
        body: 'Your doctor profile has been approved — patients can now book with you.',
      }
    default:
      return { title: 'Notification', body: item.type }
  }
}

/** Relative-ish timestamp: "just now", "3h ago", or a short date. */
export function formatNotificationTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diffMin = Math.round((Date.now() - then) / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.round(diffH / 24)
  if (diffD < 7) return `${diffD}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
