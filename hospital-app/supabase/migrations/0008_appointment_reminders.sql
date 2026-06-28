-- ============================================================================
-- MediConnect — 0008 appointment reminders
-- Track when a reminder email has been sent so the reminder cron is idempotent
-- and never double-sends.
-- ============================================================================

alter table public.appointments
  add column if not exists reminder_sent_at timestamptz;

-- The reminder cron scans for upcoming, not-yet-reminded appointments.
create index if not exists idx_appts_reminder_due
  on public.appointments (slot_date, start_time)
  where reminder_sent_at is null and status in ('pending', 'confirmed');
