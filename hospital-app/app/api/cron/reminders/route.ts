import { NextResponse, type NextRequest } from 'next/server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendAppointmentEmail } from '@/lib/notifications/appointment-emails'
import { addDays, dateKey } from '@/lib/scheduling/time'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Remind for appointments occurring within this many hours. With a once-daily
// cron, anything <= 30h out is caught on the run that first sees it; the
// reminder_sent_at flag guarantees each appointment is emailed only once.
const REMIND_WITHIN_HOURS = 30

/**
 * Sends reminder emails for upcoming appointments. Invoked by Vercel Cron (see
 * vercel.json). Protected by CRON_SECRET: Vercel sends it as a Bearer token,
 * and it can also be triggered manually with the same header for testing.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const service = createServiceRoleClient()
  const now = new Date()
  const horizon = new Date(now.getTime() + REMIND_WITHIN_HOURS * 60 * 60 * 1000)

  // Coarse date filter in SQL; precise datetime filtering happens below.
  const { data, error } = await service
    .from('appointments')
    .select('id, slot_date, start_time')
    .in('status', ['pending', 'confirmed'])
    .is('reminder_sent_at', null)
    .gte('slot_date', dateKey(now))
    .lte('slot_date', dateKey(addDays(now, 2)))

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const due = (data ?? []).filter((a) => {
    const startsAt = new Date(`${a.slot_date}T${a.start_time}`)
    return startsAt > now && startsAt <= horizon
  })

  let sent = 0
  const failures: { id: string; error: string }[] = []

  for (const appt of due) {
    try {
      const result = await sendAppointmentEmail(appt.id, 'reminder')
      if (result.ok) {
        await service
          .from('appointments')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', appt.id)
        sent++
      } else {
        failures.push({ id: appt.id, error: result.error })
      }
    } catch (err) {
      failures.push({ id: appt.id, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return NextResponse.json({
    scanned: data?.length ?? 0,
    due: due.length,
    sent,
    failures,
  })
}
