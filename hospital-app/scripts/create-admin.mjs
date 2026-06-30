// Create a ready-to-use admin account (auth user + admin profile).
//
// Usage:
//   npm run create-admin -- admin@example.com 'StrongPassw0rd' "Clinic Admin"
//
// The email is pre-confirmed, so you can log in immediately — no confirmation
// email. Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from
// .env.local. Service-role key bypasses RLS — run locally only.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnv() {
  const env = { ...process.env }
  try {
    const raw = readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    // No .env.local — fall back to process.env.
  }
  return env
}

const [email, password, ...nameParts] = process.argv.slice(2)
const fullName = nameParts.join(' ') || 'Clinic Admin'

if (!email || !password) {
  console.error("Usage: npm run create-admin -- admin@example.com 'password' \"Full Name\"")
  process.exit(1)
}
if (password.length < 8) {
  console.error('Password must be at least 8 characters.')
  process.exit(1)
}

const env = loadEnv()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findUserByEmail(target) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find((u) => u.email?.toLowerCase() === target.toLowerCase())
    if (hit) return hit
    if (data.users.length < 200) break
  }
  return null
}

// 1. Create the auth user with the email already confirmed. If it already
// exists, reset its password + confirm it so the credentials are known.
let userId
const { data: created, error: createErr } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName, role: 'admin' },
})

if (createErr) {
  const exists = /already.*registered|already exists/i.test(createErr.message)
  if (!exists) {
    console.error('Could not create user:', createErr.message)
    process.exit(1)
  }
  const existing = await findUserByEmail(email)
  if (!existing) {
    console.error('User reported as existing but could not be found.')
    process.exit(1)
  }
  const { error: updErr } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'admin' },
  })
  if (updErr) {
    console.error('Could not reset existing user:', updErr.message)
    process.exit(1)
  }
  userId = existing.id
  console.log(`(existing account found — password reset)`)
} else {
  userId = created.user.id
}

// 2. Create (or update) the matching profile row with the admin role.
const { error: profileErr } = await supabase
  .from('profiles')
  .upsert({ user_id: userId, role: 'admin', full_name: fullName }, { onConflict: 'user_id' })

if (profileErr) {
  console.error('User created but profile failed:', profileErr.message)
  process.exit(1)
}

console.log(`✓ Admin account ready: ${email}`)
console.log('Log in with that email + password, then go to /admin/dashboard.')
