-- Chunk 5: in-app notifications need an unread indicator. Add a nullable
-- read_at timestamp; null = unread. The existing notifications_update policy
-- (recipient only) already lets a user mark their own notifications read.

alter table public.notifications
  add column if not exists read_at timestamptz;

-- Speeds up the "my unread notifications" lookup in the TopBar bell.
create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, read_at);
