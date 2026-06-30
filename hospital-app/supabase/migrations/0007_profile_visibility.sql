
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
