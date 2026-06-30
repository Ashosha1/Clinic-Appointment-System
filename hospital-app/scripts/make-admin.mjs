// Promote a user to the `admin` role by email.
//
// Usage:
//   npm run make-admin -- someone@example.com
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
// The service-role key bypasses RLS, so run this locally only — never expose it.

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
      if (m && env[m[1]] === undefined) {
        env[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
    }
  } catch {
    // No .env.local — fall back to process.env.
  }
  return env
}

const email = process.argv[2]
if (!email) {
  console.error('Usage: npm run make-admin -- you@example.com')
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

// Find the auth user by email (paginate through the admin list).
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

const user = await findUserByEmail(email)
if (!user) {
  console.error(`No account found for ${email}. Sign up first, then re-run.`)
  process.exit(1)
}

const { data, error } = await supabase
  .from('profiles')
  .update({ role: 'admin' })
  .eq('user_id', user.id)
  .select('full_name, role')
  .maybeSingle()

if (error) {
  console.error('Update failed:', error.message)
  process.exit(1)
}
if (!data) {
  console.error('User has no profile row yet. Complete onboarding once, then re-run.')
  process.exit(1)
}

console.log(`✓ ${email} (${data.full_name}) is now role: ${data.role}`)
console.log('Log out and back in, then go to /admin/dashboard.')
