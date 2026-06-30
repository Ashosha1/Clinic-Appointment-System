

alter table public.profiles
  add column if not exists is_active boolean not null default true;

create index if not exists idx_profiles_is_active on public.profiles (is_active);

-- profiles RLS already lets admins update any row (profiles_update uses
-- public.is_admin()), so no new policy is required for suspend/activate.
