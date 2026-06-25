-- Chunk 4: atomic booking guard.
-- Re-checks the slot inside the transaction and inserts the appointment +
-- history row together. The appointments_no_double_booking unique partial
-- index is the real arbiter under concurrency; we also do an explicit check
-- for a friendlier message on the common (non-racing) path.

create or replace function public.book_appointment_atomic(
  p_doctor_id uuid,
  p_slot_date date,
  p_start_time time,
  p_end_time time,
  p_notes text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid;
  v_appt_id uuid;
  v_taken boolean;
begin
  v_patient_id := current_profile_id();
  if v_patient_id is null then
    return jsonb_build_object('success', false, 'error', 'You are not signed in.');
  end if;

  select exists(
    select 1 from appointments
    where doctor_id = p_doctor_id
      and slot_date = p_slot_date
      and start_time = p_start_time
      and status in ('pending', 'confirmed')
  ) into v_taken;

  if v_taken then
    return jsonb_build_object('success', false, 'error', 'slot_taken');
  end if;

  insert into appointments (patient_id, doctor_id, slot_date, start_time, end_time, status, notes)
  values (v_patient_id, p_doctor_id, p_slot_date, p_start_time, p_end_time, 'pending', p_notes)
  returning id into v_appt_id;

  insert into appointment_history (appointment_id, changed_by, old_status, new_status)
  values (v_appt_id, v_patient_id, null, 'pending');

  return jsonb_build_object('success', true, 'id', v_appt_id);
exception
  when unique_violation then
    return jsonb_build_object('success', false, 'error', 'slot_taken');
end;
$$;

grant execute on function public.book_appointment_atomic(uuid, date, time, time, text) to authenticated;
