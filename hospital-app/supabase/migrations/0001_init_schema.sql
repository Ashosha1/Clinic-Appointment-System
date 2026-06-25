-- ============================================================================
-- MediConnect — 0001 init schema
-- Tables, indexes, and triggers. RLS lives in 0002_rls_policies.sql.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user, carries the app role
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade unique,
  role        text not null check (role in ('patient', 'doctor', 'admin')),
  full_name   text not null,
  avatar_url  text,
  phone       text,
  created_at  timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- doctors — extends a 'doctor' profile with clinical metadata
-- ---------------------------------------------------------------------------
create table if not exists public.doctors (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid references public.profiles(id) on delete cascade unique,
  specialty        text not null,
  bio              text,
  consultation_fee numeric(10, 2),
  buffer_minutes   int default 0,
  is_active        boolean default true
);

-- ---------------------------------------------------------------------------
-- blocked_dates — full-day blocks (vacation, holidays)
-- ---------------------------------------------------------------------------
create table if not exists public.blocked_dates (
  id         uuid primary key default gen_random_uuid(),
  doctor_id  uuid references public.doctors(id) on delete cascade,
  date       date not null,
  reason     text
);

-- ---------------------------------------------------------------------------
-- availability_slots — weekly recurring working windows per doctor
-- ---------------------------------------------------------------------------
create table if not exists public.availability_slots (
  id                    uuid primary key default gen_random_uuid(),
  doctor_id             uuid references public.doctors(id) on delete cascade,
  day_of_week           int check (day_of_week between 0 and 6),
  start_time            time not null,
  end_time              time not null,
  slot_duration_minutes int default 30,
  is_active             boolean default true,
  constraint availability_time_order check (end_time > start_time)
);

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------
create table if not exists public.appointments (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid references public.profiles(id) on delete cascade,
  doctor_id   uuid references public.doctors(id) on delete cascade,
  slot_date   date not null,
  start_time  time not null,
  end_time    time not null,
  status      text default 'pending'
              check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  constraint appointment_time_order check (end_time > start_time)
);

-- Prevent double-booking the same doctor/date/start while an appointment is live.
create unique index if not exists appointments_no_double_booking
  on public.appointments (doctor_id, slot_date, start_time)
  where status in ('pending', 'confirmed');

-- ---------------------------------------------------------------------------
-- appointment_history — immutable audit trail of status changes
-- ---------------------------------------------------------------------------
create table if not exists public.appointment_history (
  id              uuid primary key default gen_random_uuid(),
  appointment_id  uuid references public.appointments(id) on delete cascade,
  changed_by      uuid references public.profiles(id),
  old_status      text,
  new_status      text not null,
  reason          text,
  changed_at      timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references public.profiles(id) on delete cascade,
  type      text not null,
  payload   jsonb,
  sent_at   timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_profiles_user_id        on public.profiles (user_id);
create index if not exists idx_doctors_profile_id      on public.doctors (profile_id);
create index if not exists idx_doctors_is_active       on public.doctors (is_active);
create index if not exists idx_blocked_dates_doctor    on public.blocked_dates (doctor_id, date);
create index if not exists idx_avail_doctor_day        on public.availability_slots (doctor_id, day_of_week);
create index if not exists idx_appts_doctor_date       on public.appointments (doctor_id, slot_date);
create index if not exists idx_appts_patient           on public.appointments (patient_id);
create index if not exists idx_appts_status            on public.appointments (status);
create index if not exists idx_history_appointment     on public.appointment_history (appointment_id);
create index if not exists idx_notifications_user      on public.notifications (user_id);

-- ---------------------------------------------------------------------------
-- Trigger: keep appointments.updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_appointments_updated_at on public.appointments;
create trigger trg_appointments_updated_at
  before update on public.appointments
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger: record every status change into appointment_history.
-- SECURITY DEFINER so the insert bypasses RLS (history is otherwise read-only).
-- ---------------------------------------------------------------------------
create or replace function public.log_appointment_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    select id into actor from public.profiles where user_id = auth.uid();

    insert into public.appointment_history (appointment_id, changed_by, old_status, new_status)
    values (
      new.id,
      actor,
      case when tg_op = 'INSERT' then null else old.status end,
      new.status
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_appointment_history on public.appointments;
create trigger trg_appointment_history
  after insert or update on public.appointments
  for each row
  execute function public.log_appointment_status_change();
