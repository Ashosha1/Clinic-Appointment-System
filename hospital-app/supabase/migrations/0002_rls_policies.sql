-- ============================================================================
-- MediConnect — 0002 Row Level Security
-- Helper functions + policies for every table.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they read profiles/doctors without
-- triggering the very policies we are defining — avoids infinite recursion).
-- ---------------------------------------------------------------------------
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- True when the current user is the doctor that owns `target_doctor_id`.
create or replace function public.owns_doctor(target_doctor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.doctors d
    join public.profiles p on p.id = d.profile_id
    where d.id = target_doctor_id and p.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.doctors             enable row level security;
alter table public.blocked_dates       enable row level security;
alter table public.availability_slots  enable row level security;
alter table public.appointments        enable row level security;
alter table public.appointment_history enable row level security;
alter table public.notifications       enable row level security;

-- ===========================================================================
-- profiles
--   SELECT: own row or admin
--   UPDATE: own row or admin
--   INSERT: own row (user_id must equal auth.uid()) — supports signup
-- ===========================================================================
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ===========================================================================
-- doctors
--   SELECT: any authenticated user may read active doctors (own/admin see all)
--   INSERT/UPDATE: doctor owns their own record; admin full access
-- ===========================================================================
drop policy if exists doctors_select on public.doctors;
create policy doctors_select on public.doctors
  for select to authenticated
  using (
    is_active
    or profile_id = public.current_profile_id()
    or public.is_admin()
  );

drop policy if exists doctors_insert on public.doctors;
create policy doctors_insert on public.doctors
  for insert to authenticated
  with check (profile_id = public.current_profile_id() or public.is_admin());

drop policy if exists doctors_update on public.doctors;
create policy doctors_update on public.doctors
  for update to authenticated
  using (profile_id = public.current_profile_id() or public.is_admin())
  with check (profile_id = public.current_profile_id() or public.is_admin());

drop policy if exists doctors_delete on public.doctors;
create policy doctors_delete on public.doctors
  for delete to authenticated
  using (public.is_admin());

-- ===========================================================================
-- availability_slots
--   SELECT: any authenticated user
--   INSERT/UPDATE/DELETE: owning doctor; admin full access
-- ===========================================================================
drop policy if exists avail_select on public.availability_slots;
create policy avail_select on public.availability_slots
  for select to authenticated
  using (true);

drop policy if exists avail_insert on public.availability_slots;
create policy avail_insert on public.availability_slots
  for insert to authenticated
  with check (public.owns_doctor(doctor_id) or public.is_admin());

drop policy if exists avail_update on public.availability_slots;
create policy avail_update on public.availability_slots
  for update to authenticated
  using (public.owns_doctor(doctor_id) or public.is_admin())
  with check (public.owns_doctor(doctor_id) or public.is_admin());

drop policy if exists avail_delete on public.availability_slots;
create policy avail_delete on public.availability_slots
  for delete to authenticated
  using (public.owns_doctor(doctor_id) or public.is_admin());

-- ===========================================================================
-- blocked_dates
--   SELECT: any authenticated user
--   INSERT/UPDATE/DELETE: owning doctor; admin full access
-- ===========================================================================
drop policy if exists blocked_select on public.blocked_dates;
create policy blocked_select on public.blocked_dates
  for select to authenticated
  using (true);

drop policy if exists blocked_insert on public.blocked_dates;
create policy blocked_insert on public.blocked_dates
  for insert to authenticated
  with check (public.owns_doctor(doctor_id) or public.is_admin());

drop policy if exists blocked_update on public.blocked_dates;
create policy blocked_update on public.blocked_dates
  for update to authenticated
  using (public.owns_doctor(doctor_id) or public.is_admin())
  with check (public.owns_doctor(doctor_id) or public.is_admin());

drop policy if exists blocked_delete on public.blocked_dates;
create policy blocked_delete on public.blocked_dates
  for delete to authenticated
  using (public.owns_doctor(doctor_id) or public.is_admin());

-- ===========================================================================
-- appointments
--   SELECT: patient sees own; doctor sees assigned; admin sees all
--   INSERT: patients only (for themselves)
--   UPDATE: patient (own), doctor (assigned), admin (all)
--           -- column-level "cancel only" / "confirm/complete only" rules are
--           -- enforced in the server actions layer (Chunk 2+).
-- ===========================================================================
drop policy if exists appts_select on public.appointments;
create policy appts_select on public.appointments
  for select to authenticated
  using (
    patient_id = public.current_profile_id()
    or public.owns_doctor(doctor_id)
    or public.is_admin()
  );

drop policy if exists appts_insert on public.appointments;
create policy appts_insert on public.appointments
  for insert to authenticated
  with check (
    patient_id = public.current_profile_id()
    and exists (
      select 1 from public.profiles
      where id = patient_id and role = 'patient'
    )
  );

drop policy if exists appts_update on public.appointments;
create policy appts_update on public.appointments
  for update to authenticated
  using (
    patient_id = public.current_profile_id()
    or public.owns_doctor(doctor_id)
    or public.is_admin()
  )
  with check (
    patient_id = public.current_profile_id()
    or public.owns_doctor(doctor_id)
    or public.is_admin()
  );

drop policy if exists appts_delete on public.appointments;
create policy appts_delete on public.appointments
  for delete to authenticated
  using (public.is_admin());

-- ===========================================================================
-- appointment_history
--   SELECT: admin only (audit trail)
--   INSERT: no client policy — only the SECURITY DEFINER trigger / service role
-- ===========================================================================
drop policy if exists history_select on public.appointment_history;
create policy history_select on public.appointment_history
  for select to authenticated
  using (public.is_admin());

-- ===========================================================================
-- notifications
--   SELECT/UPDATE: recipient only; admin read-all
--   INSERT: service role / triggers (no client policy)
-- ===========================================================================
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select to authenticated
  using (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());
