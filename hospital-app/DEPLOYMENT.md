# MediConnect — Deployment Guide (Vercel + Supabase)

Production deployment runbook. Follow top to bottom for a first deploy; jump to
the relevant section for redeploys.

---

## 1. Environment variables (Vercel dashboard)

Set these under **Project → Settings → Environment Variables** for the
**Production** (and **Preview**) environments.

| Variable                        | Scope            | Where to find it                                   |
| ------------------------------- | ---------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Client + Server  | Supabase → Project Settings → API → Project URL    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server  | Supabase → Project Settings → API → anon/public    |
| `SUPABASE_SERVICE_ROLE_KEY`     | **Server only**  | Supabase → Project Settings → API → service_role   |
| `NEXT_PUBLIC_SITE_URL`          | Client + Server  | Your production URL, e.g. `https://your-domain.com` |
| `RESEND_API_KEY`                | **Server only**  | Resend → API Keys (`re_...`)                        |
| `EMAIL_FROM`                    | Server only      | A verified Resend sender, e.g. `MediConnect <noreply@yourdomain.com>` |
| `CRON_SECRET`                   | **Server only**  | Any long random string (auth for the reminder cron) |

> `NEXT_PUBLIC_*` values are exposed to the browser — that is expected for the
> URL, anon key, and site URL. **Never** expose `SUPABASE_SERVICE_ROLE_KEY`,
> `RESEND_API_KEY`, or `CRON_SECRET` to the client; they stay server-only (used
> in server actions / route handlers).
>
> If `RESEND_API_KEY` is omitted, the app still runs — email sending is simply
> skipped (logged, not errored).

After changing env vars in Vercel, trigger a fresh deploy so they take effect.

---

## 2. Supabase auth configuration (production)

In **Supabase → Authentication → URL Configuration**:

- **Site URL:** `https://your-domain.com`
- **Redirect URLs** (add each):
  - `https://your-domain.com/auth/callback`
  - `https://your-domain.com/**` (wildcard for previews, optional)
  - For Vercel preview deploys: `https://*.vercel.app/auth/callback`

The OAuth/email magic-link callback is handled by `app/auth/callback/route.ts`,
so the redirect URLs above must match that path.

---

## 3. Database migrations (production project)

Link the CLI to the production project, then push migrations in
`supabase/migrations/`:

```bash
supabase link --project-ref <your-prod-project-ref>
supabase db push
```

Migrations applied (in order):

```
0001_init_schema.sql        # core tables
0002_rls_policies.sql       # row-level security
0003_storage_avatars.sql    # avatar storage bucket + policies
0004_book_appointment.sql   # booking RPC (atomic slot reservation)
0005_admin.sql              # admin views / RPCs
0006_notifications_read.sql # notification read tracking
0007_profile_visibility.sql # profile visibility rules
0008_appointment_reminders.sql # reminder_sent_at column for the reminder cron
```

Verify RLS is **enabled** on every table after push (Supabase → Auth → Policies).

---

## 4. Email notifications (Resend)

Outbound email is sent through [Resend](https://resend.com)'s REST API directly
from the Next.js server — there's **no Supabase Edge Function to deploy**.

Emails sent:

| Trigger | Recipient | Code |
| --- | --- | --- |
| Appointment booked | Patient | `lib/actions/bookAppointment.ts` → `sendAppointmentEmail(id, 'confirmation')` |
| Appointment cancelled | Patient | `lib/actions/bookAppointment.ts` (cancel) → `sendAppointmentEmail(id, 'cancellation')` |
| 24h before appointment | Patient | `app/api/cron/reminders/route.ts` → `sendAppointmentEmail(id, 'reminder')` |

> A **reschedule** is internally a new booking + a cancel, so the patient
> receives both a confirmation (new time) and a cancellation (old time).

Setup:

1. Create a Resend account and an **API key**.
2. **Verify a sending domain** (Resend → Domains) and set `EMAIL_FROM` to an
   address on it. For quick testing you can use `onboarding@resend.dev`, which
   only delivers to your own account email.
3. Set `RESEND_API_KEY` and `EMAIL_FROM` in Vercel (see §1).

In-app bell notifications still work independently (written to the
`notifications` table — see `lib/actions/notifications.ts`).

---

## 4b. Reminder cron (Vercel Cron)

`vercel.json` registers a daily cron that calls `/api/cron/reminders`:

```json
{ "crons": [{ "path": "/api/cron/reminders", "schedule": "0 8 * * *" }] }
```

- Vercel automatically calls the route with `Authorization: Bearer $CRON_SECRET`,
  which the route verifies — so **set `CRON_SECRET` in Vercel**.
- The route scans `pending`/`confirmed` appointments occurring within ~30h that
  have `reminder_sent_at IS NULL`, emails each patient, and stamps
  `reminder_sent_at` so no appointment is ever reminded twice.
- **Hobby plan:** cron runs at most **once per day** — the `0 8 * * *` schedule
  fits. On Pro you can run it hourly for tighter "24h before" timing.
- Manual test (replace the secret):
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/reminders
  ```
  Returns JSON: `{ scanned, due, sent, failures }`.

---

## 5. Vercel build settings

- **Framework preset:** Next.js
- **Build command:** `next build`
- **Install command:** `npm install`
- **Output:** (default — Vercel detects `.next`)
- **Node version:** 18.x or 20.x

Connect the Git repo and Vercel will build on every push to the production
branch.

---

## 6. Post-deploy checklist

Run through each item against the live domain before announcing the release.

**Role-based access control**

- [ ] Log in as a **patient** → can access `/patient/*` only
- [ ] Log in as a **doctor** → can access `/doctor/*` only
- [ ] Log in as an **admin** → can access `/admin/*`
- [ ] Patient navigating to `/doctor` or `/admin` → redirected immediately
- [ ] Doctor navigating to `/admin` → redirected immediately

**Core flows**

- [ ] Book an appointment end-to-end (find doctor → pick slot → confirm)
- [ ] Cancel an appointment → slot is released
- [ ] Reschedule an appointment → old slot freed, new slot taken
- [ ] Notification appears in the bell for the affected users
- [ ] Booking confirmation email delivered to the patient
- [ ] Cancellation email delivered to the patient
- [ ] Reminder cron runs (hit `/api/cron/reminders` with the Bearer secret → `sent` > 0 for a due appointment)

**Platform**

- [ ] Dark mode toggles and **persists on refresh**
- [ ] Homepage renders correctly on mobile (375px) and desktop
- [ ] `404` route shows the custom not-found page
- [ ] A thrown error shows the custom error page with a working retry
