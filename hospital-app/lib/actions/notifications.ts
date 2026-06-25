'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/auth/current-admin'
import type { ActionResult } from './_helpers'
import type { NotificationItem } from '@/lib/notifications/format'
import type { UserRole } from '@/types/database'

async function currentProfileId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  return data?.id ?? null
}

export interface MyNotifications {
  items: NotificationItem[]
  unread: number
}

/** The signed-in user's own notifications (newest first) for the TopBar bell. */
export async function getMyNotifications(limit = 20): Promise<MyNotifications> {
  const profileId = await currentProfileId()
  if (!profileId) return { items: [], unread: 0 }

  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('id, type, payload, sent_at, read_at')
    .eq('user_id', profileId)
    .order('sent_at', { ascending: false })
    .limit(limit)

  const items = (data ?? []) as NotificationItem[]
  const unread = items.filter((n) => !n.read_at).length
  return { items, unread }
}

/** Mark all of the signed-in user's unread notifications as read. */
export async function markAllNotificationsRead(): Promise<ActionResult> {
  const profileId = await currentProfileId()
  if (!profileId) return { error: 'You are not signed in.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', profileId)
    .is('read_at', null)
  if (error) return { error: error.message }

  revalidatePath('/admin/notifications')
  return { error: null }
}

export interface AdminNotificationRow extends NotificationItem {
  recipientName: string
  recipientRole: UserRole | null
}

/**
 * System-wide notification feed for admins. Admins can read every row via the
 * is_admin() select policy; we join the recipient's name for context.
 */
export async function getAllNotifications(limit = 100): Promise<AdminNotificationRow[]> {
  const admin = await getCurrentAdmin()
  if (!admin) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select(
      'id, type, payload, sent_at, read_at, recipient:profiles!notifications_user_id_fkey ( full_name, role )'
    )
    .order('sent_at', { ascending: false })
    .limit(limit)

  type Row = NotificationItem & {
    recipient: { full_name: string; role: UserRole } | { full_name: string; role: UserRole }[] | null
  }

  return ((data ?? []) as Row[]).map((r) => {
    const recipient = Array.isArray(r.recipient) ? r.recipient[0] : r.recipient
    return {
      id: r.id,
      type: r.type,
      payload: r.payload,
      sent_at: r.sent_at,
      read_at: r.read_at,
      recipientName: recipient?.full_name ?? 'Unknown',
      recipientRole: recipient?.role ?? null,
    }
  })
}
