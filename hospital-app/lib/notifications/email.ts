/**
 * Low-level transactional email sender backed by Resend's REST API
 * (https://resend.com). We hit the HTTP endpoint directly so there's no SDK
 * dependency to install or bundle.
 *
 * Required env:
 *   RESEND_API_KEY  — Resend API key (re_...)
 *   EMAIL_FROM      — verified sender, e.g. "MediConnect <noreply@yourdomain.com>"
 *
 * If RESEND_API_KEY is absent (local dev without secrets), sending is skipped
 * with a console note instead of throwing — so booking/cancel flows never break
 * just because email isn't configured.
 */

export interface SendEmailInput {
  to: string
  subject: string
  html: string
  text: string
}

export type SendEmailResult =
  | { ok: true; id: string | null; skipped?: boolean }
  | { ok: false; error: string }

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'MediConnect <onboarding@resend.dev>'

  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping email to ${to} ("${subject}")`
    )
    return { ok: true, id: null, skipped: true }
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      const msg = `Resend responded ${res.status}: ${detail.slice(0, 300)}`
      console.error(`[email] failed to send to ${to}: ${msg}`)
      return { ok: false, error: msg }
    }

    const data = (await res.json().catch(() => null)) as { id?: string } | null
    return { ok: true, id: data?.id ?? null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[email] error sending to ${to}: ${msg}`)
    return { ok: false, error: msg }
  }
}
