-- Chunk 5: admin needs to suspend/activate any user. doctors already have
-- is_active; add the same flag to profiles so patients (and doctors at the
-- account level) can be suspended. Existing rows default to active.

alter table public.profiles
  add column if not exists is_active boolean not null default true;

create index if not exists idx_profiles_is_active on public.profiles (is_active);

-- profiles RLS already lets admins update any row (profiles_update uses
-- public.is_admin()), so no new policy is required for suspend/activate.
