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

> `NEXT_PUBLIC_*` values are exposed to the browser — that is expected for the
> URL and anon key. **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the client;
> it must stay server-only (used in server actions / route handlers).

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
```

Verify RLS is **enabled** on every table after push (Supabase → Auth → Policies).

---

## 4. Edge Functions (notifications)

> Current build delivers **in-app** notifications written directly to the
> `notifications` table (see `lib/actions/notifications.ts`) — no Edge Function
> is required for the platform to work today.

When you wire up outbound email/SMS, add the function under
`supabase/functions/send-notification/` and deploy it:

```bash
supabase functions deploy send-notification
# set any provider secrets the function needs, e.g.:
supabase secrets set RESEND_API_KEY=...   # or SMTP creds
```

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
- [ ] (When email is enabled) confirmation email delivered

**Platform**

- [ ] Dark mode toggles and **persists on refresh**
- [ ] Homepage renders correctly on mobile (375px) and desktop
- [ ] `404` route shows the custom not-found page
- [ ] A thrown error shows the custom error page with a working retry
