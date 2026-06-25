-- ============================================================================
-- MediConnect — 0007 Shared-appointment profile visibility
--
-- The original profiles_select policy only exposed a user's own row (or every
-- row, to admins). That hid the counterpart's name on an appointment: doctors
-- saw "Unknown patient" in their schedule, and patients couldn't read their
-- doctor's profile. This adds a SECURITY DEFINER helper that returns true when
-- the current user and `other_profile_id` share at least one appointment (in
-- either direction), and widens profiles_select to allow it.
-- ============================================================================

-- True when the signed-in user shares an appointment with `other_profile_id`
-- as either the patient or the doctor. SECURITY DEFINER so it reads
-- appointments/doctors without re-triggering their RLS policies.
create or replace function public.shares_appointment_with(other_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.appointments a
    join public.doctors d on d.id = a.doctor_id
    where
      -- current user is the doctor; the other party is the patient
      (d.profile_id = public.current_profile_id() and a.patient_id = other_profile_id)
      or
      -- current user is the patient; the other party is the doctor
      (a.patient_id = public.current_profile_id() and d.profile_id = other_profile_id)
  );
$$;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.shares_appointment_with(id)
  );
